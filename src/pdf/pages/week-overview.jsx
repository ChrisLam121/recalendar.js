import { Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import { getWeekNumber } from '~/lib/date';
import { getPageSizeInPoints } from '~/lib/device-utils';
import {
  findByDate,
  HOLIDAY_DAY_TYPE,
  EXACT_DATE_FORMAT as SPECIAL_DATES_DATE_FORMAT,
} from '~/lib/special-dates-utils';
import { WeekDateRange } from '~/pdf/components/calendar-date-label';
import Header from '~/pdf/components/header';
import MiniCalendar, { HIGHLIGHT_WEEK } from '~/pdf/components/mini-calendar';
import PlannerNavigation from '~/pdf/components/planner-navigation';
import PdfConfig from '~/pdf/config';
import { dayPageLink, weekMonthOverviewLink, weekOverviewLink, weekRetrospectiveLink } from '~/pdf/lib/links';
import { content, pageStyle, sidebarPadding, WEEKLY_FOCUS_LINE_HEIGHT_PT } from '~/pdf/styles';
import { isRenderedDay } from '~/pdf/utils';

class WeekOverviewPage extends React.Component {
  styles = StyleSheet.create(
    Object.assign(
      {
        days: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          flexGrow: 1,
          paddingTop: 1,
          paddingLeft: 1,
        },
        plannerDays: {
          paddingTop: 0,
          paddingLeft: 0,
          borderTop: '1 solid black',
          borderLeft: '1 solid black',
        },
        day: {
          width: '33.5%',
          height: '33.5%',
          border: '1 solid black',
          flexDirection: 'column',
          marginTop: -1,
          marginLeft: -1,
          padding: 5,
          textDecoration: 'none',
          color: 'black',
        },
        dayDate: {
          flexDirection: 'row',
          flexGrow: 1,
          marginBottom: 2,
        },
        plannerDay: {
          width: '33.3333%',
          height: '33.3333%',
          borderTopWidth: 0,
          borderLeftWidth: 0,
          marginTop: 0,
          marginLeft: 0,
        },
        dayOfWeek: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        shortDate: {
          fontSize: 12,
          textTransform: 'uppercase',
          marginLeft: 'auto',
        },
        todos: {
          width: '66.6%',
          height: '33.5%',
          flexDirection: 'column',
          padding: 5,
        },
        todo: {
          fontSize: 10,
        },
        plannerBox: {
          borderColor: '#777',
        },
        boxTitle: {
          marginBottom: 4,
        },
        boxHint: {
          fontSize: 9,
          color: '#666',
        },
        focusLine: {
          height: WEEKLY_FOCUS_LINE_HEIGHT_PT,
          flexShrink: 0,
          marginHorizontal: 3,
          color: '#666',
          fontSize: 10,
          paddingTop: 7,
          borderBottom: '0.5 solid #BBB',
        },
        specialItem: {
          fontSize: 10,
        },
      },
      { content, page: pageStyle(this.props.config) },
    ),
  );

  renderDays() {
    const { date } = this.props;
    let currentDate = date.startOf('week');
    const endOfWeek = date.endOf('week');
    const days = [];
    while (currentDate.isBefore(endOfWeek)) {
      days.push(this.renderDay(currentDate));
      currentDate = currentDate.add(1, 'day');
    }

    if (this.props.config.isPlannerWorkflowEnabled) {
      days.push(this.renderFocus());
    }
    days.push(this.renderTodos());

    return days;
  }

  renderDay(day) {
    const { config } = this.props;
    const { isEnabled } = config.dayItineraries[day.weekday()];
    const specialDateKey = day.format(SPECIAL_DATES_DATE_FORMAT);
    const specialItems = isRenderedDay(day, config) ? config.specialDates.filter(findByDate(specialDateKey)) : [];
    const dayContent = (
      <View style={{ flexDirection: 'column' }}>
        <View style={this.styles.dayDate}>
          <Text style={this.styles.dayOfWeek}>{day.format('dddd')}</Text>
          <Text style={this.styles.shortDate}>{day.format('DD MMM')}</Text>
        </View>
        {specialItems.map(({ id, type, value }) => (
          <Text
            key={id}
            style={[this.styles.specialItem, { fontWeight: type === HOLIDAY_DAY_TYPE ? 'bold' : 'normal' }]}
          >
            » {value}
          </Text>
        ))}
      </View>
    );

    const link = isEnabled && dayPageLink(day, config);
    const dayStyle = [this.styles.day, config.isPlannerWorkflowEnabled && this.styles.plannerDay];
    if (!link) {
      return (
        <View key={day.unix()} style={dayStyle}>
          {dayContent}
        </View>
      );
    }

    return (
      <Link key={day.unix()} style={dayStyle} src={'#' + link}>
        {dayContent}
      </Link>
    );
  }

  renderTodos() {
    const { config, t } = this.props;
    const workflow = config.isPlannerWorkflowEnabled;
    return (
      <View
        key="todos"
        style={workflow ? [this.styles.day, this.styles.plannerDay, this.styles.plannerBox] : this.styles.todos}
      >
        {workflow && (
          <>
            <Text style={[this.styles.dayOfWeek, this.styles.boxTitle]}>{t('planner.weekly.tasks')}</Text>
            <Text style={this.styles.boxHint}>{t('planner.weekly.hint')}</Text>
          </>
        )}
        {config.todos.map(({ id, value }) => (
          <Text key={id} style={this.styles.todo}>
            {value}
          </Text>
        ))}
      </View>
    );
  }

  renderFocus() {
    const { config, t } = this.props;
    const [pageWidth, pageHeight] = getPageSizeInPoints(config);
    const { paddingTop, paddingBottom, paddingLeft, paddingRight } = sidebarPadding(config);
    const width = pageWidth - paddingLeft - paddingRight;
    const height = pageHeight - paddingTop - paddingBottom;
    // Leave room for the tallest mini-calendar header and keep the writing pitch fixed.
    let lineCount = 3;
    if (width >= 460 && height >= 672) {
      lineCount = 6;
    } else if (width >= 410 && height >= 610) {
      lineCount = 5;
    }
    const lines = Array.from({ length: lineCount }, (_, index) => index + 1);

    return (
      <View key="focus" style={[this.styles.day, this.styles.plannerDay, this.styles.plannerBox]}>
        <Text style={[this.styles.dayOfWeek, this.styles.boxTitle]}>{t('planner.weekly.focus')}</Text>
        {lines.map((line) => (
          <Text key={line} style={this.styles.focusLine}>
            {line}
          </Text>
        ))}
      </View>
    );
  }

  render() {
    const { t, date, config } = this.props;
    const pageId = weekOverviewLink(date, config);
    const miniCalendar = { date, config, highlightMode: HIGHLIGHT_WEEK };
    return (
      <Page id={pageId} size={getPageSizeInPoints(config)}>
        <View style={this.styles.page}>
          <Header
            isLeftHanded={config.isLeftHanded}
            title={t('page.week.title')}
            subtitle={<WeekDateRange date={date} config={config} />}
            number={getWeekNumber(date).toString()}
            previousLink={weekOverviewLink(date.subtract(1, 'week'), config)}
            nextLink={weekOverviewLink(date.add(1, 'week'), config)}
            calendar={<MiniCalendar {...miniCalendar} />}
            navigation={
              config.isPlannerWorkflowEnabled && (
                <PlannerNavigation
                  currentPage={pageId}
                  miniCalendar={miniCalendar}
                  links={[
                    [weekMonthOverviewLink(date, config), 'month'],
                    [weekRetrospectiveLink(date, config), 'review'],
                  ]}
                />
              )
            }
          />
          <View style={[this.styles.days, config.isPlannerWorkflowEnabled && this.styles.plannerDays]}>
            {this.renderDays()}
          </View>
        </View>
      </Page>
    );
  }
}

WeekOverviewPage.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation('pdf')(WeekOverviewPage);
