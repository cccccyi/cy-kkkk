<template>

    <div class="whale">
        <div class="mainBuild">
            <div class="topBuild setBox">
                <div class="nowVal  flex1">
                    <p class="title  ss1">
                        巨鲸资金统计
                    </p>
                    <div class="whaleMsg">
                        <div class="lineItem i1  flex1 setBox">
                            <div class="flex1 ">
                                <p class="title tCenter">仓位</p>
                                <p class="pvalue tCenter">{{formatNumber(allValue.allPositionUsd)}}</p>
                            </div>
                            <div class="flex2  setBox">
                                <div :style="{ width: getHM(allValue.longPosition, allValue.allPositionUsd) + '%' }">
                                    <p class="title">多单持仓</p>
                                    <p class="pvalue">
                                        {{formatNumber(allValue.longPosition)}}
                                        <span v-if="allValue.longPosition!=0" class="stit2">
                                            ({{getHM(allValue.longPosition,allValue.allPositionUsd)}}%)
                                        </span>
                                    </p>
                                    <p class="greenF"></p>
                                </div>
                                <div style="text-align: right !important;"
                                    :style="{ width: getHM(allValue.shortPosition,allValue.allPositionUsd) + '%' }">
                                    <p class="title">空单持仓</p>
                                    <p class="pvalue">
                                        {{formatNumber(allValue.shortPosition)}}
                                        <span v-if="allValue.longPosition!=0" class="stit2">
                                            ({{getHM(allValue.shortPosition,allValue.allPositionUsd)}}%)
                                        </span>
                                    </p>
                                    <p class="redF"></p>
                                </div>
                            </div>
                        </div>
                        <div class="lineItem i2 flex1 setBox">
                            <div class="flex1 ">
                                <p class="title tCenter">保证金</p>
                                <p class="pvalue tCenter">{{formatNumber(allValue.allMargin)}}</p>
                            </div>
                            <div class="flex2  setBox">
                                <div :style="{ width: getHM(allValue.longLargin,allValue.allMargin) + '%' }">
                                    <p class="title">多单保证金</p>
                                    <p class="pvalue">
                                        {{formatNumber(allValue.longLargin)}}
                                        <span v-if="allValue.longPosition!=0" class="stit2">
                                            ({{getHM(allValue.longLargin,allValue.allMargin)}}%)
                                        </span>
                                    </p>
                                    <p class="greenF"></p>
                                </div>
                                <div style="text-align: right;"
                                    :style="{ width: getHM(allValue.shortMargin,allValue.allMargin)+ '%' }">
                                    <p class="title">空单保证金</p>
                                    <p class="pvalue">
                                        {{formatNumber(allValue.shortMargin)}}
                                        <span v-if="allValue.longPosition!=0" class="stit2">
                                            ({{getHM(allValue.shortMargin,allValue.allMargin)}}%)
                                        </span>
                                    </p>
                                    <p class="redF"></p>
                                </div>
                            </div>
                        </div>
                        <div class="lineItem  flex1 setBox">
                            <div class="flex1 ">
                                <p class="title tCenter">盈亏（PnL）</p>
                                <p class="pvalue tCenter">{{formatNumber(allValue.allUnrealizedPnl)}}</p>
                            </div>
                            <div class="flex1 ">
                                <p class="title tCenter">多单盈亏</p>
                                <p class="pvalue tCenter">{{formatNumber(allValue.longUnrealizedPnl)}}</p>
                            </div>
                            <div class="flex1 ">
                                <p class="title tCenter">空单盈亏</p>
                                <p class="pvalue tCenter">{{formatNumber(allValue.shortUnrealizedPnl)}}</p>
                            </div>
                        </div>
                        <div class="lineItem  flex1 setBox">
                            <div class="flex1 ">
                                <p class="title tCenter">资金费</p>
                                <p class="pvalue tCenter">{{formatNumber(0-allValue.allFundingFee)}}</p>
                            </div>
                            <div class="flex1 ">
                                <p class="title tCenter">多单资金费</p>
                                <p class="pvalue tCenter">{{formatNumber(0-allValue.longFundingFee)}}</p>
                            </div>
                            <div class="flex1 ">
                                <p class="title tCenter">空单资金费</p>
                                <p class="pvalue tCenter">{{formatNumber(0-allValue.shortFundingFee)}}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="nowValAction  flex1">
                    <p class="title">
                        最新鲸鱼动态
                    </p>
                    <div class="waction">
                        <el-table :data="actionList" style="height: 417px;position: relative;top:1px"
                            :row-class-name="tableRowClassName">
                            <el-table-column prop="userId" label="地址" :formatter="formatAddress" />
                            <el-table-column prop="coin" label="币种" />
                            <el-table-column label="操作">
                                <template #default="scope">
                                    <span>
                                        {{ formatState(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="仓位">
                                <template #default="scope">
                                    <span>
                                        ${{ formatPosition(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="价格">
                                <template #default="scope">
                                    <span>
                                        ${{ formatPrice(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="createTimestamp" label="时间" :formatter="formatTimestamp" />
                        </el-table>
                    </div>

                </div>
            </div>
            <div class="nowValAction2  flex1" style="margin-top: 20px;">
                <p class="title">
                    最新鲸鱼动态
                </p>
                <div class="waction">
                    <el-table :data="actionList" style="height: 400px;position: relative;top:1px"
                        :row-class-name="tableRowClassName">
                        <el-table-column prop="userId" width="100" label="地址" :formatter="formatAddress" />
                        <el-table-column prop="coin" width="60" label="币种" />
                        <el-table-column label="操作" width="90">
                            <template #default="scope">
                                <span>
                                    <!-- {{scope.row.state}}   -->
                                    {{ formatState(scope.row) }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="仓位" width="90">
                            <template #default="scope">
                                <span>
                                    ${{ formatPosition(scope.row) }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="价格" width="90">
                            <template #default="scope">
                                <span>
                                    ${{ formatPrice(scope.row) }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="createTimestamp" width="90" label="时间" :formatter="formatTimestamp" />
                    </el-table>
                </div>

            </div>
            <div class="holdTable">
                <p class="title">
                    鲸鱼持仓情况
                </p>
                <ClientOnly>
                    <div style="overflow: hidden;">
                        <p class="selects">
                            <span class="cktitle">币种：</span>
                            <br>
                            <el-select v-model="coin" placeholder="Select" style="width: 100px">
                                <el-option v-for="item in options" :key="item" :label="item" :value="item" />
                            </el-select>
                        </p>

                        <p class="selects">
                            <span class="cktitle">方向：</span>
                            <br>
                            <el-select v-model="direction" placeholder="Select" style="width: 100px">
                                <el-option v-for="item in options2" :key="item" :label="item" :value="item" />
                            </el-select>
                        </p>

                        <p class="selects">
                            <span class="cktitle">未实现盈亏：</span>
                            <br>
                            <el-select v-model="pnl" placeholder="Select" style="width: 100px">
                                <el-option v-for="item in options3" :key="item" :label="item" :value="item" />
                            </el-select>
                        </p>

                        <p class="selects">
                            <span class="cktitle">资金费：</span>
                            <br>
                            <el-select v-model="funding" placeholder="Select" style="width: 100px">
                                <el-option v-for="item in options4" :key="item" :label="item" :value="item" />
                            </el-select>
                        </p>
                    </div>
                    <div class="btable">
                        <el-table :data="holdList" style="width: 100%;position: relative;top:1px" stripe>
                            <el-table-column label="" width="60">
                                <template #default="scope">
                                    <span class="maintitle">#{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="用户" width="120">
                                <template #default="scope">

                                    <span class="maintitle"> {{ formatAddress(scope.row) }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="币种" width="60">
                                <template #default="scope">
                                    <span class="maintitle"> {{scope.row.coin }}</span>
                                </template>
                            </el-table-column>

                            <!-- <el-table-column prop="userId" label="用户" width="120" :formatter="formatAddress" />
                            <el-table-column prop="coin" label="币种" width="60"/> -->
                            <!-- <el-table-column prop="size" label="方向" width="60" :formatter="formatSize" /> -->
                            <el-table-column label="方向" align="center">
                                <template #default="scope">
                                    <span style="color: green;font-weight: bold;" v-if=" formatSize(scope.row)=='多'">
                                        {{ formatSize(scope.row) }}

                                    </span>
                                    <span style="color: red;font-weight: bold;" v-if=" formatSize(scope.row)=='空'">
                                        {{ formatSize(scope.row) }}

                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="仓位" width="120">
                                <template #default="scope">
                                    <span class="maintitle">
                                        ${{ formatPosition2(scope.row) }}
                                        <br>
                                        <span class="sectitle">{{ formatToWan(scope.row.size)}}{{scope.row.coin}}</span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="未实现盈亏%" width="130" align="right">
                                <template #default="scope">

                                    <span class="maintitle"
                                        :class="scope.row.unrealizedPnl > 0 ? 'setGreen' : 'setRed'">
                                        ${{ formatUnrealizedPnl(scope.row) }}
                                        <br>
                                        <span class="sectitle"
                                            :class="scope.row.unrealizedPnl > 0 ? 'setGreen' : 'setRed'">{{
                                            calculatePnlPercentage(scope.row.unrealizedPnl,scope.row.positionUsd)
                                            }}</span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="开仓价格" width="120" align="right">
                                <template #default="scope">
                                    <span class="maintitle">
                                        ${{ formatEntryPrice1(scope.row) }}
                                        <br>
                                        <span class="sectitle"> {{
                                            scope.row.leverage}}x{{formatPositionType(scope.row.positionType)}}</span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="爆仓价格" width="120" align="right">
                                <template #default="scope">
                                    <span class="maintitle">
                                        ${{ formatLiquidationPrice1(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="保证金" width="120" align="right">
                                <template #default="scope">
                                    <span class="maintitle">
                                        ${{ formatMargin(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="资金费" width="120" align="right">
                                <template #default="scope">
                                    <span class="maintitle" :class="scope.row.fundingFee < 0 ? 'setGreen' : 'setRed'">
                                        ${{ formatFundingFee1(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="价格" width="120" align="right">
                                <template #default="scope">
                                    <span class="maintitle">
                                        ${{ formatPrice2(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>

                            <el-table-column label="开仓时间" width="120" align="right">
                                <template #default="scope">
                                    <span class="maintitle">
                                        {{ formatCreateTimestamp(scope.row) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <!-- <el-table-column align="right" prop="createTimestamp" label="开仓时间" :formatter="formatCreateTimestamp" /> -->
                        </el-table>
                    </div>

                    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
                        layout="prev, pager, next" :total="total" @current-change="handlePageChange"
                        style="margin-top: 20px;" />
                      
                </ClientOnly>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { ref } from 'vue'
    import mobileFooter from './components/mobileFooter.vue';
    import { _URL } from "@/api/url";


    const url = useRequestURL();
    useHead({
        title: 'Hyperliquid鲸鱼监控',
        meta: [
            { name: 'keywords', content: 'Hyperliquid鲸鱼监控' },
            { name: 'description', content: 'Hyperliquid鲸鱼监控' },
            // Open Graph（OG）标签
            { property: 'og:image', content: `${url.origin}/image/share.png` },
            { property: 'og:type', content: 'website' },
            { property: 'og:site_name', content: 'hashnews' },
            { property: 'og:title', content: 'Hyperliquid鲸鱼监控' },
            { property: 'og:description', content: 'Hyperliquid鲸鱼监控' },
            // Twitter 标签
            { name: 'twitter:card', content: 'summary' },
            { name: 'twitter:image', content: `${url.origin}/image/share.png` }
        ]
    });
    const coin = ref('全部')   //
    const direction = ref('全部')  //方向多long  空short
    const pnl = ref('全部')  //  未实现盈亏 盈利profit  ，亏损loss
    const funding = ref('全部') //  资金费 盈利profit  ，亏损loss
    const options = ['全部', 'ETH', 'BTC', 'XRP', 'kPEPE', 'SOL', 'HYPE', 'LINK', 'ADA', 'LTC', 'SUI', 'MKR', 'ENA', 'MELANIA', 'TIA', 'DOGE', 'POPCAT', 'AVAX', 'TRUMP', 'ONDO', 'HBAR', 'AAVE', 'ZK', 'VINE', 'BNB', 'TRX', 'FARTCOIN', 'IP', 'FET', 'NEAR', 'OM', 'PURR', 'AI16Z', 'WLD', 'BERA', 'TAO', 'XLM', 'kBONK', 'ZRO']
    const options2 = ['全部', '多', '空']
    const options3 = ['全部', '盈利', '亏损']
    const options4 = ['全部', '盈利', '亏损']
    let pageNum = ref(1)
    let pageSize = ref(20)
    let total = ref(0)
    //统计数据
    const allValue = ref(
        {
            "allPositionUsd": "0",
            "longPosition": "0",
            "shortPosition": "0",
            "allMargin": "0",
            "longLargin": "0",
            "shortMargin": "0",
            "allUnrealizedPnl": "0",
            "longUnrealizedPnl": "0",
            "shortUnrealizedPnl": "0",
            "allFundingFee": "0",
            "longFundingFee": "0",
            "shortFundingFee": "0"
        }
    )
    //巨鲸动态
    const actionList = ref([])
    //巨鲸持仓
    const holdList = ref([])

    //定时器
    let intervalId: number | null = null;  // 使用数字ID
    onMounted(() => {
        fetchData(); // 组件挂载时立即执行一次
        // 每隔 18.888 秒刷新数据
        intervalId = setInterval(() => {
            fetchData();
        }, 18888);
    });
    //离开时卸载
    onBeforeUnmount(() => {
        if (intervalId) {
            clearInterval(intervalId); // 组件卸载时清除定时器，避免内存泄漏
        }
    });
    watch([coin, direction, pnl, funding], async () => {
        try {
            await Promise.all([getValue(), getBtable()]);
        } catch (error) {
            console.error('监听数据变化时发生错误:', error);
        }
    }, { immediate: false });

    //小型数据加载中心
    const fetchData = async () => {
        try {
            await Promise.all([getValue(), getTRtable(), getBtable()]);
        } catch (error) {
            console.error('定时获取数据时发生错误:', error);
        }
    };
    //获取统计数据
    const getValue = async () => {
        try {
            let requestData = {
                coin: coin.value.replace('全部', ''),
                direction: ({ "全部": "", "多": "long", "空": "short" }[direction.value] ?? direction.value),
                pnl: ({ "全部": "", "盈利": "profit", "亏损": "loss" }[pnl.value] ?? pnl.value),
                funding: ({ "全部": "", "盈利": "loss", "亏损": "profit" }[funding.value] ?? funding.value),
            };
            const res = await $fetch(_URL.mediaCoinglassStatistic, {
                method: 'GET',
                query: requestData,  // 将参数传递到查询字符串中
            });
            if (res?.data) {
                //   console.log(res.data.data);
                allValue.value = res.data.data
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };
    //获取鲸鱼动态
    const getTRtable = async () => {
        try {
            let requestData = {
                pageNum: 1,
                pageSize: 20
            };
            const res = await $fetch(_URL.mediaCoinglassAction, {
                method: 'GET',
                query: requestData,  // 将参数传递到查询字符串中
            });
            if (res?.data) {
                // console.log(JSON.stringify(res.data));
                actionList.value = res.data.list
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };
    //获取鲸鱼持仓
    const getBtable = async () => {
        try {
            let requestData = {
                pageNum: pageNum.value,
                pageSize: pageSize.value,
                coin: coin.value.replace('全部', ''),
                direction: ({ "全部": "", "多": "long", "空": "short" }[direction.value] ?? direction.value),
                pnl: ({ "全部": "", "盈利": "profit", "亏损": "loss" }[pnl.value] ?? pnl.value),
                funding: ({ "全部": "", "盈利": "loss", "亏损": "profit" }[funding.value] ?? funding.value),
            };
            const res = await $fetch(_URL.mediaCoinglassHyperliquid, {
                method: 'GET',
                query: requestData,  // 将参数传递到查询字符串中
            });
            if (res?.data) {
                console.log(JSON.stringify(res.data));
                holdList.value = res.data.list
                total.value = res.data.total
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };
    //巨鲸动态背景颜色
    const tableRowClassName = ({ row }) => {
        const state = formatState(row);
        if (state.includes("买入")) {
            return "buy-row";
        } else if (state.includes("卖出")) {
            return "sell-row";
        }
        return "";
    };
    // 处理页码变化
    const handlePageChange = (newPage: number) => {
        pageNum.value = newPage;
        getBtable();
    };
    //计算百分比
    const getHM = (c, f) => {
        let hm = (c / f * 100).toFixed(2)
        return hm
    };
    //数据转换
    const formatNumber = (num: number): string => {
        if (num >= 1e8) {
            // 如果数字大于等于一亿，转为亿为单位
            return (num / 1e8).toFixed(2) + ' 亿';
        } else {
            // 如果数字小于一亿，转为万为单位
            return (num / 1e4).toFixed(2) + ' 万';
        }
    };
    // 格式化地址方法
    const formatAddress = (row: any) => {
        const address = row.userId;
        if (!address) return '';
        if (address.length <= 8) return address; // 地址太短时不省略
        return `${address.slice(0, 6)}...${address.slice(-2)}`;
    };
    // 格式化时间戳为东八区时间
    const formatTimestamp = (row: any) => {
        if (!row.createTimestamp) return '-';
        const date = new Date(row.createTimestamp * 1000); // 转换成毫秒
        return date.toLocaleTimeString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    // 格式化仓位，转换成“万”单位
    const formatPosition = (row: any) => {
        if (!row.positionUsd) return '-';
        return `${(row.positionUsd / 10000).toFixed(2)} 万`;
    };
    // 格式化价格，保留两位小数
    const formatPrice = (row: any) => {
        if (!row.entryPrice) return '-';
        return Number(row.entryPrice).toFixed(2);
    };
    // 格式化操作字段
    // const formatState = (row: any) => {
    //     return stateMap[row.state] || '-';
    // };
    const formatState = (row: any) => {
        const size = parseFloat(row.size);
        const state = parseInt(row.state);

        if (size > 0) {
            // 多头仓位
            if (state === 1) {
                return "买入开多";
            } else if (state === 2) {
                return "卖出平多";
            }
        } else if (size < 0) {
            // 空头仓位
            if (state === 1) {
                return "卖出开空";
            } else if (state === 2) {
                return "买入平空";
            }
        }

        return "未知状态";
    }
    // 格式化方向字段
    const formatSize = (row: any) => {
        if (row.size < 0) return '空'; // 负数显示为空
        if (row.size > 0) return '多'; // 正数显示“多”
        return '-'; // 默认值，防止其他情况
    };
    // 格式化仓位字段，若大于 1 亿转换为亿，小于则转换为万，第二个
    const formatPosition2 = (row: any) => {
        if (!row.positionUsd) return '-';
        // 大于 1 亿，转换为 亿
        if (row.positionUsd >= 100000000) {
            return `${(row.positionUsd / 100000000).toFixed(2)} 亿`;
        }
        // 小于 1 亿，转换为 万
        return `${(row.positionUsd / 10000).toFixed(2)} 万`;
    };
    // 格式化未实现盈亏字段，转换为“万”单位
    const formatUnrealizedPnl = (row: any) => {
        if (!row.unrealizedPnl) return '-';
        return `${(row.unrealizedPnl / 10000).toFixed(2)} 万`;
    };
    // 格式化开仓价格字段，最多保留两位小数
    const formatEntryPrice1 = (row: any) => {
        if (row.entryPrice === undefined || row.entryPrice === null) return '-';
        // 使用 parseFloat 转换并确保最多两位小数，避免显示不必要的零
        return parseFloat(row.entryPrice).toFixed(2);
    };
    // 格式化开仓价格字段，最多保留两位小数
    const formatLiquidationPrice1 = (row: any) => {
        if (row.liquidationPrice === undefined || row.liquidationPrice === null) return '-';
        // 使用 parseFloat 转换并确保最多两位小数，避免显示不必要的零
        return parseFloat(row.liquidationPrice).toFixed(2);
    };
    // 格式化保证金字段，转换为“万”单位，并保留两位小数
    const formatMargin = (row: any) => {

        if (!row.margin) return '-';
        return `${(row.margin / 10000).toFixed(2)} 万`; // 转换为万，并保留两位小数
    };
    // 格式化资金费字段，若绝对值大于一万则转换为“万”单位，保留两位小数
    const formatFundingFee1 = (row: any) => {
        // row.fundingFee = 0-row.fundingFe
        const fundingFee22 = 0 - row.fundingFee;

        if (fundingFee22 === undefined || fundingFee22 === null || isNaN(fundingFee22)) return '-';

        const fundingFee = parseFloat(fundingFee22); // 确保资金费是数字
        const absoluteFundingFee = Math.abs(fundingFee); // 获取绝对值

        if (absoluteFundingFee >= 10000) {
            return `${(fundingFee / 10000).toFixed(2)} 万`; // 大于一万转为万单位
        } else {
            return fundingFee.toFixed(2); // 小于一万保留两位小数
        }
    };
    // 格式化价格字段，保留两位小数
    const formatPrice2 = (row: any) => {
        if (row.price === undefined || row.price === null) return '-';
        return parseFloat(row.price).toFixed(2); // 保留两位小数
    };
    // 格式化时间戳为东八区时间，保留月日时分
    const formatCreateTimestamp = (row: any) => {
        if (!row.createTimestamp) return '-';

        const date = new Date(row.createTimestamp * 1000); // 将时间戳转为毫秒
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Shanghai', // 设置为东八区
        };

        // 格式化为月日时分的格式
        return date.toLocaleString('zh-CN', options).slice(5, 16); // 截取月日时分部分
    };
    const formatToWan = (value: number) => {
        const absoluteValue = Math.abs(value); // 获取绝对值
        return `${(absoluteValue / 10000).toFixed(2)} 万`; // 转换成万，保留两位小数
    };
    // 如果是 cross，返回 "全仓"，否则返回 "其他"（可以根据需求修改返回值）
    const formatPositionType = (positionType: string) => {
        return positionType === 'cross' ? '全仓' : '逐仓'; // 可以根据需求修改 "其他"
    };
    const calculatePnlPercentage = (unrealizedPnl: number, positionSize: number) => {
        if (positionSize === 0) return '0.00%'; // 避免除以 0 的错误
        const pnlPercentage = (unrealizedPnl / positionSize) * 100; // 计算百分比
        return `${pnlPercentage.toFixed(2)}%`; // 保留两位小数，添加百分号
    };

</script>
<style>
    .buy-row {
        background: linear-gradient(to left, rgba(93, 196, 93, 0.8), transparent) !important;
    }

    .sell-row {
        background: linear-gradient(to left, rgba(255, 69, 69, 0.7), transparent) !important;
    }
</style>
<style lang="scss" scoped>
    .whale {

        .el-table {
            /* font-family: "Monda", Arial, sans-serif; */
            font-family: "Roboto Condensed", sans-serif;
            color: black;
            font-weight: bold !important;
        }

        .stit2 {
            font-size: 13px;
        }

        .maintitle {
            color: black;
            font-weight: 500;
            font-size: 14px !important;
        }

        .setGreen {
            color: green !important;
        }

        .setRed {
            color: red !important;
        }

        .sectitle {
            color: rgb(150, 150, 150);
            font-size: 12px !important;
        }

        td {
            color: black !important;
        }

        min-height: calc(100vh - 135px);

        .greenF,
        .redF {
            height: 8px;
            width: 100%;
        }


        .greenF {
            background: #53a995;
        }

        .redF {
            background: #df484c;
        }

        .selects:first-child {
            margin-left: 0px !important;
        }

        .selects {

            float: left;
            margin-left: 10px;
            margin-top: 10px;
        }

        .btable {
            border: solid 1px #dddfe5;
            margin-top: 20px;
            border-radius: 5px;
            overflow: hidden;
        }

        .cktitle {
            font-size: 13px;
        }

        .whaleMsg {


            margin-top: 15px;
            border-radius: 5px;
        }

        .title {
            font-size: 20px;
            font-weight: bold;
        }

        .topBuild {}

        .lineItem:first-child {
            margin-top: 0 !important;
        }

        .lineItem:last-child {
            margin-bottom: 0 !important;
        }

        .lineItem {
            height: 95px;
            border: solid 1px #dddfe5;
            border-radius: 5px;
            margin-right: 10px;
            padding-left: 20px;
            padding-right: 20px;
            margin-top: 13px;
            margin-bottom: 13px;

            .title {
                font-size: 15px !important;
                font-weight: normal !important;
                margin-top: 15px;
                color: rgb(150, 150, 150);
            }

            .pvalue {
                font-size: 16px;
                font-weight: bold;
                font-family: "Roboto Condensed", sans-serif;
            }
        }

        .tCenter {
            /* text-align: center; */
        }

        .waction {
            border: solid 1px #dddfe5;
            border-radius: 5px;
            overflow: hidden;
            margin-top: 15px;
        }

        .nowValAction {
            padding-left: 10px;
        }

        .holdTable {
            margin-top: 30px;
        }

        @media (max-width: 1100px) {
            .stit2 {
                display: block;
            }

            .nowVal {
                width: 100% !important;
            }

            .nowValAction {
                display: none;
            }

            .ss1 {
                margin-top: 20px;
            }

            .selects {
                margin-left: 5px !important;
            }

            .el-select {
                width: 80px !important;
            }

            .pvalue {
                font-size: 15px !important;
            }

            .i1,
            .i2 {
                height: 110px !important;
            }

            .lineItem {
                margin-right: 0 !important;
            }
        }

        /* 适配电脑样式 */
        @media (min-width: 1100px) {
            .nowValAction2 {
                display: none;
            }
        }
    }
</style>