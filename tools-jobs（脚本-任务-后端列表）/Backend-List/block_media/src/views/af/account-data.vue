<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button v-show="false" v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
    </div>

    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>各网站引导账号数据</span>
      </div>
      <el-table
        key="af-account-present-table"
        v-loading="accountDataListLoading"
        :data="accountDatalist"
        :border="true"
        fit
        highlight-current-row
        style="width: 100%;"
        class="defaultFont"
      >
        <el-table-column label="ID" prop="id" width="80px">
          <template slot-scope="{row}">
            <span>{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="site" label="网站" width="100px" />
        <el-table-column prop="account_number" label="账号总数" width="120px" />
        <el-table-column prop="breed_account_number" label="精细化账号数" width="120px" />
        <el-table-column prop="normal_account_number" label="普通账号数" width="120px" />
        <el-table-column prop="top_account_number" label="大V账号数" width="120px" />
        <el-table-column prop="middle_account_number" label="中间账号数" width="120px" />
        <el-table-column prop="general_account_number" label="一般账号数" width="120px" />
        <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
          <template slot-scope="{row, $index}">
            <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>&nbsp;
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="box-card" style="margin-top:10px;">
      <div slot="header" class="clearfix">
        <span>各网站区域数据设置</span>
      </div>
      <div class="filter-container">
        <el-select v-model="locationListQuery.site_id" placeholder="网站" clearable class="filter-item" style="width: 130px">
          <el-option v-for="item in siteOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>&nbsp;
        <el-input v-model="locationListQuery.location" placeholder="地区" clearable class="filter-item" style="width:120px" />&nbsp;
        <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
        <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreateLocation">添加</el-button>&nbsp;
      </div>
      <el-table
        key="af-account-location-table"
        v-loading="locationDataListLoading"
        :data="locationDatalist"
        :border="true"
        fit
        highlight-current-row
        style="width: 100%;"
        class="defaultFont"
      >
        <el-table-column label="ID" prop="id" width="80px">
          <template slot-scope="{row}">
            <span>{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="site" label="网站" width="100px" />
        <el-table-column prop="location" label="地区" width="200px" />
        <el-table-column prop="account_number" label="账号数" width="120px" />
        <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
          <template slot-scope="{row, $index}">
            <span class="link-type" @click="handleUpdateLocation(row, $index)">编辑</span>&nbsp;
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :model="temp" label-position="left" label-width="120px" style="width: 500px; margin-left:50px;">
        <el-form-item label="网站" prop="site">
          <el-input v-model="temp.site" readonly style="background-color: #ddd;" />
        </el-form-item>
        <el-form-item label="账号总数" prop="account_number">
          <el-input v-model.number="temp.account_number" placeholder="账号总数" />
        </el-form-item>
        <el-form-item label="精细化账号数" prop="breed_account_number">
          <el-input v-model.number="temp.breed_account_number" placeholder="精细化账号数" />
        </el-form-item>
        <el-form-item label="普通账号数" prop="normal_account_number">
          <el-input v-model.number="temp.normal_account_number" placeholder="普通账号数" />
        </el-form-item>
        <el-form-item label="大V账号数" prop="top_account_number">
          <el-input v-model.number="temp.top_account_number" placeholder="大V账号数" />
        </el-form-item>
        <el-form-item label="中间账号数" prop="middle_account_number">
          <el-input v-model.number="temp.middle_account_number" placeholder="中间账号数" />
        </el-form-item>
        <el-form-item label="一般账号数" prop="general_account_number">
          <el-input v-model.number="temp.general_account_number" placeholder="一般账号数" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="updateAccountData()">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogLocationFormVisible">
      <el-form ref="dataLocationForm" :model="locationTemp" label-position="left" label-width="120px" style="width: 500px; margin-left:50px;">
        <el-form-item label="网站" prop="site_id">
          <el-select v-model="locationTemp.site_id" placeholder="网站" clearable class="filter-item" style="width: 130px">
            <el-option v-for="item in siteOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="地区" prop="location">
          <el-input v-model="locationTemp.location" placeholder="账号地区" />
        </el-form-item>
        <el-form-item label="账号总数" prop="account_number">
          <el-input v-model.number="locationTemp.account_number" placeholder="账号总数" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogLocationFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogLocationStatus==='create'?createLocationData() : updateLocationData()">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { getAccountPresentData, updateAccountPresentData, getAccountLocationData, createAccountLocationData, updateAccountLocationData } from '@/api/af'
import waves from '@/directive/waves' // waves directive

export default {
  name: 'ComplexTable',
  components: { },
  directives: { waves },
  filters: { },
  data() {
    return {
      accountDatalist: null,
      accountDataListLoading: true,
      temp: {
        id: undefined,
        site_id: '',
        account_number: '',
        breed_account_number: '',
        normal_account_number: '',
        top_account_number: '',
        middle_account_number: '',
        general_account_number: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      rules: [],
      locationDatalist: null,
      locationDataListLoading: true,
      locationListQuery: {
        site_id: '',
        location: ''
      },
      locationTemp: {
        id: '',
        site_id: '',
        location: '',
        account_number: ''
      },
      dialogLocationFormVisible: false,
      dialogLocationStatus: '',
      siteOptions: [
        { value: '1', label: 'Facebook' },
        { value: '2', label: 'Twitter' },
        { value: '3', label: 'Whatsapp' },
        { value: '4', label: 'Telegram' },
        { value: '5', label: 'Instagram' },
        { value: '6', label: 'Youtube' },
        { value: '12', label: 'Tiktok' }
      ]
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
      })
    },
    colseFullLoading() {
      this.fullLoading.close()
    },
    getList() {
      // account present data
      this.accountDatalist = []
      this.accountDataListLoading = true
      getAccountPresentData(this.listQuery).then(response => {
        this.accountDatalist = response.data.items
        this.accountDataListLoading = false
      })
      // account location data
      this.locationDatalist = []
      this.locationDataListLoading = true
      getAccountLocationData(this.locationListQuery).then(response => {
        this.locationDatalist = response.data.items
        this.locationDataListLoading = false
      })
    },
    handleFilter() {
      this.getList()
    },
    resetTemp() {
      this.temp = {
        id: '',
        account_fid: '',
        available: 'y',
        loc: '',
        tag: '',
        account: ''
      }
    },
    resetLocationTemp() {
      this.locationTemp = {
        id: '',
        site_id: '',
        location: '',
        account_number: ''
      }
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateAccountData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          const fullLoading = this.$loading({
            lock: true,
            text: 'Loading',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })
          updateAccountPresentData(tempData).then(() => {
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
    handleCreateLocation() {
      this.resetLocationTemp()
      this.dialogLocationStatus = 'create'
      this.dialogLocationFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataLocationForm'].clearValidate()
      })
    },
    createLocationData() {
      this.$refs['dataLocationForm'].validate((valid) => {
        if (valid) {
          createAccountLocationData(this.locationTemp).then(() => {
            this.dialogLocationFormVisible = false
            this.$notify({
              title: '成功',
              message: '恭喜,新增成功',
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    handleUpdateLocation(row) {
      this.locationTemp = Object.assign({}, row) // copy obj
      this.dialogLocationStatus = 'update'
      this.dialogLocationFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataLocationForm'].clearValidate()
      })
    },
    updateLocationData() {
      this.$refs['dataLocationForm'].validate((valid) => {
        if (valid) {
          updateAccountLocationData(this.locationTemp).then(() => {
            this.dialogLocationFormVisible = false
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
<style scoped>

</style>
