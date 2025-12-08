<template>
  <div class="app-container">
    <div class="filter-container">
      <el-select v-model="listQuery.available" placeholder="可用" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.loc" placeholder="所在设备" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in locOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>&nbsp;
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
      <el-table-column label="screen_name">
        <template slot-scope="{row}">
          <el-link :href="row.profile_url" target="_blank" type="primary">{{ '@' + row.screen_name}}</el-link>&nbsp;
          <el-tag :type="row.available | statusFilter"> {{ row.available_str }}</el-tag>
          <div>
            <span>角色设定： </span>{{ row.character_setting }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="头像" width="60px" style="text-align:center;">
        <template slot-scope="{row}">
          <el-image v-if="row.profile_picture" style="width:35px;height:35px;vertical-align:middle;" :src="row.profile_picture" ></el-image>
        </template>
      </el-table-column>
      <el-table-column label="贴文 / 粉丝 / 关注" prop="friends_count" width="160px">
        <template slot-scope="{row}">
          <span>{{ row.tweets_count + ' / ' + row.followers_count + ' / ' + row.followers_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所在机器" width="180px">
        <template slot-scope="{row}">
          <span>{{ row.loc }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作时间" width="150px">
        <template slot-scope="{row}">
          <span>{{ row.last_use_time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width"  width="80px">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading="dialogLoading">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 600px;">
        <!--
        <el-form-item label="登录账号" prop="account">
          <el-input v-model="temp.account" placeholder="登录账号" />
        </el-form-item>
        -->
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
  </div>
</template>

<script>
import { fetchGuidTwAccount, createAccount, updateAccount } from '@/api/bctwitter'
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
        c: 'warning'
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
        limit: 20,
        available: undefined
      },
      useTypeOptions: [],
      availableOptions: [
        { key: 'y', label: '正常' },
        { key: 'n', label: '被验证' },
        { key: 'c', label: '暂停' }
      ],
      locOptions: [
        { key: 'machine_ytj_gongying', label: 'machine_ytj_gongying' },
        { key: 'machine_hwy_001', label: 'machine_hwy_001' },
        { key: 'machine_bjb_hsx', label: 'machine_bjb_hsx' },
        { key: 'machine_tsj_hsx', label: 'machine_tsj_hsx' }
      ],
      showReviewer: false,
      temp: {
        id: '',
        account: '',
        password: '',
        screen_name: '',
        loc: '',
        available: 'y',
        source_tweet: '',
        character_setting: '',
        gen_reply: '',
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
        phone: [{ required: true, message: '需要填写账号phone', trigger: 'blur' }],
        password: [{ required: true, message: '需要填写账号密码', trigger: 'blur' }],
        available: [{ required: true, message: '当前可用状态', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      this.list = []
      fetchGuidTwAccount(this.listQuery).then(response => {
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
        account: '',
        password: '',
        screen_name: '',
        loc: '',
        available: 'y',
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
    handleDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>
