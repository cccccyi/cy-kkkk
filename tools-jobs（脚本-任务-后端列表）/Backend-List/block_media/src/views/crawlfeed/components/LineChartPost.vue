<template>
  <div v-loading="loading" :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import { fetchLineChartPostData } from '@/api/crawlfeed'

const animationDuration = 6000

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  data() {
    return {
      loading: true,
      chart: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      fetchLineChartPostData({}).then(response => {
        const {legend, xAxis, seriesData} = response.data
        this.initChart(legend, xAxis, seriesData)
      })
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart(legend, xAxis, seriesData) {
      this.chart = echarts.init(this.$el, 'macarons')
      this.chart.setOption({
        title: {
          text: '采集帖子数'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        legend: {
          data: legend
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxis
        },
        yAxis: {
          type: 'value'
        },
        series: seriesData
      })
    }
  }
}
</script>
