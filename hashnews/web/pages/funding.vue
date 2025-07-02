<template>
    <div class="whale">
        <ClientOnly>
            <div class="mainBuild">
                <div class="holdTable ">
                    <p class="title ss1">
                        各平台资金费率对比
    
                    </p>
                    <div class="mobile-menu" :class="{ 'show': showMenu }">
                        <font-awesome-icon @click="toggleMenu" :icon="['fas', 'times']"
                            style="font-size: 30px;float: right;position: relative;top:15px;right:15px;color: white;" />
                        <div class="menu-content">
                            <el-checkbox-group v-model="checkListEx" @change="sortJsonData" class="exlist">
                                <el-checkbox label="Binance" value="Binance" />
                                <br>
                                <el-checkbox label="Bitget" value="Bitget" />
                                <br>
                                <el-checkbox label="Bybit" value="Bybit" />
                                <br>
                                <el-checkbox label="Gate" value="Gate" />
                                <br>
                                <el-checkbox label="Hyperliquid" value="Hyperliquid" />
                                <br>
                                <el-checkbox label="OKX" value="OKX" />
                            </el-checkbox-group>
                            <div class="selects" style="margin-top: 30px;">
                                <span class="cktitle">OI&nbsp;&nbsp;≥&nbsp;&nbsp;${{oi}}M</span>
    
                                <el-slider v-model="oi" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </div>
                            <div class="selects">
                                <span class="cktitle">24H Vol&nbsp;&nbsp;≥&nbsp;&nbsp;${{vol24}}M</span>
    
                                <el-slider v-model="vol24" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </div>
                            <div class="selects">
                                <span class="cktitle">ARP&nbsp;&nbsp;≥&nbsp;&nbsp;{{aprPlus}}%</span>
    
                                <el-slider v-model="aprPlus" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </div>
                            <div class="selects" >
                                <span class="cktitle">ARP&nbsp;&nbsp;≤&nbsp;&nbsp;-{{aprUn}}%</span>
    
                                <el-slider v-model="aprUn" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </div>
                        </div>
                    </div>
                 
                        <div style="overflow: hidden;height: 60px;" class="pcCtrl">
                            <el-checkbox-group v-model="checkListEx" @change="sortJsonData" class="exlist">
                                <el-checkbox label="Binance" value="Binance" />
                                <el-checkbox label="Bitget" value="Bitget" />
                                <el-checkbox label="Bybit" value="Bybit" />
                                <el-checkbox label="Gate" value="Gate" />
                                <el-checkbox label="Hyperliquid" value="Hyperliquid" />
                                <el-checkbox label="OKX" value="OKX" />
                            </el-checkbox-group>
                            <p class="selects">
                                <span class="cktitle">ARP&nbsp;&nbsp;≤&nbsp;&nbsp;-{{aprUn}}%</span>
                                <br>
                                <el-slider v-model="aprUn" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </p>
                            <p class="selects">
                                <span class="cktitle">ARP&nbsp;&nbsp;≥&nbsp;&nbsp;{{aprPlus}}%</span>
                                <br>
                                <el-slider v-model="aprPlus" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </p>
                            <p class="selects">
                                <span class="cktitle">24H Vol&nbsp;&nbsp;≥&nbsp;&nbsp;${{vol24}}M</span>
                                <br>
                                <el-slider v-model="vol24" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </p>
                            <p class="selects">
                                <span class="cktitle">OI&nbsp;&nbsp;≥&nbsp;&nbsp;${{oi}}M</span>
                                <br>
                                <el-slider v-model="oi" class="sliders" :show-tooltip="false" @change="sortJsonData" />
                            </p>
                        </div>
    
                        <div class="btable" v-if="!isMobile">
                            <el-table :data="holdList" :row-class-name="tableRowClassName"
                                style="width: 100%;position: relative;top:1px">
                                <el-table-column label="" width="80">
                                    <template #default="scope">
                                        <span class="maintitle">#{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
                                    </template>
                                </el-table-column>
    
                                <el-table-column label="COIN" prop="coin" sortable>
                                    <template #default="scope">
                                        <span class="maintitle">
                                            {{ scope.row.coin}}
                                        </span>
                                    </template>
                                </el-table-column>
    
                                <el-table-column label="SYMBOL" width="170" prop="symbol" sortable>
                                    <template #default="scope">
                                        <span class="maintitle">
                                            {{ scope.row.symbol}}
                                        </span>
                                    </template>
                                </el-table-column>
    
                                <el-table-column label="Exchange" width="150" prop="exchange" sortable>
                                    <template #default="scope">
                                        <img :src="'/exs/'+ scope.row.exchange+'.png'" alt="" class="icons">
                                        <span class="maintitle">
                                            {{ scope.row.exchange}}
                                        </span>
                                    </template>
                                </el-table-column>
                                <el-table-column label="Funding" width="150" prop="funding_fee" sortable>
                                    <template #default="scope">
                                        <span style="font-weight: bold !important;" class="maintitle"
                                            :class="scope.row.funding_fee > 0 ? 'setGreen' : 'setRed'">
                                            {{ formatPercentageFour(scope.row.funding_fee)}}
                                        </span>
                                    </template>
                                </el-table-column>
                                <el-table-column label="APR" prop="apr_funding" sortable>
                                    <template #default="scope">
                                        <span style="font-weight: bold !important;" class="maintitle"
                                            :class="scope.row.apr_funding > 0 ? 'setGreen' : 'setRed'">
                                            {{ formatPercentage(scope.row.apr_funding)}}
                                        </span>
                                    </template>
                                </el-table-column>
    
    
                                <el-table-column label="OI" prop="oi" sortable>
                                    <template #default="scope">
                                        <span class="maintitle">
                                            {{formatNumberByUnit(scope.row.oi)}}
                                        </span>
                                    </template>
                                </el-table-column>
    
    
                                <el-table-column label="MarketCap" width="120" prop="marketCap" sortable>
                                    <template #default="scope">
                                        <span class="maintitle">
                                            {{formatNumberByUnit(scope.row.marketCap)}}
                                        </span>
                                    </template>
                                </el-table-column>
    
    
    
                                <el-table-column label="24H Vol" prop="volume_24h" sortable>
                                    <template #default="scope">
                                        <span class="maintitle">
                                            {{ formatNumberByUnit(scope.row.volume_24h)}}
                                        </span>
                                    </template>
                                </el-table-column>
                                <el-table-column label="Swap Bid" width="120" prop="bid" sortable>
                                    <template #default="scope">
                                        <span class="maintitle">
                                            ${{ scope.row.bid}}
                                        </span>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                        <!-- 手机版列表 -->
                        <!-- <div class="mlistItem" v-for="item,index in holdList" :class="tableRowClassName2(item)" v-if="isMobile"> -->
                        <div class="mlistItem" v-if="isMobile">
    
    
                            <div class="setBox topBar">
                                <!-- <div class="nlt" style="width: 5vw;">
                                      {{ index + 1 }}
                                    </div> -->
                                <div class="nlt" style="width: 13vw;">
                                    Coin
                                </div>
                                <div class="nlt" style="width: 13vw;">
                                    SYMBOL
                                </div>
                                <div class="nlt" style="width: 13vw;">
                                    Funding
                                </div>
                                <div class="nlt" style="width: 9vw;">
                                    APR
                                </div>
                                <div class="nlt" style="width: 14vw;">
                                    OI
                                </div>
                                <div class="nlt" style="width: 14vw;">
                                    M-Cap
                                </div>
                                <div class="nlt" style="width: 10vw;">
                                    24H Vol
                                </div>
                                <div class="nlt"  style="width: 14vw;">
                                        Swap Bid
                                    </div>
                            </div>
                            <div style="height: 27px;">
    
                            </div>



                            <div class="setBox" v-for="item,index in holdList" :class="tableRowClassName2(item)">
                                <!-- <div class="nlt" style="width: 5vw;">
                                  {{ index + 1 }}
                                </div> -->
                                <div class="nlt" style="width: 13vw;">
                                    <img :src="'/exs/'+ item.exchange+'.png'" alt="" class="icons">
                                    <span style="position: relative;left:1px;">{{ item.coin}}</span>
                                </div>
                                <div class="nlt" style="width: 13vw;">
                                    {{ item.symbol}}
                                </div>
                                <div class="nlt" style="width: 13vw;font-weight: bold;"
                                    :class="item.funding_fee > 0 ? 'setGreen' : 'setRed'">
    
                                    {{ formatPercentageFour(item.funding_fee)}}
                                </div>
                                <div class="nlt" style="width: 9vw;font-weight: bold;"
                                    :class="item.funding_fee > 0 ? 'setGreen' : 'setRed'">
                                    {{ formatPercentage(item.apr_funding)}}
                                </div>
                                <div class="nlt" style="width: 14vw;">
                                    {{formatNumberByUnit(item.oi)}}
                                </div>
                                <div class="nlt" style="width: 14vw;">
                                    {{formatNumberByUnit(item.marketCap)}}
                                </div>
                                <div class="nlt" style="width: 10vw;">
                                    {{ formatNumberByUnit(item.volume_24h)}}
                                </div>
                                <div class="nlt"  style="width: 14vw;">
                                    ${{ item.bid}}
                                </div>
                            </div>
                            <!--   <div class="setBox">
                                <div class="lt1 l11 " style="text-align: left;text-indent: 5px;width: 140px;">
                                    #{{index+1}}
                                    <span style="font-weight: bold !important;">
                                       &nbsp; {{item.coin}}
                                    </span>
                                   
                                </div>
                                <div class="flex1 lt1 " style="text-align: left;">
                                    <img :src="'/exs/'+ item.exchange+'.png'" alt="" class="icons">  {{item.exchange}}
                                </div>
                                <div class="flex1 lt1 " style="text-align: right;width: 100px;">
                                    OI:{{formatNumberByUnit(item.oi)}}&nbsp;
                                </div>
                            </div>
                         <div class="setBox">
                                <div class="lt1 l11 " style="width:140px;text-align: left;text-indent: 5px;">
                                    {{item.symbol}}
                                </div>
                              <div class="flex1 lt1 " style="text-align: left;">
                                <span class="fmlb2" style="font-weight: bold;" :class="item.funding_fee > 0 ? 'setGreen' : 'setRed'">
                                    Funding:{{ formatPercentageFour(item.funding_fee)}}
                                </span>
    
                                </div>
                                <div class=" lt1 " style="text-align: right;">
                                    <span class="fmlb2" style="font-weight: bold;" :class="item.apr_funding > 0 ? 'setGreen' : 'setRed'">
                                        APR:{{ formatPercentage(item.apr_funding)}}&nbsp;
                                    </span>
                              
                                </div>
                            </div>
                            <div class="setBox">
                                <div class="lt1 l11 " style="width:140px;text-align: left;text-indent: 5px;">
                                        24H Vol:{{formatNumberByUnit(item.volume_24h)}}
                                </div>
                              <div class="flex1 lt1 " style="text-align: left;">
                                        Swap Bi:${{item.bid}}
                                </div>
                                <div class="flex1 lt1 " style="text-align: right;">
                                              M-Cap:{{formatNumberByUnit(item.marketCap)}}&nbsp;
                                </div>
                            </div> -->
                        </div>
                        <!-- <div class="mlistItem" v-for="item,index in holdList" :class="tableRowClassName2(item)" v-if="isMobile">
                            <div class="setBox">
                                <div class="lt1 l11 " style="text-align: left;text-indent: 5px;width: 140px;">
                                    #{{index+1}}
                                    <span style="font-weight: bold !important;">
                                       &nbsp; {{item.coin}}
                                    </span>
                                   
                                </div>
                                <div class="flex1 lt1 " style="text-align: left;">
                                    <img :src="'/exs/'+ item.exchange+'.png'" alt="" class="icons">  {{item.exchange}}
                                </div>
                                <div class="flex1 lt1 " style="text-align: right;width: 100px;">
                                    OI:{{formatNumberByUnit(item.oi)}}&nbsp;
                                </div>
                            </div>
                            <div class="setBox">
                                <div class="lt1 l11 " style="width:140px;text-align: left;text-indent: 5px;">
                                    {{item.symbol}}
                                </div>
                              <div class="flex1 lt1 " style="text-align: left;">
                                <span class="fmlb2" style="font-weight: bold;" :class="item.funding_fee > 0 ? 'setGreen' : 'setRed'">
                                    Funding:{{ formatPercentageFour(item.funding_fee)}}
                                </span>
    
                                </div>
                                <div class=" lt1 " style="text-align: right;">
                                    <span class="fmlb2" style="font-weight: bold;" :class="item.apr_funding > 0 ? 'setGreen' : 'setRed'">
                                        APR:{{ formatPercentage(item.apr_funding)}}&nbsp;
                                    </span>
                              
                                </div>
                            </div>
                            <div class="setBox">
                                <div class="lt1 l11 " style="width:140px;text-align: left;text-indent: 5px;">
                                        24H Vol:{{formatNumberByUnit(item.volume_24h)}}
                                </div>
                              <div class="flex1 lt1 " style="text-align: left;">
                                        Swap Bi:${{item.bid}}
                                </div>
                                <div class="flex1 lt1 " style="text-align: right;">
                                              M-Cap:{{formatNumberByUnit(item.marketCap)}}&nbsp;
                                </div>
                            </div>
                        </div> -->
                        <div class="mbtn" @click="toggleMenu">
                            <font-awesome-icon class="ctrlRef" :icon="['fas', 'sliders']" style="font-size: 18px ;" />
                        </div>
                  
                </div>
            </div>
        </ClientOnly>
    </div>
