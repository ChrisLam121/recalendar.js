import { Canvas, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { getPageSizeInPoints } from '~/lib/device-utils';
import PdfConfig from '~/pdf/config';
import { PLANNER_INBOX, yearOverviewLink } from '~/pdf/lib/links';
import { pageStyle } from '~/pdf/styles';

import {
  CHECKBOX_SIZE,
  DOT_PITCH,
  DOT_RADIUS,
  HEADER_HEIGHT,
  INK,
  LIGHT_RULE,
  MARGIN,
  MUTED,
  mm,
  RULE,
  WRITING_PITCH,
} from './geometry';

export const styles = StyleSheet.create({
  nav: { height: 30, flexDirection: 'row', alignItems: 'center', borderBottom: '0.5 solid #C8C8C8' },
  navItem: { fontSize: 9.5, color: INK, textDecoration: 'none', padding: '8 7' },
  current: { fontWeight: 'bold' },
  heading: { height: HEADER_HEIGHT - 30, paddingTop: 12, paddingBottom: 10, justifyContent: 'center' },
  title: { fontSize: 27, fontWeight: 'bold', color: INK },
  subtitle: { fontSize: 10.5, color: MUTED, marginTop: 5 },
  label: { fontSize: 11, fontWeight: 'bold', color: INK },
  hint: { fontSize: 9, color: MUTED, lineHeight: 1.3 },
  section: { flex: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: INK, marginBottom: 5 },
});

export function Nav({ id, links = [], previous, next, paging = 'day' }) {
  const { t } = useTranslation('pdf');
  const seen = new Set();
  const items = [[yearOverviewLink(), 'home'], [PLANNER_INBOX, 'inbox'], ...links].filter(([target]) => {
    if (!target || seen.has(target)) {
      return false;
    }
    seen.add(target);
    return true;
  });
  return (
    <View style={styles.nav}>
      {items.map(([target, label]) =>
        target === id ? (
          <Text key={target} style={[styles.navItem, styles.current]}>
            {t('planner6.nav.' + label)}
          </Text>
        ) : (
          <Link key={target} src={'#' + target} style={styles.navItem}>
            {t('planner6.nav.' + label)}
          </Link>
        ),
      )}
      <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
        {previous && (
          <Link src={'#' + previous} style={styles.navItem}>
            {t('planner6.nav.prev-' + paging)}
          </Link>
        )}
        {next && (
          <Link src={'#' + next} style={styles.navItem}>
            {t('planner6.nav.next-' + paging)}
          </Link>
        )}
      </View>
    </View>
  );
}

Nav.propTypes = {
  id: PropTypes.string,
  links: PropTypes.array,
  previous: PropTypes.string,
  next: PropTypes.string,
  paging: PropTypes.string,
};

export function Sheet({
  config,
  id,
  bookmark,
  title,
  subtitle,
  heading,
  links,
  previous,
  next,
  paging,
  children,
  headerHeight = HEADER_HEIGHT,
}) {
  return (
    <Page id={id} bookmark={bookmark} size={getPageSizeInPoints(config)} wrap={false}>
      <View style={pageStyle(config)}>
        <View style={{ flex: 1, marginHorizontal: MARGIN, paddingBottom: MARGIN }}>
          <Nav id={id} links={links} previous={previous} next={next} paging={paging} />
          <View style={[styles.heading, { height: headerHeight - 30 }]}>
            {heading || (
              <>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </>
            )}
          </View>
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    </Page>
  );
}

Sheet.propTypes = {
  config: PropTypes.instanceOf(PdfConfig).isRequired,
  id: PropTypes.string.isRequired,
  bookmark: PropTypes.string,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  heading: PropTypes.node,
  links: PropTypes.array,
  previous: PropTypes.string,
  next: PropTypes.string,
  paging: PropTypes.string,
  children: PropTypes.node,
  headerHeight: PropTypes.number,
};

export function Writing({ dots = false, pitch = dots ? DOT_PITCH : WRITING_PITCH, inset = 0 }) {
  function paint(painter, width, height) {
    if (dots) {
      painter.fillColor('#000000');
      for (let y = pitch / 2; y < height - DOT_RADIUS; y += pitch) {
        for (let x = inset + pitch / 2; x < width - DOT_RADIUS; x += pitch) {
          painter.circle(x, y, DOT_RADIUS);
        }
      }
      painter.fill();
    } else {
      painter.strokeColor(LIGHT_RULE).lineWidth(0.4);
      for (let y = pitch; y < height - 1; y += pitch) {
        painter.moveTo(inset, y).lineTo(width, y);
      }
      painter.stroke();
    }
  }
  return <Canvas paint={paint} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />;
}

Writing.propTypes = { dots: PropTypes.bool, pitch: PropTypes.number, inset: PropTypes.number };

export function Prompt({ title, hint, weight = 1, dots = false }) {
  return (
    <View style={[styles.section, { flex: weight }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <View style={{ flex: 1, marginTop: 3 }}>
        <Writing dots={dots} />
      </View>
    </View>
  );
}

Prompt.propTypes = { title: PropTypes.string, hint: PropTypes.string, weight: PropTypes.number, dots: PropTypes.bool };

export function CheckLines({ count = 8, pitch = WRITING_PITCH }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed writing rows
        <View key={i} style={{ height: pitch, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: CHECKBOX_SIZE, height: CHECKBOX_SIZE, border: '0.7 solid #505050' }} />
          <View style={{ flex: 1, height: '100%', marginLeft: mm(3), borderBottom: '0.4 solid ' + RULE }} />
        </View>
      ))}
    </View>
  );
}

CheckLines.propTypes = { count: PropTypes.number, pitch: PropTypes.number };
