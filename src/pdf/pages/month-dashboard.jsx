import { StyleSheet, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { MonthYearLabel } from '~/pdf/components/calendar-date-label';
import PlannerSheet from '~/pdf/components/planner-sheet';
import WritingDots from '~/pdf/components/writing-dots';
import PdfConfig from '~/pdf/config';
import { habitTrackerLink, monthDashboardLink, monthOverviewLink } from '~/pdf/lib/links';

const styles = StyleSheet.create({
  section: {
    flexGrow: 1,
    flexBasis: 0,
    marginBottom: 10,
    borderBottom: '0.6 solid #AAA',
    paddingBottom: 8,
  },
  taskSection: { flexGrow: 1.4 },
  index: { height: 80 },
  heading: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  hint: {
    color: '#666',
    fontSize: 10,
    marginTop: 3,
    marginBottom: 2,
  },
  writing: { flex: 1, marginTop: 4 },
});

export default function MonthDashboard({ config, date }) {
  const { t } = useTranslation('pdf');
  const links = [
    [monthOverviewLink(date, config), 'month'],
    [habitTrackerLink(date, config), 'habits'],
  ];
  const sections = [
    ['focus', styles.section],
    ['tasks', [styles.section, styles.taskSection]],
    ['carry', styles.section],
    ['index', styles.index],
  ];

  return (
    <PlannerSheet
      config={config}
      id={monthDashboardLink(date, config)}
      title={t('planner.dashboard.title')}
      subtitle={<MonthYearLabel date={date} config={config} color="#555" />}
      links={links}
      previous={monthDashboardLink(date.subtract(1, 'month'), config)}
      next={monthDashboardLink(date.add(1, 'month'), config)}
    >
      {sections.map(([section, style]) => (
        <View key={section} style={style}>
          <Text style={styles.heading}>{t('planner.dashboard.' + section + '.heading')}</Text>
          <Text style={styles.hint}>{t('planner.dashboard.' + section + '.hint')}</Text>
          <View style={styles.writing}>
            <WritingDots />
          </View>
        </View>
      ))}
    </PlannerSheet>
  );
}

MonthDashboard.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
};
