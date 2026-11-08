import { Link, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { getWeekNumber } from '~/lib/date';
import PdfConfig from '~/pdf/config';
import { dayPageLink, weekMonthOverviewLink, weekOverviewLink, weekRetrospectiveLink } from '~/pdf/lib/links';
import { isRedDay } from '~/pdf/utils';

import { INK, MUTED, plannerArea, WRITING_PITCH, weekRange } from './geometry';
import { CheckLines, Prompt, Sheet, styles, Writing } from './layout';

export function PlannerWeek({ date, config }) {
  const { t } = useTranslation('pdf');
  const days = Array.from({ length: 7 }, (_, i) => date.startOf('week').add(i, 'day'));
  const rowHeight = plannerArea(config).height / 3;
  const links = [
    [weekMonthOverviewLink(date, config), 'month'],
    [weekRetrospectiveLink(date, config), 'review'],
  ];
  return (
    <Sheet
      config={config}
      id={weekOverviewLink(date, config)}
      title={weekRange(date)}
      subtitle={t('planner6.week.subtitle', { week: getWeekNumber(date) })}
      links={links}
      paging="week"
      previous={weekOverviewLink(date.subtract(1, 'week'), config)}
      next={weekOverviewLink(date.add(1, 'week'), config)}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTop: '0.6 solid #888' }}>
        {days.map((day) => {
          const target = dayPageLink(day, config);
          const color = target ? (isRedDay(day, config) ? '#B31B1B' : INK) : '#999';
          return (
            <View
              key={day.unix()}
              style={{
                width: '33.3333%',
                height: rowHeight,
                padding: '8 9',
                borderBottom: '0.5 solid #B4B4B4',
                borderRight: '0.5 solid #B4B4B4',
              }}
            >
              <Link src={target ? '#' + target : undefined} style={{ color, textDecoration: 'none', paddingBottom: 7 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{day.format('ddd')}</Text>
                  <Text style={{ fontSize: 13, marginLeft: 'auto' }}>{day.format('D MMM')}</Text>
                </View>
              </Link>
              <View style={{ flex: 1 }}>{target && <Writing />}</View>
              {!target && <Text style={styles.hint}>{t('planner6.week.outside')}</Text>}
            </View>
          );
        })}
        <View style={{ width: '66.6666%', height: rowHeight, padding: '8 10', borderBottom: '0.5 solid #B4B4B4' }}>
          <Text style={styles.label}>{t('planner6.week.outcomes')}</Text>
          <View style={{ height: WRITING_PITCH + 3, marginBottom: 5 }}>
            <Writing />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.label}>{t('planner6.week.actions')}</Text>
            <Text style={{ fontSize: 8, color: MUTED, marginLeft: 'auto' }}>{t('planner6.week.status')}</Text>
          </View>
          <CheckLines count={Math.max(1, Math.floor((rowHeight - 70) / WRITING_PITCH))} />
        </View>
      </View>
    </Sheet>
  );
}

export function PlannerReview({ date, config }) {
  const { t } = useTranslation('pdf');
  return (
    <Sheet
      config={config}
      id={weekRetrospectiveLink(date, config)}
      title={weekRange(date)}
      subtitle={t('planner6.review.subtitle')}
      paging="review"
      links={[
        [weekMonthOverviewLink(date, config), 'month'],
        [config.isWeekOverviewEnabled && weekOverviewLink(date, config), 'week'],
        [config.isWeekOverviewEnabled && weekOverviewLink(date.add(1, 'week'), config), 'next-plan'],
      ]}
      previous={weekRetrospectiveLink(date.subtract(1, 'week'), config)}
      next={weekRetrospectiveLink(date.add(1, 'week'), config)}
    >
      <Prompt title={t('planner6.review.progress')} hint={t('planner6.review.progress-hint')} />
      <Prompt title={t('planner6.review.difference')} hint={t('planner6.review.difference-hint')} weight={1.2} />
      <Prompt title={t('planner6.review.change')} hint={t('planner6.review.change-hint')} />
      <Prompt title={t('planner6.review.decisions')} hint={t('planner6.review.decisions-hint')} />
    </Sheet>
  );
}

const pageProps = { date: PropTypes.instanceOf(dayjs).isRequired, config: PropTypes.instanceOf(PdfConfig).isRequired };
PlannerWeek.propTypes = pageProps;
PlannerReview.propTypes = pageProps;
