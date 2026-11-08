import { Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import PdfConfig from '~/pdf/config';
import { PLANNER_INBOX, PLANNER_MANUAL, PLANNER_TIME_LOG, yearNotesLink } from '~/pdf/lib/links';

import { INK, plannerArea, WRITING_PITCH } from './geometry';
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

export default function PlannerAppendix6({ config }) {
  const { t } = useTranslation('pdf');
  const manualLink = [[PLANNER_MANUAL, 'guide']];
  const guideSections = ['capture', 'choose', 'day', 'review', 'navigation'];
  const columns = [
    ['interval', '24%'],
    ['duration', '15%'],
    ['activity', '61%'],
  ];
  const rowCount = Math.max(6, Math.floor((plannerArea(config).height - 100) / 31));
  return (
    <>
      <Sheet
        config={config}
        id={PLANNER_INBOX}
        bookmark={t('planner6.nav.inbox')}
        title={t('planner6.inbox.title')}
        subtitle={t('planner6.inbox.subtitle')}
        links={manualLink}
      >
        <Text style={[styles.hint, { marginBottom: 14 }]}>{t('planner6.inbox.hint')}</Text>
        <Text style={[styles.hint, { marginBottom: 6 }]}>{t('planner6.inbox.legend')}</Text>
        <CheckLines count={Math.max(1, Math.floor((plannerArea(config).height - 60) / WRITING_PITCH))} />
      </Sheet>
      <Sheet
        config={config}
        id={PLANNER_MANUAL}
        bookmark={t('planner6.nav.guide')}
        title={t('planner6.guide.title')}
        subtitle={t('planner6.guide.subtitle')}
        links={[[PLANNER_TIME_LOG, 'reference']]}
      >
        {guideSections.map((section) => (
          <View key={section} style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>{t('planner6.guide.' + section + '.title')}</Text>
            <Text style={{ fontSize: 10.5, color: INK, lineHeight: 1.4 }}>
              {t('planner6.guide.' + section + '.body')}
            </Text>
          </View>
        ))}
        <View style={{ borderTop: '0.6 solid #AAA', paddingTop: 12 }}>
          <Text style={styles.sectionTitle}>{t('planner6.guide.minimum-title')}</Text>
          <Text style={{ fontSize: 10.5, lineHeight: 1.4, color: INK }}>{t('planner6.guide.minimum')}</Text>
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
        <Text style={[styles.hint, { marginBottom: 12 }]}>{t('planner6.log.hint')}</Text>
        <Text style={[styles.hint, { marginBottom: 16 }]}>{t('planner6.log.example')}</Text>
        <View style={{ borderTop: '0.6 solid #888', borderLeft: '0.6 solid #AAA' }}>
          <View style={{ flexDirection: 'row' }}>
            {columns.map(([key, width]) => (
              <View
                key={key}
                style={{
                  width,
                  height: 30,
                  padding: '8 6',
                  borderRight: '0.6 solid #AAA',
                  borderBottom: '0.6 solid #888',
                }}
              >
                <Text style={styles.label}>{t('planner6.log.' + key)}</Text>
              </View>
            ))}
          </View>
          {Array.from({ length: rowCount }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed writing rows
            <View key={i} style={{ flexDirection: 'row' }}>
              {columns.map(([key, width]) => (
                <View
                  key={key}
                  style={{ width, height: 31, borderRight: '0.6 solid #AAA', borderBottom: '0.4 solid #B4B4B4' }}
                />
              ))}
            </View>
          ))}
        </View>
      </Sheet>
    </>
  );
}
PlannerAppendix6.propTypes = { config: PropTypes.instanceOf(PdfConfig) };
