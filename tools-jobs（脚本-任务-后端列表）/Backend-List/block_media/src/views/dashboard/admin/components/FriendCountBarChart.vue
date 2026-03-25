<template>
  <div v-loading="loading" :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import { fetchFriendCountDistributedTop } from '@/api/dashboard'

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
      fetchFriendCountDistributedTop({}).then(response => {
        const {legend, seriesData} = response.data
        this.initChart(legend, seriesData)
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
    initChart(legend, seriesData) {
      this.chart = echarts.init(this.$el, 'macarons')

      this.chart.setOption({
        title: {
          text: '好友数区间分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category',
          data: legend
        },
        series: [{
          name: '好友数区间',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          data: seriesData
        }]
      })
    }
  }
}
</script>
