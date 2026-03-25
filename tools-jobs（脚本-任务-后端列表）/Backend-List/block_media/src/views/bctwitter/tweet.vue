<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.screen_name" placeholder="推文账号" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-input v-model="listQuery.reply_screen_name" placeholder="评论账号" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.reply_status" placeholder="评论状态" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
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
        end-placeholder="结束日期"
      />
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
      <el-table-column label="内容">
        <template slot-scope="{row}">
          <div>
            <span>账号：</span>
            <el-link :href="row.user_url" target="_blank" type="primary">{{ row.screen_name}}</el-link>
          </div>
          <div>
            <span>发布时间：</span>
            <el-link :href="row.tweet_url" target="_blank" type="primary">{{ row.created_at}}</el-link>&nbsp;
          </div>
          <div>
            <el-tag type="success">{{ '采集时间:' + row.crawl_time }}</el-tag>
          </div>
          <div>
            <span>类型：</span>
            <span>{{ row.tweet_type }}</span>
          </div>
          <div>
            <span>转-评-赞 - 浏览：</span>
            <span>{{ row.retweet_count + ' - ' + row.reply_count + ' - ' + row.favorite_count + ' - ' + row.views }}</span>
          </div>
          <div style="padding:2px;text-indent:20px;">
            <span>{{ row.full_text }}</span>
          </div>
          <el-image v-if="row.media_url_https" :src="row.media_url_https" style="width:200px;" />
        </template>
      </el-table-column>
      <el-table-column label="评论">
        <template slot-scope="{row}">
          <div v-if="row.reply_status" style="border-bottom:1px solid #eee;margin-bottom:10px;">
            <div>
              <el-tag :type="row.reply_status | statusFilter">{{ row.reply_status_str }}</el-tag>
            </div>
            <div>
              <span>评论账号：</span><span style="color:skyblue;">{{ row.reply_screen_name }}</span>
            </div>
            <div v-if="row.reply_tweet_post_time">
              <span>评论时间：</span>
              <el-link :href="row.reply_url" target="_blank" type="primary">{{ row.reply_tweet_post_time}}</el-link>&nbsp;
            </div>
            <div>
              <span>评论内容：</span>
              <span>{{ row.reply_tweet_text }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80px">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px">
        <el-form-item label="评论" prop="reply_tweet_text">
          <el-input v-model="temp.reply_tweet_text" :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="内容" />
        </el-form-item>
        <el-form-item label="状态" prop="reply_status">
          <el-select v-model="temp.reply_status" class="filter-item" placeholder="请选择">
            <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchCralewrTweetList, updateTweetReplyInfo } from '@/api/bctwitter'
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
        n: 'danger',
        i: 'info',
        r: 'danger',
        s: 'success',
        c: 'danger'
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
        screen_name: '',
        reply_screen_name: 'hashnewsHK',
        reply_status: '',
        post_time_range: []
      },
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        r_id: '',
        reply_status: '',
        reply_tweet_text: ''
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
      // cascader
      cascader_value: [],
      cascader_options: [],
      statusOptions: [
        { id: 'i', label: '初始状态' },
        { id: 'r', label: '正在执行' },
        { id: 's', label: '执行成功' },
        { id: 'c', label: '终止状态' }
      ]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchCralewrTweetList(this.listQuery).then(response => {
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
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.dialogLoading = false
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.dialogLoading = true
          const tempData = Object.assign({}, this.temp)
          updateTweetReplyInfo(tempData).then((data) => {
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
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
