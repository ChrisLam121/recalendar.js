import { Link, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { getWeekNumber } from '~/lib/date';
import PdfConfig from '~/pdf/config';
import {
  dayPageLink,
  monthOverviewLink,
  PLANNER_MANUAL,
  weekOverviewLink,
  weekRetrospectiveLink,
  yearNotesLink,
  yearOverviewLink,
} from '~/pdf/lib/links';
import { getCalendarStartDate, getRenderedMonthCount, isRedDay } from '~/pdf/utils';

import { INK, MUTED, plannerArea } from './geometry';
import { Sheet } from './layout';

function IndexMonth({ date, config, width }) {
  const first = date.startOf('month').startOf('week');
  const weeks = [];
  for (let week = first; week.isBefore(date.endOf('month')); week = week.add(1, 'week')) {
    weeks.push(week);
  }
  const side = 15;
  const dayWidth = (width - side * 2) / 7;
  const cell = { width: dayWidth, textAlign: 'center', height: 12.5, fontSize: 9, textDecoration: 'none', color: INK };
  const month = monthOverviewLink(date, config);
  const year = config.isYearNotesEnabled && yearNotesLink(date);
  return (
    <View style={{ width }}>
      <View style={{ height: 18, flexDirection: 'row', alignItems: 'center' }}>
        <Link
          src={month ? '#' + month : undefined}
          style={{ fontSize: 11, color: INK, fontWeight: 'bold', textDecoration: 'none' }}
        >
          {date.format('MMMM')}
        </Link>
        <Link
          src={year ? '#' + year : undefined}
          style={{ marginLeft: 'auto', fontSize: 9, color: MUTED, textDecoration: 'none' }}
        >
          {date.format('YYYY')}
        </Link>
      </View>
      <View style={{ flexDirection: 'row', borderBottom: '0.5 solid #999' }}>
        <Text style={{ ...cell, width: side, fontSize: 7.5 }}>W</Text>
        {Array.from({ length: 7 }, (_, i) => first.add(i, 'day')).map((day) => (
          <Text key={day.day()} style={{ ...cell, fontSize: 7.5 }}>
            {day.format('dd')}
          </Text>
        ))}
        <Text style={{ ...cell, width: side, fontSize: 7.5 }}>R</Text>
      </View>
      {weeks.map((week) => {
        const weekTarget = config.isWeekOverviewEnabled && weekOverviewLink(week, config);
        const review = weekRetrospectiveLink(week, config);
        return (
          <View key={week.unix()} style={{ flexDirection: 'row' }}>
            <Link
              src={weekTarget ? '#' + weekTarget : undefined}
              style={{ ...cell, width: side, fontSize: 8, color: MUTED }}
            >
              {getWeekNumber(week)}
            </Link>
            {Array.from({ length: 7 }, (_, i) => week.add(i, 'day')).map((day) => {
              const target = dayPageLink(day, config);
              return (
                <Link
                  key={day.unix()}
                  src={target ? '#' + target : undefined}
                  style={{
                    ...cell,
                    color: !day.isSame(date, 'month') ? '#999' : isRedDay(day, config) ? '#B31B1B' : INK,
                  }}
                >
                  {day.date()}
                </Link>
              );
            })}
            <Link src={review ? '#' + review : undefined} style={{ ...cell, width: side, color: MUTED }}>
              R
            </Link>
          </View>
        );
      })}
    </View>
  );
}
IndexMonth.propTypes = {
  date: PropTypes.instanceOf(dayjs),
  config: PropTypes.instanceOf(PdfConfig),
  width: PropTypes.number,
};

export default function PlannerIndex({ config }) {
  const { t } = useTranslation('pdf');
  const start = getCalendarStartDate(config);
  const count = getRenderedMonthCount(config);
  const last = start.add(count - 1, 'month');
  const { width, height } = plannerArea(config);
  const columns = Math.max(1, Math.floor(width / 140));
  const tileWidth = (width - (columns - 1) * 14) / columns;
  const rowsPerPage = Math.max(1, Math.floor(height / 110));
  const rows = [];
  for (let i = 0; i < count; ) {
    const row = [];
    const year = start.add(i, 'month').year();
    while (i < count && row.length < columns && start.add(i, 'month').year() === year) {
      row.push(start.add(i++, 'month'));
    }
    rows.push(row);
  }
  const pageCount = Math.ceil(rows.length / rowsPerPage);
  const pageId = (i) => (i === 0 ? yearOverviewLink() : 'year-index-' + (i + 1));
  return Array.from({ length: pageCount }, (_, page) => (
    <Sheet
      key={pageId(page)}
      config={config}
      id={pageId(page)}
      bookmark={page === 0 ? t('planner6.nav.home') : undefined}
      title={start.year() === last.year() ? start.format('YYYY') : start.format('YYYY') + ' / ' + last.format('YYYY')}
      subtitle={start.format('MMMM YYYY') + ' - ' + last.format('MMMM YYYY') + '  ·  ' + t('planner6.year.index')}
      links={[[PLANNER_MANUAL, 'guide']]}
      paging="index"
      previous={page > 0 ? pageId(page - 1) : undefined}
      next={page + 1 < pageCount ? pageId(page + 1) : undefined}
    >
      {rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row) => (
        <View key={row[0].unix()} style={{ flexDirection: 'row', height: 110, columnGap: 14 }}>
          {row.map((date) => (
            <IndexMonth key={date.unix()} date={date} config={config} width={tileWidth} />
          ))}
        </View>
      ))}
    </Sheet>
  ));
}
PlannerIndex.propTypes = { config: PropTypes.instanceOf(PdfConfig) };
