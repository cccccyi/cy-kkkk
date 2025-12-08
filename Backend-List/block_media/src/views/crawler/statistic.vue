<template>
  <div class="app-container">
    <div class="filter-container">
      <el-date-picker
        v-model="time_range"
        type="daterange"
        format="yyyy-MM-dd HH:mm:ss"
        value-format="yyyy-MM-dd HH:mm:ss"
        editable
        clearable 
        class="filter-item"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期">
      </el-date-picker>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">刷新</el-button>&nbsp;
    </div>

    <el-descriptions title="未去重统计" :column="1" border style="width:80%">
      <el-descriptions-item 
        v-for="item in data.not_deduplicated"
        :key="item.id"
        :label="item.subtype" 
        label-class-name="my-label" 
        content-class-name="my-content">{{item.num}}</el-descriptions-item>
    </el-descriptions>
    <br/>
    <el-descriptions title="去重统计" :column="1" border style="width:80%">
      <el-descriptions-item 
        v-for="item in data.deduplicated"
        :key="item.id"
        :label="item.subtype" 
        label-class-name="my-label" 
        content-class-name="my-content">{{item.num}}</el-descriptions-item>
    </el-descriptions>
    <br/>
    <h3>分站点成功率统计</h3>
    <el-table :data="data.history" border fit highlight-current-row style="width: 100%" class="defaultFont">
      <el-table-column prop="index" label="序" width="50px" />
      <el-table-column label="站点">
        <template slot-scope="{row}">
          <span>{{ row.label }}</span>
        </template>
      </el-table-column>
      <el-table-column label="成功数">
        <template slot-scope="{row}">
          <span>{{ row.success }}</span>
        </template>
      </el-table-column>
      <el-table-column label="失败数">
        <template slot-scope="{row}">
          <span>{{ row.fail }}</span>
        </template>
      </el-table-column>
      <el-table-column label="成功率">
        <template slot-scope="{row}">
          <span>{{ row.rate }}</span>
        </template>
      </el-table-column>
    </el-table>

  </div>
</template>

<script>
import { statisticInfo } from '@/api/crawler'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'

export default {
  name: 'ComplexTable',
  directives: { waves },
  data() {
    return {
      time_range: '',
      data: {}
    }
  },
  created() {
    const date = new Date(); 
    const end_date = date.toLocaleDateString().replace(/\//g, '-');
    const lastWeek = date.getDate() - 1
    date.setDate(lastWeek)
    const start_date = date.toLocaleDateString().replace(/\//g, '-');
    this.time_range = [`${start_date} 00:00:00`, `${end_date} 00:00:00`]
    this.getData()
  },
  methods: {
    showFullLoading() {
      this.fullLoading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
    },
    colseFullLoading() {
      this.fullLoading.close()
    },
    getData() {
      this.showFullLoading()
      statisticInfo({time_range: this.time_range}).then(response => {
        this.data = response.data
        this.colseFullLoading()
      })
    },
    handleFilter() {
      this.getData()
    }
  }
}
</script>
