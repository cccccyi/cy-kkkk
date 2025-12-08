<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.account_fid" placeholder="账号FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.available" clearable class="filter-item" placeholder="账号有效" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.loc" placeholder="Loc，模糊查询" clearable class="filter-item" style="width:150px" />&nbsp;
      <!-- <el-select v-model="listQuery.crawl_post_insights_switch" clearable class="filter-item" placeholder="帖子Insights">
          <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
        </el-select>&nbsp;  -->
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleUpload">导入</el-button>&nbsp;
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
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="60px" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="头像" width="80px">
        <template slot-scope="{row}">
          <el-image v-if="row.profile_pic_url" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_pic_url" ></el-image>
        </template>
      </el-table-column>
      <el-table-column label="账号">
        <template slot-scope="{row}">
          <el-link :href="row.account_url" target="_blank" type="primary">{{ row.account_name}}</el-link>&nbsp;
          <el-tag type="danger" v-if="row.available=='n'">存活：{{ row.available }}</el-tag>&nbsp;
          <!-- <el-tag type="info" v-if="row.crawl_account=='y'">{{'采集账号:' + row.a_available}}</el-tag> -->
        </template>
      </el-table-column>
      <el-table-column prop="account_fid" label="FID" />
      <el-table-column prop="loc" label="Loc" width="300px" />
      <el-table-column label="主页数">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleFetchPageList(row.account_fid)">{{ row.page_nums }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="last_crawl_manage_pages" label="采集主页列表" />
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="120px" style="width: 400px; margin-left:50px;">
        <el-form-item label="主页" prop="name">
          <el-input v-model="temp.name" type="input" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="帖子Insights" prop="crawl_post_insights_switch">
          <el-select v-model="temp.crawl_post_insights_switch" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form :inline="true">
          <el-form-item label="跟踪油管作者" prop="youtuber_name">
            <el-input v-model="temp.youtuber_name" placeholder="youtube指定账号" style="width:120px;" />
          </el-form-item>
          <el-form-item label="频道ID" prop="youtube_channel_id">
            <el-input v-model="temp.youtube_channel_id" placeholder="youtube频道ID" style="width:100px;" />
          </el-form-item>
        </el-form>
        <el-form-item label="主页发帖间隔" prop="post_interval">
          <el-input v-model="temp.post_interval" placeholder="主页发帖最小间隔" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="账号-管理主页列表">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序" width="50px" />
        <el-table-column label="图片" width="50px">
          <template slot-scope="{row}">
            <el-image v-if="row.profile_picture" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_picture" ></el-image>
          </template>
        </el-table-column>
        <el-table-column label="主页">
          <template slot-scope="{row}">
            <el-link :href="row.page_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
            <span>{{ row.page_fid }}</span>
          </template>
        </el-table-column>
        <el-table-column label="样式" width="100px">
          <template slot-scope="{row}">
            <span>{{ row.page_type }}</span>
          </template>
        </el-table-column>
        <el-table-column label="点赞/粉丝" width="120px">
          <template slot-scope="{row}">
            <span>{{ row.page_likers + ' / ' + row.follower_count }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Role采集" width="120px">
          <template slot-scope="{row}">
            <span>{{ row.last_crawl_roles_time }}</span>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="导入主页信息" :visible.sync="dialogUploadFormVisible">
      <div style="text-align:center;">
        <el-upload
          ref="uploadFile"
          drag
          action="http://221.120.163.66:38011/boost_interface/vue-element-admin/page/uploadPageAdminData"
          :multiple="false"
          :limit="1"
          accept=".xls, .xlsx"
          :auto-upload="false"
          :before-upload="beforeUpload"
          :on-success="uploadSuccess"
          :on-error="uploadError"
          :on-exceed="uploadExceed">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">只能上传xls/xlsx文件，且不超过10M，一次只能上传一个</div>
        </el-upload>
      </div>
      <div style="text-align: center;margin-top: 20px;">
        <el-link type="primary" href="http://221.120.163.66:38011/template/template_import_page_admin.xlsx">下载模板</el-link>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogUploadFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchPageAdminsList, fetchAccountPageList, updateManagePage } from '@/api/page'
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
        account_fid: undefined,
        available: 'y',
        loc: ''
      },
      keywordOptions: [],
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        id: undefined,
        name: '',
        crawl_post_insights_switch: '',
        youtuber_name: '',
        youtube_channel_id: '',
        post_interval: 43200
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
      dialogUploadFormVisible: false,
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
      this.list = []
      this.listLoading = true
      fetchPageAdminsList(this.listQuery).then(response => {
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
          updateManagePage(tempData).then(() => {
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
    handleDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
    },
    handleFetchPageList(account_fid) {
      this.listLoading = true
      fetchAccountPageList({ account_fid }).then(response => {
        this.pvData = response.data.items
        this.dialogPvVisible = true
        this.listLoading = false
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
      for (let key in this.listQuery) {
        if (this.listQuery[key] !== undefined && this.listQuery[key] !== '') {
          params.push(`${key}=${this.listQuery[key]}`)
        }
      }
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/page/exportPageAdminsList?${params.join('&')}`
      window.open(url, '_blank')
    },
    handleUpload() {
      if (this.$refs.uploadFile) {
        this.$refs.uploadFile.clearFiles()
      }
      this.dialogUploadFormVisible = true
    },
    // 点击按钮手动上传，会先触发beforeUpload，再执行上传
    submit() {
      this.$refs.uploadFile.submit()
    },
    // 文件上传前对文件类型、文件大小判断限制
    beforeUpload(file) {
      const { name, size } = file
      const index = name.lastIndexOf('.')
      // 判断文件名是否有后缀，没后缀文件错误
      if (index === -1) {
        this.$notify.error({
          title: '错误',
          message: '文件错误，请重新上传！'
        })
        return false
      }
      const fileType = name.substr(index + 1)
      const acceptFileTypes = ['xls', 'xlsx']
      // 判断文件类型
      if (!acceptFileTypes.includes(fileType)) {
        this.$notify.error({
          title: '错误',
          message: '文件类型错误，请重新上传！'
        })
        return false
      }
      // 判断文件大小
      if (size > 10 * 1024 * 1024) {
        this.$notify.error({
          title: '错误',
          message: '文件大小超过10M，请重新上传！'
        })
        return false
      }
      // 默认true
      return true
    },
    // 上传接口调取成功status为200
    uploadSuccess(res) {
      if (res.code === 20000) {
        // 文件上传成功
        this.$notify.success({
          title: '成功',
          message: res.msg,
          dangerouslyUseHTMLString: true
        })
      } else {
        this.uploadError()
      }
      this.dialogUploadFormVisible = false
    },
    // 文件上传失败
    uploadError() {
      this.$notify.error({
        title: '错误',
        message: '文件上传失败！'
      })
    },
    // 文件个数超过限制
    uploadExceed() {
      this.$notify.warning({
        title: '提示',
        message: '您已添加了一个文件，如需替换，请先删除已添加的文件！'
      })
    }
  }
}
</script>
