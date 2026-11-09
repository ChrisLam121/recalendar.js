import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';

const { values } = parseArgs({
  options: {
    input: { type: 'string' },
    output: { type: 'string' },
    preview: { type: 'boolean', default: false },
    language: { type: 'string', default: 'en' },
    start: { type: 'string' },
    end: { type: 'string' },
  },
});
if (!values.input || !values.output) {
  throw new Error(
    'Usage: npm run planner -- --input existing.pdf --output planner-6.pdf [--preview] [--start 6 --end 22]',
  );
}
const inputPath = path.resolve(values.input);
const outputPath = path.resolve(values.output);
if (inputPath === outputPath) {
  throw new Error('Choose a new output filename to preserve the source planner.');
}
const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true },
  ssr: { noExternal: ['dayjs'] },
  plugins: [
    {
      name: 'planner-cli',
      resolveId(id) {
        if (id === 'virtual:planner-cli') {
          return '\0planner-cli';
        }
      },
      load(id) {
        if (id === '\0planner-cli') {
          return `
      export { default as React } from 'react';
      export { default as i18n } from 'i18next';
      export { initReactI18next, I18nextProvider } from 'react-i18next';
    `;
        }
      },
    },
  ],
});
try {
  const { React, i18n, initReactI18next, I18nextProvider } = await server.ssrLoadModule('virtual:planner-cli');
  await server.ssrLoadModule('/src/config/dayjs.js');
  const { default: resources } = await server.ssrLoadModule('virtual:i18next-loader');
  const { handleLanguageChange, i18nConfiguration } = await server.ssrLoadModule('/src/config/i18n.js');
  await i18n.use(initReactI18next).init({
    ...i18nConfiguration(['pdf', 'config']),
    lng: values.language,
    resources,
    react: { useSuspense: false },
    debug: false,
  });
  const {
    default: PdfConfig,
    CONFIG_FILE,
    CONFIG_CURRENT_VERSION,
    hydrateFromObject,
  } = await server.ssrLoadModule('/src/pdf/config.js');
  const { getJsonAttachment, ATTACHMENT_OK } = await server.ssrLoadModule('/src/lib/attachments.js');
  const { convertConfigToCurrentVersion } = await server.ssrLoadModule('/src/lib/config-compat.js');
  const inputBytes = await readFile(inputPath);
  let saved;
  if (path.extname(inputPath).toLowerCase() === '.json') {
    saved = JSON.parse(inputBytes.toString('utf8'));
  } else {
    const attachment = await getJsonAttachment(inputBytes, CONFIG_FILE);
    assert.equal(attachment.status, ATTACHMENT_OK, 'The input PDF must contain its ReCalendar config.json.');
    saved = attachment.data;
  }
  const config = new PdfConfig({ ...convertConfigToCurrentVersion(saved), isPlannerWorkflowEnabled: true });
  if (values.start !== undefined) {
    config.plannerStartHour = Number(values.start);
  }
  if (values.end !== undefined) {
    config.plannerEndHour = Number(values.end);
  }
  const { plannerHours } = await server.ssrLoadModule('/src/pdf/planner/geometry.js');
  plannerHours(config);
  config.isPreview = values.preview;
  handleLanguageChange(values.language, config.firstDayOfWeek);
  const { Font, pdf } = await server.ssrLoadModule('/src/lib/pdf.js');
  const { getFontDefinition, getCJKFontDefinition } = await server.ssrLoadModule('/src/pdf/lib/fonts.js');
  const { default: RecalendarPdf } = await server.ssrLoadModule('/src/pdf/recalendar.jsx');
  for (const definition of [getFontDefinition(config.fontFamily), getCJKFontDefinition()]) {
    Font.register({
      ...definition,
      fonts: definition.fonts.map((font) => ({ ...font, src: path.join(root, 'public', font.src) })),
    });
  }
  Font.registerHyphenationCallback((word) => [word]);
  const data = { version: CONFIG_CURRENT_VERSION, ...hydrateFromObject(config) };
  const document = React.createElement(I18nextProvider, { i18n }, React.createElement(RecalendarPdf, { config }));
  const blob = await pdf(document, {
    attachments: [
      {
        src: 'data:application/json;base64,' + Buffer.from(JSON.stringify(data)).toString('base64'),
        options: { name: CONFIG_FILE, type: 'application/json', hidden: false },
      },
    ],
  }).toBlob();
  const bytes = Buffer.from(await blob.arrayBuffer());
  const roundTrip = await getJsonAttachment(bytes, CONFIG_FILE);
  assert.equal(roundTrip.status, ATTACHMENT_OK);
  assert.deepEqual(roundTrip.data, data);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  console.log(`${values.preview ? 'Preview' : 'Full planner'} written: ${outputPath} (${bytes.length} bytes)`);
} finally {
  await server.close();
}
