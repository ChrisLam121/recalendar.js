import { Canvas, Link, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { getWeekNumber } from '~/lib/date';
import { EXACT_DATE_FORMAT, findByDate, isEvent } from '~/lib/special-dates-utils';
import PdfConfig from '~/pdf/config';
import {
  dayPageLink,
  monthOverviewLink,
  PLANNER_MANUAL,
  weekOverviewLink,
  weekRetrospectiveLink,
  yearNotesLink,
  yearOverviewLink,
} from '~/pdf/lib/links';
import { getCalendarStartDate, getRenderedMonthCount, isRedDay } from '~/pdf/utils';

import { HEADER_HEIGHT, INK, MUTED, plannerArea } from './geometry';
import { Sheet } from './layout';

function IndexMonth({ date, config, width }) {
  const first = date.startOf('month').startOf('week');
  const weeks = [];
  for (let week = first; week.isBefore(date.endOf('month')); week = week.add(1, 'week')) {
    weeks.push(week);
  }
  const side = 15;
  const dayWidth = (width - side * 2) / 7;
  const cell = { width: dayWidth, textAlign: 'center', height: 12.5, fontSize: 9, textDecoration: 'none', color: INK };
  const navigationCell = { ...cell, width: side, color: '#888888' };
  const weekCell = { ...navigationCell, borderRight: '0.6 solid #AAAAAA' };
  const reviewCell = { ...navigationCell, borderLeft: '0.6 solid #AAAAAA' };
  const month = monthOverviewLink(date, config);
  return (
    <View style={{ width }}>
      <View style={{ height: 18, flexDirection: 'row', alignItems: 'center' }}>
        <Link
          src={month ? '#' + month : undefined}
          style={{ fontSize: 11, color: INK, fontWeight: 'bold', textDecoration: 'none' }}
        >
          {date.format('MMMM')}
        </Link>
      </View>
      <View style={{ flexDirection: 'row', borderBottom: '0.5 solid #999' }}>
        <Text style={{ ...weekCell, fontSize: 7.5 }}>W</Text>
        {Array.from({ length: 7 }, (_, i) => first.add(i, 'day')).map((day) => (
          <Text key={day.day()} style={{ ...cell, fontSize: 7.5 }}>
            {day.format('dd')}
          </Text>
        ))}
        <Text style={{ ...reviewCell, fontSize: 7.5 }}>R</Text>
      </View>
      {weeks.map((week) => {
        const weekTarget = config.isWeekOverviewEnabled && weekOverviewLink(week, config);
        const review = weekRetrospectiveLink(week, config);
        return (
          <View key={week.unix()} style={{ flexDirection: 'row' }}>
            <Link src={weekTarget ? '#' + weekTarget : undefined} style={{ ...weekCell, fontSize: 8 }}>
              {getWeekNumber(week)}
            </Link>
            {Array.from({ length: 7 }, (_, i) => week.add(i, 'day')).map((day) => {
              const target = dayPageLink(day, config);
              const specialDates = config.specialDates.filter(findByDate(day.format(EXACT_DATE_FORMAT)));
              const hasEvent = specialDates.some(isEvent);
              return (
                <View key={day.unix()} style={{ width: dayWidth, height: cell.height }}>
                  {hasEvent && (
                    <Canvas
                      style={{ position: 'absolute', top: 0, left: 0, width: dayWidth, height: cell.height }}
                      paint={(painter, width, height) => {
                        // An independent square preserves the numeral's position and the full date link.
                        const size = Math.min(width, height) - 1;
                        painter
                          .strokeColor(INK)
                          .lineWidth(0.6)
                          .rect((width - size) / 2, (height - size) / 2, size, size)
                          .stroke();
                      }}
                    />
                  )}
                  <Link
                    src={target ? '#' + target : undefined}
                    style={{
                      ...cell,
                      color: !day.isSame(date, 'month')
                        ? '#999'
                        : isRedDay(day, config, specialDates)
                          ? '#B31B1B'
                          : INK,
                    }}
                  >
                    {day.date()}
                  </Link>
                </View>
              );
            })}
            <Link src={review ? '#' + review : undefined} style={reviewCell}>
              R
            </Link>
          </View>
        );
      })}
    </View>
  );
}
IndexMonth.propTypes = {
  date: PropTypes.instanceOf(dayjs),
  config: PropTypes.instanceOf(PdfConfig),
  width: PropTypes.number,
};

export default function PlannerIndex({ config }) {
  const { t } = useTranslation('pdf');
  const start = getCalendarStartDate(config);
  const count = getRenderedMonthCount(config);
  const last = start.add(count - 1, 'month');
  const { width, height } = plannerArea(config);
  const columns = Math.max(1, Math.floor(width / 140));
  const tileWidth = (width - (columns - 1) * 14) / columns;
  const headerHeight = 86;
  const availableHeight = height + HEADER_HEIGHT - headerHeight;
  const rowHeight = 108;
  const groupHeight = 14;
  const rows = [];
  for (let i = 0; i < count; ) {
    const row = [];
    const year = start.add(i, 'month').year();
    while (i < count && row.length < columns && start.add(i, 'month').year() === year) {
      row.push(start.add(i++, 'month'));
    }
    rows.push(row);
  }
  const pages = [];
  let pageRows = [];
  let usedHeight = 0;
  for (const row of rows) {
    let showYear = !pageRows.length || pageRows.at(-1).dates[0].year() !== row[0].year();
    if (pageRows.length && usedHeight + rowHeight + (showYear ? groupHeight : 0) > availableHeight) {
      pages.push(pageRows);
      pageRows = [];
      usedHeight = 0;
      showYear = true;
    }
    pageRows.push({ dates: row, showYear });
    usedHeight += rowHeight + (showYear ? groupHeight : 0);
  }
  if (pageRows.length) {
    pages.push(pageRows);
  }
  const pageCount = pages.length;
  const pageId = (i) => (i === 0 ? yearOverviewLink() : 'year-index-' + (i + 1));
  return Array.from({ length: pageCount }, (_, page) => (
    <Sheet
      key={pageId(page)}
      config={config}
      id={pageId(page)}
      bookmark={page === 0 ? t('planner6.nav.home') : undefined}
      headerHeight={headerHeight}
      heading={
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: INK }}>
            {start.year() === last.year() ? start.format('YYYY') : start.format('YYYY') + ' / ' + last.format('YYYY')}
          </Text>
          <Text style={{ fontSize: 9.5, color: MUTED, marginTop: 4 }}>
            {start.format('MMM YYYY') + ' - ' + last.format('MMM YYYY') + '  ·  ' + t('planner6.year.index')}
          </Text>
        </View>
      }
      links={[[PLANNER_MANUAL, 'guide']]}
      paging="index"
      previous={page > 0 ? pageId(page - 1) : undefined}
      next={page + 1 < pageCount ? pageId(page + 1) : undefined}
    >
      {pages[page].map(({ dates, showYear }) => (
        <View key={dates[0].unix()}>
          {showYear && (
            <View
              style={{
                height: groupHeight,
                flexDirection: 'row',
                alignItems: 'center',
                borderTop: '0.5 solid #B4B4B4',
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: MUTED }}>{dates[0].format('YYYY')}</Text>
              {config.isYearNotesEnabled && (
                <Link
                  src={'#' + yearNotesLink(dates[0])}
                  style={{
                    marginLeft: 'auto',
                    fontSize: 8.5,
                    color: MUTED,
                    textDecoration: 'none',
                    paddingHorizontal: 5,
                  }}
                >
                  {t('planner6.year.notes-link', { year: dates[0].year() })}
                </Link>
              )}
            </View>
          )}
          <View style={{ flexDirection: 'row', height: rowHeight, columnGap: 14 }}>
            {dates.map((date) => (
              <IndexMonth key={date.unix()} date={date} config={config} width={tileWidth} />
            ))}
          </View>
        </View>
      ))}
    </Sheet>
  ));
}
PlannerIndex.propTypes = { config: PropTypes.instanceOf(PdfConfig) };
