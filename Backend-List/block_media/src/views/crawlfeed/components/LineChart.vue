<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'

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
      default: '350px'
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    chartData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler(val) {
        this.setOptions(val)
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
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
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')
      this.setOptions(this.chartData)
    },
    setOptions({ groupCommentData, pageCommentData, memberCommentData, twitterMessageData, xAxisData } = {}) {
      this.chart.setOption({
        xAxis: {
          data: [...xAxisData],
          boundaryGap: false,
          axisTick: {
            show: false
          }
        },
        grid: {
          left: 10,
          right: 10,
          bottom: 20,
          top: 30,
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          padding: [5, 10]
        },
        yAxis: {
          axisTick: {
            show: false
          }
        },
        legend: {
          data: ["FB群组贴评论","FB主页贴评论","FB成员贴评论","TW发私信"]
        },
        series: [{
          name: 'FB群组贴评论', 
          itemStyle: {
            normal: {
              color: '#FF005A',
              lineStyle: {
                color: '#FF005A',
                width: 2
              }
            }
          },
          smooth: false,
          type: 'line',
          data: groupCommentData,
          animationDuration: 2800,
          animationEasing: 'cubicInOut'
        },{
          name: 'FB主页贴评论', 
          itemStyle: {
            normal: {
              color: '#00FF5A',
              lineStyle: {
                color: '#00FF5A',
                width: 2
              }
            }
          },
          smooth: false,
          type: 'line',
          data: pageCommentData,
          animationDuration: 2800,
          animationEasing: 'cubicInOut'
        },{
          name: 'FB成员贴评论',
          smooth: false,
          type: 'line',
          itemStyle: {
            normal: {
              color: '#3888fa',
              lineStyle: {
                color: '#3888fa',
                width: 2
              },
              areaStyle: {
                color: '#f3f8ff'
              }
            }
          },
          data: memberCommentData,
          animationDuration: 2800,
          animationEasing: 'quadraticOut'
        },{
          name: 'TW发私信',
          smooth: false,
          type: 'line',
          itemStyle: {
            normal: {
              color: '#D888fa',
              lineStyle: {
                color: '#D888fa',
                width: 2
              },
              areaStyle: {
                color: '#f3f8ff'
              }
            }
          },
          data: twitterMessageData,
          animationDuration: 2800,
          animationEasing: 'quadraticOut'
        }]
      })
    }
  }
}
</script>
