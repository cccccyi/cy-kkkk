<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-cascader
        placeholder="选择项目&分类"
        v-model="cascader_value_query"
        :options="cascader_options"
        :props="{ expandTrigger: 'hover' }"
        @change="cascaderHandleChangeQuery" clearable style="width: 150px" class="filter-item defaultFont">
      </el-cascader>&nbsp;
      <el-select v-model="listQuery.search_keyword" placeholder="关键字" clearable style="width: 120px" class="filter-item">
        <el-option v-for="item in keywordOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.available" placeholder="可用" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.name" placeholder="群组名" clearable class="filter-item" style="width:150px" />&nbsp;
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
      <el-table-column label="ID" prop="id" sortable="custom" width="60px" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="项目" width="200px">
        <template slot-scope="{row}">
          <span>{{ row.project_label }}</span>&nbsp;
          <el-tag type="info" v-if="row.category" size="mini">{{ 'C:'+row.category }}</el-tag>&nbsp;
          <el-tag type="danger" v-if="row.search_keyword" size="mini">{{ 'S:'+row.search_keyword }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="群组" prop="permeation_priority"  sortable="custom">
        <template slot-scope="{row}">
          <el-link :href="row.group_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
          <el-tag type="danger" alt="群组渗透优先级数值越大越优先">{{ 'P:'+row.permeation_priority }}</el-tag>&nbsp;
          <el-tag :type="row.group_available | statusFilter">{{ row.group_available }}</el-tag>&nbsp;
          <el-tag v-if="row.privacy">{{ row.privacy }}</el-tag>&nbsp;
          <el-tag type="warning" v-if="row.group_location_name">{{ 'L:'+row.group_location_name }}</el-tag>&nbsp;
        </template>
      </el-table-column>
      <el-table-column label="渗透/成员" width="80px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleFetchPv(row.identity)">{{ row.active_account_count }}</span>&nbsp;/&nbsp;
          <span>{{ row.member_count }}</span>
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
        <el-form-item label="群组FID" prop="identity">
          <el-input v-model="temp.identity" type="input" placeholder="请输入群组FID,唯一验证" />
        </el-form-item>
        <el-form-item label="群组名称" prop="name">
          <el-input v-model="temp.name" type="input" placeholder="Please input" />
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
        <el-form-item label="可用" prop="group_available">
          <el-select v-model="temp.group_available" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="渗透优先级" prop="permeation_priority">
          <el-select v-model="temp.permeation_priority" class="filter-item" placeholder="Please select">
            <el-option v-for="item in permeationPriorityOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="temp.remark" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="账号备注信息" style="width:400px;" />
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

    <el-dialog :visible.sync="dialogPvVisible" title="群组渗透记录" width="680px">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序号" width="50px" />
        <el-table-column prop="account" label="账号" width="130px" />
        <el-table-column prop="browser_dir" label="浏览器" width="130px" />
        <el-table-column prop="available" label="账号有效" width="80px" />
        <el-table-column prop="is_permeation" label="渗透" width="50px" />
        <el-table-column prop="is_kick" label="被踢" width="50px" />
        <el-table-column prop="insert_time" label="时间" width="120px" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchGroupList, fetchPv, createGroup, updateGroup } from '@/api/group'
import { fetchCascaderCategoryList, fetchKeywordList } from '@/api/keyword'
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
        project: '',
        category: '',
        search_keyword: '',
        group_available: 'y',
        name: ''
      },
      keywordOptions: [],
      availableOptions: ['', 'y', 'n', 'c'],
      permeationPriorityOptions: [0,1,2,3,4,5,6,7,8,9,10],
      showReviewer: false,
      temp: {
        id: undefined,
        identity: undefined,
        name: undefined,
        project: '',
        category: '',
        group_available: 'y',
        permeation_priority: 1,
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
        project: [{ required: true, message: 'project is required', trigger: 'change' }],
        group_available: [{ required: true, message: 'available is required', trigger: 'change' }]
      },
      downloadLoading: false,
      //cascader
      cascader_value_query: [],
      cascader_value: [],
      cascader_options: []
    }
  },
  created() {
    this.getCascaderCategoryList()
    this.getKeywordsList()
    this.getList()
  },
  methods: {
    getCascaderCategoryList() {
      fetchCascaderCategoryList({}).then(response => {
        this.cascader_options = response.data.items;
      })
    },
    getKeywordsList(){
      let keywordQuery = {page:1, limit:100}
      fetchKeywordList(keywordQuery).then(response => {
        let items = response.data.items
        for(let i in items){
          this.keywordOptions.push(items[i].keyword)
        }
      })
    },
    getList() {
      this.listLoading = true
      fetchGroupList(this.listQuery).then(response => {
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
      console.log(data)
      if (prop === 'id') {
        this.sortByID(order)
      } else if (prop === 'permeation_priority') {
        this.sortByPriority(order)
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
    sortByPriority(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+permeation_priority'
      } else {
        this.listQuery.sort = '-permeation_priority'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        text: '',
        project: this.temp.project,
        category: this.temp.category,
        available: 'y',
        permeation_priority: 1,
        remark: ''
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
          createGroup(this.temp).then(() => {
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
          updateGroup(tempData).then(() => {
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
