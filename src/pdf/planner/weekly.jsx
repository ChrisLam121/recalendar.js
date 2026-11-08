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
  const { height } = plannerArea(config);
  const rowHeight = height / 7;
  const focusGap = 8;
  const labelHeight = 11 * 1.2;
  const legendHeight = 8 * 1.4;
  const actionHeaderHeight = 6 + labelHeight + WRITING_PITCH + 3 + focusGap + labelHeight + 5 + legendHeight + 6;
  const actionCount = Math.max(1, Math.floor((height - 0.6 - actionHeaderHeight) / WRITING_PITCH));
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
      <View style={{ flexDirection: 'row', height, borderTop: '0.6 solid #888' }}>
        <View style={{ width: '60%', paddingRight: 12, borderRight: '0.5 solid #B4B4B4' }}>
          {days.map((day) => {
            const target = dayPageLink(day, config);
            const color = target ? (isRedDay(day, config) ? '#B31B1B' : INK) : '#999';
            return (
              <View
                key={day.unix()}
                style={{
                  height: rowHeight,
                  paddingTop: 5,
                  paddingBottom: 2,
                }}
              >
                <Link src={target ? '#' + target : undefined} style={{ color, textDecoration: 'none', height: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{day.format('ddd')}</Text>
                    <Text style={{ fontSize: 11, marginLeft: 'auto' }}>{day.format('D MMM')}</Text>
                  </View>
                </Link>
                <View style={{ height: WRITING_PITCH * 2 + 2 }}>{target && <Writing />}</View>
                {!target && <Text style={styles.hint}>{t('planner6.week.outside')}</Text>}
              </View>
            );
          })}
        </View>
        <View style={{ width: '40%', paddingLeft: 14, paddingTop: 6 }}>
          <Text style={[styles.label, { lineHeight: 1.2 }]}>{t('planner6.week.outcomes')}</Text>
          <View style={{ height: WRITING_PITCH + 3, marginBottom: focusGap }}>
            <Writing />
          </View>
          <Text style={[styles.label, { lineHeight: 1.2 }]}>{t('planner6.week.actions')}</Text>
          <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.4, marginTop: 5, marginBottom: 6 }}>
            {t('planner6.week.status')}
          </Text>
          <CheckLines count={actionCount} />
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
      <Prompt title={t('planner6.review.progress')} />
      <Prompt title={t('planner6.review.difference')} weight={1.2} />
      <Prompt title={t('planner6.review.change')} />
      <Prompt title={t('planner6.review.decisions')} />
    </Sheet>
  );
}

const pageProps = { date: PropTypes.instanceOf(dayjs).isRequired, config: PropTypes.instanceOf(PdfConfig).isRequired };
PlannerWeek.propTypes = pageProps;
PlannerReview.propTypes = pageProps;
