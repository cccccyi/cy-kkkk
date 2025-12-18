<template>
    <div class="deepsearch">
        <button @click="ibt">标题字号+</button>
        {{fontSize2}}
        <button @click="ibt2">标题字号-</button>
        &nbsp; &nbsp; &nbsp;
        <button @click="increaseFontSize">表格字号+</button>
        {{fontSize}}
        <button @click="increaseFontSizej">表格字号-</button>
        &nbsp; &nbsp; &nbsp;
        <button @click="kd">表格宽度+</button>
        {{kdll}}
        <button @click="kd2">表格宽度-</button>
        &nbsp; &nbsp; &nbsp;
        显示条数
        <input v-model="length" type="text" name="" id="" style="width: 38px;">
        &nbsp; &nbsp; &nbsp;
        标题
        <input v-model="text" type="text" name="" id="" style="width: 198px;">
        日期
        <input v-model="text2" type="text" name="" id="" style="width: 98px;">
        时间
        <input v-model="time" type="text" name="" id="" style="width: 98px;">
        &nbsp; &nbsp; &nbsp;
        <button @click="setNowCoin('sol','solana链上交易量24H排行榜','sol')">solana</button>
        &nbsp;
        <button @click="setNowCoin('eth','ETH链上交易量24H排行榜','eth')">eth</button>
        &nbsp;
        <button @click="setNowCoin('base','BASE链上交易量24H排行榜','base')">base</button>
        &nbsp;
        <button @click="setNowCoin('bsc','BSC链上交易量24H排行榜','bsc')">bsc</button>
        &nbsp;
        <button @click="setNowCoin('bscA','币安Alpha交易量24H排行榜','alpha')">bsc Alpha</button>
        &nbsp;
        <button @click="setNowCoin('tron','Monad链上交易量24H排行榜','tron')">tron</button>
        &nbsp;
        <button @click="setNowCoin('odin','Odin.Fun交易量24H排行榜','odin')">odin</button>
        &nbsp;
        <button @click="setNowCoin('alkanes','Alkanes协议交易量24H排行榜','alkanes')">Alkanes协议</button>
        &nbsp;
        <button @click="setNowCoin('x402','X402生态代币24H交易量排行榜','x402')">x402</button>
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        &nbsp; &nbsp;
        <button @click="upload402">导入x402数据</button>
        &nbsp; &nbsp;
        <button @click="captureAndDownload">保存图片</button>
        <el-switch v-model="isDark" inline-prompt class="tctrl" style=" --el-switch-off-color: rgba(150,150,150,0.3)" />
        <!-- <center style="font-size: 50px;padding-top: 300px;color: rgb(190,190,190);">comming soon</center> -->
        <div class="mainBuild ggwith" :class="nowCoin" ref="captureRef" style="position: relative;">
            <div style="position: relative;z-index: 9999;">
                <input type="file" accept=".xlsx" ref="fileInput" @change="handleFileChange" style="display: none" />
                <div style="height: 50px;"></div>
                <img class="logo c1" style="display: none;" src="@/assets/hlogo6.png" @dblclick="handleDblClick" />
                <img class="logo c2" src="@/assets/hlogo7.png" @dblclick="handleDblClick" />
                <span
                    style="position: absolute;top:35px;right: 200px;font-size: 20px;opacity: 0.5;font-weight: bold;">@HashNewsHK</span>
                <center>
                    <span style="display: block;margin-top: 30px;margin-bottom: 20px;">

                        <span class="ssop" style="color:#002fa7;">{{text}}</span>

                        <span class="ssop"
                            style="color:#002fa7;font-size:46px;margin-top: -20px !important;display: block;">【{{text2}}
                            {{time}}时】</span>
                    </span>
                </center>
            </div>
            <img class="cicon" v-if="nowCoin=='sol'" src="@/assets/sol.png" />
            <img class="cicon" v-if="nowCoin=='eth'" src="@/assets/eth.png" />
            <img class="cicon" v-if="nowCoin=='base'" src="@/assets/base.png" />
            <img class="cicon" v-if="nowCoin=='bsc'" src="@/assets/bsc.png" />
            <img class="cicon" v-if="nowCoin=='bscA'" src="@/assets/bscA.png" />
            <img class="cicon" v-if="nowCoin=='tron'" src="@/assets/tron.png" />
            <img class="cicon" v-if="nowCoin=='odin'" src="@/assets/odin.png" />
            <img class="cicon" v-if="nowCoin=='alkanes'" src="@/assets/alkanes.png" />
            <img class="cicon" v-if="nowCoin=='x402'" src="@/assets/x402.png" />
            <div class="btable" style="background:#111521;position: relative;z-index: 9999;" v-if="nowCoin != 'bscA'&&nowCoin != 'x402'">
                <div class="whiter">
                    <img class="" v-for="item in 100" src="@/assets/hlogo6.png" @dblclick="handleDblClick" />
                </div>
                <el-table v-if="yysss==1" :data="holdList.slice(0, length)"
                    style="width: 100%;position: relative;top:1px" :row-class-name="tableRowClassName">
                    <el-table-column label="#" width="60">
                        <template #default="scope">
                            <span class="maintitle">{{ scope.$index + 1 }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="名称" width="160" v-if="nowCoin != 'odin'">
                        <template #default="scope">
                            <!-- <img :src="'https://pipc.yuanqiwulian.com/meme_images'+getFilename(scope.row.icon)" v-if="getFilename(scope.row.icon)" class="icons" alt=""> -->
                            <!-- <div class="icons" alt="" style="
                                background: #fc912c;
                                color: white !important;
                                font-size: 20px !important;
                                text-align: center;
                                line-height: 30px !important;
                                font-weight: bold !important;
                            ">
                                {{ scope.row.symbol.substring(0,2)}}
                            </div> -->
                            <span class="maintitle mm2" style="line-height: 30px;height: 30px;"> {{ scope.row.symbol}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="代币名称" width="230" v-if="nowCoin == 'odin'">
                        <template #default="scope">
                            <!-- <img :src="scope.row.icon" class="icons" alt="">
                            <span class="maintitle mm2 "> {{ scope.row.symbol}}</span> -->
                            <img :src="'https://pipc.yuanqiwulian.com/meme_images'+getFilename(scope.row.icon)" v-if="getFilename(scope.row.icon)" class="icons" alt="">
                            <div class="icons" alt="" v-if="!getFilename(scope.row.icon)" style="
                                background: #fc912c;
                                color: white !important;
                                font-size: 20px !important;
                                text-align: center;
                                line-height: 30px !important;
                                font-weight: bold !important;
                            ">
                                {{ scope.row.symbol.substring(0,2)}}
                            </div>
                            <span class="maintitle mm2 "> {{ scope.row.symbol}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="价格">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                ${{formatPrice(Number(scope.row.price || 0)) }}
                            
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="市值" >
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">$ {{
                                (scope.row.market_cap/1000000).toFixed(2)}}&nbsp;M</span>
                                
                        </template>
                    </el-table-column>
                    <el-table-column label="池子" v-if="nowCoin != 'odin'&&nowCoin != 'alkanes'">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                {{ formatNumber(Number(scope.row.liquidity || 0))}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="持有人数" width="130">
                        <template #default="scope">
                            <span class="maintitle"> {{ scope.row.holder_count}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="24h交易量" width="160">
                        <template #default="scope">
                            <!-- {{scope.row.volume}} -->
                         <span class="maintitle"  >${{ convertNumber(scope.row.volume)}}</span>

                        </template>
                    </el-table-column>
                    <el-table-column label="24h涨跌幅" width="140">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                <!-- <span v-if="scope.row.change>0">+</span> -->
                                {{ Number(scope.row.price_change || 0).toFixed(2) }}%
                                <!-- {{scope.row.price_change}} -->
                            </span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="btable" style="background:#111521;position: relative;z-index: 9999;" v-if="nowCoin == 'bscA'">
                <div class="whiter">
                    <img class="" v-for="item in 100" src="@/assets/hlogo6.png" @dblclick="handleDblClick" />
                </div>
                <el-table v-if="yysss==1" :data="holdList.slice(0, length)"
                    style="width: 100%;position: relative;top:1px" :row-class-name="tableRowClassName">
                    <el-table-column label="#" width="60">
                        <template #default="scope">
                            <span class="maintitle">{{ scope.$index + 1 }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="代币名称">
                        <template #default="scope">
                              <img :src="'https://pipc.yuanqiwulian.com/meme_images'+getFilename(scope.row.icon)" v-if="getFilename(scope.row.icon)" class="icons" alt="">
                            <div class="icons" alt="" v-if="!getFilename(scope.row.icon)" style="
                                background: #fc912c;
                                color: white !important;
                                font-size: 20px !important;
                                text-align: center;
                                line-height: 30px !important;
                                font-weight: bold !important;
                            ">
                                {{ scope.row.symbol.substring(0,2)}}
                            </div>
                            <span class="maintitle mm2 "> {{ scope.row.symbol}}</span>
                        </template>
                    </el-table-column>

                    <el-table-column label="价格">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                {{formatPrice(Number(scope.row.price || 0)) }}
                            </span>
                        </template>
                    </el-table-column>
                    <!-- <el-table-column label="市值">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'"> {{
                                (scope.row.market_cap/1000000).toFixed(2)}}&nbsp;M</span>
                        </template>
                    </el-table-column> -->
                    <!-- <el-table-column label="池子" >
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                {{ formatNumber(Number(scope.row.liquidity || 0))}}</span>
                        </template>
                    </el-table-column> -->
                    <!-- <el-table-column label="持有人数">
                        <template #default="scope">
                            <span class="maintitle"> {{ scope.row.holder_count}}</span>
                        </template>
                    </el-table-column> -->
                    <el-table-column label="24h交易量">
                        <template #default="scope">
                            <span class="maintitle">{{ (scope.row.volume/1000000).toFixed(2)}}&nbsp;M</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="24h涨跌幅">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                <!-- <span v-if="scope.row.change>0">+</span> -->
                                {{ Number(scope.row.price_change || 0).toFixed(2) }}%
                                    <!-- {{scope.row.price_change}} -->
                            </span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- x402 -->
             <div class="btable" style="background:#111521;position: relative;z-index: 9999;" v-if="nowCoin == 'x402'">
                <div class="whiter">
                    <img class="" v-for="item in 100" src="@/assets/hlogo6.png" @dblclick="handleDblClick" />
                </div>
                <el-table v-if="yysss==1" :data="holdList.slice(0, length)"
                    style="width: 100%;position: relative;top:1px" :row-class-name="tableRowClassName2">
                    <el-table-column label="#" width="60">
                        <template #default="scope">
                            <span class="maintitle">{{ scope.$index + 1 }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="代币名称">
                        <template #default="scope">
                              <img      v-if="!blockedSymbols.includes(scope.row.symbol)" :src="'./icon2/'+scope.row.symbol+'.png'" class="icons" alt="">
                            <div    v-else class="icons" alt="" v-if="!getFilename(scope.row.icon)" style="
                                background: #fc912c;
                                color: white !important;
                                font-size: 20px !important;
                                text-align: center;
                                line-height: 30px !important;
                                font-weight: bold !important;
                            ">
                                {{ scope.row.symbol.substring(0,2)}}
                            </div>
                            <span class="maintitle mm2 "> {{ scope.row.symbol}}</span>
                        </template>
                    </el-table-column>

                    <el-table-column label="价格">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                <!-- {{formatPrice(Number(scope.row.price || 0)) }} -->
                                 {{scope.row.price}}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="市值">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'"> 
                                 {{scope.row.market_cap}}
                            </span>
                        </template>
                    </el-table-column>
                   
                    <el-table-column label="24h交易量">
                        <template #default="scope">
                            <span class="maintitle">
                                <!-- {{ (scope.row.volume/1000000).toFixed(2)}}&nbsp;M -->
                                {{scope.row.volume_24h_short}}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="24h涨跌幅">
                        <template #default="scope">
                            <span class="maintitle" :class="scope.row.change >0 ? 'setGreen' : 'setRed'">
                                <!-- <span v-if="scope.row.change>0">+</span> -->
                                  {{scope.row.change_24h}}
                                    <!-- {{scope.row.price_change}} -->
                            </span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { useDark } from "@vueuse/core";
    import * as XLSX from "xlsx";
    // import { ref } from 'vue'
    import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
    import { useRoute } from 'vue-router';
    import html2canvas from 'html2canvas';
    import request from "@/utils/request"; // 引入封装的 Axios 实例
    let hotKey = ref(["DeFi", "GameFi", "NFT", "SEC", "Bybit", "比特币"])
    const route = useRoute(); // 获取当前路由对象
    const isDark = useDark();
    const key = ref(route.query.key || '');
    const holdList = ref([]);
    const fontSize = ref(25); // 初始字号
    // 第二个区域的字号
    const fontSize2 = ref(75);
    const kdll = ref(1250); // 初始字号
    const yysss = ref(1); // 初始字号
    const length = ref(30); // 初始字号
    const blockedSymbols = ['42', 'MOEW','BNKR','GLORIA','OLAS','MAGIC','OPUS','PRXVT','JTVO','AIN','ARBUS','BREW','MRDN','ZARA','SKL','KARUM','KHO','AURA','U402']

    let nowCoin = ref('eth')

    let text = ref("ETH链上交易量24H排行榜");
    const getCurrentHour = () => {
        const date = new Date();
        return date.getHours();
    };
    let time = ref(getCurrentHour()+1);
    const date = new Date();
    const formattedDate = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });

    let text2 = ref(formattedDate);
    let chain = ref('BSC')
    onMounted(() => {
        //alert(1);
        getList('eth')
    })
const convertNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'; // 大于等于1M，转换为M为单位，保留两位小数
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'; // 大于等于1K且小于1M，转换为K为单位，保留两位小数
  } else {
    return Number(num).toFixed(2); // 小于1K，确保num是数字类型后调用toFixed，保留两位小数
  }
};
    //获取列表
    const getList = (type) => {
      //  alert(111);
        request.get('http://82.157.161.88/boost_interface/vue-element-admin/douyin/fetchGmgnCoinList?page=1&limit=30&chain='+type)
        .then((response: any) => {
           //  console.log(JSON.stringify(response));
            // newsDt.value = response.data;
            //response.data.items
            holdList.value = response.data.items
        })
        .catch((err: any) => {
            // error.value = err.message || "请求失败";
        })
    }

    //输入x402数据
    const upload402 = () => {
        //弹出浏览器原生输入框
        const inputValue = prompt("请输入内容：");
        // 判断是否点击了取消
        if (inputValue !== null) {
            console.log("你输入的内容是：", inputValue);
             holdList.value = JSON.parse(inputValue)
        } else {
            console.log("用户取消了输入");
        }
    };

    const showPrompt = () => {
        const userInput = prompt("请输入新文字：");
        if (userInput !== null) {
            text.value = userInput;
        }
    };
    const captureDiv = ref(null);


    const setNowCoin = (type, text22,coin) => {
        nowCoin.value = type;
        text.value = text22;
        getList(coin)
    }

    const formatNumber = (value: number): string => {

        if (value >= 1_000_000) {
            return (value / 1_000_000).toFixed(2) + ' M';
        } else if (value >= 1_000) {
            return (value / 1_000).toFixed(2) + ' K';
        }
        return value.toString();
    };


    const captureRef = ref(null); // 绑定需要截图的 DOM 元素



    const captureAndDownload = async () => {
        if (captureRef.value) {
            try {
                const canvas = await html2canvas(captureRef.value, {
                    useCORS: true, // 如果图片是跨域的，需要设置此选项
                    scale: 2, // 可选，调整截图的清晰度
                });
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png'); // 转换为 PNG 格式
                link.download = 'screenshot.png'; // 设置下载文件名
                link.click(); // 触发下载
            } catch (error) {
                console.error('截图失败:', error);
            }
        }
    };


