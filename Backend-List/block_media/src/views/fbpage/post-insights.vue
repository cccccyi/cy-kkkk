<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.page_fid" placeholder="主页FID多个以逗号，分隔" clearable class="filter-item" style="width:240px" />&nbsp;
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
          <span  @click="handleUpdate(row, $index)" style="color:skyblue;cursor:pointer;">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="主页 / 发帖时间" width="250px">
        <template slot-scope="{row}">
          <el-link :href="row.page_url" target="_blank" type="primary">{{ row.name}}</el-link>
          <span>&nbsp;/&nbsp;</span>
          <el-link :href="row.post_url" target="_blank" type="primary">{{ row.post_time}}</el-link>&nbsp;
          <el-link v-if="row.screenshot_image" :href="row.screenshot_image" target="_blank" type="success" icon="el-icon-camera-solid"></el-link>&nbsp;
          <br/>
          <el-tag type="success" v-if="row.share_switch=='y'">{{'帖子扩散:' + row.share_switch}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="贴文">
        <template slot-scope="{row}">
          <el-container>
            <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
              <el-image v-if="row.picture" :src="row.picture"></el-image>
            </el-aside>
            <el-main>
              <span :title="row.message">{{row.message.substring(0,30)}}</span>
              <span v-if="row.message.length > 30"> ...</span>
              <br/>
              <el-tag type="success">{{'采集时间:' + row.last_update_time}}</el-tag>
            </el-main>
            <el-aside width="60px" v-if="row.screenshot_image" style="background:#fff;padding:0;margin:0;display:flex;flex-direction:column;justify-content:center;">
              <el-image :src="row.screenshot_image" :preview-src-list="[row.screenshot_image]"></el-image>
              <div style="text-align:center;"><span class="link-type" @click="handleDeletePostScreenshot(row.post_fid)">删除</span></div>
            </el-aside>
          </el-container>
        </template>
      </el-table-column>
      <el-table-column label="呈现-触及-交互-赞/评/转/点" width="200px">
        <template slot-scope="{row}">
          <span>{{ row.post_impression + ' - ' + row.post_reach + ' - ' + row.post_engagement + ' - ' + row.post_reactions + ' / ' + row.post_comments + ' / ' + row.post_shares + ' / ' + row.post_total_clicks }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="120px" style="width: 400px; margin-left:50px;">
        <el-form-item label="帖子FID" prop="post_fid">
          <el-input v-model="temp.post_fid" type="input" readonly />
        </el-form-item>
        <el-form-item label="帖子扩散" prop="share_switch">
          <el-select v-model="temp.share_switch" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
          </el-select>
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

    <el-dialog :visible.sync="dialogPvVisible" title="群组渗透记录">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序号" width="50px" />
        <el-table-column prop="identity" label="账号FID" />
        <el-table-column prop="use_type" label="类型" />
        <el-table-column prop="browser_dir" label="浏览器" />
        <el-table-column prop="available" label="有效" width="50px" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchPostInsightsList, updatePagePost, deletePostScreenshot } from '@/api/page'
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
        page_fid: undefined,
        post_time_range: []
      },
      keywordOptions: [],
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        id: undefined,
        name: '',
        crawl_post_insights_switch: ''
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
      fetchPostInsightsList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
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
        id: undefined,
        text: '',
        project: '',
        category: 'common',
        available: 'y'
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
            createTextCorpus(this.temp).then(() => {
            this.temp.last_update_time = new Date()
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.cascader_value = [this.temp['project'], this.temp['category']]
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          updatePagePost(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜，记录更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDeletePostScreenshot(postFid) {
      this.listLoading = true
      deletePostScreenshot({post_fid:postFid}).then(response => {
        this.listLoading = false
        this.getList()
      })
    },
    handleDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
    },
    handleFetchPv(identity) {
      fetchPv(identity).then(response => {
        this.pvData = response.data.items
        this.dialogPvVisible = true
      })
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['timestamp', 'title', 'type', 'importance', 'status']
        const filterVal = ['timestamp', 'title', 'type', 'importance', 'status']
        const data = this.formatJson(filterVal)
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'table-list'
        })
        this.downloadLoading = false
      })
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },
    cascaderHandleChange(value) {
      this.listQuery.project = value[0]
      this.listQuery.category = value[1]
      this.temp.project = value[0]
      this.temp.category = value[1]
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
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/page/exportPostInsightsList?${params.join('&')}`
      window.open(url, '_blank')
    }
  }
}
</script>
