<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="关键字" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <!-- <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleUpload">导入</el-button>&nbsp; -->
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
      <el-table-column label="账号名称">
        <template slot-scope="{row}">
          <el-link :href="row.profile_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
          <el-tag type="warning" v-if="row.is_verified">{{ 'Verified:' + row.is_verified }}</el-tag>&nbsp;
          <template v-if="row.biography">
            <el-row>description: {{ row.biography }}</el-row>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="头像" width="200px">
        <template slot-scope="{row}">
          <el-image v-if="row.photo_image" :src="row.photo_image" style="max-width: 180px;"></el-image>
        </template>
      </el-table-column>
      <el-table-column label="粉丝 / 关注 / 帖子" width="180">
        <template slot-scope="{row}">
          <span>{{ row.followed_count + ' / ' + row.follow_count + ' / ' + row.posts_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Tag" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.tag }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog title="导入 群组 信息" :visible.sync="dialogUploadFormVisible">
      <div style="text-align:center;">
        <el-upload
          ref="uploadFile"
          drag
          action="http://221.120.163.66:38011/boost_interface/vue-element-admin/group/uploadGroupInfosData"
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
            只能上传xls/xlsx文件，且不超过10M，一次只能上传一个,
            EXCEL第一列为群组FID
          </div>
        </el-upload>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogUploadFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="120px" style="width: 400px; margin-left:50px;">
        <el-form-item label="标签" prop="tag">
          <el-input v-model="temp.tag" placeholder="为本目标打上标签，方便后续区分" />
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
import { fetchCollectAccountList, updateInstagramAccount } from '@/api/instagram'
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
        keyword: '',
        tag: ''
      },
      availableOptions: ['', 'y', 'n'],
      privacyOptions: [],
      groupTypeOptions: [],
      nameLangOptions: [],
      showReviewer: false,
      temp: {
        id: undefined,
        tag: ''
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
      fetchCollectAccountList(this.listQuery).then(response => {
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
        tag: ''
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
          updateInstagramAccount(tempData).then(() => {
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
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/group/exportGroupsInfos?${params.join('&')}`
      window.open(url, '_blank')
    }
  }
}
</script>
