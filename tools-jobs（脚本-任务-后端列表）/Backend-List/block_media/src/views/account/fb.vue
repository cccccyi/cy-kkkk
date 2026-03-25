<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.account_fid" placeholder="账号FID" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.user_id" placeholder="地址标签" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in locLabelsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.political_standpoint" placeholder="政治立场" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in standPointOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.copy_flag" clearable class="filter-item" placeholder="仿号" style="width:120px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <!-- <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        添加
      </el-button>&nbsp; -->
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
      <el-table-column label="ID" prop="account_id" width="100px">
        <template slot-scope="{row}">
          <span>{{ row.account_id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号">
        <template slot-scope="{row}">
          <el-link :href="row.account_url" target="_blank" type="primary">{{ row.account}}</el-link>
          <el-tag type="success" v-if="row.available=='n'">存活：{{ row.available }}</el-tag>&nbsp;
          <el-link :href="`https://www.instagram.com/${row.ins_id}`" target="_blank" v-if="row.ins_name">
            <el-tag type="danger">
              仿号INS:{{ row.ins_name }}, 待用舆材:{{ row.available_materials_count }}
            </el-tag>
          </el-link>&nbsp;
        </template>
      </el-table-column>
      <el-table-column label="FID" width="150px">
        <template slot-scope="{row}">
          <span>{{ row.account_fid }}</span>
        </template>
      </el-table-column>
      <el-table-column label="地址 / 政治立场 / 所在机器" width="200px">
        <template slot-scope="{row}">
          <span>{{ row.user_id | locFilter }} / {{ row.political_standpoint | politicalFilter }} / {{ row.identity_check }}</span>
        </template>
      </el-table-column>
      <el-table-column label="群" prop="group_num" width="80px" sortable="custom">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleFetchAccountGroup(row.account_fid)">{{ row.group_num }}</span>
        </template>
      </el-table-column>
      <el-table-column label="好友数 / 采集" width="100px">
        <template slot-scope="{row}">
          <span>{{ row.friends_count }}</span>&nbsp;/&nbsp;
          <span class="link-type" @click="handleFetchAccountFriendsList(row.account_fid)">{{ row.crawl_friend_num }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最新贴" width="120px">
        <template slot-scope="{row}">
          <span>{{ row.newest_post_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采集时间" prop="last_crawl_time" width="120px" sortable="custom">
        <template slot-scope="{row}">
          <span>{{ row.last_crawl_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="ChatGPT" align="center" width="80px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleChatGPT(row, $index)">ChatGPT</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleRestCrawltime(row.page_fid)">重置</span>&nbsp;
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
          <el-input v-model="temp.account_name" placehomlder="输入账号名" :readonly="true" />
        </el-form-item>
        <el-form :inline="true">
          <el-form-item label="跟踪 INS" prop="ins_name">
            <el-input v-model="temp.ins_name" placeholder="指定INS账号" style="width:120px;" />
          </el-form-item>
          <el-form-item label="INS ID" prop="ins_id">
            <el-input v-model="temp.ins_id" placeholder="作者ID" style="width:100px;" />
          </el-form-item>
        </el-form>
        <el-form-item label="使用间隔" prop="use_interval">
          <el-input v-model="temp.use_interval" placeholder="输入账号使用间隔" />
        </el-form-item>
        <el-divider>ChatGPT 人设</el-divider>
        <el-form-item label="职业" prop="chatgpt_profession">
          <el-input v-model="temp.chatgpt_profession" placeholder="输入账号职业信息" />
        </el-form-item>
        <el-form-item label="爱好" prop="chatgpt_hobby">
          <el-input v-model="temp.chatgpt_hobby" placeholder="输入账号爱好信息" />
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

    <el-dialog :visible.sync="dialogPvVisible" title="账号群组渗透记录" width="800px">
      <el-table :data="accountGroupList" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="index" label="序号" width="50px" />
        <el-table-column label="群组名称">
          <template slot-scope="{row}">
            <el-link :href="row.group_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
            <el-tag type="info" v-if="row.location">{{ 'L:' + row.location }}</el-tag>&nbsp;
          </template>
        </el-table-column>
        <el-table-column prop="member_count" label="成员数"  width="80px" />
        <el-table-column prop="privacy" label="隐私"  width="80px" />
        <el-table-column prop="update_time" label="采集时间"  width="120px" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogFriendRequestsVisible" title="账号好友列表">
      <el-table :data="friendRequestsList" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="id" label="ID" width="50px" />
        <el-table-column label="头像" width="50px">
          <template slot-scope="{row}">
            <el-image v-if="row.profile_picture" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_picture" ></el-image>
          </template>
        </el-table-column>
        <el-table-column label="名称">
          <template slot-scope="{row}">
            <el-link :href="row.account_url" target="_blank" type="primary">{{ row.name}}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="insert_time" label="插入时间"  width="120px" />
        <el-table-column prop="last_update_time" label="更新时间"  width="120px" />
      </el-table>
      <pagination v-show="friendRequestsListTotal>0" :total="friendRequestsListTotal" :page.sync="friendRequestsListQuery.page" :limit.sync="friendRequestsListQuery.limit" @pagination="getFriendRequestsList" />
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFriendRequestsVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogPymkVisible" title="账号可能认识人列表" width="800px">
      <el-table :data="pymkList" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="id" label="ID" width="50px" />
        <el-table-column label="头像" width="50px">
          <template slot-scope="{row}">
            <el-image v-if="row.profile_picture" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_picture" ></el-image>
          </template>
        </el-table-column>
        <el-table-column label="名称">
          <template slot-scope="{row}">
            <el-link :href="row.account_url" target="_blank" type="primary">{{ row.name}}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="social_context" label="信息" />
        <el-table-column prop="insert_time" label="插入时间"  width="120px" />
        <el-table-column prop="last_update_time" label="更新时间"  width="120px" />
      </el-table>
      <pagination v-show="pymkListTotal>0" :total="pymkListTotal" :page.sync="pymkListQuery.page" :limit.sync="pymkListQuery.limit" @pagination="getPymkList" />
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPymkVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogPymkActionListVisible" title="账号好友列表" width="800px">
      <el-table :data="pymkActionList" border fit highlight-current-row style="width: 100%" class="defaultFont">
        <el-table-column prop="id" label="ID" width="60px" />
        <el-table-column label="头像" width="50px">
          <template slot-scope="{row}">
            <el-image v-if="row.profile_picture" style="width:25px;height:25px;vertical-align:middle;" :src="row.profile_picture" ></el-image>
          </template>
        </el-table-column>
        <el-table-column label="账号">
          <template slot-scope="{row}">
            <el-link :href="row.account_url" target="_blank" type="primary">{{ row.name}}</el-link>&nbsp;
            <el-tag type="warning" v-if="row.city">{{ 'C:' + row.city }}</el-tag>&nbsp;
            <el-tag type="info" v-if="row.home_town">{{ 'H:' + row.home_town }}</el-tag>&nbsp;
            <el-tag type="success" v-if="row.friends_count>0">{{ 'F:' + row.friends_count }}</el-tag>&nbsp;
          </template>
        </el-table-column>
        <el-table-column prop="insert_time" label="插入时间"  width="105px" />
      </el-table>
      <pagination v-show="pymkActionListTotal>0" :total="pymkActionListTotal" :page.sync="pymkActionListQuery.page" :limit.sync="pymkActionListQuery.limit" @pagination="getPymkActionList" />
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPymkActionListVisible = false">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogChatGPTVisible" title="舆材自动生成" width="800px">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="0" style="margin:10px 30px;">
        <el-row style="margin-bottom:10px;">
          <el-descriptions title="账号人设信息" :column="3" border>
            <el-descriptions-item label="性别">{{chatGPTTemp.gender}}</el-descriptions-item>
            <el-descriptions-item label="职业" label-class-name="my-label" content-class-name="my-content">{{chatGPTTemp.chatgpt_profession}}</el-descriptions-item>
            <el-descriptions-item label="兴趣">{{chatGPTTemp.chatgpt_hobby}}</el-descriptions-item>            
            <el-descriptions-item label="地址">
              <el-tag size="small">账号所在地址</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-row>
        <el-row>
          <el-input type="textarea" autosize v-model="prompt_text" placeholder="Send a message" />
          <span class="generate-btn"><i class="el-icon-position" style="cursor:pointer;" @click="generateMaterial()"></i></span>
        </el-row>
        <el-row v-loading="materialListLoading">
          <el-card
            v-for="(row, $index) in materialList"
            :key="row.id"
            class="material-card">
            <div slot="header" class="clearfix">
              <el-row style="text-align:right;padding:0 0 5px 0;"><span>{{row.insert_time}}</span></el-row>
              <el-row class="prompt-area">
                <div style="padding:0 10px;"><span class="prompt-title">pro</span></div>
                <div>
                  <span>{{row.prompt}}</span>
                </div>
              </el-row>
            </div>
            <div class="text item">
              <el-row class="prompt-area">
                <div style="padding:0 10px;"><span class="prompt-title" style="background-color: aquamarine;">gpt</span></div>
                <div style="flex-grow:1;">
                  <el-input v-if="materialList[$index].is_edit" type="textarea" autosize v-model="materialList[$index].content" />
                  <div v-else>{{materialList[$index].content}}</div>
                  <div>
                    <el-image v-if="materialList[$index].image_url" style="width:200px;" :src="materialList[$index].image_url" :preview-src-list="[materialList[$index].image_url]" referrerPolicy="no-referrer"></el-image>
                  </div>
                </div>
                <div style="padding:0 10px;">
                  <span class="action-btn-span" style="cursor:pointer;margin-left:6px;position:relative;top:2px;">
                    <i class="el-icon-edit-outline" @click="editMaterial(row, $index)"></i>
                  </span>
                  <span class="action-btn-span" style="cursor:pointer;margin-left:6px;position:relative;top:2px;">
                    <i class="el-icon-picture-outline" @click="generateImage(row, $index)"></i>
                  </span>
                </div>
              </el-row>
            </div>
          </el-card>
          <pagination v-show="materialTotal>0" :total="materialTotal" :page.sync="materialListQuery.page" :limit.sync="materialListQuery.limit" @pagination="getMaterialList" :page-sizes="[5, 10, 20, 30, 50]" />
        </el-row>
      </el-form>
    </el-dialog>

  </div>
</template>

<script>
import { fetchFbAccountList, createFbAccount, updateFbAccount, fetchAccountGroupList, fetchAccountFriendsList } from '@/api/account'
import { generateMaterialChatGPT, fetchChatGPTMaterialList, updateMaterialChatGPT, generateImageChatGPT } from '@/api/chatgpt'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    locFilter(user_id) {
      let loc = '未设置'
      switch(user_id){
        case 886:
          loc = '台湾'
          break;
        case 81:
          loc = '日本'
          break;
        case 82:
          loc = '韩国'
          break;
        case 852:
          loc = '香港'
          break;
      }
      return loc
    },
    politicalFilter(status) {
      const map = {
        positive: '正面',
        negative: '负面',
        neutral: '中性',
        unknow: '未设置'
      }
      return map[status]
    },
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
        {value:886, label:'台湾'},
        {value:81, label:'日本'},
        {value:82, label:'韩国'},
        {value:852, label:'香港'},
        {value:1, label:'未设置'}
      ],
      standPointOptions: [
        {value:'positive', label:'正面'},
        {value:'negative', label:'负面'},
        {value:'neutral', label:'中性'},
        {value:'unknow', label:'未设置'}
      ],
      useTypeOptions: [],
      availableOptions: ['y', 'n', 'c'],
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
    resetTemp() {
      this.temp = {
        id: undefined,
        identity: '',
        password: '',
        account: '',
        use_type: '',
        browser_dir: '',
        available: 'y',
        can_comment: 'y',
        can_permeation: 'y',
        project: '',
        group_fid: '',
        friends_loc: '',
        bili_name: '',
        bili_aid: '',
        bili_tid: '',
        remote_ip: '',
        proxy_ip: '',
        remark: '',
        cookie_str: '',
        use_interval: 0,
        chatgpt_profession: '',
        chatgpt_hobby: ''
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
            createFbAccount(this.temp).then(() => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜,新增成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleChatGPT(row) {
      this.dialogChatGPTVisible = true
      this.chatGPTTemp = Object.assign({}, row)
      this.prompt_text = `你是一个facebook用户，性别是${this.chatGPTTemp.gender}，真实职业为${this.chatGPTTemp.chatgpt_profession}，喜欢${this.chatGPTTemp.chatgpt_hobby}，请生成一条可以发布到facebook 时间线上的帖子。要求：1.字数控制在140-200之间。2.直接输出帖子内容`;
      this.getMaterialList()
    },
    getMaterialList() {
      this.materialList = []
      this.materialListLoading = true
      this.materialListQuery.account_fid = this.chatGPTTemp.account_fid
      fetchChatGPTMaterialList(this.materialListQuery).then(response => {
        this.materialList = response.data.items
        this.materialTotal = response.data.total
        this.materialListLoading = false
      })
    },
    generateMaterial() {
      this.showFullLoading()
      const params = {
        account_fid: this.chatGPTTemp.account_fid,
        prompt: this.prompt_text
      }
      generateMaterialChatGPT(params).then(response => {
        if(response.error){
          this.$notify({
              title: '失败',
              message: response.error,
              type: 'error',
              duration: 2000
            })
        }
        this.colseFullLoading()
        this.getMaterialList()
      })
    },
    editMaterial(row, index) {
      if (row.is_edit) {
        const fullLoading = this.$loading({
          lock: true,
          text: 'Loading',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        updateMaterialChatGPT(row).then(()=>{
          fullLoading.close()
        })
        row.is_edit = false
        this.materialList.splice(index, 1, row)
      } else {
        row.is_edit = true
        this.materialList.splice(index, 1, row)
      }
    },
    generateImage(row, index) {
      this.showFullLoading()
      const params = {
        id: row.id,
        content: row.content
      }
      generateImageChatGPT(params).then(response => {
        if(response.error){
          this.$notify({
              title: '失败',
              message: response.error,
              type: 'error',
              duration: 2000
            })
        }
        this.colseFullLoading()
        this.getMaterialList()
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
          const fullLoading = this.$loading({
            lock: true,
            text: 'Loading',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          });
          updateFbAccount(tempData).then(() => {
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
    handleGetFriendRequestsList(identity){
      this.friendRequestsListQuery.account_fid = identity
      this.getFriendRequestsList()
    },
    getFriendRequestsList(){
      fetchFriendRequestsList(this.friendRequestsListQuery).then(response => {
        this.friendRequestsList = response.data.items
        this.friendRequestsListTotal = response.data.total
        this.dialogFriendRequestsVisible = true
      })
    },
    handleGetPymkList(identity){
      this.pymkListQuery.account_fid = identity
      this.getPymkList()
    },
    getPymkList(){
      fetchPymkList(this.pymkListQuery).then(response => {
        this.pymkList = response.data.items
        this.pymkListTotal = response.data.total
        this.dialogPymkVisible = true
      })
    },
    handleFetchAccountGroup(account_fid) {
      this.listLoading = true
      fetchAccountGroupList({account_fid}).then(response => {
        this.accountGroupList = response.data.items
        this.dialogPvVisible = true
        this.listLoading = false
      })
    },
    handlePymkActionListFilter(){
      this.pymkActionListQuery.page = 1
      this.getPymkActionList()
    },
    handleFetchAccountFriendsList(account_fid){
      this.pymkActionListQuery.account_fid = account_fid
      this.getPymkActionList()
    },
    getPymkActionList(){
      this.listLoading = true
      fetchAccountFriendsList(this.pymkActionListQuery).then(response => {
        this.pymkActionList = response.data.items
        this.pymkActionListTotal = response.data.total
        this.dialogPymkActionListVisible = true
        this.listLoading = false
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