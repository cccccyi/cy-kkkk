<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.account_fid" placeholder="账号FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.project_name" placeholder="所有项目" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in locLabelsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.default_picture" clearable class="filter-item" placeholder="默认头像" style="width:120px">
        <el-option v-for="item in defaultOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
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
      <el-table-column label="ID" prop="id" width="100px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="归属" width="120px">
        <template slot-scope="{row}">
          <span>{{ row.project_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号">
        <template slot-scope="{row}">
          <el-link :href="row.account_url" target="_blank" type="primary">{{ row.account}}</el-link>
          <el-tag type="success" v-if="row.available=='n'">存活：{{ row.available }}</el-tag>&nbsp;<br/>
          <el-tag type="info" v-if="row.account_type">Type：{{ row.account_type }}</el-tag>&nbsp;
          <el-tag type="warning" v-if="row.friends_count">Friend:{{ row.friends_count }}</el-tag>&nbsp;
          <el-tag type="success" v-if="row.followers_count">Followers:{{ row.followers_count }}</el-tag>&nbsp;
          <el-tag type="info" v-if="row.following_count">Following:{{ row.following_count }}</el-tag>&nbsp;
          <el-tag type="success" v-if="row.likes_count">Likes:{{ row.likes_count }}</el-tag>&nbsp;
          <el-tag type="danger" v-if="row.member_count">Member：{{ row.member_count }}</el-tag>&nbsp;<br/>
          <el-tag type="success" v-if="row.privacy">Privacy:{{ row.privacy }}</el-tag>&nbsp;
          <el-tag type="danger" v-if="row.gender">Gender：{{ row.gender }}</el-tag>&nbsp;
          <el-tag type="success" v-if="row.birth">Birth:{{ row.birth }}</el-tag>&nbsp;
          <el-tag type="info" v-if="row.hometown">Hometown:{{ row.hometown }}</el-tag>&nbsp;
          <el-tag type="danger" v-if="row.current_city">City:{{ row.current_city }}</el-tag>&nbsp;
          <el-tag type="success" v-if="row.moved_city">MovedCity:{{ row.moved_city }}</el-tag>&nbsp;<br/>
          <el-tag type="danger" v-if="row.education" :title="row.education">Education:{{ row.education }}</el-tag>&nbsp;
          <el-tag type="info" v-if="row.work" :title="row.work">Work:{{ row.work }}</el-tag>&nbsp;
        </template>
      </el-table-column>
      <el-table-column label="默认" width="50px">
        <template slot-scope="{row}">
          <span>{{ row.default_profile_picture }}</span>
        </template>
      </el-table-column>
      <el-table-column label="头像" width="100px">
        <template slot-scope="{row}">
          <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
              <el-image v-if="row.profile_picture" :src="row.profile_picture" referrerPolicy="no-referrer"></el-image>
          </el-aside>
        </template>
      </el-table-column>
      <el-table-column label="背景" width="100px">
        <template slot-scope="{row}">
          <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
              <el-image v-if="row.cover_picture" :src="row.cover_picture" referrerPolicy="no-referrer"></el-image>
          </el-aside>
        </template>
      </el-table-column>
      <el-table-column label="采集时间" prop="crawl_finish_time" width="120px" sortable="custom">
        <template slot-scope="{row}">
          <span>{{ row.crawl_finish_time }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" :page-sizes="[10, 20, 50, 1000]" />

  </div>
</template>

<script>
import { fetchFbAccountList, crawlTaskStatistic } from '@/api/crawler'
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
    },
    actionTextColor(action){
      const actionMap = {
        'add': 'color:green',
        'remove': 'color:red',
        'ignore': 'color:gray'
      }
      return actionMap[action]
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
        use_type: undefined,
        available: undefined,
        copy_flag: undefined
      },
      locLabelsOptions: [
        {value:'hbv5_ipv6', label:'hbv5_ipv6'},
        {value:'hbv5', label:'hbv5'},
        {value:'J719-V5', label:'J719-V5'},
        {value:'hbv5_group', label:'hbv5_group'},
        {value:'hk01', label:'hk01'}
      ],
      useTypeOptions: [],
      defaultOptions: ['true', 'false'],
      projectOptions: [],
      showReviewer: false,
      temp: {
        id: undefined,
        account_fid: '',
        account_name: '',
        available: 'y',
        can_comment: 'y',
        ins_name: '',
        ins_id: '',
        post_interval: '',
        chatgpt_profession: '',
        chatgpt_hobby: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      accountGroupList: [],
      dialogFriendRequestsVisible: false,
      friendRequestsList: [],
      friendRequestsListTotal: 0,
      friendRequestsListQuery: {
        page: 1,
        limit: 50,
        account_fid: undefined
      },
      dialogPymkVisible: false,
      pymkList: [],
      pymkListTotal: 0,
      pymkListQuery: {
        page: 1,
        limit: 50,
        account_fid: undefined
      },
      pymkActionTypeOptions: [{label:'All', value:''},{label:'add', value:'add'}, {label:'remove', value:'remove'}, {label:'ignore', value:'ignore'}],
      pymkActionList: [],
      dialogPymkActionListVisible: false,
      pymkActionListTotal: 0,
      pymkActionListQuery: {
        page: 1,
        limit: 50,
        account_fid: undefined,
        action: '',
        date_range: ''
      },
      dialogChatGPTVisible: false,
      materialDialogLoading: false,
      materialList: [],
      materialTotal: 0,
      materialListLoading: true,
      materialListQuery: {
        page: 1,
        limit: 5,
        account_fid: null
      },
      chatGPTTemp: {
        account_fid: ''
      },
      prompt_text: '',
      rules: {
        identity: [{ required: true, message: '需要填写账号FID', trigger: 'blur' }],
        password: [{ required: true, message: '需要填写账号密码', trigger: 'blur' }],
        browser_dir: [{ required: true, message: '浏览器缓存目录', trigger: 'change' }],
        use_type: [{ required: true, message: '账号用途', trigger: 'change' }],
        available: [{ required: true, message: '当前可用状态', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    showFullLoading() {
      this.fullLoading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
    },
    colseFullLoading() {
      this.fullLoading.close()
    },
    getList() {
      this.list = []
      this.listLoading = true
      fetchFbAccountList(this.listQuery).then(response => {
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
      let sort = ''
      if (order === 'ascending') {
        sort = '+'
      } else {
        sort = '-'
      }
      this.listQuery.sort = `${sort}${prop}`
      this.handleFilter()
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+last_update_time'
      } else {
        this.listQuery.sort = '-last_update_time'
      }
      this.handleFilter()
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
    }
  }
}
</script>
<style scoped>
.material-card {
  margin-top: 10px;
}
.generate-btn{
  float: right;
  position: relative;
  bottom: 20px;
  right: 26px;
  color: #d04703;
  font-size: larger;
}
.generate-btn:hover{
  color: #f00;
}
.action-btn-span{
  color: #d04703;
}
.prompt-area {
  display:flex;
}
.prompt-title {
  display: inline-block;
  width: 26px;
  height: 26px;
  background: #d04703;
  line-height: 26px;
  text-align: center;
  color: #fff;
}

</style>