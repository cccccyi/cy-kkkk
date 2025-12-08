<template>
  <div class="app-container">
    <div class="filter-container">
      <el-select v-model="listQuery.site" placeholder="来源平台" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in siteOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.keyword" placeholder="内容搜索" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.push_flag" placeholder="重要" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in pushFlagOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      <!--
      <el-select v-model="listQuery.twitter_status" placeholder="发推状态" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.author_name" placeholder="作者" clearable class="filter-item" style="width:120px" />&nbsp;
      -->
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp;
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
    >
      <el-table-column label="ID" align="center" width="60px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="快讯">
        <template slot-scope="{row}">
          <el-row>
            <span style="padding-right:12px;color:skyblue;font-weight:bold;">发布时间</span>
            <span>{{ row.publish_time_str }}</span>
          </el-row>
          <el-row>
            <span style="font-weight:bold;">{{ row.title }}</span>
          </el-row>
          <el-row style="font-weight:bold;color:orange;">快讯消息</el-row>
          <el-row><p style="text-indent:20px;">{{ row.detail_content }}</p></el-row>
          <div v-if="row.push_flag=='y'">
            <el-row style="font-weight:bold;color:orange;">X推文消息</el-row>
            <el-row><p style="text-indent:20px;">{{ row.content }}</p></el-row>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="80px">
        <template slot-scope="{row}">
          <div style="text-align:center;">
            <el-row>{{ row.site }}</el-row>
            <el_row><el-link :href="row.new_url" target="_blank" type="primary">{{ row.n_publish_time_str }}</el-link></el_row>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="重要" width="60px">
        <template slot-scope="{row}">
          <el-tag v-if="row.push_flag=='y'" type="primary">重要</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="删除" width="60px">
        <template slot-scope="{row}">
          <el-tag v-if="row.del_flag=='1'" type="danger">删除</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80px">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog v-loading="dialogLoading" :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 600px;">
        <el-form-item label="标题" prop="title">
          <el-input v-model="temp.title" placeholder="快讯标题" />
        </el-form-item>
        <el-form-item label="内容" prop="detail_content">
          <el-input v-model="temp.detail_content" :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="快讯内容" />
        </el-form-item>
        <el-form-item label="X推文" prop="content">
          <el-input v-model="temp.content" :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="X推文内容" />
        </el-form-item>
        <el-form-item label="重要" prop="push_flag">
          <el-select v-model="temp.push_flag" class="filter-item" placeholder="请选择">
            <el-option v-for="item in pushFlagOptions" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="publish_time_str">
          <el-input v-model="temp.publish_time_str" placeholder="发布时间" />
        </el-form-item>
        <el-form-item label="删除" prop="del_flag">
          <el-select v-model="temp.del_flag" class="filter-item" placeholder="请选择">
            <el-option v-for="item in delFlagOptions" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData() : updateData()">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchNewsList, createNewsInfo, updateNewsInfo } from '@/api/hashnews'
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
        s: 'success',
        r: 'danger'
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
      dialogLoading: false,
      listQuery: {
        page: 1,
        limit: 50,
        site: '',
        keyword: '',
        push_flag: ''
      },
      siteOptions: [
        { id: 'panews', label: 'PANews' },
        { id: 'theblock', label: 'THEBLOCK' },
        { id: 'binance', label: 'Binance' }
      ],
      pushFlagOptions: [
        { key: 'y', label: '重要' },
        { key: 'n', label: '普通' }
      ],
      delFlagOptions: [
        { key: '0', label: '正常' },
        { key: '1', label: '删除' }
      ],
      statusOptions: [
        { id: 'i', label: '初始状态' },
        { id: 'r', label: '正在执行' },
        { id: 's', label: '执行成功' },
        { id: 'd', label: '被过滤' },
        { id: 'c', label: '被判重' }
      ],
      showReviewer: false,
      temp: {
        id: '',
        title: '',
        detail_content: '',
        content: '',
        push_flag: '',
        publish_time_str: '',
        del_flag: ''
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
        title: [{ required: true, message: '标题', trigger: 'blur' }],
        detail_content: [{ required: true, message: '内容', trigger: 'change' }],
        publish_time_str: [{ required: true, message: '时间', trigger: 'change' }]
      },
      downloadLoading: false,
      dialogImageUrl: '',
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
      fetchNewsList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    resetTemp() {
      this.temp = {
        id: '',
        title: '',
        detail_content: '',
        content: '',
        push_flag: '',
        publish_time_str: '',
        del_flag: ''
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
          createNewsInfo(this.temp).then(() => {
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜，新增成功',
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
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.dialogLoading = false
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.dialogLoading = true
          const tempData = Object.assign({}, this.temp)
          updateNewsInfo(tempData).then((data) => {
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    // image
    uploadSuccess(res, file) {
      this.temp.fileList.push(res.image_path)
    },
    handleRemove(file) {
      console.log(file)
    },
    handlePreview(file) {
      console.log(file)
    },
    handleDownload(file) {
      console.log(file)
    }
  }
}
</script>
<style scoped>
  .ellipsis-multiline {
    display: -webkit-box;       /* 弹性盒子模型 */
    -webkit-box-orient: vertical; /* 垂直排列子元素 */
    overflow: hidden;           /* 超出内容隐藏 */
    -webkit-line-clamp: 3;      /* 限制显示的行数 */
  }
</style>
