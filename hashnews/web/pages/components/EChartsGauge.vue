<template>
     
    <div>
        <p class="mhTitle" >加密货币指数</p>
        <div class="mt" style="display: none;"></div>
        <div class="hotNum" style="position: relative;margin-top: 20px;">
            <div ref="chartRef" style="width: 100%; height: 200px;margin-top: -25px;"></div>
            <p style="position: absolute;font-size: 15px;bottom: 10px;left: 75px;color: green;font-weight: bold;" v-if="paNum.cnnChange>0">
                {{Number(paNum.cnnChange).toFixed(2)}}%
            </p>
            <p style="position: absolute;font-size: 15px;bottom: 10px;left: 75px;color: red;font-weight: bold;" v-if="paNum.cnnChange<0">
                {{Number(paNum.cnnChange).toFixed(2)}}%
            </p>
             <!-- <div class="setBox" style="margin-top:20px;">
                <div class="flex1 hotNumItem">
                    <p class="itemNum">
                        <span class="mkv">{{(Number(paNum.marketCpaValue)*100).toFixed(2)}}%</span> 
                        <span class="mkc">${{(Number(paNum.btcMarketCap)/1000000000000).toFixed(2)}}万亿</span>
                    </p>
                    <p class="itemTitle">btc市值占比</p>
                </div>
                <div class="flex1 hotNumItem" style="border: none;">
                    <p class="itemNum">
                        <span class="mkv">{{paNumSz.lastValue}}</span>
                        <span class="mkc">/100</span>
                    </p>
                    <p class="itemTitle">山寨指数</p>
                </div>
            </div> -->
        </div>
        <div style="overflow: hidden;" class="setBox twls">
            <div class="hwl flex1" style="margin-top: 20px;overflow: hidden;width: 0 !important;">
                <div class="pkRef" style="width: 100%;">
                    <p class="toolTitle">
                        BTC市值占比
                    </p>
                    <p style="margin-top: 10px;margin-left: 10px;">
                        <span class="mkv">{{(Number(paNum.marketCpaValue)*100).toFixed(2)}}%</span> 
                        <span class="mkc">${{(Number(paNum.btcMarketCap)/1000000000000).toFixed(2)}}万亿</span>
                    </p>
                </div>
            </div>
            <div class="hwl flex1" style="margin-top: 20px;overflow: hidden;width: 0 !important;margin-left:20px;">
                <div class="pkRef" style="width: 100%;">
                    <p class="toolTitle">
                        山寨指数
                    </p>
                    <p style="margin-top: 10px;margin-left: 10px;">
                        <span class="mkv">{{paNumSz.lastValue}}</span>
                        <span class="mkc">/100</span>
                    </p>
                </div>
            </div>
        </div>
       
        <div class="hotNum" style="margin-top: 20px;overflow: hidden;">
            <div class="toolsBar setBox">
                <div class="toolItem flex1" @click="setT1('5m')" :class="{  'tiActive': type1 === '5m' }" style="margin-left: 0 !important;">5m</div>
                <div class="toolItem flex1" @click="setT1('1h')" :class="{  'tiActive': type1 === '1h' }">1h</div>
                <div class="toolItem flex1" @click="setT1('4h')" :class="{  'tiActive': type1 === '4h' }">4h</div>
                <div class="toolItem flex1" @click="setT1('1d')" :class="{  'tiActive': type1 === '1d' }">24h</div>
            </div>
            <div class="pkRef" style="width: 100%; height: 100px;">
                <p class="toolTitle">
                    多空比
                </p>
                <p style="margin-top: 10px;">
                    <span class="t1">
                        Binance-BTC 多空持仓人数比
                    </span>
                    <span class="t3" :style="{ color: Number(pkData.change_ratio) < 0 ? '#f4434d' : '#00c88a' }">
                        <el-icon class="tsta" v-if=" Number(pkData.change_ratio) > 0"><CaretTop /></el-icon>
                        <el-icon class="tsta" v-if=" Number(pkData.change_ratio) < 0"><CaretBottom /></el-icon>
                        {{(Number(pkData.change_ratio)*100).toFixed(2)}}%
                    </span>
                    <span class="t2">
                        {{Number(pkData.longshort_ratio).toFixed(2)}}
                    </span>
                </p>
                <div class="pKgram">
                    <div class="pkItem1" :style="{width:Number(pkData.long_value)*100+'%'}"></div>
                    <div class="pkItem2" :style="{width:(1 - Number(pkData.long_value))*100+'%'}"></div>
                    <div class="river" :style="{left:'calc('+Number(pkData.long_value)*100+'%'+' - 3px)'}"></div> 
                </div>
                <p class="pKrg">
                    <span class="pkg">
                        多&nbsp; {{(Number(pkData.long_value)*100).toFixed(2)}}%
                    </span>
                    <span class="pkr">
                        空&nbsp;{{(Number(pkData.short_value)*100).toFixed(2)}}%
                    </span>
                </p>
            </div>
        </div>

        <div class="hotNum" style="margin-top: 20px;overflow: hidden;">
            <div class="toolsBar setBox" style="width: 140px;">
                <div class="toolItem flex1" @click="setT2('1h')" :class="{  'tiActive': type2 === '1h' }"  style="margin-left: 0 !important;">1h</div>
                <div class="toolItem flex1" @click="setT2('4h')" :class="{  'tiActive': type2 === '4h' }">4h</div>
                <div class="toolItem flex1" @click="setT2('1d')" :class="{  'tiActive': type2 === '1d' }">24h</div>
            </div>
            <div class="pkRef" style="width: 100%;">
                <p class="toolTitle">
                    爆仓数据
                </p>
                <p style="margin-top: 10px;overflow: hidden;">
                    <span class="t3" :style="{ color:  (listHead.totalTurnover   / totalTurnovers[totalTurnovers.length - 2] - 1) < 0 ? '#f4434d' : '#00c88a' }">
                        <el-icon class="tsta" v-if=" (listHead.totalTurnover   / totalTurnovers[totalTurnovers.length - 2] - 1) > 0"><CaretTop /></el-icon>
                        <el-icon class="tsta" v-if="  (listHead.totalTurnover   / totalTurnovers[totalTurnovers.length - 2] - 1) < 0"><CaretBottom /></el-icon>
                        {{( (listHead.totalTurnover   / totalTurnovers[totalTurnovers.length - 2] - 1)*100).toFixed(2)}}%
                    </span>
                    <span class="t2">
                       ${{getYi(listHead.totalTurnover)}}
                    </span>
                </p>
                <div class="cline" ref="lineRef">
                    
                </div>
            </div>
        </div>
        <!-- <p class="title" style="margin-top: 20px;">btc市值占比</p>
        <div class="hotNum" style="position: relative;">
            <p class="mkv">{{Number(paNum.marketCpaValue)*100}}%</p>
            <p class="mkc">${{(Number(paNum.btcMarketCap)/100000000).toFixed(2)}}亿</p>
        </div> -->
    </div>
