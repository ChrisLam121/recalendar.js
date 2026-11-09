import { Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { getWeekdays, getWeekNumber } from '~/lib/date';
import { getPageSizeInPoints } from '~/lib/device-utils';
import PlannerNavigation from '~/pdf/components/planner-navigation';
import PdfConfig from '~/pdf/config';
import {
  dayPageLink,
  habitTrackerLink,
  monthDashboardLink,
  monthOverviewLink,
  weekOverviewLink,
  yearOverviewLink,
} from '~/pdf/lib/links';
import { pageStyle, redDayText } from '~/pdf/styles';
import { isRedDay } from '~/pdf/utils';

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: '22 24 24',
  },
  heading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 10,
    rowGap: 6,
    marginBottom: 20,
  },
  title: {
    color: '#222',
    textDecoration: 'none',
    fontSize: 32,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  navigation: {
    flexDirection: 'row',
    columnGap: 8,
    marginLeft: 'auto',
  },
  monthButton: {
    color: '#333',
    textDecoration: 'none',
    fontSize: 11,
    border: '0.6 solid transparent',
    borderRadius: 3,
    padding: '5 9',
  },
  grid: {
    flex: 1,
  },
  weekdays: {
    flexDirection: 'row',
    borderBottom: '1 solid #333',
  },
  weekday: {
    flex: 1,
    paddingLeft: 7.5,
  },
  weekdayLabel: {
    color: '#333',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingBottom: 6,
  },
  weekColumn: {
    width: 26,
    flexGrow: 0,
    flexShrink: 0,
    textAlign: 'center',
    textDecoration: 'none',
  },
  week: {
    flex: 1,
    flexDirection: 'row',
    borderBottom: '0.6 solid #AAA',
  },
  weekNumber: {
    color: '#666',
    fontSize: 10,
    paddingTop: 8,
  },
  dayCell: {
    flex: 1,
    padding: '6 7',
    borderLeft: '0.5 solid #DDD',
    textDecoration: 'none',
  },
  dayNumber: {
    color: '#222',
    fontSize: 17,
  },
  otherMonthDay: {
    color: '#999',
  },
});

function MonthOverviewPage({ date, config, t }) {
  const pageId = monthOverviewLink(date, config);

  function renderMonthButton(offset) {
    const month = date.add(offset, 'month');
    const link = monthOverviewLink(month, config);
    if (!link) {
      return null;
    }

    const name = month.format('MMMM');
    return (
      <Link src={'#' + link} style={styles.monthButton}>
        {offset < 0 ? '‹ ' + name : name + ' ›'}
      </Link>
    );
  }

  function renderDay(day) {
    const link = dayPageLink(day, config);
    const inMonth = day.isSame(date, 'month');
    const dayColor = inMonth && isRedDay(day, config) ? redDayText : null;

    return (
      <Link key={day.unix()} src={link ? '#' + link : undefined} style={styles.dayCell}>
        <View>
          <Text style={[styles.dayNumber, inMonth ? dayColor : styles.otherMonthDay]}>{day.date()}</Text>
        </View>
      </Link>
    );
  }

  function renderWeek(week) {
    const link = weekOverviewLink(week, config);
    const days = Array.from({ length: 7 }, (_, index) => week.add(index, 'day'));

    return (
      <View key={week.unix()} style={styles.week}>
        <Link src={link ? '#' + link : undefined} style={styles.weekColumn}>
          <View>
            <Text style={styles.weekNumber}>{getWeekNumber(week)}</Text>
          </View>
        </Link>
        {days.map(renderDay)}
      </View>
    );
  }

  const weeks = [];
  const endOfMonth = date.endOf('month');
  for (let week = date.startOf('month').startOf('week'); week.isBefore(endOfMonth); week = week.add(1, 'week')) {
    weeks.push(renderWeek(week));
  }

  return (
    <Page
      id={pageId}
      bookmark={config.isPlannerWorkflowEnabled ? date.format('MMMM YYYY') : undefined}
      size={getPageSizeInPoints(config)}
      wrap={false}
    >
      <View style={pageStyle(config)}>
        {config.isPlannerWorkflowEnabled && (
          <PlannerNavigation
            currentPage={pageId}
            links={[
              [habitTrackerLink(date, config), 'habits'],
              [monthDashboardLink(date, config), 'dashboard'],
            ]}
          />
        )}
        <View style={styles.body}>
          <View style={styles.heading}>
            <Link src={'#' + yearOverviewLink()} style={styles.title}>
              {date.format('MMMM YYYY')}
            </Link>
            <View style={styles.navigation}>
              {renderMonthButton(-1)}
              {renderMonthButton(1)}
            </View>
          </View>
          <View style={styles.weekdays}>
            <Text style={[styles.weekColumn, styles.weekdayLabel]}>{t('calendar.header.week-number')}</Text>
            {getWeekdays(config.firstDayOfWeek).map(({ index, short }) => (
              <Text key={index} style={[styles.weekday, styles.weekdayLabel]}>
                {short}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>{weeks}</View>
        </View>
      </View>
    </Page>
  );
}

MonthOverviewPage.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation('pdf')(MonthOverviewPage);
