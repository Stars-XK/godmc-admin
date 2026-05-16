import { ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import dayjs from 'dayjs'

const TIME_RANGES = { '5m': [6, 'hour'], '1h': [24, 'hour'], '1d': [7, 'day'] }

/**
 * 监测趋势图 composable
 * @param {Object} options
 * @param {string} options.unit - y轴单位 (e.g. 'MPa', 'm³/h')
 * @param {Function} options.getMarkLine - 返回 markLine 数据 (max, pointInfo) => { yAxis, label, color }
 * @param {Object} options.seriesExtra - 额外的 series 配置 (e.g. { type: 'bar', ... })
 */
export function useMonitorTrend(options = {}) {
  const { unit = '', seriesExtra = {}, extraOption = null } = options

  const trendInterval = ref('1h')
  const chartRef = ref(null)
  let chartInstance = null

  const timeFormat = (interval, d) =>
    dayjs(d).format(interval === '1d' ? 'MM-DD' : 'HH:mm')

  function fetchTrend(point) {
    if (!point || !chartRef.value) return
    const [n, u] = TIME_RANGES[trendInterval.value] || [24, 'hour']
    const end = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const start = dayjs().subtract(n, u).format('YYYY-MM-DD HH:mm:ss')

    request({
      url: '/data-integration/query/history',
      method: 'get',
      params: {
        deviceCode: point.deviceCode,
        pointCode: point.code,
        startTime: start,
        endTime: end,
        interval: trendInterval.value,
      },
    }).then(res => {
      const data = res.data?.data || res.data || []
      const dates = data.map(d => d.ts || d[0])
      const vals = data.map(d => d.val ?? d[1] ?? 0)
      renderChart(dates, vals, point)
    }).catch(() => {
      if (chartInstance) renderChart([], [], point)
    })
  }

  function renderChart(dates, vals, point) {
    if (!chartRef.value) return
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value)
    }

    const max = point.rangeMax || 9999
    const min = point.rangeMin
    const defaultSeries = {
      type: 'line',
      data: vals,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: '#0D9488' },
    }

    const mergedSeries = { ...defaultSeries, ...seriesExtra, data: vals }

    const markLineData = []
    if (max && max < 9999) {
      markLineData.push({
        yAxis: max,
        label: { formatter: `上限${max}`, fontSize: 10 },
        lineStyle: { color: '#EF4444', type: 'dashed' },
      })
    }
    if (min != null) {
      markLineData.push({
        yAxis: min,
        label: { formatter: `下限${min}`, fontSize: 10 },
        lineStyle: { color: '#F59E0B', type: 'dashed' },
      })
    }
    if (markLineData.length > 0) {
      mergedSeries.markLine = { silent: true, symbol: 'none', data: markLineData }
    }

    const seriesColor = mergedSeries.lineStyle?.color || '#0D9488'

    const baseOption = {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 30, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: dates.map(d => timeFormat(trendInterval.value, d)),
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: unit || point.unit,
        axisLabel: { fontSize: 10 },
      },
      series: [mergedSeries],
    }

    const finalOption = extraOption
      ? { ...baseOption, ...extraOption({ min: point.rangeMin, max: point.rangeMax }) }
      : baseOption

    chartInstance.setOption(finalOption, true)

    if (dates.length > 0 && typeof seriesExtra.type === 'undefined') {
      // 为 line 类型添加渐变面积
      chartInstance.setOption({
        series: [{
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: seriesColor.replace(')', ',0.15)').replace('rgb', 'rgba') },
              { offset: 1, color: seriesColor.replace(')', ',0.02)').replace('rgb', 'rgba') },
            ]),
          },
        }],
      })
    }
  }

  function dispose() {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
  }

  return { trendInterval, chartRef, fetchTrend, dispose }
}
