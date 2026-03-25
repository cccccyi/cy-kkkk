<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-select 
        v-model="listQuery.tags" 
        placeholder="标签" 
        clearable class="filter-item" style="width: 100px">
        <el-option v-for="item in tagsOptionsQuery" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.location" placeholder="地址" clearable class="filter-item" style="width:160px" />&nbsp;
      <el-input v-model="listQuery.name" placeholder="群名，多个以英文逗号(,) 分隔" clearable class="filter-item" style="width:300px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
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
      <el-table-column label="群组名称">
        <template slot-scope="{row}">
          <el-link :href="row.group_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
          <el-tag :type="row.group_available | statusFilter">{{ row.group_available }}</el-tag>&nbsp;
          <el-tag type="warning" v-if="row.privacy">{{ row.privacy }}</el-tag>&nbsp;
          <template v-if="row.location">
            <el-row>Location: <el-tag>{{ row.location }}</el-tag></el-row>
          </template>
          <template v-if="row.description">
            <el-row>description: {{ row.description }}</el-row>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="成员" width="100px">
        <template slot-scope="{row}">
          <span>{{ row.member_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="标签" width="120px">
        <template slot-scope="{row}">
          <el-tag
            v-for="tag in row.tags"
            :key="tag"
            type="primary">
            {{tag}}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
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
          <el-input v-model="temp.name" type="input" placeholder="请输入群组名称" />
        </el-form-item>
        <el-form-item label="群组标签" prop="tags">
          <el-tag
            :key="tag"
            v-for="tag in temp.tags"
            closable
            :disable-transitions="false"
            @close="handleDeleteTag(tag)">
            {{tag}}
          </el-tag>
          <el-input
            class="input-new-tag"
            v-if="inputVisible"
            v-model="inputValue"
            ref="saveTagInput"
            size="small"
            @keyup.enter.native="handleInputTagConfirm"
            @blur="handleInputTagConfirm"
          >
          </el-input>
          <el-button v-else class="button-new-tag" size="small" @click="showTagInput">+新增标签</el-button>
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
import { fetchCollectGroupList, fetchGroupTags, updateCollectGroup } from '@/api/library'
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
        tags: '',
        standpoint: '',
        privacy: '',
        group_type: '',
        group_available: 'y',
        name: '',
        location: '',
        name_lang: '',
        permeation_account_count: ''
      },
      tagsOptionsQuery: [],
      tagsOptions: [],
      standpointOptions: [],
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
      dialogPvVisible: false,
      pvData: [],
      rules: {
        identity: [{ required: true, message: '群组FID必填且唯一', trigger: 'blur' }],
        project: [{ required: true, message: '所属项目必填', trigger: 'change' }],
        group_available: [{ required: true, message: 'available is required', trigger: 'change' }]
      },
      downloadLoading: false,
      //tags
      inputVisible: false,
      inputValue: ''
    }
  },
  created() {
    this.getConfig()
    this.getList()
  },
  methods: {
    getConfig() {
      fetchGroupTags({}).then(response => {
        this.tagsOptionsQuery = response.data.items
        this.tagsOptions = response.data.items
      })
    },
    getList() {
      this.listLoading = true
      fetchCollectGroupList(this.listQuery).then(response => {
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
    handleExport() {
      let params = []
      for(let key in this.listQuery) {
        if (this.listQuery[key] !== undefined && this.listQuery[key] !== '') {
          params.push(`${key}=${this.listQuery[key]}`)
        }
      }
      const url = `http://221.120.163.66:38011/boost_interface/vue-element-admin/library/exportGroups?${params.join('&')}`
      window.open(url, '_blank')
    }
  }
}
</script>
