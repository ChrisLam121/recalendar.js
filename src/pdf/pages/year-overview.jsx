import { Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import { getPageSizeInPoints } from '~/lib/device-utils';
import { getHorizontalSidebarOffset } from '~/lib/sidebar-utils';
import MiniCalendar, { HIGHLIGHT_NONE, MINI_CALENDAR_WIDTH } from '~/pdf/components/mini-calendar';
import PlannerNavigation from '~/pdf/components/planner-navigation';
import PdfConfig from '~/pdf/config';
import { PLANNER_MANUAL, yearNotesLink, yearOverviewLink } from '~/pdf/lib/links';
import { sidebarPadding } from '~/pdf/styles';

const PAGE_VERTICAL_MARGIN = 5;
const ROW_GAP = 1;

class YearOverviewPage extends React.Component {
  constructor(props) {
    super(props);

    const { config } = props;
    const [pageWidth] = getPageSizeInPoints(config);
    const availableWidth = pageWidth - getHorizontalSidebarOffset(config);
    this.columns = Math.max(1, Math.floor(availableWidth / MINI_CALENDAR_WIDTH));
    const calendarMargin = (availableWidth - this.columns * MINI_CALENDAR_WIDTH) / (this.columns * 2);

    const { paddingTop, paddingBottom, ...horizontalPadding } = sidebarPadding(config);
    this.styles = StyleSheet.create({
      page: {
        ...horizontalPadding,
        paddingTop: paddingTop + PAGE_VERTICAL_MARGIN,
        paddingBottom: paddingBottom + PAGE_VERTICAL_MARGIN,
      },
      year: {
        fontSize: 48,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'black',
        textDecoration: 'none',
        justifyContent: 'center',
      },
      titleRange: {
        flexDirection: 'row',
        justifyContent: 'center',
      },
      yearRange: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        textDecoration: 'none',
        textTransform: 'capitalize',
      },
      separator: {
        padding: '0 6',
      },
      calendarsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: ROW_GAP,
      },
      yearBreak: {
        borderTop: '1 solid #777',
        marginTop: 5,
        paddingTop: 5,
      },
      calendar: {
        marginLeft: calendarMargin,
        marginRight: calendarMargin,
      },
      nav: { marginHorizontal: 12, paddingHorizontal: 0 },
    });
  }

  renderCalendars() {
    const { startDate, endDate, config } = this.props;
    const rows = [];
    let currentDate = startDate;
    while (currentDate.isBefore(endDate)) {
      const calendars = [];
      const rowStart = currentDate;
      const yearBreak = rows.length > 0 && rowStart.month() === 0;
      while (calendars.length < this.columns && currentDate.isBefore(endDate) && currentDate.isSame(rowStart, 'year')) {
        calendars.push(
          <View key={currentDate.unix()} style={this.styles.calendar}>
            <MiniCalendar date={currentDate} highlightMode={HIGHLIGHT_NONE} config={config} isOverview />
          </View>,
        );
        currentDate = currentDate.add(1, 'month');
      }

      rows.push(
        <View
          key={rowStart.unix()}
          style={[this.styles.calendarsRow, yearBreak ? this.styles.yearBreak : null]}
          wrap={false}
        >
          {calendars}
        </View>,
      );
    }

    return rows;
  }

  isFullYear() {
    const { startDate, endDate } = this.props;
    const lastMonth = endDate.subtract(1, 'month');
    return startDate.month() === 0 && lastMonth.month() === 11 && startDate.year() === lastMonth.year();
  }

  renderTitlePart(title, date, style) {
    if (!this.props.config.isYearNotesEnabled) {
      return <Text style={style}>{title}</Text>;
    }

    return (
      <Link src={'#' + yearNotesLink(date)} style={style}>
        {title}
      </Link>
    );
  }

  renderTitle() {
    const { startDate, endDate, config } = this.props;
    if (this.isFullYear()) {
      return this.renderTitlePart(startDate.format('YYYY'), startDate, this.styles.year);
    }

    const lastMonth = endDate.subtract(1, 'month');
    return (
      <View style={this.styles.titleRange}>
        {this.renderTitlePart(startDate.format('MMMM YYYY'), startDate, this.styles.yearRange)}
        {(!config.isPlannerWorkflowEnabled || !lastMonth.isSame(startDate, 'month')) && (
          <>
            <Text style={[this.styles.yearRange, this.styles.separator]}>-</Text>
            {this.renderTitlePart(lastMonth.format('MMMM YYYY'), lastMonth, this.styles.yearRange)}
          </>
        )}
      </View>
    );
  }

  render() {
    const { config, startDate, t } = this.props;
    const pageId = yearOverviewLink();
    return (
      <Page
        size={getPageSizeInPoints(config)}
        bookmark={config.isPlannerWorkflowEnabled ? t('planner.nav.home') : undefined}
        style={this.styles.page}
      >
        <View id={pageId}>{this.renderTitle()}</View>
        {config.isPlannerWorkflowEnabled && (
          <PlannerNavigation
            compact
            currentPage={pageId}
            miniCalendar={{ date: startDate, config, isOverview: true }}
            links={[[PLANNER_MANUAL, 'manual']]}
            style={this.styles.nav}
          />
        )}
        {this.renderCalendars()}
      </Page>
    );
  }
}

YearOverviewPage.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  endDate: PropTypes.instanceOf(dayjs).isRequired,
  startDate: PropTypes.instanceOf(dayjs).isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation('pdf')(YearOverviewPage);
