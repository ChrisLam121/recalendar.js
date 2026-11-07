import { getPageSizeInPoints } from '~/lib/device-utils';
import { sidebarPadding } from '~/pdf/styles';

export const MARGIN = 22;
export const HEADER_HEIGHT = 106;
export const INK = '#252525';
export const MUTED = '#626262';
export const RULE = '#B4B4B4';
export const LIGHT_RULE = '#D6D6D6';

export function plannerArea(config) {
  const [pageWidth, pageHeight] = getPageSizeInPoints(config);
  const { paddingLeft, paddingRight, paddingTop, paddingBottom } = sidebarPadding(config);
  return {
    width: pageWidth - paddingLeft - paddingRight - MARGIN * 2,
    height: pageHeight - paddingTop - paddingBottom - HEADER_HEIGHT - MARGIN,
  };
}

export function plannerHours(config) {
  const start = Number(config.plannerStartHour ?? 6);
  const end = Number(config.plannerEndHour ?? 22);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 24 || end <= start) {
    throw new Error('Planner hours must be whole hours between 0 and 24, with the end after the start.');
  }
  return { start, end, slots: (end - start) * 2 };
}

export function weekRange(date) {
  const start = date.startOf('week');
  const end = date.endOf('week');
  if (start.year() !== end.year()) {
    return start.format('D MMM YYYY') + ' - ' + end.format('D MMM YYYY');
  }
  if (start.month() !== end.month()) {
    return start.format('D MMM') + ' - ' + end.format('D MMM YYYY');
  }
  return start.format('D') + ' - ' + end.format('D MMMM YYYY');
}
