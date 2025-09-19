<template>
  <div v-loading="loading" :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import { fetchGroupAreaTop } from '@/api/dashboard'

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
      fetchGroupAreaTop({}).then(response => {
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
          text: '群组所在地区分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        series: [
          {
            name: '所在地区',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 95],
            center: ['50%', '55%'],
            data: seriesData,
            animationEasing: 'cubicInOut',
            animationDuration: 2000
          }
        ]
      })
    }
  }
}
</script>
