import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import PlannerSheet from '~/pdf/components/planner-sheet';
import PdfConfig from '~/pdf/config';
import { PLANNER_INBOX, PLANNER_MANUAL, PLANNER_TIME_LOG } from '~/pdf/lib/links';

const styles = StyleSheet.create({
  hint: { color: '#555', fontSize: 11, lineHeight: 1.35, marginBottom: 12 },
  legend: { color: '#333', fontSize: 11, marginBottom: 10 },
  entry: {
    height: 25,
    borderBottom: '0.55 solid #BBB',
    padding: '5 0',
    color: '#777',
    fontSize: 11,
  },
  template: {
    color: '#222',
    fontSize: 15,
    fontWeight: 'bold',
    paddingVertical: 10,
    textDecoration: 'none',
    borderBottom: '0.55 solid #BBB',
  },
  section: { marginTop: 8 },
  sectionTitle: { marginBottom: 5, fontSize: 14, fontWeight: 'bold' },
  dateField: { fontSize: 12, marginBottom: 14 },
  table: { borderTop: '0.65 solid #777', borderLeft: '0.65 solid #777' },
  row: { flexDirection: 'row' },
  cell: {
    justifyContent: 'center',
    paddingLeft: 7,
    borderRight: '0.65 solid #777',
    borderBottom: '0.65 solid #777',
    height: 33,
    width: '16%',
    flexShrink: 0,
  },
  activity: { width: '52%' },
  tableHeading: { fontSize: 11, fontWeight: 'bold' },
  total: { marginTop: 15, fontSize: 12 },
});

const manualLinks = [[PLANNER_MANUAL, 'manual']];
const guideSections = ['navigation', 'tasks', 'reflection', 'notes'];
const columns = ['start', 'end', 'duration', 'activity'];
const inboxRows = Array.from({ length: 19 }, (_, index) => index + 1);
const logRows = Array.from({ length: 12 }, (_, index) => index + 1);

export default function PlannerAppendix({ config }) {
  const { t } = useTranslation('pdf');
  const inbox = t('planner.nav.inbox');
  const manual = t('planner.nav.manual');
  const timeLog = t('planner.log.title');

  return (
    <>
      <PlannerSheet config={config} id={PLANNER_INBOX} bookmark={inbox} title={inbox} links={manualLinks}>
        <Text style={styles.hint}>{t('planner.inbox.hint')}</Text>
        <Text style={styles.legend}>{t('planner.inbox.legend')}</Text>
        {inboxRows.map((number) => (
          <Text key={number} style={styles.entry}>
            □
          </Text>
        ))}
      </PlannerSheet>
      <PlannerSheet config={config} id={PLANNER_MANUAL} bookmark={manual} title={t('planner.guide.title')}>
        <Link src={'#' + PLANNER_TIME_LOG} style={styles.template}>
          {timeLog}
        </Link>
        {guideSections.map((section) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('planner.guide.' + section + '.title')}</Text>
            <Text style={styles.hint}>{t('planner.guide.' + section + '.body')}</Text>
            {section === 'tasks' && <Text style={styles.legend}>{t('planner.inbox.legend')}</Text>}
          </View>
        ))}
      </PlannerSheet>
      <PlannerSheet config={config} id={PLANNER_TIME_LOG} bookmark={timeLog} title={timeLog} links={manualLinks}>
        <Text style={styles.dateField}>{t('planner.log.date')}</Text>
        <Text style={styles.hint}>{t('planner.log.example')}</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            {columns.map((column) => (
              <View key={column} style={[styles.cell, column === 'activity' && styles.activity]}>
                <Text style={styles.tableHeading}>{t('planner.log.' + column)}</Text>
              </View>
            ))}
          </View>
          {logRows.map((number) => (
            <View key={number} style={styles.row}>
              {columns.map((column) => (
                <View key={column} style={[styles.cell, column === 'activity' && styles.activity]} />
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.total}>{t('planner.log.total')}</Text>
      </PlannerSheet>
    </>
  );
}

PlannerAppendix.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
};
