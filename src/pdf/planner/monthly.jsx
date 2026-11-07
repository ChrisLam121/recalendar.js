import { Link, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { getWeekNumber } from '~/lib/date';
import PdfConfig from '~/pdf/config';
import {
  dayPageLink,
  habitTrackerLink,
  monthDashboardLink,
  monthOverviewLink,
  weekOverviewLink,
} from '~/pdf/lib/links';
import { isRedDay } from '~/pdf/utils';

import { INK, MUTED, plannerArea } from './geometry';
import { Prompt, Sheet, styles } from './layout';

export function PlannerMonth({ date, config }) {
  const { t } = useTranslation('pdf');
  const weeks = [];
  for (
    let week = date.startOf('month').startOf('week');
    week.isBefore(date.endOf('month'));
    week = week.add(1, 'week')
  ) {
    weeks.push(week);
  }
  const { height } = plannerArea(config);
  return (
    <Sheet
      config={config}
      id={monthOverviewLink(date, config)}
      bookmark={date.format('MMMM YYYY')}
      title={date.format('MMMM YYYY')}
      subtitle={t('planner6.month.calendar-hint')}
      paging="month"
      links={[
        [monthDashboardLink(date, config), 'direction'],
        [habitTrackerLink(date, config), 'habits'],
      ]}
      previous={monthOverviewLink(date.subtract(1, 'month'), config)}
      next={monthOverviewLink(date.add(1, 'month'), config)}
    >
      <View style={{ flexDirection: 'row', height: 24, borderBottom: '0.7 solid #777', alignItems: 'center' }}>
        <Text style={{ width: 22, fontSize: 8, color: MUTED }}>W</Text>
        {Array.from({ length: 7 }, (_, i) => date.startOf('week').add(i, 'day')).map((day) => (
          <Text key={day.day()} style={{ flex: 1, fontSize: 9, fontWeight: 'bold', paddingLeft: 6, color: INK }}>
            {day.format('ddd')}
          </Text>
        ))}
      </View>
      {weeks.map((week) => {
        const weekTarget = config.isWeekOverviewEnabled && weekOverviewLink(week, config);
        return (
          <View
            key={week.unix()}
            style={{ height: (height - 24) / weeks.length, flexDirection: 'row', borderBottom: '0.5 solid #B4B4B4' }}
          >
            <Link
              src={weekTarget ? '#' + weekTarget : undefined}
              style={{ width: 22, color: MUTED, fontSize: 9, paddingTop: 10, textDecoration: 'none' }}
            >
              {getWeekNumber(week)}
            </Link>
            {Array.from({ length: 7 }, (_, i) => week.add(i, 'day')).map((day) => {
              const target = dayPageLink(day, config);
              const color = !day.isSame(date, 'month') ? '#999' : isRedDay(day, config) ? '#B31B1B' : INK;
              return (
                <Link
                  key={day.unix()}
                  src={target ? '#' + target : undefined}
                  style={{
                    flex: 1,
                    borderLeft: '0.4 solid #D6D6D6',
                    padding: '8 6',
                    textDecoration: 'none',
                    fontSize: 15,
                    color,
                  }}
                >
                  {day.date()}
                </Link>
              );
            })}
          </View>
        );
      })}
    </Sheet>
  );
}

export function PlannerMonthDirection({ date, config }) {
  const { t } = useTranslation('pdf');
  return (
    <Sheet
      config={config}
      id={monthDashboardLink(date, config)}
      title={date.format('MMMM YYYY')}
      subtitle={t('planner6.month.direction')}
      paging="month"
      links={[
        [monthOverviewLink(date, config), 'month'],
        [habitTrackerLink(date, config), 'habits'],
      ]}
      previous={monthDashboardLink(date.subtract(1, 'month'), config)}
      next={monthDashboardLink(date.add(1, 'month'), config)}
    >
      <Prompt title={t('planner6.month.outcomes')} hint={t('planner6.month.outcomes-hint')} weight={1.3} />
      <Prompt title={t('planner6.month.progress')} hint={t('planner6.month.progress-hint')} weight={1.2} />
      <Prompt title={t('planner6.month.adjust')} hint={t('planner6.month.adjust-hint')} weight={0.8} />
      <Prompt title={t('planner6.month.index')} hint={t('planner6.month.index-hint')} weight={0.6} />
    </Sheet>
  );
}

export function PlannerHabits({ date, config }) {
  const { t } = useTranslation('pdf');
  const { width, height } = plannerArea(config);
  const days = Array.from({ length: date.daysInMonth() }, (_, i) => date.date(i + 1));
  const labelWidth = 90;
  const goalWidth = 27;
  const cellWidth = (width - labelWidth - goalWidth) / days.length;
  const rowHeight = Math.min(24, (height - 174) / Math.max(1, config.habits.length));
  const cellStyle = {
    width: cellWidth,
    height: rowHeight,
    borderRight: '0.4 solid #B4B4B4',
    borderBottom: '0.4 solid #B4B4B4',
  };
  return (
    <Sheet
      config={config}
      id={habitTrackerLink(date, config)}
      title={date.format('MMMM YYYY')}
      subtitle={t('planner6.habits.title')}
      paging="month"
      links={[
        [monthOverviewLink(date, config), 'month'],
        [monthDashboardLink(date, config), 'direction'],
      ]}
      previous={habitTrackerLink(date.subtract(1, 'month'), config)}
      next={habitTrackerLink(date.add(1, 'month'), config)}
    >
      <Text style={[styles.hint, { height: 32 }]}>{t('planner6.habits.hint')}</Text>
      <View style={{ flexDirection: 'row', borderBottom: '0.6 solid #777', height: 28, alignItems: 'center' }}>
        <Text style={[styles.label, { width: labelWidth }]}>{t('planner6.habits.habit')}</Text>
        <Text style={{ width: goalWidth, textAlign: 'center', fontSize: 8, color: MUTED }}>
          {t('planner6.habits.goal')}
        </Text>
        {days.map((day) => (
          <View key={day.date()} style={{ width: cellWidth, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: isRedDay(day, config) ? '#B31B1B' : INK }}>{day.date()}</Text>
            <Text style={{ fontSize: 7, color: MUTED, marginTop: 3 }}>{day.format('dd')}</Text>
          </View>
        ))}
      </View>
      {config.habits.map(({ id, value }) => (
        <View key={id} style={{ flexDirection: 'row' }}>
          <View
            style={{
              width: labelWidth,
              height: rowHeight,
              justifyContent: 'center',
              borderBottom: '0.4 solid #B4B4B4',
              paddingRight: 4,
            }}
          >
            <Text style={{ fontSize: 8.5, color: INK, maxLines: 2, textOverflow: 'ellipsis' }}>{value}</Text>
          </View>
          <View
            style={{
              width: goalWidth,
              height: rowHeight,
              borderLeft: '0.4 solid #B4B4B4',
              borderRight: '0.4 solid #B4B4B4',
              borderBottom: '0.4 solid #B4B4B4',
            }}
          />
          {days.map((day) => (
            <View
              key={day.date()}
              style={[cellStyle, config.weekendDays.includes(day.day()) && { backgroundColor: '#F0F0F0' }]}
            />
          ))}
        </View>
      ))}
      <View style={{ flex: 1, marginTop: 16 }}>
        <Prompt title={t('planner6.habits.pattern')} />
        <Prompt title={t('planner6.habits.change')} />
      </View>
    </Sheet>
  );
}

const pageProps = { date: PropTypes.instanceOf(dayjs).isRequired, config: PropTypes.instanceOf(PdfConfig).isRequired };
PlannerMonth.propTypes = pageProps;
PlannerMonthDirection.propTypes = pageProps;
PlannerHabits.propTypes = pageProps;
