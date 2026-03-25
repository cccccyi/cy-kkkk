<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.title" placeholder="文本内容" clearable class="filter-item" style="width:180px" />&nbsp;
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
        end-placeholder="结束日期"/>&nbsp;
      <!-- <br/> -->
      <!-- <el-input v-model="listQuery.external_urls" placeholder="分享链接标记多个以逗号，分隔" clearable class="filter-item" style="margin-right:200px;width:300px" />&nbsp; -->
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <!-- <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp; -->
      <!-- <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleResetCrawlStatus">重置采集</el-button>&nbsp; -->
      <!-- <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExport">导出</el-button> -->
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
      <el-table-column label="账号" width="200px">
        <template slot-scope="{row}">
          <div style="display:flex;align-items:center;">
            <div style="width:40px;">
              <el-image v-if="row.avatar" :src="row.avatar" referrer-policy="no-referrer" style="width:40px;border-radius:20px;" />
            </div>
          </div>
          <el-link :href="row.user_url" target="_blank" type="primary">{{ row.nickname}}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="标题描述">
        <template slot-scope="{row}">
          <el-container>
            <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
              <el-image v-if="row.video_cover" :src="row.video_cover" :preview-src-list="[row.video_cover]"></el-image>
            </el-aside>
            <el-main>
              <div>标题： {{row.title}}</div>
              <div>描述： {{row.des}}</div>
              <br/>
            </el-main>
          </el-container>
        </template>
      </el-table-column>
      <el-table-column label="发帖时间" width="160px">
        <template slot-scope="{row}">
          <el-link :href="row.aweme_url" target="_blank" type="primary">{{ row.post_time}}</el-link>&nbsp;
        </template>
      </el-table-column>
      <el-table-column label="点赞-分享-评论" width="180px">
        <template slot-scope="{row}">
          <span>{{ row.liked_count + ' - ' + row.share_count + ' - ' }}</span>
          <span class="link-type" @click="handleFetchCommentList(row.aweme_id)">{{ row.comment_count }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :visible.sync="dialogCommentVisible" title="评论列表" width="880px">
      <el-table :data="commentData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="id" label="序" width="50px" />
        <el-table-column label="头像" width="50px">
          <template slot-scope="{row}">
            <el-image v-if="row.avatar" style="width:25px;height:25px;vertical-align:middle;" :src="row.avatar" ></el-image>
          </template>
        </el-table-column>
        <el-table-column label="账号" width="150px">
          <template slot-scope="{row}">
            <el-link :href="row.user_url" target="_blank" type="primary">{{ row.nickname}}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论" />
        <el-table-column label="点赞-评论" width="120px">
          <template slot-scope="{row}">
            <span>{{ row.like_count + ' - ' + row.sub_comment_count }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="post_time" label="时间" width="150px" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogCommentVisible = false">确定</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { fetchPostList, fetchCommentList, resetGroupPostCrawl } from '@/api/douyin'
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
        title: undefined,
        post_time_range: []
      },
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        fids: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
      dialogCommentVisible: false,
      commentData: [],
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'change' }],
        crawl_post_insights_switch: [{ required: true, message: 'is required', trigger: 'change' }]
      },
      downloadLoading: false,
      // cascader
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
      this.list = []
      fetchPostList(this.listQuery).then(response => {
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
        fids: ''
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
          addPostByFids(this.temp).then((res) => {
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
    handleResetCrawlStatus() {
      if(this.listQuery.post_time_range.length == 0){
        this.$notify({
          title: '提示',
          message: "需要添加条件搜索，防止重置记录太多...",
          type: 'info',
          duration: 2000
        })
      }else{
        this.listLoading = true
        resetGroupPostCrawl(this.listQuery).then(res => {
          this.listLoading = false
          this.$notify({
              title: '重置采集状态',
              message: res.msg,
              type: 'success',
              duration: 2000
            })
        })
      }
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
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/group/exportGroupPostList?${params.join('&')}`
      window.open(url, '_blank')
    },
    handleFetchCommentList(aweme_id) {
      this.listLoading = true
      fetchCommentList({ aweme_id }).then(response => {
        this.commentData = response.data.items
        this.dialogCommentVisible = true
        this.listLoading = false
      })
    },
  }
}
</script>
