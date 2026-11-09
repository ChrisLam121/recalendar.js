import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import i18n from 'i18next';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({
  configFile: false,
  root,
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { '~': path.join(root, 'src') } },
  ssr: { noExternal: ['dayjs'] },
});
after(() => server.close());
await i18n.init({ lng: 'en', resources: {} });
await server.ssrLoadModule('/src/config/dayjs.js');
const { default: dayjs } = await server.ssrLoadModule('dayjs/esm');
const { findByDate, getSpannedYears } = await server.ssrLoadModule('/src/lib/special-dates-utils.js');
const { importIcalDates } = await server.ssrLoadModule('/src/lib/ical-import.js');
const range = { year: 2026, month: 10, monthCount: 14 };
const english = await readFile(new URL('./fixtures/hk-en.ics', import.meta.url), 'utf8');
const chinese = await readFile(new URL('./fixtures/hk-tc.ics', import.meta.url), 'utf8');

// The gazetted dates, independently listed rather than computed by the importer.
const expected = [
  '2026-12-25',
  '2026-12-26',
  '2027-01-01',
  '2027-02-06',
  '2027-02-08',
  '2027-02-09',
  '2027-03-26',
  '2027-03-27',
  '2027-03-29',
  '2027-04-05',
  '2027-05-01',
  '2027-05-13',
  '2027-06-09',
  '2027-07-01',
  '2027-09-16',
  '2027-10-01',
  '2027-10-08',
  '2027-12-25',
  '2027-12-27',
];

test('imports all 19 gazetted holidays across November 2026 to December 2027', () => {
  for (const source of [english, chinese]) {
    const entries = importIcalDates(source, range, 'holiday');
    assert.deepEqual(
      entries.map(({ date }) => date),
      expected,
    );
    for (const wrongDate of ['2027-02-17', '2027-06-19', '2027-12-26']) {
      assert.equal(entries.some(findByDate(wrongDate)), false);
    }
  }
});

test('keeps bilingual labels but skips reimported duplicates', () => {
  const en = importIcalDates(english, range, 'holiday');
  const tc = importIcalDates(chinese, range, 'holiday', en);
  assert.equal(en.length + tc.length, 38);
  assert.equal(importIcalDates(english, range, 'holiday', [...en, ...tc]).length, 0);
  assert.equal(importIcalDates(chinese, range, 'holiday', [...en, ...tc]).length, 0);
});

test('exact dates stay in their year; old annual birthdays still repeat', () => {
  const dates = [
    { date: '2026-12-26', value: '2026 Christmas holiday' },
    { date: '2027-12-27', value: '2027 Christmas holiday' },
    { date: '12-26', value: 'Birthday' },
    { date: '02-29', value: 'Leap birthday' },
  ];
  assert.deepEqual(
    dates.filter(findByDate('2027-12-26')).map((x) => x.value),
    ['Birthday'],
  );
  assert.deepEqual(
    dates.filter(findByDate('2026-12-26')).map((x) => x.value),
    ['2026 Christmas holiday', 'Birthday'],
  );
  assert.deepEqual(
    dates.filter(findByDate('2027-12-27')).map((x) => x.value),
    ['2027 Christmas holiday'],
  );
  assert.deepEqual(
    dates.filter(findByDate('2028-02-29')).map((x) => x.value),
    ['Leap birthday'],
  );
  assert.equal(dates.filter(findByDate('2027-02-28')).length, 0);
});

test('calendar range uses requested months, without extra adjacent years', () => {
  assert.deepEqual(getSpannedYears(range), [2026, 2027]);
  assert.deepEqual(getSpannedYears({ year: 2027, month: 0, monthCount: 12 }), [2027]);
  assert.deepEqual(getSpannedYears({ year: 2026, month: 11, monthCount: 26 }), [2026, 2027, 2028, 2029]);
});

