<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.screen_name" placeholder="推文账号" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.reply_status" placeholder="标签" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
      <el-date-picker
        v-model="listQuery.post_time_range"
        type="daterange"
        format="yyyy-MM-dd HH:mm:ss"
        value-format="yyyy-MM-dd HH:mm:ss"
        editable
        clearable
        class="filter-item"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp;
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
      <el-table-column label="ID" prop="id" align="center" width="60px" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="内容">
        <template slot-scope="{row}">
          <div>
            <span>账号：</span>
            <el-link :href="row.user_url" target="_blank" type="primary">{{ row.screen_name}}</el-link>
          </div>
          <div>
            <span>发布时间：</span>
            <el-link :href="row.tweet_url" target="_blank" type="primary">{{ row.created_at}}</el-link>&nbsp;
          </div>
          <div>
            <el-tag type="success">{{ '采集时间:' + row.crawl_time }}</el-tag>
          </div>
          <div>
            <span>类型：</span>
            <span>{{ row.tweet_type }}</span>
          </div>
          <div style="padding:2px;text-indent:20px;">
            <span>{{ row.full_text }}</span>
          </div>
          <el-image v-if="row.media_url_https" :src="row.media_url_https" style="width:200px;" />
        </template>
      </el-table-column>
      <el-table-column label="转 - 评 - 赞 - 浏览" prop="friends_count" width="180px">
        <template slot-scope="{row}">
          <el-row><span>{{ row.retweet_count + ' - ' + row.reply_count + ' - ' + row.favorite_count + ' - ' + row.views }}</span></el-row>
          <el-row><el-tag v-if="row.tag" type="primary">{{ row.tag }}</el-tag></el-row>
          <el-row><el-tag v-if="row.del_flag=='1'" type="danger">删除</el-tag></el-row>
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
        <el-form-item label="标签" prop="tag">
          <el-select v-model="temp.tag" class="filter-item" placeholder="请选择">
            <el-option v-for="item in tagOptions" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
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
import { fetchKolTweetList, updateKolTweetInfo } from '@/api/bctwitter'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        y: 'success',
        n: 'danger',
        i: 'info',
        r: 'danger',
        s: 'success'
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
        screen_name: '',
        tag: '',
        post_time_range: []
      },
      tagOptions: [
        { key: 'whale', label: '巨鲸' },
        { key: 'BTC', label: 'BTC' },
        { key: 'ETH', label: 'ETH' }
      ],
      delFlagOptions: [
        { key: '0', label: '正常' },
        { key: '1', label: '删除' }
      ],
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        id: '',
        tag: '',
        del_tag: ''
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
        name: [{ required: true, message: 'name is required', trigger: 'change' }],
        crawl_post_insights_switch: [{ required: true, message: 'is required', trigger: 'change' }]
      },
      downloadLoading: false,
      // cascader
      cascader_value: [],
      cascader_options: [],
      statusOptions: [
        { id: 'i', label: '初始状态' },
        { id: 'r', label: '正在执行' },
        { id: 's', label: '执行成功' }
      ]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchKolTweetList(this.listQuery).then(response => {
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
        id: '',
        tag: '',
        del_tag: ''
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
          addTweetUrls(this.temp).then((res) => {
            this.dialogFormVisible = false
            this.$notify({
              title: '添加',
              message: res.msg,
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
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
          updateKolTweetInfo(tempData).then((data) => {
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
    }
  }
}
</script>
