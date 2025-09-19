<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.screen_name" placeholder="screen_name" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.status" clearable class="filter-item" placeholder="目标状态" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.reply_flag" clearable class="filter-item" placeholder="主号评论" style="width:150px">
        <el-option v-for="item in replyOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.tag" placeholder="Tag" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <!-- <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleUpload">导入</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExport">导出</el-button> -->
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
      <el-table-column label="screen_name">
        <template slot-scope="{row}">
          <el-link :href="row.profile_url" target="_blank" type="primary">{{ row.screen_name}}</el-link><br>
          <el-row>
            <span>{{ row.name }}</span>
            <i v-if="row.is_blue_verified && row.profile_image_shape!='Square'" class="el-icon-medal" :style="{color: 'blue', margin:'0 5px'}" title="X蓝标" />
            <i v-if="row.profile_image_shape=='Square'" class="el-icon-medal" :style="{color: 'orange', margin:'0 5px'}" title="X金标" />
          </el-row>
          <el-tag v-if="row.tag" type="primary">{{ 'Tag: ' + row.tag }}</el-tag><br>
          <el-image v-if="row.profile_picture" style="max-width: 100px;" :src="row.profile_picture" :preview-src-list="[row.profile_picture]" /><br>
          <el-image v-if="row.profile_banner_url" style="max-width: 100px;" :src="row.profile_banner_url" :preview-src-list="[row.profile_banner_url]" /><br>
          <template v-if="row.location"><el-row>地址: {{ row.location }}</el-row></template>
          <template v-if="row.description"><el-row>简介: {{ row.description }}</el-row></template>
          <template v-if="row.ai_judge_industry">
            <el-row>
              <span style="color:#00f;">AI - 所处行业 </span><el-tag type="danger">{{ row.ai_judge_industry }}</el-tag>
            </el-row>
            <el-row>
              <span style="color:#00f;">AI - 账号概括</span> <el-tag type="primamry">{{ row.ai_summary_intro }}</el-tag>
            </el-row>
            <el-row>
              <span style="color:#00f;">AI - 语言判断</span> <el-tag type="primamry">{{ row.ai_judge_lang }}</el-tag>
            </el-row>
          </template>
          <template v-if="row.remark">
            <el-row>
              <span style="color:#00f;">备注 </span>{{ row.remark }}
            </el-row>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="贴文 / 粉丝 / 关注" prop="friends_count" width="180px">
        <template slot-scope="{row}">
          <span>{{ row.statuses_count + ' / ' + row.followers_count + ' / ' + row.friends_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集" width="200">
        <template slot-scope="{row}">
          <div><span style="display:inline-block;width:60px;text-align:left;">采集时间：</span><span>{{ row.last_update_time }}</span></div>
          <!-- <div><span style="display:inline-block;width:60px;text-align:left;">最&nbsp;&nbsp;新 贴 ：</span><span>{{ row.latest_post_time }}</span></div>
          <div><span style="display:inline-block;width:60px;text-align:left;">日均发帖：</span><span>{{ row.avg_day_post_num }}</span></div>
          <div><span style="display:inline-block;width:60px;text-align:left;">采集间隔：</span><span>{{ row.crawl_interval_time }}</span></div> -->
          <!-- <el-tag v-if="row.reply_flag=='y'" type="danger">主号进行评论</el-tag> -->
          <el-row>
            <span style="color:#00f;margin-right:5px;">标记状态：</span>
            <el-tag :type="row.crawl_available | statusFilter">{{ row.twitter_status_str }}</el-tag>
          </el-row>
          <el-row>
            <span style="color:#00f;margin-right:5px;">关注状态：</span>
            <el-tag v-if="row.followed_by=='1' && row.following=='1'" type="danger">互关</el-tag>
            <el-tag v-else-if="row.followed_by=='1'" type="warning" >已关注我方账号</el-tag>
            <el-tag v-else-if="row.following=='1'" type="info">我方已关注</el-tag>
          </el-row>
          <el-row>
            <span style="color:#00f;margin-right:5px;">评论任务数：</span><span>{{ row.all_task_num }}</span><br/>
            <span style="color:#00f;margin-right:5px;">成功任务数：</span><span>{{ row.success_task_num }}</span>
          </el-row>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80px">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog title="导入 引导Twitter账号 信息" :visible.sync="dialogUploadFormVisible">
      <div style="text-align:center;">
        <el-upload
          ref="uploadFile"
          drag
          action="http://82.157.161.88/boost_interface/vue-element-admin/bctwitter/uploadTwAccountTarget"
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
          <div class="el-upload__tip" slot="tip">
            只能上传xls/xlsx文件，且不超过10M，一次只能上传一个，<br/>
            EXCEL列定义： screen_name
          </div>
        </el-upload>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogUploadFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogImportFormVisible">
      <el-form ref="dataForm" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="账号" prop="names">
          <el-input v-model="temp.urls" :autosize="{ minRows: 10, maxRows: 20}" type="textarea" placeholder="twitter账号，@screen_name，一行一个" style="width:300px;" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogImportFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createImportData():createImportData()">
          确定
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="监控目标" prop="screen_name">
          <el-input v-model="temp.screen_name" type="screen_name" placeholder="@screen_name" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="temp.status" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="temp.remark" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="账号备注信息" style="width:400px;" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<style>
  .el-tag + .el-tag {
    margin-left: 10px;
  }
  .button-new-tag {
    margin-left: 10px;
    height: 32px;
    line-height: 30px;
    padding-top: 0;
    padding-bottom: 0;
  }
  .input-new-tag {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
  }
</style>

<script>
import { fetchFollowAccountTargetList, addMonitorTweetNames, updateFollowAccountTarget } from '@/api/bctwitter'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        i: 'warning',
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
        screen_name: '',
        status: 'y',
        reply_flag: '',
        tag: ''
      },
      availableOptions: [
        { key: 'i', label: '初始' },
        { key: 'y', label: '正常' },
        { key: 'n', label: '被过滤' }
      ],
      replyOptions: [
        { key: 'y', label: '进行主号评论' },
        { key: 'n', label: '不进行主号评论' }
      ],
      privacyOptions: [],
      groupTypeOptions: [],
      nameLangOptions: [],
      showReviewer: false,
      temp: {
        id: undefined,
        screen_name: '',
        status: '',
        remark: ''
      },
      dialogImportFormVisible: false,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
      dialogUploadFormVisible: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      this.list = []
      fetchFollowAccountTargetList(this.listQuery).then(response => {
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
        identity: '',
        name: '',
        source_type: '',
        standpoint: null,
        group_available: 'y',
        remark: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogImportFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createImportData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          addMonitorTweetNames(this.temp).then((res) => {
            this.dialogImportFormVisible = false
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
          updateFollowAccountTarget(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜，更新成功',
              type: 'success',
              duration: 2000
            })
            this.getList()
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
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },
    // edit tags
    handleDeleteTag(tag) {
      this.temp.tags.splice(this.temp.tags.indexOf(tag), 1)
    },
    showTagInput() {
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    handleInputTagConfirm() {
      let inputValue = this.inputValue;
      if (inputValue) {
        this.temp.tags.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = '';
    },
    handleUpload() {
      if (this.$refs.uploadFile) {
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
      const url = `http://161.117.55.73:8011/boost_interface/vue-element-admin/twitter/exportAccountInfosYJG?${params.join('&')}`
      window.open(url, '_blank')
    }
  }
}
</script>
