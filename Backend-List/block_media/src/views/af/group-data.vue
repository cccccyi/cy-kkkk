<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button v-show="false" v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
    </div>

    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>基本信息</span>
      </div>
      <el-descriptions class="margin-top" title="" :column="1" style="width:480px;" :size="size" border>
        <template slot="extra">
          <el-button type="primary" size="small" @click="handleUpdateBasic()">编辑</el-button>
        </template>
        <el-descriptions-item>
          <template slot="label">公开群组数</template>
          {{ basicTemp.public_group_number }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template slot="label">
            公开群组覆盖成员数
          </template>
          {{ basicTemp.public_group_member_number }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template slot="label">隐私群组数</template>
          {{ basicTemp.privacy_group_number }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template slot="label">
            隐私群组覆盖成员数
          </template>
          {{ basicTemp.privacy_group_member_number }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="box-card" style="margin-top:10px;">
      <div slot="header" class="clearfix">
        <span>群组区域数据设置</span>
      </div>
      <div class="filter-container">
        <el-input v-model="locationListQuery.location" placeholder="地区" clearable class="filter-item" style="width:120px" />&nbsp;
        <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
        <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreateLocation">添加</el-button>&nbsp;
      </div>
      <el-table
        key="af-page-location-table"
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
        <el-table-column prop="location" label="地区" width="200px" />
        <el-table-column prop="group_number" label="群组数" width="120px" />
        <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
          <template slot-scope="{row, $index}">
            <span class="link-type" @click="handleUpdateLocation(row, $index)">编辑</span>&nbsp;
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="box-card" style="margin-top:10px;">
      <div slot="header" class="clearfix">
        <span>群组成员区间分布</span>
      </div>
      <div class="filter-container">
        <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreateFollower">添加</el-button>&nbsp;
      </div>
      <el-table
        key="af-page_followers-table"
        v-loading="followerDataListLoading"
        :data="followerDatalist"
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
        <el-table-column prop="range_label" label="粉丝区间" width="200px" />
        <el-table-column prop="group_number" label="群组总数" width="120px" />
        <el-table-column label="操作" align="center" width="80px" class-name="small-padding fixed-width">
          <template slot-scope="{row, $index}">
            <span class="link-type" @click="handleUpdate(row, $index)">编辑</span>&nbsp;
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="群组-基本数据信息编辑" :visible.sync="dialogBasicFormVisible">
      <el-form ref="dataBasicForm" :model="basicTemp" label-position="left" label-width="150px" style="width: 500px; margin-left:50px;">
        <el-form-item label="公开群组数量" prop="public_group_number">
          <el-input v-model="basicTemp.public_group_number" placeholder="公开总数" />
        </el-form-item>
        <el-form-item label="公开群组覆盖成员" prop="public_group_member_number">
          <el-input v-model.number="basicTemp.public_group_member_number" placeholder="公开群组覆盖成员数" />
        </el-form-item>
        <el-form-item label="隐私群组数量" prop="privacy_group_number">
          <el-input v-model="basicTemp.privacy_group_number" placeholder="公开总数" />
        </el-form-item>
        <el-form-item label="隐私群组覆盖成员" prop="privacy_group_member_number">
          <el-input v-model.number="basicTemp.privacy_group_member_number" placeholder="隐私群组覆盖成员数" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogBasicFormVisible = false">取消</el-button>
        <el-button type="primary" @click="updateBasicData()">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogLocationFormVisible">
      <el-form ref="dataLocationForm" :model="locationTemp" label-position="left" label-width="120px" style="width: 500px; margin-left:50px;">
        <el-form-item label="地区" prop="location">
          <el-input v-model="locationTemp.location" placeholder="群组所在地区" />
        </el-form-item>
        <el-form-item label="群组总数" prop="group_number">
          <el-input v-model.number="locationTemp.group_number" placeholder="群组总数" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogLocationFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogLocationStatus==='create'?createLocationData() : updateLocationData()">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :model="followerTemp" label-position="left" label-width="120px" style="width: 500px; margin-left:50px;">
        <el-form-item label="粉丝区间" prop="range_label">
          <el-input v-model="followerTemp.range_label" />
        </el-form-item>
        <el-form-item label="群组总数" prop="group_number">
          <el-input v-model.number="followerTemp.group_number" placeholder="群组总数" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createFollowerData() : updateFollowerData()">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { getGroupBasicData, updateGroupBasicData, getGroupLocationData, createGroupLocationData, updateGroupLocationData, getGroupFollowerRangeData, createGroupFollowerRangeData, updateGroupFollowerRangeData } from '@/api/af'
import waves from '@/directive/waves' // waves directive

export default {
  name: 'ComplexTable',
  components: { },
  directives: { waves },
  filters: { },
  data() {
    return {
      basicTemp: {
        public_group_number: 0,
        public_group_member_number: 0,
        privacy_group_number: 0,
        privacy_group_member_number: 0
      },
      dialogBasicFormVisible: false,
      //
      followerDatalist: null,
      followerDataListLoading: true,
      followerTemp: {
        id: undefined,
        range_label: '',
        group_number: ''
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
        location: ''
      },
      locationTemp: {
        id: '',
        location: '',
        group_number: ''
      },
      dialogLocationFormVisible: false,
      dialogLocationStatus: ''
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
      // basic
      getGroupBasicData().then(response => {
        this.basicTemp = response.data
      })
      // group location data
      this.locationDatalist = []
      this.locationDataListLoading = true
      getGroupLocationData(this.locationListQuery).then(response => {
        this.locationDatalist = response.data.items
        this.locationDataListLoading = false
      })
      // page follower data
      this.followerDatalist = []
      this.followerDataListLoading = true
      getGroupFollowerRangeData(this.locationListQuery).then(response => {
        this.followerDatalist = response.data.items
        this.followerDataListLoading = false
      })
    },
    handleFilter() {
      this.getList()
    },
    resetTemp() {
      this.followerTemp = {
        id: undefined,
        range_label: '',
        group_number: ''
      }
    },
    resetLocationTemp() {
      this.locationTemp = {
        id: '',
        location: '',
        group_number: ''
      }
    },
    handleUpdateBasic() {
      this.dialogBasicFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataBasicForm'].clearValidate()
      })
    },
    updateBasicData() {
      this.$refs['dataBasicForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.basicTemp)
          const fullLoading = this.$loading({
            lock: true,
            text: 'Loading',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })
          updateGroupBasicData(tempData).then(() => {
            fullLoading.close()
            this.dialogBasicFormVisible = false
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
    handleCreateFollower() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createFollowerData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createGroupFollowerRangeData(this.followerTemp).then(() => {
            this.dialogFormVisible = false
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
    handleUpdate(row) {
      this.followerTemp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateFollowerData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.followerTemp)
          const fullLoading = this.$loading({
            lock: true,
            text: 'Loading',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })
          updateGroupFollowerRangeData(tempData).then(() => {
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
          createGroupLocationData(this.locationTemp).then(() => {
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
          updateGroupLocationData(this.locationTemp).then(() => {
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
