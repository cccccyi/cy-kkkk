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
        新增
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
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="60px" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="项目" width="120px">
        <template slot-scope="{row}">
          <span>{{ row.project + ' - ' + row.category }}</span>
        </template>
      </el-table-column>
      <el-table-column label="关键字" width="180px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.keyword }}</span>&nbsp;
          <el-tag :type="row.available | statusFilter">{{ row.available }}</el-tag>&nbsp;
          <el-tag type="primary">{{ '仅Loc:' + row.only_search_width_loc }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="地址FIDs">
        <template slot-scope="{row}">
          <span>{{ row.locs_str }}</span>
        </template>
      </el-table-column>
      <el-table-column label="FB收集群组" width="120px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.last_crawl_group_time | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="FB收集主页" width="120px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.last_crawl_page_time | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row, $index)">
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="关键字" prop="keyword">
          <el-input v-model="temp.keyword" type="input" placeholder="输入关键字" />
        </el-form-item>
        <el-form-item label="项目&分类" prop="project">
          <el-cascader
            label="项目&分类"
            prop="project"
            v-model="cascader_value"
            :options="cascader_options"
            :props="{ expandTrigger: 'hover' }"
            @change="cascaderHandleChange" clearable style="width: 150px" class="filter-item defaultFont">
          </el-cascader>&nbsp;
        </el-form-item>
        <el-form-item label="仅地址搜索" prop="only_search_width_loc">
          <el-checkbox v-model="temp.only_search_width_loc">搜索L</el-checkbox>
        </el-form-item>
        <el-form-item label="搜索地址" prop="loc_fids">
          <el-select 
            v-model="temp.loc_fids" 
            class="filter-item" 
            multiple collapse-tags 
            placeholder="选择地址" style="width:300px;">
            <el-option v-for="item in locFidInfosOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
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
          确认
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { fetchLocFidInfos, fetchCascaderCategoryList, fetchKeywordList, createKeyword, updateKeyword } from '@/api/keyword'
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
        available: undefined
      },
      availableOptions: ['', 'y', 'n'],
      locFidInfosOptions: [],
      showReviewer: false,
      temp: {
        id: undefined,
        keyword: '',
        project: '',
        category: '',
        only_search_width_loc: '',
        loc_fids: [],
        available: 'y'
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
        keyword: [{ required: true, message: 'keyword is required', trigger: 'blur' }],
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
    this.getConfig()
    this.getList()
  },
  methods: {
    getConfig() {
      fetchCascaderCategoryList({}).then(response => {
        this.cascader_options = response.data.items;
      })
      fetchLocFidInfos({}).then(response => {
        this.locFidInfosOptions = response.data.items;
      })
    },
    getList() {
      this.listLoading = true
      fetchKeywordList(this.listQuery).then(response => {
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
        keyword: '',
        project: this.temp.project,
        category: this.temp.category,
        available: 'y',
        loc_fids: []
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
            createKeyword(this.temp).then(() => {
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
          updateKeyword(tempData).then(() => {
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
    handleFetchPv(identity) {
      fetchPv(identity).then(response => {
        this.pvData = response.data.items
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
