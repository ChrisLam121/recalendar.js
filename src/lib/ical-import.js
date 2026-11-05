import dayjs from 'dayjs/esm';
import ICAL from 'ical.js';

import { EXACT_DATE_FORMAT, getDateRange, getDedupeKey } from './special-dates-utils';

// Some calendar exporters emit slightly non-standard, but readable, properties.
ICAL.design.strict = false;

function dateKey(time) {
  // DATE values are calendar dates, not instants. Do not shift them across days
  // when the browser is in a different time zone.
  if (time.isDate) {
    return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
  }

  return dayjs(time.toJSDate()).format(EXACT_DATE_FORMAT);
}

export function importIcalDates(text, config, type, existingItems = []) {
  const { start, end } = getDateRange(config);
  const calendar = new ICAL.Component(ICAL.parse(text));
  const components = calendar.getAllSubcomponents('vevent');
  const seen = new Set(existingItems.map(getDedupeKey));
  const items = [];

  const add = (time, event) => {
    if (event.component.getFirstPropertyValue('status') === 'CANCELLED') {
      return;
    }

    const date = dateKey(time);
    const item = { date, value: event.summary, type };
    if (date >= start && date < end && !seen.has(getDedupeKey(item))) {
      seen.add(getDedupeKey(item));
      items.push(item);
    }
  };

  for (const component of components) {
    if (component.hasProperty('recurrence-id')) {
      continue;
    }

    // Relate only exceptions belonging to this event, rather than other UIDs.
    const uid = component.getFirstPropertyValue('uid');
    const exceptions = components.filter(
      (candidate) => candidate.hasProperty('recurrence-id') && candidate.getFirstPropertyValue('uid') === uid,
    );
    const event = new ICAL.Event(component, { exceptions });
    if (component.getFirstPropertyValue('status') === 'CANCELLED') {
      continue;
    }

    if (!event.isRecurring()) {
      add(event.startDate, event);
      continue;
    }

    const iterator = event.iterator();
    for (let next = iterator.next(); next; next = iterator.next()) {
      if (dateKey(next) >= end) {
        break;
      }

      const occurrence = event.getOccurrenceDetails(next);
      add(occurrence.startDate, occurrence.item);
    }
  }

  return items;
}
