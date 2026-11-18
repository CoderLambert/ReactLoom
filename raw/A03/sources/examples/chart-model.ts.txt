import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartConfiguration,
  type ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  type Plugin,
  PointElement,
  Tooltip,
} from 'chart.js'

export type ChartKind = 'bar' | 'line'
export const READING_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// This entry needs two chart types; registration is not a measured bundle-size claim.
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
)

export function createReadingConfig(
  type: ChartKind,
  counts: readonly number[],
  options: ChartOptions<ChartKind> = {},
  plugins: Plugin<ChartKind>[] = [],
): ChartConfiguration<ChartKind, number[], string> {
  return {
    type,
    data: {
      labels: [...READING_DAYS],
      datasets: [
        {
          label: '阅读量',
          data: [...counts],
          backgroundColor: 'rgba(49,113,82,0.7)',
          borderColor: '#317152',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } },
      ...options,
    },
    plugins,
  }
}
