import { Link } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';

import PdfConfig from '~/pdf/config';
import { monthOverviewLink, yearOverviewLink } from '~/pdf/lib/links';

function linkedMonth(date, config, style) {
  const month = date.format('MMMM');
  const destination = config.isMonthOverviewEnabled && monthOverviewLink(date, config);
  return destination ? (
    <Link src={'#' + destination} style={style}>
      {month}
    </Link>
  ) : (
    month
  );
}

// These labels are rendered inside the surrounding Text, so each link covers only its own word.
export function MonthYearLabel({ date, config, color }) {
  const style = { color, textDecoration: 'none' };
  return (
    <>
      {linkedMonth(date, config, style)}{' '}
      <Link src={'#' + yearOverviewLink()} style={style}>
        {date.format('YYYY')}
      </Link>
    </>
  );
}

const weekMonthStyle = { color: 'black', textDecoration: 'none' };

export function WeekDateRange({ date, config }) {
  const first = date.startOf('week');
  const last = date.endOf('week');
  if (!config.isPlannerWorkflowEnabled) {
    return `${first.format('DD MMMM')} - ${last.format('DD MMMM')}`;
  }

  return (
    <>
      {first.format('DD ')}
      {linkedMonth(first, config, weekMonthStyle)}
      {' - '}
      {last.format('DD ')}
      {linkedMonth(last, config, weekMonthStyle)}
    </>
  );
}

MonthYearLabel.propTypes = {
  date: PropTypes.instanceOf(dayjs).isRequired,
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  color: PropTypes.string.isRequired,
};

WeekDateRange.propTypes = {
  date: PropTypes.instanceOf(dayjs).isRequired,
  config: PropTypes.instanceOf(PdfConfig).isRequired,
};
