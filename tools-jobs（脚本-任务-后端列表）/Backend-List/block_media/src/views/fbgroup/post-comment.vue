<template>
  <div class="app-container">
    <div class="filter-container">
      <el-cascader
        placeholder="选择项目&分类"
        v-model="cascader_value"
        :options="cascader_options"
        :props="{ expandTrigger: 'hover' }"
        @change="cascaderHandleChange" clearable style="width: 150px" class="filter-item defaultFont">
      </el-cascader>&nbsp;
      <el-select v-model="listQuery.can_comment" placeholder="能否评论" clearable class="filter-item" style="width: 100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.comment_flag" placeholder="已评论" clearable class="filter-item" style="width: 100px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.group_fid" placeholder="群组FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-input v-model="listQuery.corpus_text_id" placeholder="文" clearable class="filter-item" style="width:80px" />&nbsp;
      <el-input v-model="listQuery.corpus_image_id" placeholder="图" clearable class="filter-item" style="width:80px" />&nbsp;
      <el-input v-model="listQuery.browser_dir" placeholder="号" clearable class="filter-item" style="width:80px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        搜索
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
      <el-table-column label="群组">
        <template slot-scope="{row}">
          <el-link :href="row.group_url" target="_blank">{{row.name}}</el-link>&nbsp;
          <el-tag type="success" v-if="row.privacy">{{ row.privacy }}</el-tag>&nbsp;
          <el-link :href="row.account_url" target="_blank" type="primary">{{ row.user_name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="帖子" width="160px">
        <template slot-scope="{row}">
          <el-link :href="row.post_url" target="_blank" type="primary">{{ row.post_time }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="评论" width="165px">
        <template slot-scope="{row}">
          <el-tag :type="row.can_comment | statusFilter">{{ row.can_comment }}</el-tag>&nbsp;
          <el-link :href="row.comment_url" target="_blank" type="primary">{{ row.comment_time}}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="舆材" width="220px">
        <template slot-scope="{row}">
          <span>{{row.corpus_text_id + ' ' + row.corpus_image_id + ' ' + row.browser_dir}}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />
  </div>
</template>

<script>
import { fetchPostList } from '@/api/group'
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
        limit: 50,
        project: undefined,
        category: undefined,
        can_comment: 'y',
        comment_flag: undefined,
        corpus_text_id: undefined,
        corpus_image_id: undefined,
        browser_dir: undefined
      },
      availableOptions: ['', 'y', 'n'],
      showReviewer: false,
      temp: {
        id: undefined,
        keyword: '',
        project: 'unassign',
        category: 'unassign',
        available: 'y'
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
    this.getCascaderCategoryList()
    this.getList()
  },
  methods: {
    getCascaderCategoryList() {
      fetchCascaderCategoryList({}).then(response => {
        this.cascader_options = response.data.items;
      })
    },
    getList() {
      this.listLoading = true
      fetchPostList(this.listQuery).then(response => {
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
        keyword: '',
        project: 'unassign',
        category: 'unassign',
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
    cascaderHandleChange(value) {
      this.listQuery.project = value[0]
      this.listQuery.category = value[1]
    }
  }
}
</script>
