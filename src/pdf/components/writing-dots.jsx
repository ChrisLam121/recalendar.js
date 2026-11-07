import { Canvas } from '@react-pdf/renderer';

const DOT_SIZE_PT = 0.82;
const DOT_CORNER_RADIUS_PT = 0.27;
const POINTS_PER_MM = 72 / 25.4;

const WRITING_DOT_SPACING_MM = 8.5;
const SPACING_PT = WRITING_DOT_SPACING_MM * POINTS_PER_MM;

export default function WritingDots() {
  function paint(painter, width, height) {
    painter.fillColor('#000000');
    for (let y = SPACING_PT / 2; y < height - 1; y += SPACING_PT) {
      for (let x = 1; x < width - 1; x += SPACING_PT) {
        painter.roundedRect(x - DOT_SIZE_PT / 2, y - DOT_SIZE_PT / 2, DOT_SIZE_PT, DOT_SIZE_PT, DOT_CORNER_RADIUS_PT);
      }
    }
    painter.fill();
  }

  return <Canvas paint={paint} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />;
}
