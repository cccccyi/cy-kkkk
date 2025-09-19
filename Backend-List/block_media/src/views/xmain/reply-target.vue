<template>
  <div class="app-container">
    <div class="filter-container">
      <!--
      <el-select v-model="listQuery.available" placeholder="可用" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.loc" placeholder="所在设备" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in locOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      -->
      <el-input v-model="listQuery.screen_name" placeholder="screen_name" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleTargetCreate">添加目标</el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleBlackCreate">添加黑名单</el-button>&nbsp;
    </div>

    <el-row :gutter="20">
      <!-- 第一列 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <div slot="header" class="table-header">主账号评论目标</div>
          <el-table
            key="tableKey1"
            v-loading="targetListLoading"
            :data="targetList"
            height="calc(100vh - 220px)"
            border
            style="width: 100%">
            <el-table-column label="账号">
              <template slot-scope="{row}">
                <el-tooltip class="item" effect="dark" placement="top-start">
                  <div slot="content" style="max-width:400px;">账号名: {{ row.name }}<br>简介:<br>{{ row.description }}</div>
                  <el-image v-if="row.profile_picture" style="max-width:40px;vertical-align:middle;margin-right:10px;" :src="row.profile_picture" :preview-src-list="[row.profile_picture]" />
                </el-tooltip>
                <el-link :href="row.profile_url" target="_blank" type="primary">{{ row.screen_name}}</el-link>
                <i v-if="row.is_blue_verified && row.profile_image_shape!='Square'" class="el-icon-medal" :style="{color: 'blue', margin:'0 5px'}" title="X蓝标" />
                <i v-if="row.profile_image_shape=='Square'" class="el-icon-medal" :style="{color: 'orange', margin:'0 5px'}" title="X金标" />
                <i class="el-icon-data-line" :style="{color: row.x_list_id? 'blue' : 'gray', margin:'0 5px'}" title="蓝色已监控，灰色还未监控" />
                <el-tag v-if="row.reply_num" type="danger" title="累计评论数">{{ row.reply_num }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="粉丝" prop="friends_count" width="140px">
              <template slot-scope="{row}">
                <span>{{ row.followers_count }}</span>
                <el-tag v-if="row.followed_by=='1'" type="danger" style="margin-left:5px;">互关</el-tag>
                <el-tag v-else-if="row.following=='1'" type="success" style="margin-left:5px;">关注</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="" align="center" class-name="small-padding fixed-width" width="40px">
              <template slot-scope="{row,$index}">
                <span class="action-btn-span" style="cursor:pointer;" title="从评论目标踢除">
                  <i class="el-icon-delete" type="primary" style="font-size:18px;color:skyblue;" @click="handleKickOff(row, $index)" />
                </span>
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <pagination
            v-show="targetListTotal > 0"
            layout="total, pager"
            :total="targetListTotal"
            :page-size="50"
            :pager-count="5"
            :page.sync="listQuery.targetPage"
            :limit.sync="listQuery.targetLimit"
            style="margin:10px 0;"
            @pagination="getList"
          />
        </el-card>
      </el-col>

      <!-- 第二列 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <div slot="header" class="table-header">主账号关注列表</div>
          <el-table
            key="tableKey2"
            v-loading="followingListLoading"
            :data="followingList"
            height="calc(100vh - 220px)"
            border
            style="width: 100%">
            <el-table-column label="账号">
              <template slot-scope="{row}">
                <el-tooltip class="item" effect="dark" placement="top-start">
                  <div slot="content" style="max-width:400px;">账号名: {{ row.name }}<br>简介:<br>{{ row.description }}</div>
                  <el-image v-if="row.profile_picture" style="max-width:40px;vertical-align:middle;margin-right:10px;" :src="row.profile_picture" :preview-src-list="[row.profile_picture]" />
                </el-tooltip>
                <el-link :href="row.profile_url" target="_blank" type="primary">{{ row.screen_name}}</el-link>&nbsp;
                <i v-if="row.is_blue_verified && row.profile_image_shape!='Square'" class="el-icon-medal" :style="{color: 'blue', margin:'0 5px'}" title="X蓝标" />
                <i v-if="row.profile_image_shape=='Square'" class="el-icon-medal" :style="{color: 'orange', margin:'0 5px'}" title="X金标" />
                <el-tag v-if="row.b_id" type="info">黑名单</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="粉丝" prop="friends_count" width="140px">
              <template slot-scope="{row}">
                <span>{{ row.followers_count }}</span>
                <el-tag v-if="row.followed_by=='1'" type="danger" style="margin-left:5px;">互关</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="" align="center" class-name="small-padding fixed-width" width="40px">
              <template slot-scope="{row,$index}">
                <span class="action-btn-span" style="cursor:pointer;" title="添加至评论目标">
                  <i v-if="row.reply_flag!='y'" class="el-icon-s-promotion" type="primary" style="font-size:18px;color:skyblue;" @click="handleAddTarget(row, $index)" />
                </span>
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <pagination
            v-show="followingListTotal > 0"
            layout="total, pager"
            :total="followingListTotal"
            :page-size="50"
            :pager-count="5"
            :page.sync="listQuery.followingPage"
            :limit.sync="listQuery.followingLimit"
            style="margin:10px 0;"
            @pagination="getFollowingList"
          />
        </el-card>
      </el-col>

      <!-- 第三列 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <div slot="header" class="table-header">黑名单</div>
          <el-table
            key="tableKey3"
            v-loading="blackListLoading"
            :data="blackList"
            height="calc(100vh - 220px)"
            border
            style="width: 100%">
            <el-table-column label="账号">
              <template slot-scope="{row}">
                <el-tooltip class="item" effect="dark" placement="top-start">
                  <div slot="content" style="max-width:400px;">账号名: {{ row.name }}<br>简介:<br>{{ row.description }}</div>
                  <el-image v-if="row.profile_picture" style="max-width:40px;vertical-align:middle;margin-right:10px;" :src="row.profile_picture" :preview-src-list="[row.profile_picture]" />
                </el-tooltip>
                <el-link :href="row.profile_url" target="_blank" type="primary">{{ row.screen_name}}</el-link>
                <i v-if="row.is_blue_verified && row.profile_image_shape!='Square'" class="el-icon-medal" :style="{color: 'blue', margin:'0 5px'}" title="X蓝标" />
                <i v-if="row.profile_image_shape=='Square'" class="el-icon-medal" :style="{color: 'orange', margin:'0 5px'}" title="X金标" />
              </template>
            </el-table-column>
            <el-table-column label="粉丝" prop="friends_count" width="140px">
              <template slot-scope="{row}">
                <span>{{ row.followers_count }}</span>
                <el-tag v-if="row.followed_by=='1'" type="danger" style="margin-left:5px;">互关</el-tag>
                <el-tag v-else-if="row.following=='1'" type="success" style="margin-left:5px;">关注</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <pagination
            v-show="blackListTotal > 0"
            layout="total, pager"
            :total="blackListTotal"
            :page-size="50"
            :pager-count="5"
            :page.sync="listQuery.blackPage"
            :limit.sync="listQuery.blackLimit"
            style="margin:10px 0;"
            @pagination="getBlackList"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading="dialogLoading">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 600px;">
        <el-form-item label="密码" prop="password">
          <el-input v-model="temp.password" placeholder="输入账号密码" />
        </el-form-item>
        <el-form-item label="Loc" prop="loc">
          <el-input v-model="temp.loc" placeholder="所在设备" />
        </el-form-item>
        <el-form-item label="账号名" prop="screen_name">
          <el-input v-model="temp.screen_name" placeholder="@账号" />
        </el-form-item>
        <el-form-item label="可用" prop="available">
          <el-select v-model="temp.available" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="temp.remark" type="textarea" :rows="4" placeholder="备注信息" />
        </el-form-item>
        <el-form-item label="推文内容" prop="source_tweet">
          <el-input v-model="temp.source_tweet" type="textarea" :rows="4" placeholder="填写原推文信息，使用下面的提示词生成评论" />
        </el-form-item>
        <el-form-item label="评论提示词" prop="character_setting">
          <el-input v-model="temp.character_setting" type="textarea" :autosize="{ minRows: 10, maxRows: 15}" placeholder="评论提示词" />
        </el-form-item>
        <el-form-item label="生成评论" prop="gen_reply">
          <el-input v-model="temp.gen_reply" type="textarea" :rows="4" placeholder="填写原推文信息，使用下面的提示词生成评论" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="添加目标" :visible.sync="dialogTargetFormVisible">
      <el-form ref="dataForm" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="@账号" prop="names">
          <el-input v-model="temp.targets" :autosize="{ minRows: 10, maxRows: 20}" type="textarea" placeholder="twitter账号，@screen_name，一行一个" style="width:300px;" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogTargetFormVisible = false">取消</el-button>
        <el-button type="primary" @click="createTargetData()">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="添加黑名单" :visible.sync="dialogBlackFormVisible">
      <el-form ref="dataForm" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="@账号" prop="names">
          <el-input v-model="temp.blacks" :autosize="{ minRows: 10, maxRows: 20}" type="textarea" placeholder="twitter账号，@screen_name，一行一个" style="width:300px;" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogBlackFormVisible = false">取消</el-button>
        <el-button type="primary" @click="createBlackData()">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchXmainReplyTarget, fetchXfollowingTarget, fetchXblackTarget, kickOffXmainReplyTarget, addXmainReplyTarget, createTargetAccount, createBlackAccount, createAccount, updateAccount } from '@/api/bctwitter'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { Message, MessageBox } from 'element-ui'

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        y: 'success',
        n: 'danger',
        c: 'warning'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      tableKey: 0,
      targetList: null,
      targetListTotal: 0,
      targetListLoading: true,
      followingList: null,
      followingListTotal: 0,
      followingListLoading: true,
      blackList: null,
      blackListTotal: 0,
      blackListLoading: true,
      dialogLoading: false,
      listQuery: {
        targetPage: 1,
        targetLimit: 50,
        followingPage: 1,
        followingLimit: 50,
        blackPage: 1,
        blackLimit: 50,
        screen_name: ''
      },
      useTypeOptions: [],
      showReviewer: false,
      temp: {
        targets: '',
        blacks: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
      dialogTargetFormVisible: false,
      dialogBlackFormVisible: false,
      pvData: [],
      rules: {
        phone: [{ required: true, message: '需要填写账号phone', trigger: 'blur' }],
        password: [{ required: true, message: '需要填写账号密码', trigger: 'blur' }],
        available: [{ required: true, message: '当前可用状态', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getAllData()
  },
  methods: {
    getAllData() {
      this.getList()
      this.getFollowingList()
      this.getBlackList()
    },
    getList() {
      this.targetListLoading = true
      this.targetList = []
      const query = {
        page: this.listQuery.targetPage,
        limit: this.listQuery.targetLimit,
        screen_name: this.listQuery.screen_name
      }
      fetchXmainReplyTarget(query).then(response => {
        this.targetList = response.data.items
        this.targetListTotal = response.data.total
        this.targetListLoading = false
      })
    },
    getFollowingList() {
      this.followingListLoading = true
      this.followingList = []
      const query = {
        page: this.listQuery.followingPage,
        limit: this.listQuery.followingLimit,
        screen_name: this.listQuery.screen_name
      }
      fetchXfollowingTarget(query).then(response => {
        this.followingList = response.data.items
        this.followingListTotal = response.data.total
        this.followingListLoading = false
      })
    },
    getBlackList() {
      this.blackListLoading = true
      this.blackList = []
      const query = {
        page: this.listQuery.blackPage,
        limit: this.listQuery.blackLimit,
        screen_name: this.listQuery.screen_name
      }
      fetchXblackTarget(query).then(response => {
        this.blackList = response.data.items
        this.blackListTotal = response.data.total
        this.blackListLoading = false
      })
    },
    handleFilter() {
      this.getAllData()
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
        targets: '',
        blacks: ''
      }
    },
    handleKickOff(row, index) {
      MessageBox.confirm('确定要将目标踢除，添加进黑名单？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.targetListLoading = true
        const query = {
          id: row.id,
          screen_name: row.screen_name
        }
        kickOffXmainReplyTarget(query).then(response => {
          this.targetListLoading = false
          this.getList()
          this.getBlackList()
        })
      }).catch(() => {
        Message.info('已取消操作')
      })
    },
    handleAddTarget(row, index) {
      MessageBox.confirm('确定要将目标，添加进评论目标？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.temp.targets = row.screen_name
        createTargetAccount(this.temp).then((res) => {
          this.$notify({
            title: '成功',
            message: res.msg,
            type: 'success',
            duration: 2000
          })
          this.getList()
          this.getBlackList()
        })
      }).catch(() => {
        Message.info('已取消操作')
      })
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
          createAccount(this.temp).then(() => {
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
          updateAccount(tempData).then((data) => {
            console.log(data)
            // this.dialogFormVisible = false
            // this.$notify({
            //   title: '成功',
            //   message: '恭喜，更新成功',
            //   type: 'success',
            //   duration: 2000
            // })
            this.temp.gen_reply = data.data
            this.dialogLoading = false
            // this.getList()
          })
        }
      })
    },
    handleTargetCreate() {
      this.resetTemp()
      this.dialogTargetFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createTargetData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createTargetAccount(this.temp).then((res) => {
            this.dialogTargetFormVisible = false
            this.$notify({
              title: '成功',
              message: res.msg,
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    handleBlackCreate() {
      this.resetTemp()
      this.dialogBlackFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createBlackData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createBlackAccount(this.temp).then((res) => {
            this.dialogBlackFormVisible = false
            this.$notify({
              title: '成功',
              message: res.msg,
              type: 'success',
              duration: 2000
            })
            this.getList()
            this.getBlackList()
          })
        }
      })
    }
  }
}
</script>
<style scoped>
.el-card >>> .el-card__body {
  padding: 0;
}

.table-header {
  font-weight: bold;
  font-size: 16px;
}
.pagination, .el-pagination {
  text-align: center;
  margin-top: 10px;
}
</style>
