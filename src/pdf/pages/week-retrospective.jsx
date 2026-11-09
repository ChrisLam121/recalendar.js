import { Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import { getWeekNumber } from '~/lib/date';
import { getPageSizeInPoints } from '~/lib/device-utils';
import { WeekDateRange } from '~/pdf/components/calendar-date-label';
import Header from '~/pdf/components/header';
import Itinerary from '~/pdf/components/itinerary';
import MiniCalendar, { HIGHLIGHT_WEEK } from '~/pdf/components/mini-calendar';
import PlannerNavigation from '~/pdf/components/planner-navigation';
import WritingDots from '~/pdf/components/writing-dots';
import PdfConfig from '~/pdf/config';
import { weekMonthOverviewLink, weekOverviewLink, weekRetrospectiveLink } from '~/pdf/lib/links';
import { content, pageStyle } from '~/pdf/styles';
import { splitItemsByPages } from '~/pdf/utils';

class WeekRetrospectivePage extends React.Component {
  styles = StyleSheet.create({
    content,
    page: pageStyle(this.props.config),
    prompts: { flex: 1, margin: '12 20 16', rowGap: 8 },
    response: { flex: 1, minHeight: 34 },
    prompt: { fontWeight: 'bold', fontSize: 12, color: '#333' },
    writing: { flex: 1, marginTop: 3 },
  });

  render() {
    const { t, date, config } = this.props;
    const pageId = weekRetrospectiveLink(date, config);
    const itemsByPage = splitItemsByPages(config.weekRetrospectiveItinerary);
    const miniCalendar = { date, config, highlightMode: HIGHLIGHT_WEEK };
    return (
      <>
        <Page id={pageId} size={getPageSizeInPoints(config)}>
          <View style={this.styles.page}>
            <Header
              isLeftHanded={config.isLeftHanded}
              title={t('page.retrospective.title')}
              titleSize={15}
              subtitle={<WeekDateRange date={date} config={config} />}
              subtitleSize={18}
              number={getWeekNumber(date).toString()}
              previousLink={weekRetrospectiveLink(date.subtract(1, 'week'), config)}
              nextLink={weekRetrospectiveLink(date.add(1, 'week'), config)}
              calendar={<MiniCalendar {...miniCalendar} />}
              navigation={
                config.isPlannerWorkflowEnabled && (
                  <PlannerNavigation
                    currentPage={pageId}
                    miniCalendar={miniCalendar}
                    links={[
                      [weekMonthOverviewLink(date, config), 'month'],
                      [config.isWeekOverviewEnabled && weekOverviewLink(date, config), 'week'],
                    ]}
                  />
                )
              }
            />
            <View style={this.styles.content}>
              {config.isPlannerWorkflowEnabled && (
                <View style={this.styles.prompts}>
                  {['went-well', 'obstacle', 'change', 'carry'].map((prompt) => (
                    <View key={prompt} style={this.styles.response}>
                      <Text style={this.styles.prompt}>{t('planner.review.' + prompt)}</Text>
                      <View style={this.styles.writing}>
                        <WritingDots />
                      </View>
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

WeekRetrospectivePage.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  date: PropTypes.instanceOf(dayjs).isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation('pdf')(WeekRetrospectivePage);
