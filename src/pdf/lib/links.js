import { getWeekId } from '~/lib/date';
import { isRendered, isRenderedDay, isRenderedMonth } from '~/pdf/utils';

export function dayPageLink(date, config) {
  if (config.isPlannerWorkflowEnabled && !isRenderedDay(date, config)) {
    return '';
  }
  const dayLink = findEnabledDayPageLink(date, config, 1);
  if (dayLink) {
    return dayLink;
  }

  if (config.isWeekOverviewEnabled) {
    // This ensures that we use the correct year for things like week 52
    // that has days from this and next year
    return weekOverviewLink(date.startOf('week'), config);
  }

  if (config.isMonthOverviewEnabled) {
    return monthOverviewLink(date, config);
  }

  return '';
}

export function nextDayPageLink(date, config) {
  const currentDate = date.add(1, 'day');
  return findEnabledDayPageLink(currentDate, config, 1);
}

export function previousDayPageLink(date, config) {
  const currentDate = date.subtract(1, 'day');
  return findEnabledDayPageLink(currentDate, config, -1);
}

function findEnabledDayPageLink(date, config, step) {
  for (let i = 0; i < config.dayItineraries.length; i++) {
    const currentDayItinerary = config.dayItineraries.find(findDayOfWeek(date.day()));
    if (!currentDayItinerary?.isEnabled) {
      date = date.add(step, 'day');
      continue;
    }

    if (!isRenderedDay(date, config)) {
      return '';
    }

    return 'day-' + date.format('DDMMYYYY');
  }

  return '';
}

function findDayOfWeek(needle) {
  return ({ dayOfWeek }) => dayOfWeek === needle;
}

export function monthOverviewLink(date, config) {
  if (config.isMonthOverviewEnabled) {
    return isRenderedMonth(date, config) ? 'month-' + date.format('MMYYYY') : '';
  }

  const dayLink = findEnabledDayPageLink(date.date(1), config, 1);
  if (dayLink) {
    return dayLink;
  }

  if (config.isWeekOverviewEnabled) {
    // This ensures that we use the correct year for things like week 52
    // that has days from this and next year
    return weekOverviewLink(date.date(1).startOf('week'), config);
  }

  return '';
}

export function habitTrackerLink(date, config) {
  return config.isMonthOverviewEnabled && isRenderedMonth(date, config) ? 'habits-' + date.format('MMYYYY') : '';
}

export function monthDashboardLink(date, config) {
  return config.isPlannerWorkflowEnabled && habitTrackerLink(date, config) ? 'dashboard-' + date.format('MMYYYY') : '';
}

export function weekMonthOverviewLink(week, config) {
  if (!config.isMonthOverviewEnabled) {
    return '';
  }
  return monthOverviewLink(week, config) || monthOverviewLink(week.endOf('week'), config);
}

export function dailyNotesLink(date, config) {
  const enabled = config.dayItineraries.find(findDayOfWeek(date.day()))?.isEnabled;
  return config.isPlannerWorkflowEnabled && enabled && isRenderedDay(date, config)
    ? 'notes-' + date.format('DDMMYYYY')
    : '';
}

export const PLANNER_INBOX = 'master-inbox';
export const PLANNER_MANUAL = 'template-library';
export const PLANNER_TIME_LOG = 'template-time-log';

export function weekOverviewLink(date, config) {
  if (config.isWeekOverviewEnabled) {
    return isRendered(date.startOf('week'), config) ? 'week-overview-' + getWeekId(date) : '';
  }

  const dayLink = findEnabledDayPageLink(date.weekday(0), config, 1);
  if (dayLink) {
    return dayLink;
  }

  if (config.isMonthOverviewEnabled) {
    return monthOverviewLink(date, config);
  }

  return '';
}

export function weekRetrospectiveLink(date, config) {
  if (!config.isWeekRetrospectiveEnabled || !isRendered(date.startOf('week'), config)) {
    return '';
  }

  return 'week-retrospective-' + getWeekId(date);
}

export function yearOverviewLink() {
  return 'year-overview';
}

export function yearNotesLink(date) {
  return 'year-notes-' + date.format('YYYY');
}