const ics = (events) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events.join('\r\n')}\r\nEND:VCALENDAR\r\n`;
const event = (lines) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n');

test('expands recurrence over the entire range and honors EXDATE', () => {
  const source = ics([
    event([
      'UID:annual',
      'DTSTART;VALUE=DATE:20251225',
      'RRULE:FREQ=YEARLY',
      'EXDATE;VALUE=DATE:20271225',
      'SUMMARY:Annual event',
    ]),
  ]);
  assert.deepEqual(
    importIcalDates(source, range, 'event').map((x) => x.date),
    ['2026-12-25'],
  );
});

test('honors recurrence exceptions without mixing unrelated UIDs', () => {
  const source = ics([
    event(['UID:a', 'DTSTART;VALUE=DATE:20251225', 'RRULE:FREQ=YEARLY', 'SUMMARY:Original']),
    event(['UID:a', 'RECURRENCE-ID;VALUE=DATE:20271225', 'DTSTART;VALUE=DATE:20271227', 'SUMMARY:Moved']),
    event(['UID:b', 'DTSTART;VALUE=DATE:20251225', 'RRULE:FREQ=YEARLY', 'SUMMARY:Other']),
  ]);
  const entries = importIcalDates(source, range, 'event');
  assert.deepEqual(
    entries.map(({ date, value }) => [date, value]),
    [
      ['2026-12-25', 'Original'],
      ['2027-12-27', 'Moved'],
      ['2026-12-25', 'Other'],
      ['2027-12-25', 'Other'],
    ],
  );
});

test('filters cancelled events and respects exact start/end date boundaries', () => {
  const source = ics([
    event(['UID:a', 'DTSTART;VALUE=DATE:20261031', 'SUMMARY:Before']),
    event(['UID:b', 'DTSTART;VALUE=DATE:20261101', 'SUMMARY:First']),
    event(['UID:c', 'DTSTART;VALUE=DATE:20271231', 'SUMMARY:Last']),
    event(['UID:d', 'DTSTART;VALUE=DATE:20280101', 'SUMMARY:After']),
    event(['UID:e', 'DTSTART;VALUE=DATE:20270206', 'SUMMARY:Cancelled', 'STATUS:CANCELLED']),
  ]);
  assert.deepEqual(
    importIcalDates(source, range, 'event').map((x) => x.date),
    ['2026-11-01', '2027-12-31'],
  );
});

test('day, week overview and mini-calendar all use year-aware matching', async () => {
  const { default: PdfConfig } = await server.ssrLoadModule('/src/pdf/config.js');
  const { default: DayPage } = await server.ssrLoadModule('/src/pdf/pages/day.jsx');
  const { default: Week } = await server.ssrLoadModule('/src/pdf/pages/week-overview.jsx');
  const { default: Mini } = await server.ssrLoadModule('/src/pdf/components/mini-calendar.jsx');
  const config = new PdfConfig({ ...range, specialDates: importIcalDates(english, range, 'holiday') });
  for (const [key, expectedCount, expectedRed] of [
    ['2026-11-07', 0, true],
    ['2027-02-06', 1, true],
    ['2027-02-17', 0, false],
    ['2027-05-13', 1, true],
  ]) {
    const date = dayjs(key);
    const dayPage = new DayPage({ date, config }).render();
    const header = dayPage.props.children[0].props.children.props.children.find((child) => child?.props?.specialItems);
    assert.equal(header.props.specialItems.length, expectedCount);
    assert.equal(header.props.isRedDay, expectedRed);
    const weekDay = new Week.WrappedComponent({ date, config }).renderDay(date);
    assert.equal(weekDay.props.children.props.children[1].length, expectedCount);
  }
  const mini = new Mini.WrappedComponent({ date: dayjs('2027-05-01'), config, t: (key) => key });
  for (const [key, expectedBold] of [
    ['2027-05-13', true],
    ['2027-05-25', false],
  ]) {
    const date = dayjs(key);
    const week = mini.renderWeek(date.startOf('week'));
    const day = week.props.children[1].find((child) => child.props.children === date.date());
    assert.equal(
      day.props.style.some((style) => style.fontWeight === 1000),
      expectedBold,
    );
    assert.equal(Object.assign({}, ...day.props.style).color, expectedBold ? '#B31B1B' : 'black');
  }
});

test('restored v4 birthdays and saved v5 exact dates retain their date scope', async () => {
  const { convertConfigToCurrentVersion } = await server.ssrLoadModule('/src/lib/config-compat.js');
  const {
    default: PdfConfig,
    hydrateFromObject,
    CONFIG_CURRENT_VERSION,
  } = await server.ssrLoadModule('/src/pdf/config.js');
  const legacy = { version: 'v4', ...range, specialDates: [{ date: '06-15', type: 'event', value: 'Birthday' }] };
  const restored = new PdfConfig(hydrateFromObject(convertConfigToCurrentVersion(structuredClone(legacy))));
  assert.equal(restored.isPlannerWorkflowEnabled, false);
  assert.equal(restored.specialDates[0].date, '06-15');
  restored.specialDates.push({ date: '2027-06-09', type: 'holiday', value: 'Tuen Ng Festival' });
  const saved = JSON.parse(JSON.stringify({ version: CONFIG_CURRENT_VERSION, ...hydrateFromObject(restored) }));
  const reloaded = new PdfConfig(hydrateFromObject(convertConfigToCurrentVersion(saved)));
  assert.equal(reloaded.specialDates.filter(findByDate('2026-06-15')).length, 1);
  assert.equal(reloaded.specialDates.filter(findByDate('2027-06-15')).length, 1);
  assert.equal(reloaded.specialDates.filter(findByDate('2026-06-09')).length, 0);
  assert.equal(reloaded.specialDates.filter(findByDate('2027-06-09')).length, 1);

  const nextEdition = new PdfConfig({ ...hydrateFromObject(reloaded), year: 2026, month: 5, monthCount: 1 });
  const annualEvents = nextEdition.specialDates.filter(({ type }) => type !== 'holiday');
  nextEdition.specialDates = [...annualEvents, ...importIcalDates(english, nextEdition, 'holiday', annualEvents)];
  assert.deepEqual(nextEdition.specialDates.filter(findByDate('2026-06-15')), annualEvents);
  assert.equal(nextEdition.specialDates.filter(findByDate('2026-06-19')).length, 1);
  assert.equal(nextEdition.specialDates.filter(findByDate('2027-06-09')).length, 0);
});

test('planner workflow round-trips and limits day and notes links while retaining complete Sunday-start weeks', async () => {
  const { default: PdfConfig, hydrateFromObject } = await server.ssrLoadModule('/src/pdf/config.js');
  const { dailyNotesLink, dayPageLink, monthDashboardLink, nextDayPageLink, weekOverviewLink, weekRetrospectiveLink } =
    await server.ssrLoadModule('/src/pdf/lib/links.js');
  const restored = new PdfConfig(
    JSON.parse(JSON.stringify(hydrateFromObject(new PdfConfig({ ...range, isPlannerWorkflowEnabled: true })))),
  );
  assert.equal(restored.isPlannerWorkflowEnabled, true);
  const end = dayjs.utc('2027-12-31');
  const out = end.add(1, 'day');
  assert.equal(dayPageLink(dayjs.utc('2026-11-01'), restored), 'day-01112026');
  assert.equal(dayPageLink(out, new PdfConfig(range)), 'day-01012028');
  assert.equal(dayPageLink(out, restored), '');
  assert.equal(dailyNotesLink(out, restored), '');
  assert.equal(nextDayPageLink(end, restored), '');
  assert.equal(dailyNotesLink(end, restored), 'notes-31122027');
  assert.equal(monthDashboardLink(end, restored), 'dashboard-122027');
  assert.equal(monthDashboardLink(out, restored), '');
  assert.equal(weekOverviewLink(out, restored), 'week-overview-522027');
  const newYear = dayjs.utc('2027-01-01');
  assert.equal(weekOverviewLink(newYear, restored), 'week-overview-532026');
  assert.equal(weekRetrospectiveLink(newYear, restored), 'week-retrospective-532026');
  assert.equal(weekOverviewLink(newYear.add(2, 'day'), restored), 'week-overview-012027');
});

function collectCalendarLinks(node, targets = []) {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectCalendarLinks(child, targets);
    }
  } else if (node?.props) {
    const { src, children } = node.props;
    if (src?.startsWith('#')) {
      targets.push(src.slice(1));
    }
    collectCalendarLinks(children, targets);
  }
  return targets;
}

test('date headings link each month in the range and keep the year linked to Home', async () => {
  const { default: PdfConfig } = await server.ssrLoadModule('/src/pdf/config.js');
  const { MonthYearLabel, WeekDateRange } = await server.ssrLoadModule('/src/pdf/components/calendar-date-label.jsx');
  const config = new PdfConfig({ ...range, isPlannerWorkflowEnabled: true });
  const weekLinks = (date) => collectCalendarLinks(WeekDateRange({ date: dayjs.utc(date), config }));
  assert.deepEqual(weekLinks('2026-11-01'), ['month-112026', 'month-112026']);
  assert.deepEqual(weekLinks('2026-12-27'), ['month-122026', 'month-012027']);
  assert.deepEqual(weekLinks('2027-12-26'), ['month-122027']);

  const yearLinks = () =>
    collectCalendarLinks(MonthYearLabel({ date: dayjs.utc('2027-01-01'), config, color: 'black' }));
  assert.deepEqual(yearLinks(), ['month-012027', 'year-overview']);
  config.isMonthOverviewEnabled = false;
  assert.deepEqual(weekLinks('2026-12-27'), []);
  assert.deepEqual(yearLinks(), ['year-overview']);
});

test('mini calendar month and habit links respect the rendered preview range', async () => {
  const { default: PdfConfig } = await server.ssrLoadModule('/src/pdf/config.js');
  const { default: MiniCalendar } = await server.ssrLoadModule('/src/pdf/components/mini-calendar.jsx');
  const config = new PdfConfig(range);
  config.isPreview = true;

  const getHeaderLinks = (day) => {
    const calendar = new MiniCalendar.WrappedComponent({
      date: dayjs.utc(day),
      config,
      showHabits: true,
      t: () => 'H',
    });
    return collectCalendarLinks(calendar.renderMonthName());
  };

  assert.deepEqual(getHeaderLinks('2026-11-01'), ['month-112026', 'year-overview', 'habits-112026']);
  assert.deepEqual(getHeaderLinks('2026-12-01'), ['month-112026', 'year-overview']);
  config.isMonthOverviewEnabled = false;
  assert.deepEqual(getHeaderLinks('2026-11-01'), ['day-01112026', 'year-overview']);
});

test('mini calendar destinations match rendered links and account for the cross-year week boundary', async () => {
  const { default: PdfConfig } = await server.ssrLoadModule('/src/pdf/config.js');
  const { default: MiniCalendar, getMiniCalendarDestinations } = await server.ssrLoadModule(
    '/src/pdf/components/mini-calendar.jsx',
  );
  const config = new PdfConfig({ ...range, isPlannerWorkflowEnabled: true });
  const date = dayjs.utc('2026-12-27');

  for (const flags of [{}, { showHabits: false }, { showArrows: false }, { isOverview: true }]) {
    const props = { date, config, ...flags };
    const destinations = getMiniCalendarDestinations(props);
    const calendar = new MiniCalendar.WrappedComponent({ ...props, t: (key) => key });
    const actual = new Set(collectCalendarLinks(calendar.render()));
    assert.deepEqual(destinations, actual);
    assert.equal(destinations.has('year-overview'), true);
    assert.equal(destinations.has('master-inbox'), true);
    assert.equal(destinations.has('week-retrospective-532026'), true);
    assert.equal(destinations.has('week-overview-012027'), false);
    assert.equal(destinations.has('month-012027'), flags.showArrows !== false && !flags.isOverview);
    assert.equal(destinations.has('habits-122026'), flags.showHabits !== false);
  }
});

test('national-holiday API imports also keep years and filter to planner months', async () => {
  const { default: SpecialDates } = await server.ssrLoadModule('/src/configuration-form/special-dates.jsx');
  const items = [];
  const component = new SpecialDates.WrappedComponent({ ...range, items, onAdd: (item) => items.push(item) });
  component.setState = (patch) => Object.assign(component.state, patch);
  Object.assign(component.state, { selectedCountry: 'HK', yearsCovered: [2026, 2027], countries: [] });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => ({
      holidays: url.endsWith('/2026.json')
        ? [
            { date: '2026-01-01', name: 'New Year' },
            { date: '2026-12-25', name: 'Christmas' },
            { date: '2026-12-26', name: 'Christmas holiday' },
          ]
        : [
            { date: '2027-02-06', name: 'Lunar New Year' },
            { date: '2027-12-25', name: 'Christmas' },
            { date: '2027-12-27', name: 'Christmas holiday' },
          ],
    }),
  });
  try {
    await component.onImportHolidays();
    assert.deepEqual(
      items.map((item) => item.date),
      ['2026-12-25', '2026-12-26', '2027-02-06', '2027-12-25', '2027-12-27'],
    );
    await component.onImportHolidays();
    assert.equal(items.length, 5);
    assert.equal(component.state.holidaysResult.skipped, 5);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
