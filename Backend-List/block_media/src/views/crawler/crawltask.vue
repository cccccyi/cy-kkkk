<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">刷新</el-button>&nbsp;
    </div>
    <el-divider content-position="left">Facebook采集任务</el-divider>
    <el-descriptions :column="2" border style="width:60%">
      <template v-for="item in data.fb_crawl_task">
        <el-descriptions-item 
          :key="item.available"
          :label="item.project_name" 
          labelStyle="width:120px"
          label-class-name="my-label" 
          content-class-name="my-content">
          {{item.available_label}}
        </el-descriptions-item>
        <el-descriptions-item 
          :key="item.status"
          :label="item.label" 
          labelStyle="width:120px"
          label-class-name="my-label" 
          content-class-name="my-content">
          {{item.num}}
        </el-descriptions-item>
      </template>
    </el-descriptions>

    <el-divider content-position="left">Instagram采集任务</el-divider>
    <el-descriptions :column="2" border style="width:60%">
      <template v-for="item in data.ins_crawl_task">
        <el-descriptions-item 
          :key="item.available"
          :label="item.project_name" 
          labelStyle="width:120px"
          label-class-name="my-label" 
          content-class-name="my-content">
          {{item.available_label}}
        </el-descriptions-item>
        <el-descriptions-item 
          :key="item.status"
          :label="item.label" 
          labelStyle="width:120px"
          label-class-name="my-label" 
          content-class-name="my-content">
          {{item.num}}
        </el-descriptions-item>
      </template>
    </el-descriptions>

    <el-divider content-position="left">群发帖检测任务</el-divider>
    <el-descriptions :column="1" border style="width:60%">
      <el-descriptions-item 
        v-for="item in data.permeation_post_detect"
        :key="item.status"
        :label="item.label" 
        labelStyle="width:120px"
        label-class-name="my-label" 
        content-class-name="my-content">
        {{item.num}}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider content-position="left">群发帖指定帖子采集任务</el-divider>
    <el-descriptions :column="1" border style="width:60%">
      <el-descriptions-item 
        v-for="item in data.permeation_post_info"
        :key="item.status"
        :label="item.label" 
        labelStyle="width:120px"
        label-class-name="my-label" 
        content-class-name="my-content">
        {{item.num}}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider content-position="left">Facebook入群检测任务</el-divider>
    <el-descriptions :column="1" border style="width:60%">
      <el-descriptions-item 
        v-for="item in data.permeation_join_group"
        :key="item.status"
        :label="item.label" 
        labelStyle="width:120px"
        label-class-name="my-label" 
        content-class-name="my-content">
        {{item.num}}
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script>
import { crawlTaskStatistic } from '@/api/crawler'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'

export default {
  name: 'ComplexTable',
  directives: { waves },
  data() {
    return {
      data: {}
    }
  },
  created() {
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
      crawlTaskStatistic().then(response => {
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
