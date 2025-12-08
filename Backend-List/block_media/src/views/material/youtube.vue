<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.channel_id" placeholder="频道ID" clearable class="filter-item" style="width:120px" />&nbsp;
      <!-- <el-select v-model="listQuery.fb_post_flag" placeholder="已发帖" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp; -->
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExport">导出</el-button>&nbsp;
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      class="defaultFont"
      @sort-change="sortChange"
    >
      <el-table-column label="ID" align="center" width="60px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="频道ID" width="150px">
        <template slot-scope="{row}">
          <span>{{ row.channel_id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发帖时间" width="120px">
        <template slot-scope="{row}">
          <span>{{ row.published_time_text }}</span>
        </template>
      </el-table-column>
      <el-table-column label="视频截图" width="100px">
        <template slot-scope="{row}">
          <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
              <el-image v-if="row.pic" :src="row.pic" referrerPolicy="no-referrer"></el-image>
              <!-- <img :src="row.pic" referrer="no-referrer"> -->
          </el-aside>
        </template>
      </el-table-column>
      <el-table-column label="文本">
        <template slot-scope="{row}">
          <span>{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="是否下载" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.down_flag }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="是否发帖" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.fb_post_flag }}</span>
        </template>
      </el-table-column>
      <el-table-column label="FB帖子" width="160px">
        <template slot-scope="{row}">
          <el-link v-if="row.post_fid" :href="`https://www.facebook.com/${row.post_fid}`" target="_blank">{{row.post_fid}}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <span class="link-type" @click="handlePostStatus(row.id, 'y')">已发帖</span>&nbsp;|&nbsp;
          <span class="link-type" @click="handlePostStatus(row.id, 'n')">未发帖</span>
        </template>
      </el-table-column> -->
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

  </div>
</template>

<script>
import { fetchYoutubeVideos } from '@/api/material'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        y: 'success',
        n: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 50,
        channel_id: undefined,
        fb_post_flag: undefined
      },
      availableOptions: ['y', 'n', 'p'],
      showReviewer: false,
      temp: {
        id: undefined,
        screen_name: '',
        project: '',
        category: '',
        available: 'y'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新建'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        screen_name: [{ required: true, message: '目标账号名', trigger: 'blur' }],
        project: [{ required: true, message: '选择所属项目', trigger: 'change' }],
        available: [{ required: true, message: '是否可用,有效', trigger: 'change' }]
      },
      downloadLoading: false,
      // cascader
      cascader_value_query: [],
      cascader_value: [],
      cascader_options: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchYoutubeVideos(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleExport() {
      const params = []
      for (const key in this.listQuery) {
        if (this.listQuery[key] !== undefined && this.listQuery[key] !== '') {
          params.push(`${key}=${this.listQuery[key]}`)
        }
      }
      const url = `http://161.117.55.73:8011/boost_interface/vue-element-admin/material/exportYoutubeVideos?${params.join('&')}`
      window.open(url, '_blank')
    },
  }
}
</script>
