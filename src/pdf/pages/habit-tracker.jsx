import { Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import { getWeekendDays } from '~/lib/date';
import { getPageSizeInPoints } from '~/lib/device-utils';
import { getHorizontalSidebarOffset } from '~/lib/sidebar-utils';
import Itinerary from '~/pdf/components/itinerary';
import MiniCalendar, { HIGHLIGHT_NONE } from '~/pdf/components/mini-calendar';
import PlannerNavigation from '~/pdf/components/planner-navigation';
import PdfConfig from '~/pdf/config';
import { dayPageLink, habitTrackerLink, monthDashboardLink, monthOverviewLink } from '~/pdf/lib/links';
import { pageStyle, redDayText } from '~/pdf/styles';
import { isRedDay, splitItemsByPages } from '~/pdf/utils';

const DAYS_IN_LONGEST_MONTH = 31;
const MAX_HABIT_SQUARE_WIDTH = 13;
const MIN_HABIT_SQUARE_WIDTH = 4;
const MIN_HABIT_COLUMN_WIDTH = 40;
const MAX_HABIT_COLUMN_WIDTH = 150;

class HabitTrackerPage extends React.Component {
  constructor(props) {
    super(props);

    const { config } = props;
    const [pageWidth] = getPageSizeInPoints(config);
    const availableWidth = pageWidth - getHorizontalSidebarOffset(config);
    const habitSquareWidth = Math.max(
      MIN_HABIT_SQUARE_WIDTH,
      Math.min(MAX_HABIT_SQUARE_WIDTH, Math.floor((availableWidth - MIN_HABIT_COLUMN_WIDTH) / DAYS_IN_LONGEST_MONTH)),
    );

    const stylesObject = Object.assign(
      {
        content: {
          flex: 1,
          flexGrow: 1,
        },
        header: {
          flexGrow: 0,
          flexDirection: 'row',
          borderBottom: '1 solid black',
        },
        meta: {
          flexGrow: 1,
          flexDirection: 'column',
          borderRight: '1 solid black',
        },
        month: {
          flexGrow: 1,
          justifyContent: 'center',
        },
        title: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          color: 'black',
          padding: '10 5',
          fontSize: 35,
          fontWeight: 'bold',
          marginLeft: 'auto',
        },
        habitsTable: {
          flexGrow: 0,
          flexDirection: 'column',
          fontSize: 8,
        },
        habitsHeader: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        habitsTitle: {
          fontWeight: 'normal',
        },
        habitLabel: {
          textAlign: 'center',
          maxLines: 1,
          textOverflow: 'ellipsis',
          paddingHorizontal: 1,
        },
        habitDay: {
          fontSize: 8,
          flexDirection: 'column',
          borderRight: '1 solid #AAA',
          borderBottom: '1 solid #AAA',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          textDecoration: 'none',
          color: 'black',
          width: habitSquareWidth,
          height: habitSquareWidth,
          flexGrow: 0,
          flexShrink: 0,
        },
        habitDayDate: {
          fontWeight: 'bold',
          position: 'relative',
          top: -1,
        },
        habitDayOfWeek: {
          fontSize: 6,
          textAlign: 'center',
          position: 'relative',
          top: -1,
        },
        habitRow: {
          flexDirection: 'row',
        },
        habitContainer: {
          justifyContent: 'center',
          height: habitSquareWidth,
          borderRight: '1 solid #AAA',
          borderBottom: '1 solid #AAA',
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: MIN_HABIT_COLUMN_WIDTH,
          maxWidth: MAX_HABIT_COLUMN_WIDTH,
          fontWeight: 'bold',
        },
        habitSquare: {
          height: habitSquareWidth,
          width: habitSquareWidth,
          flexGrow: 0,
          flexShrink: 0,
          borderRight: '1 solid #AAA',
          borderBottom: '1 solid #AAA',
          textDecoration: 'none',
        },
        weekendDay: {
          backgroundColor: '#EEE',
        },
        reflection: { flexGrow: 1, margin: '20 20 16' },
        reflectionTitle: { color: '#222', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
        response: { flexGrow: 1, minHeight: 34 },
        prompt: { fontSize: 11, color: '#444' },
      },
      { page: pageStyle(props.config) },
    );

    if (this.props.config.isLeftHanded) {
      stylesObject.header.flexDirection = 'row-reverse';

      stylesObject.meta.borderLeft = '1 solid black';
      stylesObject.meta.borderRight = 'none';

      delete stylesObject.title.marginLeft;
    }

    this.styles = StyleSheet.create(stylesObject);
  }

  renderHabitsTable() {
    const habits = this.props.config.habits;
    if (habits.length === 0) {
      return null;
    }

    return (
      <View style={this.styles.habitsTable}>
        {this.renderHabitsHeader()}
        {habits.map(this.renderHabit)}
      </View>
    );
  }

  renderHabitsHeader() {
    const { date, t } = this.props;
    let currentDate = date.startOf('month');
    const endOfMonth = date.endOf('month');
    const days = [];
    while (currentDate.isBefore(endOfMonth)) {
      days.push(this.renderDay(currentDate));
      currentDate = currentDate.add(1, 'day');
    }

    return (
      <View style={this.styles.habitsHeader}>
        <View style={this.styles.habitContainer}>
          <Text style={[this.styles.habitLabel, this.styles.habitsTitle]}>{t('page.month.habits.title')}</Text>
        </View>
        {days}
      </View>
    );
  }

  renderDay(day) {
    const dateStyle = isRedDay(day, this.props.config) ? redDayText : null;
    return (
      <Link key={day.unix()} src={'#' + dayPageLink(day, this.props.config)} style={this.styles.habitDay}>
        <Text style={[this.styles.habitDayDate, dateStyle]}>{day.format('D')}</Text>
        <Text style={[this.styles.habitDayOfWeek, dateStyle]}>{day.format('dd')}</Text>
      </Link>
    );
  }

  renderHabit = ({ id, value }) => {
    return (
      <View key={id} style={this.styles.habitRow}>
        <View style={this.styles.habitContainer}>
          <Text style={this.styles.habitLabel}>{value}</Text>
        </View>
        {this.renderHabitSquares()}
      </View>
    );
  };

  renderHabitSquares() {
    const { config } = this.props;
    const weekendDays = getWeekendDays(config.weekendDays, config.firstDayOfWeek);
    let currentDate = this.props.date.startOf('month');
    const endOfMonth = this.props.date.endOf('month');
    const squares = [];
    while (currentDate.isBefore(endOfMonth)) {
      const styles = [this.styles.habitSquare];
      if (weekendDays.includes(currentDate.day())) {
        styles.push(this.styles.weekendDay);
      }
      squares.push(
        config.isPlannerWorkflowEnabled ? (
          <View key={currentDate.date()} style={styles} />
        ) : (
          <Link key={currentDate.date()} style={styles} src={'#' + dayPageLink(currentDate, config)} />
        ),
      );
      currentDate = currentDate.add(1, 'day');
    }

    return squares;
  }

  render() {
    const { date, config, t } = this.props;
    const pageId = habitTrackerLink(date, config);
    const monthLink = monthOverviewLink(date, config);
    const itemsByPage = splitItemsByPages(config.monthItinerary);
    const miniCalendar = { date, config, highlightMode: HIGHLIGHT_NONE, showHabits: false };
    return (
      <>
        <Page id={pageId} size={getPageSizeInPoints(config)}>
          <View style={this.styles.page}>
            <View style={this.styles.header}>
              <View style={this.styles.meta}>
                {config.isPlannerWorkflowEnabled && (
                  <PlannerNavigation
                    currentPage={pageId}
                    miniCalendar={miniCalendar}
                    links={[
                      [monthLink, 'month'],
                      [monthDashboardLink(date, config), 'dashboard'],
                    ]}
                  />
                )}
                <View style={this.styles.month}>
                  <Link
                    src={config.isPlannerWorkflowEnabled && monthLink ? '#' + monthLink : undefined}
                    style={this.styles.title}
                  >
                    {date.format('MMMM')}
                  </Link>
                </View>
              </View>
              <MiniCalendar {...miniCalendar} />
            </View>
            {this.renderHabitsTable()}
            <View style={this.styles.content}>
              {config.isPlannerWorkflowEnabled && (
                <View style={this.styles.reflection}>
                  <Text style={this.styles.reflectionTitle}>{t('planner.habits.reflect')}</Text>
                  {['helped', 'obstacle', 'change'].map((prompt) => (
                    <View key={prompt} style={this.styles.response}>
                      <Text style={this.styles.prompt}>{t('planner.habits.' + prompt)}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Itinerary date={date} items={itemsByPage[0]} config={config} />
            </View>
          </View>
        </Page>
        {itemsByPage.slice(1).map((items, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static pagination, never reordered
          <Page key={index} size={getPageSizeInPoints(config)}>
            <View style={this.styles.page}>
              <Itinerary date={date} items={items} config={config} />
            </View>
          </Page>
        ))}
      </>
    );
  }
}

HabitTrackerPage.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation('pdf')(HabitTrackerPage);
