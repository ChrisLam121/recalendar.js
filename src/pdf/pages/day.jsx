import { Page, StyleSheet, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import React from 'react';

import { getPageSizeInPoints } from '~/lib/device-utils';
import { findByDate, EXACT_DATE_FORMAT as SPECIAL_DATES_DATE_FORMAT } from '~/lib/special-dates-utils';
import Header from '~/pdf/components/header';
import Itinerary from '~/pdf/components/itinerary';
import MiniCalendar from '~/pdf/components/mini-calendar';
import PdfConfig from '~/pdf/config';
import { dayPageLink, monthOverviewLink, nextDayPageLink, previousDayPageLink } from '~/pdf/lib/links';
import DailyNotes from '~/pdf/pages/daily-notes';
import { content, pageStyle } from '~/pdf/styles';
import { isRedDay, splitItemsByPages } from '~/pdf/utils';

class DayPage extends React.Component {
  styles = StyleSheet.create(Object.assign({}, { content, page: pageStyle(this.props.config) }));

  renderExtraItems = (items, index) => (
    <Page key={index} size={getPageSizeInPoints(this.props.config)}>
      <View style={this.styles.page}>
        <Itinerary date={this.props.date} items={items} config={this.props.config} />
      </View>
    </Page>
  );

  render() {
    const { date, config } = this.props;
    const { items, isEnabled } = config.dayItineraries[date.weekday()];
    if (!isEnabled) {
      return null;
    }
    const itemsByPage = splitItemsByPages(items);

    const specialDateKey = this.props.date.format(SPECIAL_DATES_DATE_FORMAT);
    const specialItems = this.props.config.specialDates.filter(findByDate(specialDateKey));
    const monthLink = monthOverviewLink(date, config);
    const pageId = dayPageLink(date, config);
    const workflow = config.isPlannerWorkflowEnabled;
    const notesItems = itemsByPage[1] ?? [];
    return (
      <>
        <Page id={pageId} size={getPageSizeInPoints(config)}>
          <View style={this.styles.page}>
            <Header
              isLeftHanded={config.isLeftHanded}
              isRedDay={isRedDay(date, config, specialItems)}
              title={date.format('MMMM')}
              titleLink={monthLink ? '#' + monthLink : undefined}
              subtitle={date.format('dddd')}
              number={date.format('DD')}
              previousLink={previousDayPageLink(date, config)}
              nextLink={nextDayPageLink(date, config)}
              calendar={<MiniCalendar date={date} config={config} />}
              specialItems={specialItems}
            />
            <View style={this.styles.content}>
              <Itinerary date={date} items={itemsByPage[0]} config={config} showTimeRules={workflow} />
            </View>
          </View>
        </Page>
        {workflow && <DailyNotes date={date} items={notesItems} config={config} />}
        {itemsByPage.slice(workflow ? 2 : 1).map(this.renderExtraItems)}
      </>
    );
  }
}

DayPage.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
};

export default DayPage;
