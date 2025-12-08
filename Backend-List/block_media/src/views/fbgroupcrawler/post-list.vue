<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.group_fid" placeholder="群组FID多个以逗号，分隔" clearable class="filter-item" style="width:210px" />&nbsp;
      <el-input v-model="listQuery.post_fids" placeholder="帖子FID多个以逗号，分隔" clearable class="filter-item" style="width:210px" />&nbsp;
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
      <el-select v-model="listQuery.post_available" clearable class="filter-item" placeholder="帖子状态" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.crawl_flag" clearable class="filter-item" placeholder="采集状态" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <br/>
      <el-input v-model="listQuery.external_urls" placeholder="分享链接标记多个以逗号，分隔" clearable class="filter-item" style="margin-right:200px;width:300px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleResetCrawlStatus">重置采集</el-button>&nbsp;
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
      <el-table-column label="群组 / 账号 / 发帖时间" width="400px">
        <template slot-scope="{row}">
          <el-link :href="row.group_url" target="_blank" type="primary">{{ row.group_name}}</el-link>
          <span>&nbsp;/&nbsp;</span>
          <el-link :href="row.user_url" target="_blank" type="primary">{{ row.user_name}}</el-link>
          <span>&nbsp;/&nbsp;</span>
          <el-link :href="row.post_url" target="_blank" type="primary">{{ row.post_time}}</el-link>&nbsp;
          <el-link v-if="row.screenshot_image" :href="row.screenshot_image" target="_blank" type="success" icon="el-icon-camera-solid"></el-link>&nbsp;
          <br/>
          <el-tag type="danger" v-if="row.external_url">
            分享链接：
            <el-link :href="row.external_url" target="_blank" type="primary">{{ row.external_url_flag}}</el-link>
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="贴文">
        <template slot-scope="{row}">
          <el-container>
            <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
              <el-image v-if="row.image_in_content" :src="row.image_in_content"></el-image>
            </el-aside>
            <el-main>
              <span :title="row.post_content">{{row.post_content.substring(0,30)}}</span>
              <span v-if="row.post_content.length > 30"> ...</span>
              <br/>
              <el-tag type="success">{{'采集时间:' + row.last_update_time}}</el-tag>
            </el-main>
          </el-container>
        </template>
      </el-table-column>
      <el-table-column label="有效" width="60px">
        <template slot-scope="{row}">
          <span>{{row.post_available}}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集" width="60px">
        <template slot-scope="{row}">
          <span>{{row.crawl_flag}}</span>
        </template>
      </el-table-column>
      <el-table-column label="转-评-表情 - 赞/爱/笑/哇/伤/怒/心" width="240px">
        <template slot-scope="{row}">
          <span>{{ row.forward_count + ' - ' + row.reply_count + ' - ' + row.emotion_count + ' - ' + row.praise_count + ' / ' + row.love_count + ' / ' + row.laugh_count + ' / ' + row.wow_count + ' / ' + row.sad_count + ' / ' + row.angry_count + ' / ' + row.care_count }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

      <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="帖子FID" prop="fids">
          <el-input v-model="temp.fids" :autosize="{ minRows: 10, maxRows: 20}" type="textarea" placeholder="添加帖子FID，一行一个" style="width:600px;" />
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
import { fetchGroupPostList, addPostByFids, resetGroupPostCrawl } from '@/api/group'
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
        group_fid: undefined,
        post_fids: undefined,
        post_time_range: [],
        post_available: undefined,
        crawl_flag: undefined,
        external_urls: undefined
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
      this.list = []
      fetchGroupPostList(this.listQuery).then(response => {
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
    }
  }
}
</script>