</template>
<script setup lang="ts">
    import { ref } from 'vue'
    import mobileFooter from './components/mobileFooter.vue';
    import { _URL } from "@/api/url";
    const url = useRequestURL();
    useHead({
        title: '各平台资金费对比',
        meta: [
            { name: 'keywords', content: '各平台资金费对比' },
            { name: 'description', content: '各平台资金费对比' },
            // Open Graph（OG）标签
            { property: 'og:image', content: `${url.origin}/image/share.png` },
            { property: 'og:type', content: 'website' },
            { property: 'og:site_name', content: 'hashnews' },
            { property: 'og:title', content: '各平台资金费对比' },
            { property: 'og:description', content: '各平台资金费对比' },
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
    let coin_supply = { "1INCH": 1386672940.312543, "A8": 287855203.7, "AAVE": 15099808.84740032, "ACE": 62464307, "ACH": 9019660259.361599, "ACT": 948245023.383984, "ACX": 437914191.4330931, "ADA": 35312950699.40473, "ADX": 147900000, "AERGO": 477499995.7689212, "AERO": 814797502.7167034, "AEVO": 903184799.7187029, "AGI": 1332412647.186438, "AGLD": 77310001, "AI": 330333332.33, "AI16Z": 1099998622.4126348, "AIC": 749999700, "AIDOGE": 174455896934211000, "AIFUN": 0, "AIOT": 50000000, "AIOZ": 1175695494.5790708, "AIXBT": 924256820.3841392, "AKT": 248285794.661141, "ALCH": 850000000, "ALEO": 363590964.245977, "ALGO": 8598939269.676762, "ALICE": 100000000, "ALPACA": 151686417.60270965, "ALPHA": 922000000, "ALPINE": 15514854.22168, "ALT": 3273550799.850709, "ALU": 990000000, "AMB": 5299825432, "AMP": 84231577693.27176, "ANIME": 5538604656, "ANKR": 10000000000, "ANLOG": 1857089402, "APE": 752651515, "API3": 86421978, "APT": 621361852.8730417, "APU": 337892157626.5295, "AR": 65652466, "ARB": 4756695618, "ARC": 999998319, "ARK": 188605520, "ARKM": 225100000, "ARPA": 1519586598.3877385, "ASR": 7392918, "ASTR": 7655878479, "ATA": 587792028.2579365, "ATH": 9084674961, "ATOM": 390934204, "AUCTION": 6090142.29001446, "AUDIO": 1321769799, "AVA": 999994070, "AVAAI": 0, "AVAIL": 2059795731, "AVAX": 418427156.679772, "AVL": 161683998, "AXL": 965263286.610078, "AXS": 161340870.385132, "B2": 46900245, "B3": 21292670212, "BABY": 2294036491, "BADGER": 20421349.91236254, "BAI": 0, "BAKE": 289770511.79138726, "BAL": 63338150.2776731, "BAN": 999961859, "BANANA": 3982397.74788956, "BANANAS31": 10000000000, "BAND": 160824479.410701, "BANK": 425250000, "BAT": 1495668356.9526057, "BB": 523417808.2191781, "BCH": 19868812.5, "BEAM": 49466004168, "BEL": 80000000, "BERA": 119401833.8625879, "BGB": 1169993089.2, "BGSC": 6075000000, "BICO": 950444556.4772326, "BID": 268466796.9, "BIGTIME": 1887042599.0062063, "BILLY": 936137657, "BIO": 1434181910.87, "BLAST": 28578187682.99721, "BLUE": 224845911, "BLUR": 2331554024.115297, "BLZ": 466713950.729144, "BMT": 309804500, "BNB": 140888985.64, "BNT": 115188101.74069732, "BOBA": 171624231.86, "BOME": 68929781163.08597, "BOND": 7910262.29101514, "BONE": 229923350.6228802, "BONK": 79171458768250.16, "BR": 210000000, "BRETT": 9910236395, "BROCCOLI": 1000000000, "BSV": 19864125, "BSW": 544496508, "BTC": 19863953, "BTCDOM": 0, "BTT": 986061142857000, "BUBB": 1000000000, "BURGER": 43040100.35405466, "BUZZ": 999867160, "C98": 950416394, "CAKE": 320478131.2413869, "CARV": 261811989.44, "CAT": 6749783055123.635, "CATI": 325790000, "CATS": 675067692800.0621, "CELO": 570648764, "CELR": 7783424106.9912, "CETUS": 720566445.3911248, "CFX": 5061508555.51, "CGPT": 822705528, "CHEEMS": 187495034775398, "CHESS": 200571421, "CHILLGUY": 999953846.633523, "CHR": 842231914.378197, "CHZ": 9590535642, "CKB": 46489654515.23066, "CLANKER": 1000000, "CLAY": 0, "CLOUD": 0, "COMBO": 82467130, "COMP": 9029537.21428524, "COOK": 873630734.7001727, "COOKIE": 514053767, "COQ": 69420000000000, "CORE": 1001076061.5951296, "COS": 5176458774, "COTI": 2098908536.5685086, "COW": 419612730.26469946, "CPOOL": 773095883.2031598, "CRO": 26571560696, "CRV": 1343343631, "CSPR": 13067017121, "CTC": 449416053, "CTK": 145899916, "CTSI": 869061665.4516767, "CVC": 1000000000, "CVX": 97043389.85359137, "CYBER": 39747000, "D": 647874403, "DARK": 999957849, "DASH": 12255639.40730744, "DATA": 1128103853, "DBR": 1829293597, "DEEP": 3151000000, "DEFI": 30059736.11, "DEGEN": 14179608879, "DEGO": 20997212.63267069, "DENT": 99999999999.99994, "DEXE": 83733368.98844688, "DF": 999926146.6275177, "DGB": 17687744779.232845, "DHX": 0, "DIA": 119676104, "DODO": 725703404.35, "DOG": 100000000000, "DOGE": 149238246383.7052, "DOGS": 516750000000, "DOLO": 361694000, "DOOD": 7800000000, "DOT": 1576770604.0422583, "DRIFT": 300240583.76328, "DUCK": 31319194.867369, "DUKO": 9663955990, "DUSK": 483999999.31632507, "DYDX": 776537909.5234395, "DYM": 288009263, "EDGE": 0, "EDU": 410715985, "EGLD": 28215958.47369463, "EIGEN": 299264891.7785325, "ELIZA": 999987297.358787, "ELON": 549652770159583.3, "ELX": 0, "ENA": 5820312500, "ENJ": 1837957996.8151615, "ENS": 36291610.61114447, "EOS": 1564767399.8375, "EPIC": 22296716.44879068, "EPT": 2316583323, "ETC": 151888786.6778688, "ETH": 120729738.24154536, "ETHFI": 276965331, "ETHW": 107818999.04993, "F": 1726595745, "FARTCOIN": 999998256, "FB": 37781050.17320734, "FDUSD": 1517569608.289573, "FET": 2390849370.7134285, "FHE": 249000000, "FIDA": 990911617.896725, "FIL": 665767339, "FIO": 810174910.2135257, "FIS": 113163740.297, "FLM": 544232664.2961614, "FLOCK": 176637258.1750065, "FLOKI": 9625068768710.28, "FLOW": 1581417955.178094, "FLR": 65128906355.14731, "FLUX": 384371609.4991484, "FORM": 381867255.144574, "FORTH": 14343554.15380151, "FOXY": 0, "FRED": 999817667.286427, "FTN": 436261513, "FTT": 328895103.813207, "FUEL": 4824504968.94085, "FUN": 10843201660.398026, "FWOG": 975635328, "FXS": 89923576.29211822, "G": 9380640000, "GALA": 44380831776.70704, "GAS": 64992331, "GEMS": 399931237, "GHST": 52747801.21406849, "GIGA": 9302411888, "GLM": 1000000000, "GLMR": 978359836, "GM": 273939524.33, "GME": 411297484026, "GMT": 2874766902.323662, "GMX": 10129749.91482257, "GNO": 2587877.28927596, "GOAT": 999993315.951215, "GODS": 368472224.0649, "GOMINING": 408622534.03779477, "GPS": 1636241368.1820111, "GRASS": 243905091, "GRIFFAIN": 999881120, "GROK": 6320359606.769096, "GRT": 9825196062.785088, "GT": 122910588, "GTC": 94780727.70514555, "GUN": 787833333, "HAEDAL": 195000000, "HAPPY": 3333174669, "HBAR": 42238834745.85722, "HEI": 71922505, "HFT": 571754318.0058, "HIFI": 141812991.87810302, "HIGH": 73286293.77158035, "HIPPO": 10000000000, "HIVE": 500749242.945, "HMSTR": 64375000000, "HNT": 182381699.1353545, "HOOK": 234748730.57573897, "HOT": 174989068284.78094, "HOUSE": 998759261.708371, "HSK": 132500000, "HYPE": 333928180, "HYPER": 175200000, "ICE": 6615204261.41, "ICP": 532800938.3914353, "ICX": 1064068808.4792104, "ID": 1002514534.4004356, "IDEX": 939447584.7059144, "ILV": 7611238.62713796, "IMT": 0, "IMX": 1817351985.3898141, "INIT": 148750000, "INJ": 99970935.41, "IO": 156636838.82, "IOST": 24269784065, "IOTA": 3751592581, "IOTX": 9441368979, "IP": 270418950, "ISLAND": 172561510.79454, "J": 161007935, "JAILSTOOL": 999811201.878492, "JASMY": 49444999677.16958, "JELLY": 0, "JELLYJELLY": 999999099, "JOE": 398139433, "JST": 9900000000, "JTO": 327227062.5, "JUP": 2897855555.54, "KAIA": 6016220625.2051935, "KAITO": 241388889, "KAS": 26160425827.282825, "KAVA": 1082853459, "KDA": 316607589.02608, "KEKIUS": 1000000000, "KERNEL": 162317496, "KEY": 5999999954.464072, "KILO": 211700000, "KISHU": 93136097121133940, "KMNO": 1440410967, "KNC": 187063389.7606331, "KOMA": 487697722.1353065, "KSM": 16488770.43610189, "L3": 0, "LADYS": 734366023232083, "LAI": 2399308275.339515, "LAYER": 210000000, "LDO": 897847242.0441473, "LEVER": 41999246619.0928, "LINA": 9996646261.001118, "LINK": 657099970.4527867, "LISTA": 189176717.36164808, "LOKA": 375023761.9608511, "LOOKS": 999941673, "LOOM": 1242920897.5790398, "LPT": 40532978.22881623, "LQTY": 94907382.02601366, "LRC": 1366825863.509865, "LSK": 187345646.43963897, "LTC": 75846951.98347135, "LUCE": 999999996, "LUMIA": 116354102.73127739, "LUNA": 709984438.91686, "LUNC": 5449271835274.332, "MAGA": 390258895840, "MAGIC": 329767950.4602583, "MAJOR": 83349868, "MANA": 1942255184.1130493, "MANEKI": 8858766369, "MANTA": 412690315.22574574, "MASA": 689832130.9493824, "MASK": 100000000, "MAV": 596431975.1811638, "MAVIA": 111931126, "MAX": 130520000, "MBL": 18491887214, "MBOX": 500322467, "MDT": 676157012.5, "ME": 148985635.573301, "MELANIA": 549998442.88934, "MEME": 45491874819.19004, "MEMEFI": 10000000000, "MEMHASH": 843392248, "MERL": 525000000, "METIS": 6376034.342, "MEW": 88888888888, "MICHI": 0, "MILK": 238900000, "MINA": 1231055386.8400393, "MINT": 1041314412631.2438, "MKR": 832920.61165059, "MLN": 2967315.06865754, "MNT": 3364694382.8368406, "MOBILE": 89280000000, "MOCA": 2676888888.2, "MOG": 390567526433216.7, "MON": 487667071.1295556, "MOODENG": 989971791.17, "MORPHO": 264520678.53462023, "MOTHER": 986143154.31, "MOVE": 2500000000, "MOVR": 9566411, "MTL": 84646958, "MUBARAK": 1000000000, "MUMU": 2283204416985, "MVL": 26602958863.10265, "MYRIA": 30972980808, "MYRO": 944203815, "MYX": 92067374, "NAVX": 576047447.17, "NC": 177472445, "NEAR": 1211649605, "NEIRO": 420684552288.7844, "NEO": 70538831, "NFP": 441839240.4877291, "NFT": 999990000000000, "NIKO": 1000000000, "NIL": 195150000, "NKN": 787622139.489528, "NMR": 8061179.53352041, "NOT": 102456957533.56, "NS": 181812510.458333, "NTRN": 583007316.465503, "NULS": 112504738.88205422, "OBOL": 98719850, "OBT": 3100000000, "OG": 4300000, "OGN": 692693527, "OIK": 0, "OL": 478145802.9706, "OM": 963062242.5398605, "OMG": 140245398.24513277, "OMNI": 34468488.35655884, "ONDO": 3159107529, "ONE": 14574050917.262903, "ONG": 413854982.4414432, "ONT": 913697857, "OP": 1657120774, "ORBS": 3989676436, "ORCA": 59957275.298047, "ORDER": 252127507.64, "ORDI": 21000000, "OSMO": 726556648.443657, "OXT": 982294556.7979902, "PAAL": 886671542.2417741, "PARTI": 233000000, "PAWS": 0, "PAXG": 236916.94, "PEAQ": 781200479.594159, "PEIPEI": 420684354244576, "PELL": 0, "PENDLE": 162236498.52152926, "PENGU": 62860396090.04, "PEOPLE": 5060137334.7, "PEPE": 420689899653543.56, "PERP": 66002156.95, "PHA": 794065075.9944838, "PHB": 55828836.66938931, "PI": 7083629691.465515, "PIPPIN": 999996253, "PIRATE": 237813528, "PIXEL": 2893732401.66, "PLUME": 2000000000, "PNUT": 999852830.905148, "POL": 10420026100.802225, "POLYX": 957156482.094994, "PONKE": 555544226, "POPCAT": 979973184.6, "PORTAL": 521095546.2644047, "POWER": 0, "POWR": 560186455.852475, "PRCL": 412284457, "PRIME": 35773841, "PROM": 18250000, "PROMPT": 0, "PROS": 51394815, "PUFFER": 102306717, "PUMP": 285000000, "PUNDIX": 258386541.0999244, "PURR": 0, "PYR": 43119235.73105957, "PYTH": 3624987109.417167, "QI": 6729678219, "QKC": 7120346536, "QNT": 12072738, "QTUM": 105640495.5, "QUBIC": 117309893238683, "QUICK": 752159.00547067, "RACA": 410670371068.18915, "RAD": 51575978.89552598, "RARE": 834736442.8752108, "RATS": 624391545786, "RAY": 290286142.067794, "RDNT": 1216096869, "RED": 280000000, "REEF": 21015694229.94593, "REI": 950000000, "REN": 999330480.3618875, "RENDER": 517716590.05628264, "REQ": 844292691.4191633, "REX": 1950000000, "REZ": 2806183423.5928264, "RFC": 961550031, "RIF": 1000000000, "RLB": 2108451805.8933487, "RLC": 72382548.06525736, "ROAM": 292159742.920653, "RON": 654239687.9637812, "ROSE": 7064132681, "RPL": 21384675.27468185, "RSR": 57084685454, "RSS3": 778170448.5280361, "RUNE": 351529533, "RVN": 15138711381.094606, "S": 2880000000, "SAFE": 580281293, "SAGA": 245746931, "SAND": 2538289190.2233224, "SANTOS": 10646061.291549, "SATS": 2100000000000000, "SC": 56025636522.075195, "SCA": 104812998.7111812, "SCR": 190000000, "SCRT": 307605243.074288, "SD": 53284459.46051195, "SEI": 5107222222, "SEND": 48720041, "SERAPH": 202960848, "SFP": 500000000, "SHELL": 279666666.66666, "SHIB": 589249895320668.6, "SHM": 0, "SIGN": 1200000000, "SIREN": 731856696.0224442, "SKL": 5883602671, "SLERF": 499997750, "SLF": 97000000, "SLP": 41121390423, "SNT": 4000460675.3126316, "SNX": 339466216.9903987, "SOL": 519444468.3339317, "SOLO": 398796764.0825947, "SOLV": 1482600000, "SONIC": 0, "SOSO": 0, "SPEC": 14104697, "SPELL": 161224592899.49738, "SPX": 930993090.07, "SSV": 12367025.86698233, "STEEM": 512604539.328, "STG": 204338417.4544445, "STMX": 12351317703.942566, "STO": 225333333, "STORJ": 410215536.2299525, "STPT": 1942420283.027067, "STRK": 3107889969.936132, "STX": 1525526872.66563, "SUI": 3338327017.9116654, "SUN": 19250843152.547474, "SUNDOG": 997420606, "SUPER": 582543559.4169173, "SUPRA": 13798383070.5289, "SUSHI": 268627817.9659587, "SWARMS": 999984830, "SWEAT": 7067479692.85, "SWELL": 2209881925.060113, "SXP": 642914185.1777676, "SXT": 1400000000, "SYN": 184836770.9219507, "SYRUP": 1068156264.205664, "SYS": 814171883.0260185, "T": 10128333798.695452, "TAI": 691685195, "TAIKO": 103165315.91499485, "TAO": 8786270, "THE": 101442446.8892038, "THETA": 1000000000, "TIA": 632609672.331558, "TLM": 5803475172.4054, "TNSR": 381293155.90054375, "TOKEN": 1000019789, "TOMI": 1947520376.973507, "TON": 2490178577.117312, "TOSHI": 408069300000, "TRB": 2663297, "TREAT": 0, "TROY": 10000000000, "TRU": 1268323664.3459923, "TRUMP": 199999387.250405, "TRX": 94906230826.82272, "TST": 947323724.5800885, "TURBO": 69000000000, "TUT": 839087074.0260144, "TWT": 416649900, "ULTI": 5476666666, "UMA": 86713863.38378371, "UNFI": 9548650.10357291, "UNI": 628688836.71, "USDC": 60899537484.90792, "USTC": 5595108414.778393, "USUAL": 871874496.1863642, "UXLINK": 408956731, "VANA": 30084000, "VANRY": 1935871661.1807923, "VELO": 7390475595, "VET": 85985041177, "VIC": 120964381.15, "VIDT": 869770288, "VINE": 999994104, "VIRTUAL": 652595972.0632643, "VOXEL": 239702480.74096566, "VR": 6346850908.954846, "VRA": 9624357318, "VTHO": 89429117893, "VVV": 29932009.66863949, "W": 4576901000, "WAL": 1315416667, "WAVES": 117735544, "WAXL": 0, "WAXP": 4381148125.182045, "WCT": 186200000, "WEMIX": 420904448.1177949, "WEN": 727716951329, "WHY": 420000000000000, "WIF": 998840689.196437, "WING": 5000005.40998927, "WLD": 1385172468.0357203, "WOO": 1913169824.037396, "X": 690000000000, "XAI": 1420959219.5767226, "XCH": 13957509, "XCN": 33517791545, "XDC": 15708100608.45, "XEC": 19864207797583, "XEM": 8999999999, "XION": 33979088.01, "XLM": 31061793752.22428, "XMR": 18446744.07370955, "XNO": 133248297, "XRD": 10739234075.765902, "XRP": 58550454873, "XTER": 93969655, "XTZ": 1043172864.848264, "XVG": 16521951235.741348, "XVS": 16586837.0169662, "YFI": 33812.94698322, "YGG": 512925269.9781956, "ZBCN": 76965689315.09608, "ZCX": 628706003.357031, "ZEC": 15886821, "ZEN": 16020359.375, "ZENT": 7795743566.839713, "ZEREBRO": 999957009.501315, "ZETA": 828916667, "ZEUS": 999979348, "ZIL": 19492386409.216515, "ZK": 3675000000, "ZKJ": 292861111, "ZKL": 263988095, "ZOO": 470314210.3912121, "ZORA": 0, "ZRC": 1491598748, "ZRO": 110000000, "ZRX": 848396562.8973439 }
    //交易所
    const checkListEx = ref(
        ['Binance', 'Bitget', 'Bybit', 'Gate', 'Hyperliquid', 'OKX']
    )
    const { $device } = useNuxtApp();
    const isMobile = $device.isMobile;
    //处理前的列表
    const holdList0 = ref([])

    //处理后的列表
    const holdList = ref([])

    //筛选条件
    let oi = ref(5)
    let vol24 = ref(1)
    let aprPlus = ref(1)
    let aprUn = ref(1)
    const showMenu = ref(false) // 控制菜单显示状态
    //定时器
    let intervalId: number | null = null;  // 使用数字ID
    onMounted(() => {
        getBtable(); // 组件挂载时立即执行一次
        // 每隔 38.888 秒刷新数据
        intervalId = setInterval(() => {
            getBtable();
        }, 38888);
    });
    //离开时卸载
    onBeforeUnmount(() => {
        if (intervalId) {
            clearInterval(intervalId); // 组件卸载时清除定时器，避免内存泄漏
        }
    });
    // 切换菜单显示状态
    const toggleMenu = () => {
        showMenu.value = !showMenu.value
    }
    //排序方法
    // 排序方法，带筛选功能
    const sortJsonData = () => {
        let jsonData = holdList0.value;
        let coinSupply = coin_supply;
        let checkList = checkListEx.value;
        let oi_value = oi.value;
        let vol24_value = vol24.value;
        let aprPlus_value = aprPlus.value;
        let aprUn_value = aprUn.value;

        // 创建交易所顺序映射表
        const exchangeOrder = {};
        checkList.forEach((exchange, index) => {
            exchangeOrder[exchange] = index;
        });

        // 筛选：交易所匹配 + oi & volume_24h >= 阈值 + apr_funding 单独处理正负
        const filteredData = jsonData.filter(item =>
            checkList.includes(item.exchange) &&
            item.oi >= oi_value * 1_000_000 &&
            item.volume_24h >= vol24_value * 1_000_000 &&
            (
                (item.apr_funding > 0 && item.apr_funding > aprPlus_value / 100) ||
                (item.apr_funding < 0 && item.apr_funding < -aprUn_value / 100)
            )
        );

        // 计算市值并添加字段
        const dataWithMarketCap = filteredData.map(item => {
            const supply = coinSupply[item.coin] || 0;
            const marketCap = item.bid * supply;
            return { ...item, marketCap };
        });

        // 市值降序排序
        dataWithMarketCap.sort((a, b) => b.marketCap - a.marketCap);

        // 按 coin 分组
        const coinGroups = {};
        dataWithMarketCap.forEach(item => {
            if (!coinGroups[item.coin]) {
                coinGroups[item.coin] = [];
            }
            coinGroups[item.coin].push(item);
        });

        // 分组后，组内按交易所顺序排序
        let sortedData = [];
        Object.keys(coinGroups).forEach(coin => {
            const sortedGroup = coinGroups[coin].sort((a, b) => {
                return exchangeOrder[a.exchange] - exchangeOrder[b.exchange];
            });
            sortedData = sortedData.concat(sortedGroup);
        });

        // 设置结果
        holdList.value = sortedData;
    };





    //获取资金费率对比表
    const getBtable = async () => {
        try {
            let requestData = {};
            const res = await $fetch(_URL.fundingRate, {
                method: 'GET',
                query: requestData,  // 将参数传递到查询字符串中
            });
            if (res?.data) {
                holdList0.value = res.data.data;
                //去处理数据
                sortJsonData();
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    };
    //根据coin字段设置背景色

    function hashCoin(str: string): number {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 16777619) >>> 0; // 保证结果为正整数
        }
        return hash;
    }
    const bgClassList = [
        'coin-bg-17', 'coin-bg-4', 'coin-bg-10', 'coin-bg-2', 'coin-bg-15',
        'coin-bg-6', 'coin-bg-20', 'coin-bg-1', 'coin-bg-11', 'coin-bg-8',
        'coin-bg-13', 'coin-bg-18', 'coin-bg-5', 'coin-bg-14', 'coin-bg-19',
        'coin-bg-7', 'coin-bg-3', 'coin-bg-16', 'coin-bg-12', 'coin-bg-9',
    ];
    const tableRowClassName = ({ row }: { row: any }) => {
        const coin = row.coin || '';
        const hash = hashCoin(coin);
        const classIndex = hash % bgClassList.length;
        return bgClassList[classIndex];
    };
    const tableRowClassName2 = (row) => {
        const coin = row.coin || '';
        const hash = hashCoin(coin);
        const classIndex = hash % bgClassList.length;
        return bgClassList[classIndex];
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
    //转成以百万为单位的
    const formatNumberByUnit = (number, decimalPlaces = 2) => {
        if (typeof number !== 'number') {
            number = parseFloat(number);
        }

        if (isNaN(number)) {
            return '0';
        }

        const absNumber = Math.abs(number);
        const isNegative = number < 0;

        let unit = '';
        let value = 0;

        if (absNumber >= 1e9) { // 十亿级别
            value = number / 1e9;
            unit = 'B';
        } else { // 百万级别
            value = number / 1e6;
            unit = 'M';
        }

        // 格式化并移除末尾多余的0和小数点
        let formatted = value.toFixed(decimalPlaces);
        formatted = formatted.replace(/\.0+$|(\.\d*[1-9])0+$/, '$1');

        return (isNegative ? '-' : '') + formatted + ' ' + unit;
    }


    const formatPercentage = (number) => {
        if (typeof number !== 'number') {
            number = parseFloat(number);
        }

        if (isNaN(number)) {
            return '0.0%';
        }

        // 转换为百分比并保留1位小数
        const percentage = number * 100;
        const formatted = percentage.toFixed(1);

        // 处理可能的浮点数精度问题
        return formatted.replace(/\.0+$/, '.0') + '%';
    }


    const formatPercentageFour = (number) => {
        if (typeof number !== 'number') {
            number = parseFloat(number);
        }

        if (isNaN(number)) {
            return '0.0000%';
        }

        // 转换为百分比并保留4位小数
        const percentage = number * 100;
        const formatted = percentage.toFixed(4);

        return formatted + '%';
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
   
    .coin-bg-1 {
        background: linear-gradient(to right, rgba(255, 138, 128, 0.35), transparent) !important;
    }

    .coin-bg-2 {
        background: linear-gradient(to right, rgba(255, 202, 40, 0.35), transparent) !important;
    }

    .coin-bg-3 {
        background: linear-gradient(to right, rgba(255, 112, 67, 0.35), transparent) !important;
    }

    .coin-bg-4 {
        background: linear-gradient(to right, rgba(174, 213, 129, 0.35), transparent) !important;
    }

    .coin-bg-5 {
        background: linear-gradient(to right, rgba(129, 212, 250, 0.35), transparent) !important;
    }

    .coin-bg-6 {
        background: linear-gradient(to right, rgba(186, 104, 200, 0.35), transparent) !important;
    }

    .coin-bg-7 {
        background: linear-gradient(to right, rgba(255, 171, 145, 0.35), transparent) !important;
    }

    .coin-bg-8 {
        background: linear-gradient(to right, rgba(100, 181, 246, 0.35), transparent) !important;
    }

    .coin-bg-9 {
        background: linear-gradient(to right, rgba(77, 182, 172, 0.35), transparent) !important;
    }

    .coin-bg-10 {
        background: linear-gradient(to right, rgba(144, 164, 174, 0.35), transparent) !important;
    }

    .coin-bg-11 {
        background: linear-gradient(to right, rgba(240, 98, 146, 0.35), transparent) !important;
    }

    .coin-bg-12 {
        background: linear-gradient(to right, rgba(255, 213, 79, 0.35), transparent) !important;
    }

    .coin-bg-13 {
        background: linear-gradient(to right, rgba(149, 117, 205, 0.35), transparent) !important;
    }

    .coin-bg-14 {
        background: linear-gradient(to right, rgba(38, 166, 154, 0.35), transparent) !important;
    }

    .coin-bg-15 {
        background: linear-gradient(to right, rgba(255, 87, 34, 0.35), transparent) !important;
    }

    .coin-bg-16 {
        background: linear-gradient(to right, rgba(96, 125, 139, 0.35), transparent) !important;
    }

    .coin-bg-17 {
        background: linear-gradient(to right, rgba(255, 64, 129, 0.35), transparent) !important;
    }

    .coin-bg-18 {
        background: linear-gradient(to right, rgba(174, 234, 0, 0.35), transparent) !important;
    }

    .coin-bg-19 {
        background: linear-gradient(to right, rgba(0, 191, 165, 0.35), transparent) !important;
    }

    .coin-bg-20 {
        background: linear-gradient(to right, rgba(79, 195, 247, 0.35), transparent) !important;
    }

    .coin-bg-1:hover {
        background: linear-gradient(to right, rgba(255, 138, 128, 0.55), transparent) !important;
    }

    .coin-bg-2:hover {
        background: linear-gradient(to right, rgba(255, 202, 40, 0.55), transparent) !important;
    }

    .coin-bg-3:hover {
        background: linear-gradient(to right, rgba(255, 112, 67, 0.55), transparent) !important;
    }

    .coin-bg-4:hover {
        background: linear-gradient(to right, rgba(174, 213, 129, 0.55), transparent) !important;
    }

    .coin-bg-5:hover {
        background: linear-gradient(to right, rgba(129, 212, 250, 0.55), transparent) !important;
    }

    .coin-bg-6:hover {
        background: linear-gradient(to right, rgba(186, 104, 200, 0.55), transparent) !important;
    }

    .coin-bg-7:hover {
        background: linear-gradient(to right, rgba(255, 171, 145, 0.55), transparent) !important;
    }

    .coin-bg-8:hover {
        background: linear-gradient(to right, rgba(100, 181, 246, 0.55), transparent) !important;
    }

    .coin-bg-9:hover {
        background: linear-gradient(to right, rgba(77, 182, 172, 0.55), transparent) !important;
    }

    .coin-bg-10:hover {
        background: linear-gradient(to right, rgba(144, 164, 174, 0.55), transparent) !important;
    }

    .coin-bg-11:hover {
        background: linear-gradient(to right, rgba(240, 98, 146, 0.55), transparent) !important;
    }

    .coin-bg-12:hover {
        background: linear-gradient(to right, rgba(255, 213, 79, 0.55), transparent) !important;
    }

    .coin-bg-13:hover {
        background: linear-gradient(to right, rgba(149, 117, 205, 0.55), transparent) !important;
    }

    .coin-bg-14:hover {
        background: linear-gradient(to right, rgba(38, 166, 154, 0.55), transparent) !important;
    }

    .coin-bg-15:hover {
        background: linear-gradient(to right, rgba(255, 87, 34, 0.55), transparent) !important;
    }

    .coin-bg-16:hover {
        background: linear-gradient(to right, rgba(96, 125, 139, 0.55), transparent) !important;
    }

    .coin-bg-17:hover {
        background: linear-gradient(to right, rgba(255, 64, 129, 0.55), transparent) !important;
    }

    .coin-bg-18:hover {
        background: linear-gradient(to right, rgba(174, 234, 0, 0.55), transparent) !important;
    }

    .coin-bg-19:hover {
        background: linear-gradient(to right, rgba(0, 191, 165, 0.55), transparent) !important;
    }

    .coin-bg-20:hover {
        background: linear-gradient(to right, rgba(79, 195, 247, 0.55), transparent) !important;
    }
</style>
<style lang="scss" scoped>
    .whale {
        .mobile-menu {
            position: fixed;
            top: 0;
            right: -100%;
            width: 70%;
            height: 100vh;
            background: rgba(4, 56, 188, 0.95);
            transition: right 0.3s ease-in-out;
            z-index: 10001 !important;

            &.show {
                right: 0;
            }

            .menu-content {
                padding: 20px;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .close-icon {
                color: white;
                font-size: 24px;
                align-self: flex-end;
                cursor: pointer;
                margin-bottom: 30px;
            }

            .mobile-nav-item {
                color: white;
                font-size: 18px;
                text-decoration: none;
                padding: 15px 0;
                font-weight: 500;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);

                &:hover {
                    color: #afbee6;
                }
            }
        }



        .exlist {
            float: left;
            position: relative;
            top: 22px
        }

        .sliders {
            width: 100px;

        }

        .icons {
            width: 20px;
            height: 20px;
            border-radius: 20px;
            background-size: cover;
            float: left;
            position: relative;
            top: 1px;
            left: -8px;
            border: solid 2px rgba(255, 255, 255, 0.1);
        }

        .el-table {
            /* font-family: "Monda", Arial, sans-serif; */
            font-family: "Roboto Condensed", sans-serif;
            color: black;
            font-weight: bold !important;
            font-size: 16px;
        }

        .stit2 {
            font-size: 13px;
        }

        .maintitle {
            color: black;
            font-size: 18px;
        }

        .setGreen {
            color: rgb(7, 155, 7) !important;
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

        /* .selects:first-child {
        
        } */

        .selects {
            float: right;
            width: 130px;
            display: block;
        }

        .btable {
            border: solid 1px #dddfe5;
            margin-top: 20px;
            border-radius: 5px;
            overflow: hidden;
        }

        .cktitle {
            font-size: 13px;
            position: relative;
            left: -8px;
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



        @media (max-width: 1100px) {

            .nlt {
                padding: 1px 1px 1px 1px;
                word-wrap: break-word;
                /* 等同于 */
                overflow-wrap: break-word;
                border-bottom: solid 1px rgba(100, 100, 100, 0.1);
                font-size: 11px;
                border-right: solid 1px rgba(100, 100, 100, 0.2);

                line-height: 25px;
            }

            .nlt:last-child {
                border-right: none !important
            }

            .topBar {
                background: white;
                position: fixed;
                z-index: 9999;
            }

            .cktitle {
                color: white;
                left: -5px !important;
            }

            .icons {
                width: 21px;
                height: 21px;
                border-radius: 20px;
                background-size: cover;
                float: left;
                position: relative;
                top: 2px;
                left: 0px;
                border: solid 1px rgba(255, 255, 255, 0.1);
            }

            .mlistItem {
                /*  */
                /* border-bottom: solid 1px rgba(100, 100, 100, 0.1);  */
                font-family: "Roboto Condensed", sans-serif;

                /* padding:5px 0 5px 0; */
                .lt1 {
                    text-align: center;
                }

            }

            .mbtn {
                width: 50px;
                height: 50px;
                background: rgb(92, 128, 239);
                position: fixed;
                bottom: 80px;
                right: 20px;
                border-radius: 100px;
                color: white;
                text-align: center;
                line-height: 53px;
                box-shadow: 0 1px 2px 0 #3973ac;
            }

            .selects {
                width: 100% !important;
                height: 80px !important;
                display: block;
            }

            .sliders {
                /* 
                margin-left: 0 !important;
                margin-top: 10px; */
                width: 200px;
                margin-left: 10px;
                float: left;
                position: absolute;
            }

            .pcCtrl {
                display: none;
            }

            .mainBuild {
                width: 100%;
                display: block;
                padding: 60px 0px 0 0px !important;
            }

            .el-table {

                font-size: 15px !important;
            }

            .maintitle {

                font-size: 16px !important;
            }

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
                display: none;
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

            .ctrlRef {
                display: none;
            }
        }
    }
</style>