<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.group_fid" placeholder="群组FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-input v-model="listQuery.user_fid" placeholder="账号FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.is_permeation" clearable class="filter-item" placeholder="渗透状态" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleUpload">导入</el-button>&nbsp;
      <!-- <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExport">导出</el-button>&nbsp; -->
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
      <el-table-column label="ID" prop="id" align="center" width="60px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="群组">
        <template slot-scope="{row}">
          <el-link :href="row.page_url" target="_blank" type="primary">{{ row.group_name}}</el-link>&nbsp;
          <!-- <el-tag type="success" v-if="row.page_available=='n'">存活：{{ row.group_available }}</el-tag>&nbsp; -->
        </template>
      </el-table-column>
      <el-table-column label="账号">
        <template slot-scope="{row}">
          <span>{{ row.user_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="链接" width="350">
        <template slot-scope="{row}">
          <el-link :href="'https://www.facebook.com/groups/' + row.group_fid + '/user/' + row.user_fid" target="_blank" type="primary">{{ '/groups/' + row.group_fid + '/user/' + row.user_fid }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="渗透状态" width="100">
        <template slot-scope="{row}">
          <span>{{ row.is_permeation }}</span>
        </template>
      </el-table-column>
      <el-table-column label="帖子数" width="100">
        <template slot-scope="{row}">
          <span>{{ row.post_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集时间" prop="last_crawl_time" width="180">
        <template slot-scope="{row}">
          <span>{{ row.last_update_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <!-- <span class="link-type" @click="handleRestCrawltime(row.page_fid)">重置</span>&nbsp; -->
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog title="导入 群组-用户 信息" :visible.sync="dialogUploadFormVisible">
      <div style="text-align:center;">
        <el-upload
          ref="uploadFile"
          drag
          action="http://221.120.163.66:38011/boost_interface/vue-element-admin/group/uploadGroupData"
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogUploadFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchGroupUserList } from '@/api/group'
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
        account_fid: undefined,
        is_permeation: undefined,
      },
      availableOptions: ['y', 'n'],
      projectOptions: [],
      categoryOptions: [],
      showReviewer: false,
      temp: {
        id: undefined,
        group_fid: '',
        account_fid: ''
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
      dialogUploadFormVisible: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.list = []
      this.listLoading = true
      fetchGroupUserList(this.listQuery).then(response => {
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
      let sort = ''
      if (order === 'ascending') {
        sort = '+'
      } else {
        sort = '-'
      }
      this.listQuery.sort = `${sort}${prop}`
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
    handleRestCrawltime(pageFid){
      this.listLoading = true
      resetPageCrawltime({page_fid:pageFid}).then(response => {
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
    handleFetchPageRoleList(page_fid) {
      this.listLoading = true
      fetchPageRoleList({page_fid}).then(response => {
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
    handleUpload() {
      if(this.$refs.uploadFile) {
        this.$refs.uploadFile.clearFiles()
      }
      this.dialogUploadFormVisible = true
    },
    //点击按钮手动上传，会先触发beforeUpload，再执行上传
    submit() {
      this.$refs.uploadFile.submit();
    },
    //文件上传前对文件类型、文件大小判断限制
    beforeUpload(file) {
      const { name, size } = file;
      const index = name.lastIndexOf('.');
      //判断文件名是否有后缀，没后缀文件错误
      if(index === -1) {
        this.$notify.error({
          title: '错误',
          message: '文件错误，请重新上传！',
        });
        return false;
      }
      const fileType = name.substr(index + 1);
      const acceptFileTypes = ['xls', 'xlsx'];
      //判断文件类型
      if(!acceptFileTypes.includes(fileType)) {
        this.$notify.error({
          title: '错误',
          message: '文件类型错误，请重新上传！',
        });
        return false;
      }
      //判断文件大小
      if(size > 10*1024*1024) {
        this.$notify.error({
          title: '错误',
          message: '文件大小超过10M，请重新上传！',
        });
        return false;
      }
      //默认true
      return true;
    },
    //上传接口调取成功status为200
    uploadSuccess(res) {
      if(res.code === 20000) {  // 文件上传成功
        this.$notify.success({
          title:'成功',
          message: res.msg,
          dangerouslyUseHTMLString: true
        });
        this.getList();
      } else {
        this.uploadError();
      }
      this.dialogUploadFormVisible = false
    },
    //文件上传失败
    uploadError() {
      this.$notify.error({
        title: '错误',
        message: '文件上传失败！',
      });
    },
    //文件个数超过限制
    uploadExceed() {
      this.$notify.warning({
        title:'提示',
        message: '您已添加了一个文件，如需替换，请先删除已添加的文件！',
      });
    },
    handleExport() {
      let params = []
      for(let key in this.listQuery) {
        if (this.listQuery[key] !== undefined && this.listQuery[key] !== '') {
          params.push(`${key}=${this.listQuery[key]}`)
        }
      }
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/page/exportManagePagesList?${params.join('&')}`
      window.open(url, '_blank')
    },
    handleExportDetail() {
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/page/exportManagePagesDetailList`
      window.open(url, '_blank')
    }
  }
}
</script>
