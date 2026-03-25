<template>
  <div class="app-container">
    <div class="filter-container">
      <el-select v-model="listQuery.project" placeholder="Project" clearable style="width: 120px" class="filter-item">
        <el-option v-for="item in projectOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.category" placeholder="Category" clearable style="width: 120px" class="filter-item">
        <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.available" placeholder="Available" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
      </el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        Add
      </el-button>&nbsp;
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Project" width="110px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.project }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Category" width="110px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.category }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Available" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.available | statusFilter">
            {{ row.available }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Remark" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type">{{ row.remark }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Image" min-width="150px">
        <template slot-scope="{row}">
          <img :src="row.image_name" style="max-width:100px;max-height:80px;" />
        </template>
      </el-table-column>
      <el-table-column label="Time" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.last_update_time | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            Edit
          </el-button>
          <el-button v-if="row.available!='y'" size="mini" type="success" @click="handleModifyAvailable(row,'y', $index)">
            Active
          </el-button>
          <el-button v-if="row.available!='n'" size="mini" type="danger" @click="handleModifyAvailable(row,'n', $index)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="Image" prop="imgDataUrl" v-if="dialogStatus==='create'">
          <a class="btn" @click="toggleShow">Click Upload Image ...</a>
          <el-input v-model="temp.imgDataUrl" type="hidden" />
        </el-form-item>
        <el-form-item  v-if="dialogStatus==='create'">
          <my-upload field="img" 
            v-model="show" 
            @crop-success="cropSuccess" 
            @crop-upload-success="cropUploadSuccess" 
            @crop-upload-fail="cropUploadFail" 
            :noCircle=true 
            :width=499
            :height=304
            img-format="jpg/png" />
          <img :src="imgDataUrl" style='max-width:400px;'>
        </el-form-item>
        <el-form-item label="Remark" prop="remark">
          <el-input v-model="temp.remark" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="Project" prop="project">
          <el-select v-model="temp.project" class="filter-item" placeholder="Please select">
            <el-option v-for="item in projectOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="Category" prop="category">
          <el-select v-model="temp.category" class="filter-item" placeholder="Please select">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="Available" prop="available">
          <el-select v-model="temp.available" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          Confirm
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchImageList, createImageCorpus, updateImageCorpus } from '@/api/corpus'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import myUpload from 'vue-image-crop-upload/upload-2.vue'

export default {
  name: 'ComplexTable',
  components: { 
    Pagination,
    'my-upload': myUpload
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
        limit: 20,
        project: undefined,
        category: undefined,
        available: undefined
      },
      projectOptions: ['vpn', 'ireland'],
      categoryOptions: ['common', 'china', 'vpn', 'av', 'star'],
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        id: undefined,
        remark: '',
        project: '',
        category: 'common',
        available: 'y',
        imgDataUrl: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        project: [{ required: true, message: 'project is required', trigger: 'change' }],
        category: [{ required: true, message: 'category is required', trigger: 'change' }],
        available: [{ required: true, message: 'available is required', trigger: 'change' }]
      },
      downloadLoading: false,
      //image
      show: false,
			params: {},
			headers: {smail: '*_~'},
			imgDataUrl: '' // the datebase64 url of created image
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchImageList(this.listQuery).then(response => {
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
    handleModifyAvailable(row, available, index) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.available = available
      updateTextCorpus(this.temp).then(() => {
        this.list.splice(index, 1, this.temp)
        this.$message({
          message: 'Update Available Success',
          type: 'success'
        })
      })
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
        remark: '',
        project: '',
        category: 'common',
        available: 'y',
        imageDataUrl: ''
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
            createImageCorpus(this.temp).then(() => {
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
          updateImageCorpus(tempData).then(() => {
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
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
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
    //image
    toggleShow() {
      this.show = !this.show;
    },
    cropSuccess(imgDataUrl, field){
      console.log('-------- crop success --------');
      this.imgDataUrl = imgDataUrl;
      this.temp.imgDataUrl = imgDataUrl
    },
    cropUploadSuccess(jsonData, field){
      console.log('-------- upload success --------');
      console.log(jsonData);
      console.log('field: ' + field);
    },
    cropUploadFail(status, field){
      console.log('-------- upload fail --------');
      console.log(status);
      console.log('field: ' + field);
    }

  }
}
</script>
