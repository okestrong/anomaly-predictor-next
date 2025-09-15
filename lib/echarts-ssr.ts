// lib/echarts-ssr.ts
import 'server-only';
import * as echarts from 'echarts';

// SSR에서 SVG 문자열 생성
export async function renderChartToSVG(option: echarts.EChartsOption, w: number, h: number) {
  const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: w, height: h });
  chart.setOption(option);
  const svg = chart.renderToSVGString();
  chart.dispose();
  return svg;
}