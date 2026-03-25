<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="主页名称" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-input v-model="listQuery.page_fid" placeholder="主页FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.page_available" clearable class="filter-item" placeholder="主页有效" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.crawl_post_insights_switch" clearable class="filter-item" placeholder="帖子截图" style="width:120px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.copy_flag" clearable class="filter-item" placeholder="仿号" style="width:120px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.belong_project" clearable class="filter-item" placeholder="所属项目" style="width:120px">
        <el-option v-for="item in projectOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.belong_category" clearable class="filter-item" placeholder="主页类型" style="width:120px">
        <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.admin_count" placeholder="管理员数" clearable class="filter-item" style="width:100px" />&nbsp;
      <el-input v-model="listQuery.vcman_admin_count" placeholder="Vcman号数" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleUpload">导入</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExport">导出</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExportDetail">导出详情</el-button>&nbsp;
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
      <el-table-column label="主页">
        <template slot-scope="{row}">
          <el-link :href="row.page_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
          <el-tag type="danger" v-if="row.page_available=='n'">存活：{{ row.page_available }}</el-tag>&nbsp;
          <el-tag type="warning" v-if="row.crawl_post_insights_switch=='y'">采集截图</el-tag>&nbsp;
          <el-link :href="`https://space.bilibili.com/${row.bili_aid}`" target="_blank" v-if="row.bili_name">
            <el-tag type="danger">
              仿号B站:{{ row.bili_name }}
            </el-tag>
          </el-link>&nbsp;
          <el-link :href="`https://www.youtube.com/@${row.youtube_channel_id}/videos`" target="_blank" v-if="row.youtube_channel_id">
            <el-tag type="danger">
              仿号youtube:{{ row.youtube_channel_id }}, 待用舆材:{{ row.available_materials_count }}
            </el-tag>
          </el-link>&nbsp;
          <!-- <el-tag type="success" v-if="row.crawl_post_insights_switch=='y'">{{'Insight:' + row.last_crawl_post_insights_time}}</el-tag> -->
        </template>
      </el-table-column>
      <el-table-column label="FID (新/旧)" width="240px">
        <template slot-scope="{row}">
          <span>{{ row.page_fid }}</span><span v-if="row.origin_fid"> / {{row.origin_fid}}</span>
        </template>
      </el-table-column>
      <el-table-column label="所属项目 / 类型 / 样式" width="200px">
        <template slot-scope="{row}"><span>{{ row.belong_project + ' / ' + row.belong_category + ' / ' + row.page_type }}</span></template>
      </el-table-column>
      <el-table-column label="粉丝 / 点赞" prop="follower_count" width="120px" sortable="custom">
        <template slot-scope="{row}">
          <span>{{ row.follower_count + ' / ' + row.page_likers }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总管理员" width="140px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleFetchPageRoleList(row.page_fid)">{{ row.role_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Vcman号" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.vcman_admin_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最新贴" width="120px">
        <template slot-scope="{row}">
          <span>{{ row.newest_post_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集时间" prop="last_crawl_time" width="120px" sortable="custom">
        <template slot-scope="{row}">
          <span>{{ row.last_crawl_roles_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="60px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleRestCrawltime(row.page_fid)">重置</span>&nbsp;
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="120px" style="width: 400px; margin-left:50px;">
        <el-form-item label="主页" prop="name">
          <el-input v-model="temp.name" type="input" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="所属项目" prop="belong_project">
          <el-input v-model="temp.belong_project" placeholder="主页管理，人为打的标记，非采集" />
        </el-form-item>
        <el-form-item label="所属类别" prop="belong_category">
          <el-input v-model="temp.belong_category" placeholder="主页管理，人为打的标记，非采集" />
        </el-form-item>
        <el-form-item label="帖子截图" prop="crawl_post_insights_switch">
          <el-select v-model="temp.crawl_post_insights_switch" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="youtbe频道ID" prop="youtube_channel_id">
          <el-input v-model="temp.youtube_channel_id" placeholder="youtube频道ID" style="width:100px;" />
        </el-form-item>
        <!-- <el-form :inline="true">
          <el-form-item label="跟踪Youtube" prop="youtuber_name">
            <el-input v-model="temp.youtuber_name" placeholder="指定youtube账号" style="width:120px;" />
          </el-form-item>
          <el-form-item label="频道ID" prop="youtube_channel_id">
            <el-input v-model="temp.youtube_channel_id" placeholder="youtube频道ID" style="width:100px;" />
          </el-form-item>
        </el-form> -->
        <!--
        <el-form :inline="true">
          <el-form-item label="跟踪 B站作者" prop="bili_name">
            <el-input v-model="temp.bili_name" placeholder="指定Bilibli账号" style="width:120px;" />
          </el-form-item>
          <el-form-item label="作者ID" prop="bili_aid">
            <el-input v-model="temp.bili_aid" placeholder="作者ID" style="width:100px;" />
          </el-form-item>
        </el-form>
        -->
        <el-form-item label="定期发帖" prop="post_flag">
          <el-select v-model="temp.post_flag" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="发帖间隔" prop="post_interval">
          <el-input v-model="temp.post_interval" placeholder="主页发帖最小间隔" />
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input type="textarea" autosize v-model="temp.remark" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="主页Roles列表" width="880px">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序" width="50px" />
        <el-table-column label="头像" width="50px">
          <template slot-scope="{row}">
            <el-image v-if="row.profile_pic_url" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_pic_url" ></el-image>
          </template>
        </el-table-column>
        <el-table-column label="账号">
          <template slot-scope="{row}">
            <el-link :href="row.account_url" target="_blank" type="primary">{{ row.account_name}}</el-link>&nbsp;
            <el-tag v-if="row.available=='y'" type="success" >{{ row.available }}</el-tag>&nbsp;
            <el-tag v-if="row.available=='n'" type="danger" >{{ row.available }}</el-tag>&nbsp;
            <!-- <el-tag type="info" v-if="row.crawl_account=='y'">{{'采集账号:' + row.a_available}}</el-tag>&nbsp; -->
            <el-tag type="danger" v-if="row.pending_change_type">{{'账号还未确认:' + row.pending_change_type}}</el-tag>&nbsp;
            <span>{{ row.account_fid }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="loc" label="Loc" width="240px" />
        <el-table-column prop="role_label" label="角色" width="100px" />
        <el-table-column prop="last_update_time" label="更新时间" width="120px" />
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
          action="http://221.120.163.66:38011/boost_interface/vue-element-admin/page/uploadPageData"
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
        <el-link type="primary" href="http://221.120.163.66:38011/template/template_import_page.xlsx">下载模板</el-link>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogUploadFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchManagePagesList, fetchPageConfigs, fetchPageRoleList, updateManagePage, resetPageCrawltime } from '@/api/page'
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
        name: undefined,
        page_fid: undefined,
        page_available: 'y',
        crawl_post_insights_switch: undefined,
        belong_project: undefined,
        belong_category: undefined,
        admin_count: '',
        vcman_admin_count: ''
      },
      availableOptions: ['y', 'n'],
      projectOptions: [],
      categoryOptions: [],
      showReviewer: false,
      temp: {
        id: undefined,
        name: '',
        belong_project: '',
        belong_category: '',
        crawl_post_insights_switch: '',
        youtuber_name: '',
        youtube_channel_id: '',
        bili_name: '',
        bili_aid: '',
        post_flag: '',
        post_interval: 43200,
        remark: ''
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
    this.getPageConfigs()
    this.getList()
  },
  methods: {
    getPageConfigs() {
      fetchPageConfigs().then(response => {
        this.projectOptions = response.data.projects
        this.categoryOptions = response.data.categorys
      })
    },
    getList() {
      this.list = []
      this.listLoading = true
      fetchManagePagesList(this.listQuery).then(response => {
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
      if (this.$refs.uploadFile) {
        this.$refs.uploadFile.clearFiles()
      }
      this.dialogUploadFormVisible = true
    },
    // 点击按钮手动上传，会先触发beforeUpload，再执行上传
    submit() {
      this.$refs.uploadFile.submit();
    },
    // 文件上传前对文件类型、文件大小判断限制
    beforeUpload(file) {
      const { name, size } = file;
      const index = name.lastIndexOf('.');
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
    },
    handleExport() {
      const params = []
      for (const key in this.listQuery) {
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
