<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp;
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
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="文本">
        <template slot-scope="{row}">
          <span>{{ row.text }}</span>
        </template>
      </el-table-column>
      <el-table-column label="图片" min-width="120px">
        <template slot-scope="{row}">
          <el-image v-for="img in row.images" :src="'http://221.120.163.66:38011/mewe_images/' + img" :key="img" style="max-width: 160px;margin-right:5px;"></el-image>
        </template>
      </el-table-column>
      <el-table-column label="任务状态">
        <template slot-scope="{row}">
          <span>{{ '创建时间：' + row.insert_time }}</span><br/>
          <span>{{ '任务状态: ' + row.status_str }}</span><br/>
          <span v-if="row.email">使用账号：{{ row.email}}<br/></span>
          <span v-if="row.uid">账号UID：{{ row.uid}}<br/></span>
          <span v-if="row.uscreen_name">
            账号：<el-link :href="'https://mewe.com/' + row.uscreen_name" target="_blank" type="primary">{{ row.uscreen_name}}</el-link><br/>
          </span>
          <span>{{ '任务执行时间: ' + row.last_fetch_time }}<br/></span>
          <span v-if="row.post_time">新帖时间：{{ row.post_time }}<br/></span>
          <span v-if="row.post_id">帖子PID：{{ row.post_id }}<br/></span>
        </template>
      </el-table-column>
      <el-table-column label="截图" width="200px">
        <template slot-scope="{row}">
          <el-image v-if="row.screenshot_image" :src="'http://221.120.163.66:38011/mewe_images/' + row.screenshot_image" style="max-width: 180px;"></el-image>
        </template>
      </el-table-column>
      <!-- <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button v-if="row.available!='n'" size="mini" type="danger" @click="handleModifyAvailable(row,'n', $index)">
            删除
          </el-button>
        </template>
      </el-table-column> -->
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 450px; margin-left:20px;">
        <el-form-item label="内容" prop="text">
          <el-input v-model="temp.text" :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="请输入，发帖文本内容" />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload
            class="upload-demo"
            action="http://221.120.163.66:38011/boost_interface/vue-element-admin/mewe/uploadImage"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :on-success="uploadSuccess"
            :file-list="temp.fileList"
            list-type="picture">
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">只能上传jpg/png文件</div>
          </el-upload>
        </el-form-item>
        <el-dialog :visible.sync="dialogVisible">
          <img width="100%" :src="dialogImageUrl" alt="">
        </el-dialog>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { fetchPostCorpusList, createPostCorpus } from '@/api/mewe'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: {
    Pagination
  },
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
        limit: 20
      },
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        id: undefined,
        text: '',
        fileList: []
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
        text: [{ required: true, message: 'text is required', trigger: 'change' }]
      },
      downloadLoading: false,
      // image
      dialogImageUrl: '',
      dialogVisible: false,
      disabled: false,
      // cascader
      cascader_value_query: [],
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
      fetchPostCorpusList(this.listQuery).then(response => {
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
        title: '',
        text: '',
        fileList: []
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
          createPostCorpus(this.temp).then(() => {
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
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
          createPostCorpus(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
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
    //image
    uploadSuccess(res, file) {
      this.temp.fileList.push(res.image_path)
    },
    handleRemove(file) {
      console.log(file);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleDownload(file) {
      console.log(file);
    },
    cascaderHandleChangeQuery(value) {
      this.listQuery.project = value[0]
      this.listQuery.category = value[1]
    },
    cascaderHandleChange(value) {
      this.temp.project = value[0]
      this.temp.category = value[1]
    }

  }
}
</script>
