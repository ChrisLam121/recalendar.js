import { Canvas, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import PdfConfig from '~/pdf/config';
import { PLANNER_INBOX, PLANNER_MANUAL, PLANNER_TIME_LOG, yearNotesLink } from '~/pdf/lib/links';

import { INK, MUTED, plannerArea, WRITING_PITCH } from './geometry';
import { CheckLines, Sheet, styles, Writing } from './layout';

export function PlannerYearNotes({ config, date }) {
  const { t } = useTranslation('pdf');
  return (
    <Sheet
      config={config}
      id={yearNotesLink(date)}
      bookmark={date.format('YYYY')}
      title={date.format('YYYY')}
      subtitle={t('planner6.year.notes')}
    >
      <Writing dots />
    </Sheet>
  );
}
PlannerYearNotes.propTypes = { config: PropTypes.instanceOf(PdfConfig), date: PropTypes.instanceOf(dayjs) };

function WorkedTimeline({ config }) {
  const { t } = useTranslation('pdf');
  const { width } = plannerArea(config);
  const axis = 38;
  const lane = (width - axis) / 2;
  const scale = 1.5;
  const height = 120 * scale;
  const blocks = [
    { key: 'planned', x: 0, start: 0, minutes: 60 },
    { key: 'first', x: lane + axis, start: 20, minutes: 45 },
    { key: 'call', x: lane + axis, start: 65, minutes: 15 },
    { key: 'second', x: lane + axis, start: 80, minutes: 35 },
  ];
  function paint(painter) {
    for (let minute = 0; minute <= 120; minute += 30) {
      painter.strokeColor(minute % 60 === 0 ? '#999999' : '#D0D0D0').lineWidth(minute % 60 === 0 ? 0.6 : 0.4);
      painter
        .moveTo(0, minute * scale)
        .lineTo(lane - 4, minute * scale)
        .stroke();
      painter
        .moveTo(lane + axis + 4, minute * scale)
        .lineTo(width, minute * scale)
        .stroke();
    }
  }
  return (
    <>
      <View style={{ flexDirection: 'row', height: 24 }}>
        <Text style={[styles.label, { width: lane + axis }]}>{t('planner6.daily.plan')}</Text>
        <Text style={styles.label}>{t('planner6.daily.actual')}</Text>
      </View>
      <View style={{ height, marginBottom: 15 }}>
        <Canvas paint={paint} style={{ position: 'absolute', width, height }} />
        {[0, 30, 60, 90, 120].map((minute) => (
          <Text
            key={minute}
            style={{
              position: 'absolute',
              left: lane,
              top: minute * scale - 4,
              width: axis,
              fontSize: 8,
              color: MUTED,
              textAlign: 'center',
            }}
          >
            {String(9 + Math.floor(minute / 60)).padStart(2, '0')}:{String(minute % 60).padStart(2, '0')}
          </Text>
        ))}
        {blocks.map(({ key, x, start, minutes }) => (
          <View
            key={key}
            style={{
              position: 'absolute',
              left: x + 4,
              top: start * scale,
              width: lane - 8,
              height: minutes * scale,
              border: '0.6 solid #888',
              backgroundColor: '#F4F4F4',
              padding: key === 'call' ? '2 6' : '5 6',
            }}
          >
            <Text style={{ fontSize: key === 'call' ? 8.5 : 9, color: INK, lineHeight: 1.2 }}>
              {t('planner6.log.' + key)}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
WorkedTimeline.propTypes = { config: PropTypes.instanceOf(PdfConfig).isRequired };

export default function PlannerAppendix6({ config }) {
  const { t } = useTranslation('pdf');
  const manualLink = [[PLANNER_MANUAL, 'guide']];
  const guideSections = ['capture', 'choose', 'day', 'review', 'navigation', 'overflow'];
  const inboxId = (page) => (page === 0 ? PLANNER_INBOX : PLANNER_INBOX + '-2');
  return (
    <>
      {[0, 1].map((page) => (
        <Sheet
          key={inboxId(page)}
          config={config}
          id={inboxId(page)}
          bookmark={page === 0 ? t('planner6.nav.inbox') : undefined}
          title={t('planner6.inbox.title') + '  ' + (page + 1) + ' / 2'}
          subtitle={t('planner6.inbox.subtitle')}
          links={manualLink}
          paging="inbox"
          previous={page === 1 ? inboxId(0) : undefined}
          next={page === 0 ? inboxId(1) : undefined}
        >
          <Text style={[styles.hint, { marginBottom: 14 }]}>{t('planner6.inbox.hint')}</Text>
          <Text style={[styles.hint, { marginBottom: 6 }]}>{t('planner6.inbox.legend')}</Text>
          <CheckLines
            count={Math.max(1, Math.min(20, Math.floor((plannerArea(config).height - 60) / WRITING_PITCH)))}
          />
        </Sheet>
      ))}
      <Sheet
        config={config}
        id={PLANNER_MANUAL}
        bookmark={t('planner6.nav.guide')}
        title={t('planner6.guide.title')}
        subtitle={t('planner6.guide.subtitle')}
        links={[[PLANNER_TIME_LOG, 'reference']]}
      >
        {guideSections.map((section) => (
          <View key={section} style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>{t('planner6.guide.' + section + '.title')}</Text>
            <Text style={{ fontSize: 9.5, color: INK, lineHeight: 1.35 }}>
              {t('planner6.guide.' + section + '.body')}
            </Text>
          </View>
        ))}
        <View style={{ borderTop: '0.6 solid #AAA', paddingTop: 10 }}>
          <Text style={styles.sectionTitle}>{t('planner6.guide.minimum-title')}</Text>
          <Text style={{ fontSize: 9.5, lineHeight: 1.35, color: INK }}>{t('planner6.guide.minimum')}</Text>
        </View>
      </Sheet>
      <Sheet
        config={config}
        id={PLANNER_TIME_LOG}
        bookmark={t('planner6.log.title')}
        title={t('planner6.log.title')}
        subtitle={t('planner6.log.subtitle')}
        links={manualLink}
      >
        <Text style={[styles.hint, { marginBottom: 16 }]}>{t('planner6.log.hint')}</Text>
        <WorkedTimeline config={config} />
        <Text style={[styles.label, { marginBottom: 7 }]}>{t('planner6.log.total')}</Text>
        <Text style={[styles.hint, { marginBottom: 18 }]}>{t('planner6.log.difference')}</Text>
        {['task', 'review', 'notes'].map((section) => (
          <View key={section} style={{ marginBottom: 18 }}>
            <Text style={styles.sectionTitle}>{t('planner6.log.' + section + '-title')}</Text>
            <Text style={{ fontSize: 10, color: INK, lineHeight: 1.4 }}>{t('planner6.log.' + section + '-body')}</Text>
          </View>
        ))}
      </Sheet>
    </>
  );
}
PlannerAppendix6.propTypes = { config: PropTypes.instanceOf(PdfConfig) };