</template>
<script setup>
    import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
    import { _URL } from "@/api/url";
    import { useDark } from '@vueuse/core'; // 导入 useDark
    import * as echarts from 'echarts';
    const paNum = ref({})
    const paNumSz = ref({})
    let type1 = ref('5m')
    let type2 = ref('1h')
    let pkData = ref({}) //多空比
    let clineData = ref({})  //爆仓数据
    let listHead =ref('') //爆仓总数
    //贪婪指数图
    const chartRef = ref(null);
    let chart = null; // 存储 ECharts 实例
    //曲线图
    const lineRef = ref(null);
    let line = null; // 存储 ECharts 实例

   
    // 获取暗色模式状态
    const isDark = useDark();

    // 动态设置图表颜色
    const getAxisLabelColor = () => {
        return isDark.value ? '#ffffff' : '#464646';  // 暗色模式下白色，正常模式下灰色
    };

    const getTitleColor = () => {
        return isDark.value ? '#ffffff' : '#464646';  // 暗色模式下白色，正常模式下灰色
    };

    // 初始化图表
    const initChart = () => {
        if (!chartRef.value) return;
        chart = echarts.init(chartRef.value);

        const option = {
            series: [
                {
                    type: 'gauge',
                    startAngle: 180,
                    endAngle: 0,
                    center: ['50%', '85%'],
                    radius: '120%',
                    min: 0,
                    max: 100,
                    splitNumber: 5,
                    axisLabel: {
                        color: getAxisLabelColor(), // 根据暗色模式设置颜色
                    },
                    axisLine: {
                        lineStyle: {
                            width: 6,
                            color: [
                                [0.25, '#fa475f'], // 红色
                                [0.5, '#feaa3f'], // 黄色
                                [0.75, '#1cca91'], // 绿色
                                [1, '#15e19f'] // 深绿色
                            ]
                        }
                    },
                    pointer: {
                        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                        length: '12%',
                        width: 10,
                        offsetCenter: [0, '-60%'],
                        itemStyle: {
                            color: 'auto'
                        }
                    },
                    axisTick: {
                        length: 8,
                        lineStyle: {
                            color: 'auto',
                            width: 1
                        }
                    },
                    splitLine: {
                        length: 15,
                        lineStyle: {
                            color: 'auto',
                            width: 2
                        }
                    },
                    title: {
                        offsetCenter: [0, '13%'],
                        fontSize: 20,
                        textStyle: {
                            color: 'inherit'
                        }
                    },
                    detail: {
                        fontSize: 30,
                        offsetCenter: [0, '-22%'],
                        valueAnimation: true,
                        formatter: function (value) {
                            return Math.round(value) + '';
                        },
                        color: 'inherit'
                    },
                    data: [{ value:paNum.value.cnnValue, name: getFearGreedLevel(paNum.value.cnnValue)}]
                }
            ]
        };

        chart.setOption(option);
    };


    let timestamps = [];
    let totalTurnovers = [];
    // let lineLoad = false;
      // 初始曲线
    const initLine = () => {
        if (!lineRef.value) return;
        if (line) {
            line.dispose();
            line = null;
        }
        
            // 只初始化一次
            line = echarts.init(lineRef.value);
        

        const option = {


            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'line',
                    axis: 'x', 
                    lineStyle: {
                        color: '#999' 
                    }
                },
                formatter: function (params) {
                    const data = params[0];
                    const rawValue = data.value;
                    let displayValue = '';

                    if (rawValue >= 1e8) {
                    displayValue = (rawValue / 1e8).toFixed(2) + ' 亿';
                    } else {
                    displayValue = (rawValue / 1e4).toFixed(2) + ' 万';
                    }

                    return `${data.axisValue}<br/>成交额: ${displayValue}`;
                }
            },
            grid: {
                left: '-1%',
                right: '-1%',
                top: '0%',
                bottom: '0%'
            },
            xAxis: {
                show: false,
                data: timestamps
            },
            yAxis: {
                show: false
            },
            series: [{
                data:totalTurnovers,
                type: 'line',
                smooth: true,
                symbol: 'none',
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            {
                                offset: 0,
                                color: 'rgba(55, 162, 218, 0.8)'
                            },
                            {
                                offset: 1,
                                color: 'rgba(55, 162, 218, 0)'
                            }
                        ],
                        global: false
                    }
                },
                lineStyle: {
                    color: 'rgba(55, 162, 218, 1)'
                }
            }]
        };
    //    if(!lineLoad){
            line.setOption(option);
            // lineLoad = true;
    //    }else{
    //     line.setOption({
    //         xAxis: {
    //             data: timestamps
    //         },
    //         series: [{
    //             data: totalTurnovers
    //         }]
    //     });
    //    }
    };
    // 监听 `val`, `status` 和 `isDark` 变化，实时更新图表
    watch(() => [paNum, isDark.value], ([newVal, darkMode]) => {
        if (chart) {
            initChart(); // 每次主题变化重新初始化图表
        }
    }, { immediate: true });
   
    onMounted(() => {
        feargreedindex()  //贪婪指数
        altcoinSeason()   //山寨指数
        longshortRatio('5m')  //多空比
        turnover('1h')  //爆仓数据
    });
    //获取多空比
    const setT1 =  (val) => {
        type1.value = val;
        longshortRatio(val)  //多空比
    };
    //获取爆仓数据
    const setT2 =  (val) => {
        type2.value = val;
        turnover(val)  //爆仓数据
    };
    //获取贪婪指数
    const feargreedindex = async () => {
        try {
            const res = await $fetch(_URL.coinankStatistic, {
                method: 'GET'
            });
            if (res?.data) {
                paNum.value = res.data.data;
                initChart();
             
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };

    //获取山寨指数
    const altcoinSeason = async () => {
        try {
            const res = await $fetch(_URL.altcoinSeason, {
                method: 'GET'
            });
            if (res?.data) {
                 paNumSz.value = res.data.data;
                // initChart();
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };

    //获取多空比
    const longshortRatio = async (val) => {
        try {
            const res = await $fetch(_URL.longshortRatio, {
                method: 'GET',
                query: {
                    interval: val
                }
            });
            if (res?.data) {
                console.log('多空比数据：'+JSON.stringify(res.data))
                pkData.value = res.data.data;
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };


    //获取爆仓数据
    const turnover = async (val) => {
        try {
            const res = await $fetch(_URL.turnover, {
                method: 'GET',
                query: {
                    interval: val
                }
            });
            if (res?.data) {
             //  console.log('爆仓数据：'+JSON.stringify(res))
                //  paNumSz.value = res.data.data;
                // // initChart();
                let listData = res.data.data.data;
                listHead.value = res.data.data.ext;
              //  alert(listData.length)
                // const timestamps = [];
                // const totalTurnovers = [];
                timestamps = []
                totalTurnovers = []
                for (let i = listData.length - 1; i >= 0; i--) {
                    const item = listData[i];
                    const date = new Date(item.ts);
                    let formattedDate;

                    if (val === "1d") {
                        formattedDate = date.toISOString().split('T')[0];
                    } else {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        if (i === 0) {
                            const now = new Date();
                            const hours = String(now.getHours()).padStart(2, '0');
                            const minutes = String(now.getMinutes()).padStart(2, '0');
                            const seconds = String(now.getSeconds()).padStart(2, '0');
                            formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                        } else {
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const seconds = String(date.getSeconds()).padStart(2, '0');
                            formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                        }
                    }

                    timestamps.push(formattedDate);

                    // 计算 all.longTurnover 与 all.shortTurnover 的和
                    const totalTurnover = item.all.longTurnover + item.all.shortTurnover;
                    if (i > 0) {
                        totalTurnovers.push(totalTurnover);
                    } else {
                        totalTurnovers.push(listHead.value.totalTurnover);
                    }
                }
                console.log(JSON.stringify(timestamps));
                console.log(JSON.stringify(totalTurnovers));
                initLine();
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };

    const getYi =  (totalTurnover) => {
        let convertedTurnover = ''
        if (totalTurnover >= 1e8) {
            convertedTurnover = (totalTurnover / 1e8).toFixed(2) + '亿';
        } else {
            convertedTurnover = (totalTurnover / 1e4).toFixed(2) + '万';
        }
        return convertedTurnover
    }


  


    
    
    //指数转汉字
    const getFearGreedLevel = (index) => {
        if (index <= 24) {
            return "极度恐惧";
        } else if (index <= 49) {
            return "恐惧";
        } else if (index <= 51) {
            return "中性";
        } else if (index <= 74) {
            return "贪婪";
        } else {
            return "极度贪婪";
        }
    }
</script>
<style lang="scss" scoped>
    /* 曲线容器开始 */
    .cline{
        height: 100px;
    }
    /* 曲线容器结束 */
    /* pk模块开始 */
    .toolsBar{
        width: 180px;
        float: right;
        background-color: #eff2f5;
        padding: 3px;
        border-radius: 5px;
        margin-right:8px;
        .toolItem{
            border-radius: 3px;
            margin-left: 3px;
            height: 18px;
            font-size: 13px;
            line-height: 17px;
            text-align: center;
            cursor: pointer;
            font-weight: bold;
            color:#616e85
        }
        .tiActive{
            background-color: white;
            color:black
        }
    }
    .pKgram{
        position: relative;
        margin-left: 10px;
        margin-right: 10px;
        .pkItem1{
            height: 10px;
            background: #00c88a;
            display: inline-block;
          
        }
        .pkItem2{
            height: 10px;
            background: #f4434d;
            display: inline-block;
          
        }
        .river{
            height: 11px;
            width: 7px;
            background: rgb(255, 255, 255);
            position: absolute;
            bottom: 6px;
            transform: skew(-30deg);
        }
    }
    .pkg{
        color: #00c88a;
        float: left;
        margin-left: 10px;
        font-size: 13px;
        font-weight: bold;
    }
    .pkr{
        color: #f4434d;
        float: right;
        margin-right: 10px;
        font-size: 13px;
        font-weight: bold;
    }
    .t1,.t2,.t3{
        font-weight: bold;
    }
    .t1{
        font-size: 13px;
        color: #616e85;
        margin-left: 10px;
    }
    .t2{
        float: right;
        margin-right: 20px;
    }
    .t3{
        float: right;
        margin-right: 10px;
        .tsta{
            position: relative;
            top:2px
        }
    }
    /* pk模块结束 */
    .toolTitle{
        margin-left: 10px;
        font-size: 17px;
        font-weight: bold;
    }
    .mkv{
        font-size: 20px;
        color: green;
        font-weight: bold;
    }
    .mkc{
        font-size: 15px;
        color: #949899;
        margin-left: 5px;
        font-weight: bold;
    }
     .seczs {
      font-size: 18px;
      color: #7b8485;
    }
    .hwl{
        width: calc(50% - 10px) !important;
        float: left;
        border: solid 1px #efeeee;
        border-radius: 10px;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    .hotNum {
        border: solid 1px #efeeee;
        border-radius: 10px;
        margin-top: 10px;
        padding-top: 10px;
        padding-bottom: 10px;

        .hotNumItem {
            text-align: center;
            border-right: solid 1px #efeeee;

            .itemNum {
                font-size: 25px;
                line-height: 20px;
                position: relative;
                top: 2px;
                font-family: "Roboto Condensed", sans-serif;
            }

            .itemTitle {
                font-size: 13px;
             
                line-height: 30px;
                position: relative;
                top: 2px
            }
        }
    }
    @media (max-width: 1100px) {
        .mhTitle{
            display: none;
        }
        .mt{
           display: block !important;
           height: 25px;
        }
        .twls{
            width: 94%;
            margin-left: 3%;
        }
        .hotNum{
            width: 94%;
            margin-left: 3%;
        }
    }
</style>