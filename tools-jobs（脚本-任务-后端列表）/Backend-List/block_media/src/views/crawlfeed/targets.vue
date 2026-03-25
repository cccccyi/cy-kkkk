<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.account_fid" placeholder="目标FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.available_flag" clearable class="filter-item" placeholder="有效" style="width:120px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.follow_flag" clearable class="filter-item" placeholder="已关注(followed)" style="width:140px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.account_num" placeholder="采集账号" clearable class="filter-item" style="width:120px" />&nbsp;
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
      <!-- <el-table-column label="头像">
        <template slot-scope="{row}">
          <el-image v-if="row.profile_picture" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_picture" ></el-image>
        </template>
      </el-table-column> -->
      <el-table-column label="账号">
        <template slot-scope="{row}">
          <el-link :href="row.target_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
          <el-tag type="success">{{ row.available }}</el-tag>&nbsp;
        </template>
      </el-table-column>
      <el-table-column prop="tag_name" label="Tag" width="80" />
      <el-table-column prop="project_name" label="Project" width="80" />
      <el-table-column prop="account_fid" label="FID" />
      <el-table-column label="采集账号数" width="100">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleFetchAccountList(row.account_fid)">{{ row.account_num }}</span>
          &nbsp;/&nbsp;
          <span class="link-type" @click="handleFetchFollowList(row.account_fid)">{{ row.follow_nums }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最新贴">
        <template slot-scope="{row}">
          <span>{{ row.latest_post_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="帖子数 动态/时间线">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleFetchPostList(row.account_fid)">{{ row.post_num + ' / ' + row.timeline_post_num }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

      <el-dialog :visible.sync="dialogAccountVisible" title="目标-采集账号列表">
      <el-table :data="accountData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序" width="50px" />
        <el-table-column label="账号">
          <template slot-scope="{row}">
            <el-link :href="row.account_url" target="_blank" type="primary">{{ row.a_name}}</el-link>&nbsp;
          </template>
        </el-table-column>
        <el-table-column label="最新确认" width="180px">
          <template slot-scope="{row}">
            <span>{{ row.update_time }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="loc" label="Loc" />
        <el-table-column prop="a_update_time" label="更新时间" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFollowVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogFollowVisible" title="发起-账号关注历史">
      <el-table :data="followData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序" width="50px" />
        <el-table-column label="账号">
          <template slot-scope="{row}">
            <el-link :href="row.account_url" target="_blank" type="primary">{{ row.account_fid}}</el-link>&nbsp;
            <span>{{ row.page_fid }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100px">
          <template slot-scope="{row}">
            <span>{{ row.status }}</span>
          </template>
        </el-table-column>
      <el-table-column label="时间" width="180px">
        <template slot-scope="{row}">
          <span>{{ row.insert_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最新确认" width="180px">
        <template slot-scope="{row}">
          <span>{{ row.last_confirm_time }}</span>
        </template>
      </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFollowVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogPostVisible" title="帖子-列表" width="70%">
      <el-table :data="postData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序" width="50px" />
        <el-table-column label="帖子FID" width="140px">
          <template slot-scope="{row}">
            <el-link :href="row.url" target="_blank" type="primary">{{ row.iid}}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="内容">
          <template slot-scope="{row}">
            <span :title="row.content">{{row.content? row.content.substring(0,50) : ''}}</span>
          </template>
        </el-table-column>
      <el-table-column label="发帖时间" width="140px">
        <template slot-scope="{row}">
          <span>{{ row.post_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集时间" width="140px">
        <template slot-scope="{row}">
          <span>{{ row.last_update_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集账号" width="140px">
        <template slot-scope="{row}">
          <span>{{ row.viewer_account_fid }}</span>
        </template>
      </el-table-column>
      <el-table-column label="动态" width="80px">
        <template slot-scope="{row}">
          <span><i v-if="row.feeds_flag" class="el-icon-circle-check" style="color:green;font-weight:bold;"></i></span>
        </template>
      </el-table-column>
      <el-table-column label="时间线" width="80px">
        <template slot-scope="{row}">
          <span><i v-if="row.timeline_flag" class="el-icon-circle-check" style="color:green;font-weight:bold;"></i></span>
        </template>
      </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPostVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="导入采集目标" :visible.sync="dialogUploadFormVisible">
      <div style="text-align:center;">
        <el-upload
          ref="uploadFile"
          drag
          action="https://47.74.153.74/boost_interface/vue-element-admin/crawlfeed/uploadTargetsData"
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
import { fetchCrawlTargetList, fetchAccountLikesList, fetchTargetFollowHistory, fetchTargetPostList } from '@/api/crawlfeed'
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
        available_flag: undefined,
        follow_flag: undefined,
        account_num: undefined
      },
      availableOptions: ['y', 'n'],
      temp: {
        id: undefined,
        name: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
      dialogAccountVisible: false,
      accountData: [],
      dialogFollowVisible: false,
      followData: [],
      postData: [],
      dialogPostVisible: false,
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'change' }],
        crawl_post_insights_switch: [{ required: true, message: 'is required', trigger: 'change' }]
      },
      downloadLoading: false,
      //cascader
      cascader_value: [],
      cascader_options: [],
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
      fetchCrawlTargetList(this.listQuery).then(response => {
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
    handleFetchAccountList(target_fid){
      this.listLoading = true
      fetchAccountLikesList({target_fid}).then(response => {
        this.accountData = response.data.items
        this.dialogAccountVisible = true
        this.listLoading = false
      })
    },
    handleFetchFollowList(target_fid) {
      this.listLoading = true
      fetchTargetFollowHistory({target_fid}).then(response => {
        this.followData = response.data.items
        this.dialogFollowVisible = true
        this.listLoading = false
      })
    },
    handleFetchPostList(target_fid) {
      this.listLoading = true
      fetchTargetPostList({target_fid}).then(response => {
        this.postData = response.data.items
        this.dialogPostVisible = true
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
      const url = `https://47.74.153.74/boost_interface/vue-element-admin/crawlfeed/exportCrawlTargetList?available_flag=${this.listQuery.available_flag}&follow_flag=${this.listQuery.follow_flag}`
      window.open(url, '_blank')
    }
  }
}
</script>
