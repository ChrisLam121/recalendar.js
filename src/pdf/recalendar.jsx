import { Document, StyleSheet } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import React from 'react';

import PdfConfig from '~/pdf/config';
import { NOTO_SANS_CJK } from '~/pdf/lib/fonts';
import DayPage from '~/pdf/pages/day';
import HabitTrackerPage from '~/pdf/pages/habit-tracker';
import LastPage from '~/pdf/pages/last';
import MonthOverviewPage from '~/pdf/pages/month-overview';
import WeekOverviewPage from '~/pdf/pages/week-overview';
import WeekRetrospectivePage from '~/pdf/pages/week-retrospective';
import YearNotesPage from '~/pdf/pages/year-notes';
import YearOverviewPage from '~/pdf/pages/year-overview';
import PlannerAppendix6, { PlannerYearNotes } from '~/pdf/planner/appendix';
import PlannerDay from '~/pdf/planner/daily';
import PlannerIndex from '~/pdf/planner/index';
import { PlannerHabits, PlannerMonth, PlannerMonthDirection } from '~/pdf/planner/monthly';
import { PlannerReview, PlannerWeek } from '~/pdf/planner/weekly';
import { getCalendarStartDate, getRenderedMonthCount, isRenderedDay, isRenderedMonth } from '~/pdf/utils';

class RecalendarPdf extends React.Component {
  styles = StyleSheet.create({
    document: {
      fontFamily: [this.props.config.fontFamily, NOTO_SANS_CJK],
    },
    page: {
      flexDirection: 'row',
      backgroundColor: '#E4E4E4',
    },
  });

  renderWeek(startOfWeek, endDate) {
    const { config } = this.props;

    const Day = config.isPlannerWorkflowEnabled ? PlannerDay : DayPage;
    const Month = config.isPlannerWorkflowEnabled ? PlannerMonth : MonthOverviewPage;
    const Habits = config.isPlannerWorkflowEnabled ? PlannerHabits : HabitTrackerPage;
    const Week = config.isPlannerWorkflowEnabled ? PlannerWeek : WeekOverviewPage;
    const Review = config.isPlannerWorkflowEnabled ? PlannerReview : WeekRetrospectivePage;
    const YearNotes = config.isPlannerWorkflowEnabled ? PlannerYearNotes : YearNotesPage;
    const weekPages = [];
    let currentDate = startOfWeek.clone();
    const endOfWeek = startOfWeek.add(1, 'weeks');
    while (currentDate.isBefore(endOfWeek)) {
      if (
        config.isYearNotesEnabled &&
        currentDate.month() === 0 &&
        currentDate.date() === 1 &&
        currentDate.year() > config.year &&
        currentDate.isBefore(endDate)
      ) {
        weekPages.push(<YearNotes key={'year-notes-' + currentDate.year()} date={currentDate} config={config} />);
      }
      if (config.isMonthOverviewEnabled && currentDate.date() === 1 && isRenderedMonth(currentDate, config)) {
        weekPages.push(
          <Month key={'month-overview-' + currentDate.unix()} date={currentDate} config={config} />,
          <Habits key={'habit-tracker-' + currentDate.unix()} date={currentDate} config={config} />,
        );
        if (config.isPlannerWorkflowEnabled) {
          weekPages.push(
            <PlannerMonthDirection key={'dashboard-' + currentDate.unix()} date={currentDate} config={config} />,
          );
        }
      }
      if (isRenderedDay(currentDate, config)) {
        weekPages.push(<Day key={'day-' + currentDate.unix()} date={currentDate} config={config} />);
      }
      currentDate = currentDate.add(1, 'days');
    }
    return (
      <React.Fragment key={'week-' + startOfWeek.unix()}>
        {config.isWeekOverviewEnabled && <Week date={startOfWeek} config={config} />}
        {weekPages}
        {config.isWeekRetrospectiveEnabled && <Review date={startOfWeek} config={config} />}
      </React.Fragment>
    );
  }

  renderCalendar() {
    const { config } = this.props;
    const { year, monthCount } = config;
    const Index = config.isPlannerWorkflowEnabled ? PlannerIndex : YearOverviewPage;
    const YearNotes = config.isPlannerWorkflowEnabled ? PlannerYearNotes : YearNotesPage;
    const pageList = [];
    let currentDate = getCalendarStartDate(config);
    const endDate = currentDate.add(monthCount, 'months');
    const renderedEndDate = currentDate.add(getRenderedMonthCount(config), 'months');

    pageList.push(<Index key={'year-overview-' + year} startDate={currentDate} endDate={endDate} config={config} />);
    if (config.isYearNotesEnabled) {
      pageList.push(<YearNotes key={'year-notes-' + year} date={currentDate} config={config} />);
    }

    currentDate = currentDate.startOf('week');
    while (currentDate.isBefore(renderedEndDate)) {
      pageList.push(this.renderWeek(currentDate, renderedEndDate));
      currentDate = currentDate.add(1, 'weeks');
    }

    if (config.isPlannerWorkflowEnabled) {
      pageList.push(<PlannerAppendix6 key="planner-appendix" config={config} />);
    }
    pageList.push(<LastPage key="last" config={config} />);

    return pageList;
  }

  render() {
    return <Document style={this.styles.document}>{this.renderCalendar()}</Document>;
  }
}

RecalendarPdf.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
};

export default RecalendarPdf;
