<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.account_fid" placeholder="账号FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-input v-model="listQuery.error_code" placeholder="错误码" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.active_available" clearable class="filter-item" placeholder="引导状态" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.crawl_available" clearable class="filter-item" placeholder="采集状态" style="width:100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
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
      <el-table-column label="账号">
        <template slot-scope="{row}">
          <el-link :href="row.profile_url" target="_blank" type="primary">{{ row.account}}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="FID" width="160px">
        <template slot-scope="{row}">
          <span>{{ row.account_fid }}</span>
        </template>
      </el-table-column>
      <el-table-column label="好友 / 粉丝" prop="friends_count" width="180px">
        <template slot-scope="{row}">
          <span>{{ row.friends_count + ' / ' + row.followers_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="引导信息（imei/layer/active,error_code）" width="280px">
        <template slot-scope="{row}">
          <span>{{ row.device_imei + ' / ' + row.bind_layer + ' / ' + row.active + ' / ' + row.error_code }}</span>
        </template>
      </el-table-column>
      <el-table-column label="判死时间" width="160">
        <template slot-scope="{row}">
          <span>{{ row.dead_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最新贴" width="160">
        <template slot-scope="{row}">
          <span>{{ row.latest_post_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集状态" width="120">
        <template slot-scope="{row}">
          <span>{{ row.crawl_available }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集时间" width="160">
        <template slot-scope="{row}">
          <span>{{ row.last_update_time }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog title="导入 引导账号 信息" :visible.sync="dialogUploadFormVisible">
      <div style="text-align:center;">
        <el-upload
          ref="uploadFile"
          drag
          action="http://221.120.163.66:38011/boost_interface/vue-element-admin/account/uploadFbAccountInfosDataYY"
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
            EXCEL列定义： fid, place_id, imei, bind_layer, active, error_code, dead_time
          </div>
        </el-upload>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogUploadFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="群组FID" prop="identity">
          <el-input v-model="temp.identity" type="input" placeholder="请输入群组FID,唯一验证" />
        </el-form-item>
        <el-form-item label="群组名称" prop="name">
          <el-input v-model="temp.name" type="input" placeholder="请输入群组名称" />
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
import { fetchGuidFbAccountListYY, updateCollectGroup } from '@/api/account'
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
        account_fid: '',
        error_code: '',
        active_available: '',
        crawl_available: ''
      },
      availableOptions: ['', 'y', 'n'],
      privacyOptions: [],
      groupTypeOptions: [],
      nameLangOptions: [],
      showReviewer: false,
      temp: {
        id: undefined,
        identity: '',
        name: '',
        source_type: '',
        standpoint: null,
        group_available: null,
        remark: ''
      },
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
      fetchGuidFbAccountListYY(this.listQuery).then(response => {
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
          updateCollectGroup(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜，更新成功',
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
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },
    //edit tags
    handleDeleteTag(tag) {
      this.temp.tags.splice(this.temp.tags.indexOf(tag), 1);
    },
    showTagInput() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
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
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/account/exportAccountInfosYY?${params.join('&')}`
      window.open(url, '_blank')
    }
  }
}
</script>
