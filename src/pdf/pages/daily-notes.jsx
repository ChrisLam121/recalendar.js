import { View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { MonthYearLabel } from '~/pdf/components/calendar-date-label';
import Itinerary from '~/pdf/components/itinerary';
import PlannerSheet from '~/pdf/components/planner-sheet';
import WritingDots from '~/pdf/components/writing-dots';
import PdfConfig from '~/pdf/config';
import {
  dailyNotesLink,
  dayPageLink,
  monthOverviewLink,
  nextDayPageLink,
  previousDayPageLink,
  weekOverviewLink,
} from '~/pdf/lib/links';

export default function DailyNotes({ config, date, items }) {
  const { t } = useTranslation('pdf');
  const previous = previousDayPageLink(date, config);
  const next = nextDayPageLink(date, config);
  const links = [
    [config.isMonthOverviewEnabled && monthOverviewLink(date, config), 'month'],
    [config.isWeekOverviewEnabled && weekOverviewLink(date, config), 'week'],
    [dayPageLink(date, config), 'schedule'],
  ];
  // The old notes page used this placeholder as its only heading.
  const customItems = items.some(({ type, value }) => type === 'item' && value.trim() !== '{{date:YYYY-MM-DD, dddd}}')
    ? items
    : [];

  return (
    <PlannerSheet
      config={config}
      id={dailyNotesLink(date, config)}
      title={
        <>
          {date.format('ddd, DD ')}
          <MonthYearLabel date={date} config={config} color="#222" />
        </>
      }
      subtitle={t('planner.notes.subtitle')}
      links={links}
      previous={previous && 'notes-' + previous.slice(4)}
      next={next && 'notes-' + next.slice(4)}
    >
      {customItems.length > 0 && <Itinerary date={date} items={customItems} config={config} />}
      <View style={{ flex: 1 }}>
        <WritingDots />
      </View>
    </PlannerSheet>
  );
}

DailyNotes.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
  items: PropTypes.array.isRequired,
};
