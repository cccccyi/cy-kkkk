<template>
  <div class="dashboard-editor-container">
    <panel-group @handleSetLineChartData="handleSetLineChartData" />
    <el-row style="background:#fff;padding:6px 6px 0;margin-bottom:32px;">
      <el-col :span="8"><group-area-pie-chart /></el-col>
      <el-col :span="8"><bar-chart /></el-col>
      <el-col :span="8"><group-box-card /></el-col>
    </el-row>
    <el-row style="background:#fff;padding:6px 6px 0;margin-bottom:32px;">
      <el-col :span="8"><page-follower-bar-chart /></el-col>
      <el-col :span="8"><friend-area-pie-chart /></el-col>
      <el-col :span="8"><friend-count-bar-chart /></el-col>
    </el-row>
  </div>
</template>

<script>
import GithubCorner from '@/components/GithubCorner'
import PanelGroup from './components/PanelGroup'
import LineChart from './components/LineChart'
import RaddarChart from './components/RaddarChart'
import GroupAreaPieChart from './components/GroupAreaPieChart'
import FriendAreaPieChart from './components/FriendAreaPieChart'
import BarChart from './components/BarChart'
import PageFollowerBarChart from './components/PageFollowerBarChart'
import FriendCountBarChart from './components/FriendCountBarChart'
import TransactionTable from './components/TransactionTable'
import TodoList from './components/TodoList'
import BoxCard from './components/BoxCard'
import GroupBoxCard from './components/GroupBoxCard'

export default {
  name: 'DashboardAdmin',
  components: {
    GithubCorner,
    PanelGroup,
    LineChart,
    RaddarChart,
    GroupAreaPieChart,
    FriendAreaPieChart,
    BarChart,
    PageFollowerBarChart,
    FriendCountBarChart,
    TransactionTable,
    TodoList,
    BoxCard,
    GroupBoxCard
  },
  data() {
    return {
      
    }
  },
  created() {
    this.getData()
  },
  methods: {
    getData(){
      
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
