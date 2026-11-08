import { Canvas, StyleSheet, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { EXACT_DATE_FORMAT, findByDate } from '~/lib/special-dates-utils';
import PdfConfig from '~/pdf/config';
import {
  dailyNotesLink,
  dayPageLink,
  monthOverviewLink,
  nextDayPageLink,
  previousDayPageLink,
  weekOverviewLink,
} from '~/pdf/lib/links';
import { isRedDay } from '~/pdf/utils';

import { INK, MUTED, plannerArea, plannerHours, WRITING_PITCH } from './geometry';
import { Sheet, styles as shared, Writing } from './layout';

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', height: 54 },
  number: { fontSize: 46, lineHeight: 1, fontWeight: 'bold', color: INK, width: 65, flexShrink: 0 },
  month: { fontSize: 13, fontWeight: 'bold', color: INK },
  weekday: { fontSize: 11, color: MUTED, marginTop: 5 },
  focus: { width: '45%', marginLeft: 'auto', height: 50 },
  focusTitle: { fontSize: 9, color: MUTED, marginBottom: 2 },
  focusLine: { height: WRITING_PITCH, borderBottom: '0.4 solid #B4B4B4' },
  occasion: { height: 26, fontSize: 8.5, lineHeight: 1.25, color: MUTED, maxLines: 2, textOverflow: 'ellipsis' },
  columns: { height: 22, flexDirection: 'row', alignItems: 'center' },
  columnLabel: { fontSize: 11, fontWeight: 'bold', color: INK },
});

function DateHeading({ date, config, notes = false }) {
  const { t } = useTranslation('pdf');
  return (
    <View style={styles.heading}>
      <Text style={[styles.number, isRedDay(date, config) && { color: '#B31B1B' }]}>{date.format('DD')}</Text>
      <View>
        <Text style={styles.month}>{date.format('MMMM YYYY')}</Text>
        <Text style={styles.weekday}>{date.format('dddd')}</Text>
      </View>
      <View style={styles.focus}>
        {notes ? (
          <Text style={[shared.label, { marginTop: 12 }]}>{t('planner6.daily.notes')}</Text>
        ) : (
          <>
            <Text style={styles.focusTitle}>{t('planner6.daily.focus')}</Text>
            <View style={styles.focusLine} />
          </>
        )}
      </View>
    </View>
  );
}
DateHeading.propTypes = {
  date: PropTypes.instanceOf(dayjs),
  config: PropTypes.instanceOf(PdfConfig),
  notes: PropTypes.bool,
};

function Timeline({ config }) {
  const { t } = useTranslation('pdf');
  const { start, end, slots } = plannerHours(config);
  const { width, height: bodyHeight } = plannerArea(config);
  const height = bodyHeight - 58;
  const axis = 36;
  const lane = (width - axis) / 2;
  const pitch = height / slots;
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  function paint(painter) {
    painter.lineWidth(0.4).strokeColor('#B4B4B4');
    painter
      .moveTo(lane, 0)
      .lineTo(lane, height)
      .moveTo(lane + axis, 0)
      .lineTo(lane + axis, height)
      .stroke();
    for (let i = 0; i <= slots; i++) {
      const y = i * pitch;
      // Lighter full-width half-hour guides preserve the stronger hourly rhythm.
      const halfHour = i % 2 !== 0;
      painter.lineWidth(halfHour ? 0.4 : 0.6).strokeColor(halfHour ? '#D0D0D0' : '#999999');
      painter
        .moveTo(0, y)
        .lineTo(lane - 4, y)
        .moveTo(lane + axis + 4, y)
        .lineTo(width, y)
        .stroke();
    }
  }
  return (
    <>
      <View style={styles.columns}>
        <Text style={[styles.columnLabel, { width: lane }]}>{t('planner6.daily.plan')}</Text>
        <View style={{ width: axis }} />
        <Text style={[styles.columnLabel, { paddingLeft: 4 }]}>{t('planner6.daily.actual')}</Text>
      </View>
      <View style={{ height, marginTop: 5 }}>
        <Canvas paint={paint} style={{ position: 'absolute', width, height }} />
        {hours.map((hour) => (
          <Text
            key={hour}
            style={{
              position: 'absolute',
              top: (hour - start) * 2 * pitch - 4.5,
              left: lane,
              width: axis,
              textAlign: 'center',
              fontSize: 8.5,
              color: MUTED,
            }}
          >
            {String(hour).padStart(2, '0')}:00
          </Text>
        ))}
      </View>
    </>
  );
}
Timeline.propTypes = { config: PropTypes.instanceOf(PdfConfig) };

export default function PlannerDay({ config, date }) {
  const { t } = useTranslation('pdf');
  if (!config.dayItineraries.find((day) => day.dayOfWeek === date.day())?.isEnabled) {
    return null;
  }
  const previous = previousDayPageLink(date, config);
  const next = nextDayPageLink(date, config);
  const dayId = dayPageLink(date, config);
  const notesId = dailyNotesLink(date, config);
  const links = [
    [config.isMonthOverviewEnabled && monthOverviewLink(date, config), 'month'],
    [config.isWeekOverviewEnabled && weekOverviewLink(date, config), 'week'],
  ];
  const occasions = config.specialDates.filter(findByDate(date.format(EXACT_DATE_FORMAT)));
  return (
    <>
      <Sheet
        config={config}
        id={dayId}
        heading={<DateHeading config={config} date={date} />}
        links={[...links, [notesId, 'notes']]}
        previous={previous}
        next={next}
      >
        <Text style={styles.occasion}>{occasions.map(({ value }) => value).join(' / ') || ' '}</Text>
        <Timeline config={config} />
      </Sheet>
      <Sheet
        config={config}
        id={notesId}
        paging="notes"
        heading={<DateHeading config={config} date={date} notes />}
        links={[...links, [dayId, 'day']]}
        previous={previous && 'notes-' + previous.slice(4)}
        next={next && 'notes-' + next.slice(4)}
      >
        {occasions.length > 0 && (
          <Text style={[shared.hint, { marginBottom: 10 }]}>{occasions.map(({ value }) => value).join(' / ')}</Text>
        )}
        <Text style={[shared.hint, { marginBottom: 6 }]}>{t('planner6.daily.notes-hint')}</Text>
        <View style={{ flex: 1 }}>
          <Writing dots />
        </View>
      </Sheet>
    </>
  );
}
PlannerDay.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
};
