<template>
  <div class="app-container">
    <div class="filter-container">
      <el-select v-model="listQuery.available" placeholder="可用" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
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
      <el-table-column label="真实头像">
        <template slot-scope="{row}">
          <el-image v-if="row.photo" :src="row.photo" :key="img" style="max-width: 80px;"></el-image>
        </template>
      </el-table-column>
      <el-table-column label="设置头像">
        <template slot-scope="{row}">
          <el-image v-if="row.upload_photo" :src="'http://221.120.163.66:38011/uwants_images/' + row.upload_photo" :key="img" style="max-width: 80px;"></el-image>
        </template>
      </el-table-column>
      <el-table-column label="UID">
        <template slot-scope="{row}">
          <el-link :href="'https://news.discuss.com.hk/space.php?uid=' + row.uid" target="_blank" type="primary">{{ row.uid}}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="账号">
        <template slot-scope="{row}">
          {{ row.account}}&nbsp;
          <el-tag :type="row.available | statusFilter"> {{ row.available }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="密码">
        <template slot-scope="{row}">
          <span>{{ row.password }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所在机器">
        <template slot-scope="{row}">
          <span>{{ row.loc }}</span>
        </template>
      </el-table-column>
      <el-table-column label="级别">
        <template slot-scope="{row}">
          <span>{{ row.position }}</span>
        </template>
      </el-table-column>
      <el-table-column label="帖子 / 粉丝 / 追踪">
        <template slot-scope="{row}">
          <span>{{ row.thread_count + ' / ' + row.follower_count + ' / ' + row.following_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="UID" prop="uid">
          <el-input v-model="temp.uid" placeholder="输入Uwants账号, uid" />
        </el-form-item>
        <el-form-item label="账号" prop="identity">
          <el-input v-model="temp.account" placeholder="输入Uwants账号, 登录名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="temp.password" placeholder="输入账号密码" />
        </el-form-item>
        <el-form-item label="Loc" prop="loc">
          <el-input v-model="temp.loc" placeholder="所在设备" />
        </el-form-item>
        <el-form-item label="可用" prop="available">
          <el-select v-model="temp.available" class="filter-item" placeholder="Please select">
            <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload
            class="upload-demo"
            action="http://221.120.163.66:38011/boost_interface/vue-element-admin/uwants/uploadImage"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :on-success="uploadSuccess"
            :file-list="temp.fileList"
            list-type="picture">
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">只能上传jpg/png文件</div>
          </el-upload>
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
import { fetchAccountList, createAccount, updateAccount } from '@/api/discuss'
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
        limit: 20,
        available: undefined
      },
      useTypeOptions: [],
      availableOptions: ['y', 'n', 'c'],
      showReviewer: false,
      temp: {
        id: undefined,
        uid: '',
        account: '',
        password: '',
        loc: '',
        available: 'y',
        upload_photo: ''
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
        account: [{ required: true, message: '需要填写贴吧账号', trigger: 'blur' }],
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
      fetchAccountList(this.listQuery).then(response => {
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
        uid: '',
        account: '',
        password: '',
        loc: '',
        available: 'y',
        upload_photo: ''
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
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          updateAccount(tempData).then(() => {
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜，更新成功',
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
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
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
    //image
    uploadSuccess(res, file) {
      this.temp.upload_photo = res.image_path
    },
    handleRemove(file) {
      console.log(file);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleDownload(file) {
      console.log(file);
    },
  }
}
</script>
