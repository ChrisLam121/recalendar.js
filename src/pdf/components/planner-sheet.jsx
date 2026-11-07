import { Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import PropTypes from 'prop-types';

import { getPageSizeInPoints } from '~/lib/device-utils';
import PlannerNavigation from '~/pdf/components/planner-navigation';
import PdfConfig from '~/pdf/config';
import { pageStyle } from '~/pdf/styles';

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottom: '0.8 solid #444',
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#222',
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  body: {
    flex: 1,
    margin: '12 20 20',
  },
});

export default function PlannerSheet({ config, id, bookmark, title, subtitle, links, previous, next, children }) {
  return (
    <Page id={id} bookmark={bookmark} size={getPageSizeInPoints(config)} wrap={false}>
      <View style={pageStyle(config)}>
        <PlannerNavigation currentPage={id} links={links} previous={previous} next={next} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.body}>{children}</View>
      </View>
    </Page>
  );
}

PlannerSheet.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  id: PropTypes.string.isRequired,
  bookmark: PropTypes.string,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  links: PropTypes.array,
  previous: PropTypes.string,
  next: PropTypes.string,
  children: PropTypes.node,
};
