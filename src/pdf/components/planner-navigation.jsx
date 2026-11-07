import { Link, StyleSheet, View } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { getMiniCalendarDestinations } from '~/pdf/components/mini-calendar';
import { PLANNER_INBOX, yearOverviewLink } from '~/pdf/lib/links';

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 4,
    paddingHorizontal: 10,
  },
  // Clear the reMarkable toolbar toggle and align Home with the sample schedule labels.
  toolbarClearance: { paddingLeft: 35 },
  link: {
    fontSize: 10,
    color: '#333',
    textDecoration: 'none',
    padding: '4 5',
  },
  compactLink: { paddingVertical: 1 },
  pagination: { flexDirection: 'row', marginLeft: 'auto' },
});

export default function PlannerNavigation({
  currentPage,
  miniCalendar,
  links = [],
  compact = false,
  previous,
  next,
  style,
}) {
  const { t } = useTranslation('pdf');
  const home = yearOverviewLink();
  const calendarDestinations = miniCalendar && getMiniCalendarDestinations(miniCalendar);
  function hasShortcut([destination]) {
    return destination && destination !== currentPage && !calendarDestinations?.has(destination);
  }

  const shortcuts = [[home, 'home'], [PLANNER_INBOX, 'inbox'], ...links].filter(hasShortcut);
  const paging = [
    [previous, 'previous'],
    [next, 'next'],
  ].filter(hasShortcut);

  if (!shortcuts.length && !paging.length) {
    return null;
  }

  function renderShortcut([destination, label]) {
    return (
      <Link key={label} src={'#' + destination} style={[styles.link, compact && styles.compactLink]}>
        {t('planner.nav.' + label)}
      </Link>
    );
  }

  return (
    <View style={[styles.bar, currentPage !== home && styles.toolbarClearance, style]}>
      {shortcuts.map(renderShortcut)}
      {paging.length > 0 && <View style={styles.pagination}>{paging.map(renderShortcut)}</View>}
    </View>
  );
}

PlannerNavigation.propTypes = {
  currentPage: PropTypes.string.isRequired,
  miniCalendar: PropTypes.object,
  links: PropTypes.array,
  compact: PropTypes.bool,
  previous: PropTypes.string,
  next: PropTypes.string,
  style: PropTypes.object,
};
