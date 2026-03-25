<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-date-picker
        v-model="listQuery.post_time_range"
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
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExport">导出</el-button>
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
      <el-table-column label="ID" prop="id" align="center" width="60px" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号 / 发帖时间" width="280px">
        <template slot-scope="{row}">
          <el-link :href="row.user_url" target="_blank" type="primary">{{ row.screen_name}}</el-link>
          <span>&nbsp;/&nbsp;</span>
          <el-link :href="row.tweet_url" target="_blank" type="primary">{{ row.created_at}}</el-link>&nbsp;
          <el-link v-if="row.screenshot_image" :href="row.screenshot_image" target="_blank" type="success" icon="el-icon-camera-solid"></el-link>&nbsp;
          <br/>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.tweet_type }}</span>
        </template>
      </el-table-column>
      <el-table-column label="推文">
        <template slot-scope="{row}">
          <el-container>
            <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
              <el-image v-if="row.media_url_https" :src="row.media_url_https"></el-image>
            </el-aside>
            <el-main>
              <span :title="row.full_text">{{row.full_text.substring(0,80)}}</span>
              <span v-if="row.full_text.length > 80"> ...</span>
              <br/>
              <el-tag type="success">{{'采集时间:' + row.last_crawl_time}}</el-tag>
            </el-main>
          </el-container>
        </template>
      </el-table-column>
      <el-table-column label="转-评-赞 - 浏览" width="200px">
        <template slot-scope="{row}">
          <span>{{ row.retweet_count + ' - ' + row.reply_count + ' - ' + row.favorite_count + ' - ' + row.views_count }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="推文链接" prop="urls">
          <el-input v-model="temp.urls" :autosize="{ minRows: 10, maxRows: 20}" type="textarea" placeholder="导入推文链接，一行一个" style="width:600px;" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          确定
        </el-button>
      </div>
    </el-dialog>
    
  </div>
</template>

<script>
import { fetchTweetList, addTweetUrls } from '@/api/twitter'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
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
        post_type: undefined,
        post_time_range: []
      },
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        urls: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'change' }],
        crawl_post_insights_switch: [{ required: true, message: 'is required', trigger: 'change' }]
      },
      downloadLoading: false,
      //cascader
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
      fetchTweetList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        urls: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          addTweetUrls(this.temp).then((res) => {
            this.dialogFormVisible = false
            this.$notify({
              title: '添加',
              message: res.msg,
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },
    handleExport() {
      let params = []
      for(let key in this.listQuery) {
        if (this.listQuery[key] !== undefined && this.listQuery[key] !== '') {
          if(key=='post_time_range' && this.listQuery[key]){
            params.push(`${key}=${JSON.stringify(this.listQuery[key])}`)
          }else{
            params.push(`${key}=${this.listQuery[key]}`)
          }
        }
      }
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/twitter/exportTweetList?${params.join('&')}`
      window.open(url, '_blank')
    }
  }
}
</script>
