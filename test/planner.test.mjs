import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { PDFArray, PDFDict, PDFDocument, PDFName } from '@cantoo/pdf-lib';
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
const { plannerHours, weekRange } = await server.ssrLoadModule('/src/pdf/planner/geometry.js');
const { default: PdfConfig, hydrateFromObject } = await server.ssrLoadModule('/src/pdf/config.js');
const { getJsonAttachment } = await server.ssrLoadModule('/src/lib/attachments.js');

test('timeline hours persist, support midnight boundaries and reject invalid ranges', () => {
  assert.deepEqual(plannerHours({}), { start: 6, end: 22, slots: 32 });
  const saved = hydrateFromObject(new PdfConfig({ plannerStartHour: 0, plannerEndHour: 24 }));
  assert.deepEqual(plannerHours(new PdfConfig(saved)), { start: 0, end: 24, slots: 48 });
  for (const [plannerStartHour, plannerEndHour] of [
    [-1, 22],
    [6, 25],
    [6, 6],
    [7, 6],
    [6.5, 22],
    [NaN, 22],
  ]) {
    assert.throws(() => plannerHours({ plannerStartHour, plannerEndHour }));
  }
});

test('week headings show both years across New Year', () => {
  dayjs.updateLocale('en', { weekStart: 0 });
  assert.equal(weekRange(dayjs.utc('2026-12-27')), '27 Dec 2026 - 2 Jan 2027');
  assert.equal(weekRange(dayjs.utc('2027-01-03')), '3 - 9 January 2027');
});

function destinations(document) {
  const result = new Map();
  const walk = (tree) => {
    const names = tree.lookupMaybe(PDFName.of('Names'), PDFArray);
    if (names) {
      for (let i = 0; i < names.size(); i += 2) {
        result.set(names.lookup(i).decodeText(), names.lookup(i + 1, PDFArray));
      }
    }
    const kids = tree.lookupMaybe(PDFName.of('Kids'), PDFArray);
    if (kids) {
      for (const child of kids.asArray()) {
        walk(document.context.lookup(child, PDFDict));
      }
    }
  };
  walk(document.catalog.lookup(PDFName.of('Names'), PDFDict).lookup(PDFName.of('Dests'), PDFDict));
  return result;
}

function targets(page) {
  return (page.node.Annots()?.asArray() || []).flatMap((ref) => {
    const annotation = page.doc.context.lookup(ref, PDFDict);
    const action = annotation.lookup(PDFName.of('A'), PDFDict);
    return action?.lookup(PDFName.of('S'))?.toString() === '/GoTo' ? [action.lookup(PDFName.of('D')).decodeText()] : [];
  });
}

test('generated preview has complete navigation, reciprocal Notes and preserved settings', {
  timeout: 120000,
}, async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'planner-test-'));
  try {
    const input = path.join(temp, 'config.json');
    const output = path.join(temp, 'planner.pdf');
    const config = {
      version: 'v5',
      year: 2027,
      month: 0,
      monthCount: 14,
      firstDayOfWeek: 0,
      device: 'ReMarkable Paper Pro',
      pageSize: [1620, 2160],
      dpi: 229,
      habits: [{ id: 'reading', value: 'Reading' }],
      specialDates: [{ id: 'newyear', date: '2027-01-01', value: 'New Year / 元旦', type: 'holiday' }],
    };
    await writeFile(input, JSON.stringify(config));
    await promisify(execFile)(
      process.execPath,
      ['scripts/generate-planner.mjs', '--input', input, '--output', output, '--preview'],
      { cwd: root },
    );
    const bytes = await readFile(output);
    const pdf = await PDFDocument.load(bytes);
    // January 2027 spans six Sunday-start weeks: 62 daily sheets + 12 weekly
    // sheets + 3 monthly sheets + Home + Year Notes + 4 appendix/settings sheets.
    assert.equal(pdf.getPageCount(), 83);
    const named = destinations(pdf);
    const pagesByRef = new Map(pdf.getPages().map((page) => [page.ref.toString(), page]));
    const getPage = (name) => pagesByRef.get(named.get(name).get(0).toString());
    for (const page of pdf.getPages()) {
      for (const target of targets(page)) {
        assert.ok(named.has(target), `Missing destination: ${target}`);
        assert.ok(getPage(target), `Destination outside page tree: ${target}`);
      }
    }
    for (let day = 1; day <= 31; day++) {
      const date = String(day).padStart(2, '0') + '012027';
      assert.ok(targets(getPage('day-' + date)).includes('notes-' + date));
      assert.ok(targets(getPage('notes-' + date)).includes('day-' + date));
      if (day < 31) {
        const next = String(day + 1).padStart(2, '0') + '012027';
        assert.ok(targets(getPage('day-' + date)).includes('day-' + next));
        assert.ok(targets(getPage('notes-' + date)).includes('notes-' + next));
      }
    }
    assert.ok(named.has('week-overview-532026'));
    assert.ok(targets(getPage('day-01012027')).includes('week-overview-532026'));
    assert.ok(targets(getPage('week-retrospective-532026')).includes('week-overview-012027'));
    assert.equal(named.has('month-022027'), false);
    assert.equal(named.has('day-01022027'), false);
    const attachment = await getJsonAttachment(bytes, 'config.json');
    assert.equal(attachment.status, 'OK');
    assert.deepEqual(attachment.data.habits, config.habits);
    assert.deepEqual(attachment.data.specialDates, config.specialDates);
    assert.equal(attachment.data.monthCount, 14);
    assert.equal(attachment.data.isPlannerWorkflowEnabled, true);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