const formatPrice = (num) => {
  if (typeof num !== 'number' || isNaN(num) || num < 0) return 'Invalid input';

  if (num < 1) {
    const str = num.toFixed(20); // 高精度防科学计数法
    const match = str.match(/^0\.0*(\d+)/); // 匹配有效数字
    const zeroCount = str.match(/^0\.0*/)[0].length - 2;

    const significantPart = match[1].slice(0, 3); // 取前3位方便四舍五入
    const rounded = Math.round(Number(`0.${significantPart}`) * 100);
    const roundedStr = rounded.toString().padStart(2, '0');

    if (zeroCount >= 3) {
      return `0.{${zeroCount}}${roundedStr}`;
    } else {
      return `0.${'0'.repeat(zeroCount)}${roundedStr}`;
    }
  } else {
    // 大于等于1的数，保留两位小数，四舍五入
    return num.toFixed(2);
  }
};



    const tableRowClassName = ({ row }) => {
        // const change = formatState(row);
        if (row.price_change > 0) {
            return "buy-row";
        } else {
            return "sell-row";
        }
        // if (state.includes("买入")) {
        //     return "buy-row";
        // } else if (state.includes("卖出")) {
        //     return "sell-row";
        // }
    };

     const tableRowClassName2 = ({ row }) => {
        // const change = formatState(row);
        if (row.change_24h && row.change_24h.substring(0,1) != '-') {
            return "buy-row";
        } else {
            return "sell-row";
        }
        // if (state.includes("买入")) {
        //     return "buy-row";
        // } else if (state.includes("卖出")) {
        //     return "sell-row";
        // }
    };
    // 增加字号的方法
    const increaseFontSize = () => {
        fontSize.value += 1; // 每次点击增加1px
        document.documentElement.style.setProperty('--font-size', `${fontSize.value}px`);
    };
    // 增加字号的方法
    const increaseFontSizej = () => {
        fontSize.value -= 1; // 每次点击增加1px
        document.documentElement.style.setProperty('--font-size', `${fontSize.value}px`);
    };


    // 增加字号的方法
    const ibt = () => {
        fontSize2.value += 1; // 每次点击增加1px
        document.documentElement.style.setProperty('--font-size-2', `${fontSize2.value}px`);
    };
    const ibt2 = () => {
        fontSize2.value -= 1; // 每次点击增加1px
        document.documentElement.style.setProperty('--font-size-2', `${fontSize2.value}px`);
    };


    // 增加字号的方法
    const kd = () => {
        kdll.value += 30; // 每次点击增加1px
        document.documentElement.style.setProperty('--width', `${kdll.value}px`);
    };
    const kd2 = () => {
        kdll.value -= 30; // 每次点击增加1px
        document.documentElement.style.setProperty('--width', `${kdll.value}px`);
    };


    // 增加字号的方法
    const ys1 = () => {
        yysss.value = 1
    };
    const ys2 = () => {
        yysss.value = 2
    };
    const ys3 = () => {
        yysss.value = 3
    };

    // 创建一个文件输入的引用
    const fileInput = ref(null);

    // 双击图片时触发
    const handleDblClick = () => {
        // 触发文件选择器
        fileInput.value.click();
    };
    const getFilename = url => {
  if (!url || typeof url !== "string") return ""; // 先检查是否是有效字符串
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin === "http://82.157.161.88" ? "/" + parsedUrl.pathname.split("/").pop() : "";
  } catch {
    return "";
  }
};
    // 文件选择器改变时触发
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // 创建一个文件读取器
            const reader = new FileReader();
            reader.onload = (e) => {
                // 将文件内容读取为二进制字符串
                const binaryString = e.target.result;
                // 使用 xlsx 库解析工作簿
                const workbook = XLSX.read(binaryString, { type: "binary" });
                // 获取第一个工作表的名称
                const firstSheetName = workbook.SheetNames[0];
                // 将工作表转换为 JSON 格式
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
                // 打印到控制台
                holdList.value = data
                console.log(JSON.stringify(data));
                //console.log("Excel 数据:", data);
            };
            reader.readAsBinaryString(file);
        }
    };
    const getRowStyle = ({ row, rowIndex }) => {
        // 计算透明度，随着行数增加逐渐变小
        const opacity = 1 - rowIndex * 0.05; // 可根据需要调整衰减速度
        return {

            background: `linear-gradient(to left, rgba(40, 77, 151, ${opacity}), transparent)`,
        };
    }
    // const sp = ref('123')
    // const cd =ref(true)
    // const toChange =()=>{
    //   sp.value = 456
    // }
