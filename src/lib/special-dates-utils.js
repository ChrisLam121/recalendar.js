import dayjs from 'dayjs/esm';

export const HOLIDAY_DAY_TYPE = 'holiday';
export const EVENT_DAY_TYPE = 'event';

export function isHoliday({ type }) {
  return type === HOLIDAY_DAY_TYPE;
}
export function isEvent({ type }) {
  return type === EVENT_DAY_TYPE;
}

export function findByDate(dateToSearchFor) {
  const annualDate = dateToSearchFor.slice(-5);
  return ({ date }) => date === dateToSearchFor || date === annualDate;
}

// Keep month/day keys for existing annually repeating birthdays and anniversaries.
export const DATE_FORMAT = 'MM-DD';
export const EXACT_DATE_FORMAT = 'YYYY-MM-DD';

export function getDedupeKey({ date, holidayName, value, type = HOLIDAY_DAY_TYPE }) {
  const name = (holidayName ?? value ?? '').trim().toLowerCase();
  return `${type}|${date}|${name}`;
}

export function getDateRange({ year, month, monthCount }) {
  const firstDay = dayjs({ year: Number(year), month: Number(month), day: 1 });
  return {
    start: firstDay.format(EXACT_DATE_FORMAT),
    end: firstDay.add(Number(monthCount), 'months').format(EXACT_DATE_FORMAT),
  };
}

export function getSpannedYears(config) {
  const { start, end } = getDateRange(config);
  const firstDay = dayjs(start);
  const lastDay = dayjs(end).subtract(1, 'day');
  const years = [];
  for (let current = firstDay.year(); current <= lastDay.year(); current++) {
    years.push(current);
  }
  return years;
}

export function formatYearRange(years) {
  if (years.length === 0) {
    return '';
  }

  return years.length === 1 ? String(years[0]) : `${years[0]}-${years[years.length - 1]}`;
}
