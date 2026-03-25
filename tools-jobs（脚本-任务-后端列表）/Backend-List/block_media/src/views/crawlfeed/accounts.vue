<template>
  <div class="app-container defaultFont">
    <div class="filter-container">
      <el-input v-model="listQuery.account_fid" placeholder="账号FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-input v-model="listQuery.loc" placeholder="设备Loc" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.available_flag" clearable class="filter-item" placeholder="有效" style="width:120px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
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
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="60px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号" width="200">
        <template slot-scope="{row}">
          <el-image v-if="row.profile_image_url" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_image_url" ></el-image>&nbsp;&nbsp;
          <el-link :href="row.account_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
          <el-tag type="success">{{ row.available }}</el-tag>&nbsp;
        </template>
      </el-table-column>
      <el-table-column prop="account_fid" label="FID" width="150" />
      <el-table-column prop="loc" label="Loc" width="140" />
      <el-table-column label="发起/采集/采集次数/帖子总数/均贴">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleFetchFollowList(row.account_fid)">{{ row.follow_nums }}</span>
          &nbsp;/&nbsp;
          <span class="link-type" @click="handleFetchLikeList(row.account_fid)">{{ row.target_num }}</span>
          &nbsp;/&nbsp;
          <span>{{ row.crawler_num }}</span>
          &nbsp;/&nbsp;
          <span>{{ row.crawler_total_post_num }}</span>
          &nbsp;/&nbsp;
          <span>{{ row.crawler_avg_post_num }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最新一次 - 采集贴范围" width="280">
        <template slot-scope="{row}">
          <span>{{ row.min_post_time + ' - ' + row.max_post_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="区间（H）" width="80">
        <template slot-scope="{row}">
          <span>{{ row.feeds_time_range }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集贴数" width="80">
        <template slot-scope="{row}">
          <span>{{ row.crawl_feeds_post_num }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="update_time" label="更新时间" width="160" />
      <el-table-column label="操作" align="center" width="50px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>&nbsp;
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 500px; margin-left:50px;">
        <el-form-item label="FID" prop="account_fid">
          <el-input v-model="temp.account_fid" placeholder="输入账号FID" :readonly="true" />
        </el-form-item>
        <el-form-item label="账号" prop="account_name">
          <el-input v-model="temp.name" placehomlder="输入账号名" :readonly="true" />
        </el-form-item>
        <el-form-item label="存活" prop="available">
          <el-select v-model="temp.available" style="width:120px">
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

    <el-dialog :visible.sync="dialogLikesVisible" title="目标-账号Follow列表" width="960px">
      <el-table :data="likesData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序" width="50px" />
        <el-table-column label="目标">
          <template slot-scope="{row}">
            <el-link :href="row.target_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
          </template>
        </el-table-column>
        <el-table-column label="目标" width="80">
         <template slot-scope="{row}">
          <span>
            <i v-if="row.target_flag=='y'" class="el-icon-circle-check" style="color:green;font-weight:bold;"></i>
            <i v-else class="el-icon-circle-close" style="color:red;font-weight:bold;"></i>
          </span>
         </template>
        </el-table-column>
        <el-table-column label="最新确认" width="150">
          <template slot-scope="{row}">
            <span>{{ row.update_time }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最新贴" width="150">
         <template slot-scope="{row}">
          <span>{{ row.latest_post_time }}</span>
         </template>
        </el-table-column>
        <el-table-column label="帖子数" width="80">
         <template slot-scope="{row}">
          <span>{{ row.post_num }}</span>
         </template>
        </el-table-column>
       </el-table>
       <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFollowVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogFollowVisible" title="发起-账号关注历史">
      <el-table :data="followData" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序" width="50px" />
        <el-table-column label="目标">
          <template slot-scope="{row}">
            <el-link :href="row.target_url" target="_blank" type="primary">{{ row.target_name}}</el-link>&nbsp;
            <span>{{ row.page_fid }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100px">
          <template slot-scope="{row}">
            <span>{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180px">
          <template slot-scope="{row}">
            <span>{{ row.insert_time }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最新确认" width="180px">
          <template slot-scope="{row}">
            <span>{{ row.last_confirm_time }}</span>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFollowVisible = false">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchCrawlAccountList, fetchAccountLikesList, fetchTargetFollowHistory, updateCrawlAccount } from '@/api/crawlfeed'
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
        account_fid: undefined,
        loc: undefined,
        available_flag: undefined
      },
      keywordOptions: [],
      availableOptions: ['y', 'n'],
      showReviewer: false,
      temp: {
        id: undefined,
        name: '',
        account_fid: '',
        available: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
      dialogFollowVisible: false,
      followData: [],
      dialogLikesVisible: false,
      likesData: [],
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'change' }],
        crawl_post_insights_switch: [{ required: true, message: 'is required', trigger: 'change' }]
      },
      downloadLoading: false,
      //cascader
      cascader_value: [],
      cascader_options: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.list = []
      this.listLoading = true
      fetchCrawlAccountList(this.listQuery).then(response => {
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
        name: '',
        account_fid: '',
        available: ''
      }
    },
    handleFetchFollowList(account_fid) {
      this.listLoading = true
      fetchTargetFollowHistory({account_fid}).then(response => {
        this.followData = response.data.items
        this.dialogFollowVisible = true
        this.listLoading = false
      })
    },
    handleFetchLikeList(account_fid) {
      this.listLoading = true
      fetchAccountLikesList({account_fid}).then(response => {
        this.likesData = response.data.items
        this.dialogLikesVisible = true
        this.listLoading = false
      })
    },
    handleExport() {
      let params = []
      const url = `https://47.74.153.74/boost_interface/vue-element-admin/crawlfeed/exportCrawlAccountList`
      window.open(url, '_blank')
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
          const fullLoading = this.$loading({
            lock: true,
            text: 'Loading',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          });
          updateCrawlAccount(tempData).then(() => {
            //const index = this.list.findIndex(v => v.id === this.temp.id)
            //this.list.splice(index, 1, this.temp)
            fullLoading.close()
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜,更新成功',
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