</script>
<style>
    .buy-row {
        background: linear-gradient(to left, #208c4f, transparent) !important;
    }

    .sell-row {
        background: linear-gradient(to left, rgba(205, 69, 69, 0.7), transparent) !important;
    }
</style>
<style lang="scss">
    .ggwith {
        width: var(--width) !important;
        padding-right: 50px;
        padding-left: 50px;
        padding-bottom: 78px;
        padding-top: 10px !important;
        margin-top: 50px;
        overflow: hidden;
        transition: background 0.3s ease;
        /* 过渡动画更流畅 */

    }

    /* 每种币种的背景色 */
    .ggwith.sol {
        background: #265d76;
    }

    .ggwith.eth {
        background: #4460dd;
    }

    .ggwith.base {
        background: #3a2ea3;
    }

    .ggwith.bsc {
        background: #151e23;
    }

    .ggwith.bscA {
        background: #151e23;
    }

    .ggwith.tron {
        /* background: #362c04; */
        background: #5c42f4;
    }

    .ggwith.odin {
        background: #fc912c;
    }

     .ggwith.alkanes {
        background: #09293a;
    }

     .ggwith.x402 {
        background: #3a2ea3;
    }


    .cicon {
        top: -50px;
        left: -50px;
        width: 300px;
        position: absolute;
    }

    :root {
        --font-size: 25px;
        /* 初始字号 */
        --font-size-2: 75px;
        /* 第二个区域的初始字号 */
        --width: 1250px;
        /* 第二个区域的初始字号 */
    }

    @font-face {
        font-family: ziTi1;
        src: url(/111.ttf);
    }

    .ggwith {}

    .icons {
        width: 30px;
        height: 30px;
        border-radius: 20px;
        background-size: cover;
        float: left;
    }

    .mm2 {
        position: relative;
        top: 5px;
        left: 12px;
    }

    .deepsearch {
        .logo {
            width: 380px;
            position: absolute;
            right: -35px;
            top: 0;
            opacity: 0.6;
        }

        .tctrl {
            position: absolute;
            top: 20px;
            right: 20px;
        }

        .el-table {
            font-size: var(--font-size) !important;
            /* font-family: "Monda", Arial, sans-serif; */
            font-family: "Roboto Condensed", sans-serif;
            color: black;
            font-weight: bold !important;
        }

        .stit2 {
            font-size: 13px;
        }

        .maintitle {
            font-size: var(--font-size) !important;
            color: black;
            font-weight: bold !important;
            /* text-shadow: 0.5px 0.5px 2px rgba(52, 49, 49, 0.5) */
        }

        .ssop {
            font-family: ziTi1;
            font-size: var(--font-size-2);

        }

        .setGreen {
            /* color: rgb(45, 188, 45) !important; */
            color: white;
        }

        .setRed {
            /* color: red !important; */
            color: white;
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
            position: relative;

            .whiter {

                position: absolute;
                width: 3200px;
                z-index: 9999;
                height: 1000px;
                transform: rotate(45deg);

                img {
                    width: 40%;
                    opacity: 0.04;
                    margin-top: 170px;
                    margin-left: 20px;

                }
            }
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