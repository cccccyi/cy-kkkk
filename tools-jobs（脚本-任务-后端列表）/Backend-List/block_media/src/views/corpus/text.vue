<template>
  <div class="app-container">
    <div class="filter-container">
      <el-cascader
        placeholder="选择项目&分类"
        v-model="cascader_value_query"
        :options="cascader_options"
        :props="{ expandTrigger: 'hover' }"
        @change="cascaderHandleChangeQuery" clearable style="width: 150px" class="filter-item defaultFont">
      </el-cascader>&nbsp;
      <el-select v-model="listQuery.available" placeholder="可用" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        搜索
      </el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        添加
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
      class="defaultFont"
      @sort-change="sortChange"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="项目" width="130px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.project + ' - ' + row.category }}</span>&nbsp;
          <el-tag :type="row.available | statusFilter">{{ row.available }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="文本" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.text }}</span>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="120px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.last_update_time | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button v-if="row.available!='y'" size="mini" type="success" @click="handleModifyAvailable(row,'y', $index)">
            激活
          </el-button>
          <el-button v-if="row.available!='n'" size="mini" type="danger" @click="handleModifyAvailable(row,'n', $index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="文本" prop="text">
          <el-input v-model="temp.text" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="项目&分类" prop="project">
          <el-cascader
            prop="project"
            v-model="cascader_value"
            :options="cascader_options"
            :props="{ expandTrigger: 'hover' }"
            @change="cascaderHandleChange" clearable style="width: 150px" class="filter-item defaultFont">
          </el-cascader>&nbsp;
        </el-form-item>
        <el-form-item label="可用" prop="available">
          <el-select v-model="temp.available" class="filter-item" placeholder="Please select">
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
  </div>
</template>

<script>
import { fetchTextList, fetchPv, createTextCorpus, updateTextCorpus } from '@/api/corpus'
import { fetchCascaderCategoryList } from '@/api/keyword'
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
        limit: 20,
        project: undefined,
        category: undefined,
        available: 'y'
      },
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        id: undefined,
        text: '',
        project: '',
        category: 'common',
        available: 'y'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新建'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        text: [{ required: true, message: 'text is required', trigger: 'blur' }],
        project: [{ required: true, message: 'project is required', trigger: 'change' }],
        available: [{ required: true, message: 'available is required', trigger: 'change' }]
      },
      downloadLoading: false,
      //cascader
      cascader_value_query: [],
      cascader_value: [],
      cascader_options: []
    }
  },
  created() {
    this.getList()
    this.getCascaderCategoryList()
  },
  methods: {
    getCascaderCategoryList() {
      fetchCascaderCategoryList({}).then(response => {
        this.cascader_options = response.data.items;
      })
    },
    getList() {
      this.listLoading = true
      fetchTextList(this.listQuery).then(response => {
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
      updateImageCorpus(this.temp).then(() => {
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
        text: '',
        project: this.temp.project,
        category: this.temp.category,
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
          updateTextCorpus(tempData).then(() => {
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
