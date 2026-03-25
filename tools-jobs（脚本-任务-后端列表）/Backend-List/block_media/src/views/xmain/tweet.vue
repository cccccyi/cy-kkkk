<template>
  <div class="app-container">
    <div class="filter-container">
      <!--
      <el-select v-model="listQuery.site" placeholder="来源平台" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in siteOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.keyword" placeholder="内容搜索" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.push_flag" placeholder="重要" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in pushFlagOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.author_name" placeholder="作者" clearable class="filter-item" style="width:120px" />&nbsp;
      -->
      <el-select v-model="listQuery.status" placeholder="发推状态" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
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
      <el-table-column label="ID" align="center" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="快讯">
        <template slot-scope="{row}">
          <div v-if="row.tweet_id">
            <el-row>
              <span style="padding-right:12px;color:gray;">@{{ row.screen_name }}</span>
              <el-link :href="row.tweet_url" target="_blank" type="primary">{{ row.created_at_str }}</el-link>
            </el-row>
            <el-row><p style="white-space:pre-line;">{{ row.full_text }}</p></el-row>
            <el-row>
              <el-image v-if="row.img" :src="row.img" :preview-src-list="[row.img]" style="max-width:200px;" referrer-policy="no-referrer" />
            </el-row>
            <div>
              <span style="display:inline-block;width:100px;">
                <i class="el-icon-chat-round" style="margin-right:5px;" />
                <span>{{ row.reply_count }}</span>
              </span>
              <span style="display:inline-block;width:100px;">
                <i class="el-icon-position" style="margin-right:5px;" />
                <span>{{ row.retweet_count }}</span>
              </span>
              <span style="display:inline-block;width:100px;">
                <i class="el-icon-apple" style="margin-right:5px;" />
                <span>{{ row.favorite_count }}</span>
              </span>
              <span style="display:inline-block;width:100px;">
                <i class="el-icon-user" style="margin-right:5px;" />
                <span>{{ row.views }}</span>
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="来源">
        <template slot-scope="{row}">
          <div v-if="row.p_id">
            <el-row>
              <span style="padding-right:5px;color:gray;">计划发推：</span>
              <span>{{ row.created_at_str }}</span>
            </el-row>
            <el-row>
              <span style="padding-right:5px;color:gray;">状态：</span>
              <el-tag :type="row.status | statusFilter">{{ row.status_str }}</el-tag>
            </el-row>
            <el-row><span style="font-weight:bold;">{{ row.source_title }}</span></el-row>
            <el-row><p style="white-space:pre-line;">{{ row.source_content }}</p></el-row>
            <el-row>
              <el-image v-if="row.img" :src="row.img" :preview-src-list="[row.img]" style="max-width:200px;" referrer-policy="no-referrer" />
            </el-row>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80px">
        <template slot-scope="{row,$index}">
          <span v-if="row.status=='i' || row.status=='d'" class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog v-loading="dialogLoading" :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 600px;">
        <el-form-item label="标题" prop="source_title">
          <el-input v-model="temp.source_title" placeholder="X推文标题" />
        </el-form-item>
        <el-form-item label="内容" prop="source_content">
          <el-input v-model="temp.source_content" :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="X推文内容" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="temp.status" class="filter-item" placeholder="请选择">
            <el-option v-for="item in formStatusOptions" :key="item.id" :label="item.label" :value="item.id" />
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
import { fetchMainTweetList, createNewsInfo, updateMainTweetInfo } from '@/api/bctwitter'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        i: 'primary',
        r: 'warning',
        s: 'success',
        d: 'danger'
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
        status: ''
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
        { id: 'i', label: '等待发推' },
        { id: 'r', label: '正在执行' },
        { id: 's', label: '执行成功' },
        { id: 'd', label: '取消发推' }
      ],
      formStatusOptions: [
        { id: 'i', label: '等待发推' },
        { id: 'd', label: '取消发推' }
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
      fetchMainTweetList(this.listQuery).then(response => {
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
          updateMainTweetInfo(tempData).then((data) => {
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
