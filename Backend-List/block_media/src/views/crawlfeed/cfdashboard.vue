<template>
  <div class="dashboard-editor-container">
    <panel-group @handleSetLineChartData="handleSetLineChartData" />
    <el-row style="background:#fff;padding:6px 6px 0;margin-bottom:32px;">
      <el-col :span="8">
        <h3>采集账号分布</h3>
        <el-table :data="accountLocData" border fit highlight-current-row style="width: 100%" class="defaultFont">
          <el-table-column prop="index" label="序" width="50px" />
          <el-table-column label="站点">
            <template slot-scope="{row}">
              <span>{{ row.loc }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效数">
            <template slot-scope="{row}">
              <span>{{ row.available_count }}</span>
            </template>
          </el-table-column>
          <el-table-column label="验证数">
            <template slot-scope="{row}">
              <span>{{ row.not_available_count }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
      <el-col :span="16"><line-chart-post /></el-col>
    </el-row>
    <el-row style="background:#fff;padding:6px 6px 0;margin-bottom:32px;">
      
    </el-row>
  </div>
</template>

<script>
import { fetchAccountLocDataList } from '@/api/crawlfeed'
import GithubCorner from '@/components/GithubCorner'
import PanelGroup from './components/PanelGroup'
import LineChartPost from './components/LineChartPost'

export default {
  name: 'DashboardAdmin',
  components: {
    GithubCorner,
    PanelGroup,
    LineChartPost
  },
  data() {
    return {
      accountLocData: []
    }
  },
  created() {
    this.getData()
  },
  methods: {
    getData(){
      fetchAccountLocDataList().then(response => {
        this.accountLocData = response.data.items
      })
    },
    handleSetLineChartData(type) {
      
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .github-corner {
    position: absolute;
    top: 0px;
    border: 0;
    right: 0;
  }

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

@media (max-width:1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
