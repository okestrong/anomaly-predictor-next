// lib/echarts-types.ts
import * as echarts from 'echarts/core'
import {
  LineChart, BarChart, ScatterChart, PieChart,
  type LineSeriesOption, type BarSeriesOption, type ScatterSeriesOption, type PieSeriesOption
} from 'echarts/charts'
import {
  GridComponent, TitleComponent, TooltipComponent, DatasetComponent,
  type GridComponentOption, type TitleComponentOption, type TooltipComponentOption, type DatasetComponentOption,
  DataZoomComponent, type DataZoomComponentOption, 
  LegendComponent, type LegendComponentOption,
  ToolboxComponent, type ToolboxComponentOption
} from 'echarts/components'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'

// 트리 셰이킹: 필요한 것만 등록
echarts.use([
  LineChart, BarChart, ScatterChart, PieChart,
  GridComponent, TitleComponent, TooltipComponent, DatasetComponent, 
  DataZoomComponent, LegendComponent, ToolboxComponent,
  CanvasRenderer, SVGRenderer
])

// 옵션 합성 타입 (엄격한 TS 체크)
export type ECOption = echarts.ComposeOption<
  | LineSeriesOption | BarSeriesOption | ScatterSeriesOption | PieSeriesOption
  | GridComponentOption | TitleComponentOption | TooltipComponentOption | DatasetComponentOption
  | DataZoomComponentOption | LegendComponentOption | ToolboxComponentOption
>;

// 차트 테마 색상 (AI 테마 유지)
export const chartTheme = {
  colors: [
    '#FF0080', // AI circuit
    '#00FF7F', // Success green  
    '#FFA500', // Warning orange
    '#8B5CF6', // Purple
    '#EF4444', // Danger red
    '#00FF41', // Matrix green
    '#FBBF24', // Amber
    '#10B981', // Emerald
  ],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#9CA3AF',
    fontSize: 11
  },
  grid: {
    borderColor: '#374151'
  },
  line: {
    itemStyle: {
      borderWidth: 2
    },
    lineStyle: {
      width: 2
    },
    symbolSize: 4,
    smooth: false
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#374151'
      }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#9CA3AF',
      fontSize: 10
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#374151'],
        type: 'dashed'
      }
    }
  },
  valueAxis: {
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#9CA3AF',
      fontSize: 10
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#374151'],
        type: 'dashed'
      }
    }
  }
}

// 데이터 구조
export interface MetricValue {
  timestamp: number;
  value: number;
}

export interface ChartData {
  data: MetricValue[];
  metadata?: Record<string, any>;
}