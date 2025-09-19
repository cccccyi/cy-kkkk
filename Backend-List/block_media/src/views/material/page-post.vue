<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.page_fid" placeholder="主页FID" clearable class="filter-item" style="width:150px" />&nbsp;
      <el-input v-model="listQuery.youtube_channel_id" placeholder="youtube频道ID" clearable class="filter-item" style="width:160px" />&nbsp;
      <el-select v-model="listQuery.fb_post_flag" placeholder="已发帖" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in availableOptions" :key="item" :label="item" :value="item" />
      </el-select>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleUpload">导入</el-button>&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleExport">导出</el-button>&nbsp;
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
      <el-table-column label="ID" align="center" width="60px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="主页" width="180px">
        <template slot-scope="{row}">
          <el-link :href="`https://www.facebook.com/` + row.page_fid" target="_blank" type="primary">{{ row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="youtube频道ID" width="150px">
        <template slot-scope="{row}">
          <span>{{ row.youtube_channel_id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发帖时间" width="120px">
        <template slot-scope="{row}">
          <el-link v-if="row.external_url" :href="row.external_url" target="_blank" type="primary">{{ row.youtube_published_time_text }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="视频截图" width="100px">
        <template slot-scope="{row}">
          <el-aside width="80px" style="background:#fff;padding:0;margin:0;">
            <el-image v-if="row.youtube_video_pic" :src="row.youtube_video_pic" referrer-policy="no-referrer" />
          </el-aside>
        </template>
      </el-table-column>
      <el-table-column label="文本">
        <template slot-scope="{row}">
          <span>{{ row.text }}</span>
        </template>
      </el-table-column>
      <el-table-column label="是否下载" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.down_flag }}</span>
        </template>
      </el-table-column>
      <el-table-column label="是否发帖" width="80px">
        <template slot-scope="{row}">
          <span>{{ row.fb_post_flag }}</span>
        </template>
      </el-table-column>
      <el-table-column label="FB帖子" width="160px">
        <template slot-scope="{row}">
          <el-link v-if="row.post_fid" :href="`https://www.facebook.com/${row.post_fid}`" target="_blank">{{row.post_fid}}</el-link>
        </template>
      </el-table-column>
      <!-- <el-table-column label="操作" align="center" width="120px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <span class="link-type" @click="handlePostStatus(row.id, 'y')">已发帖</span>&nbsp;|&nbsp;
          <span class="link-type" @click="handlePostStatus(row.id, 'n')">未发帖</span>
        </template>
      </el-table-column> -->
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog title="导入主页发帖舆材" :visible.sync="dialogUploadFormVisible">
      <div style="text-align:center;">
        <el-upload
          ref="uploadFile"
          drag
          action="http://221.120.163.66:38011/boost_interface/vue-element-admin/material/uploadPagePostMaterials"
          :multiple="false"
          :limit="1"
          accept=".xls, .xlsx"
          :auto-upload="false"
          :before-upload="beforeUpload"
          :on-success="uploadSuccess"
          :on-error="uploadError"
          :on-exceed="uploadExceed">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">只能上传xls/xlsx文件，且不超过10M，一次只能上传一个</div>
        </el-upload>
      </div>
      <div style="text-align: center;margin-top: 20px;">
        <el-link type="primary" href="http://221.120.163.66:38011/template/template_import_page_post_materials.xlsx">下载模板</el-link>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogUploadFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchPagePostMaterials } from '@/api/material'
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
        page_fid: '',
        channel_id: '',
        fb_post_flag: ''
      },
      availableOptions: ['y', 'n', 'p'],
      showReviewer: false,
      temp: {
        id: undefined,
        screen_name: '',
        project: '',
        category: '',
        available: 'y'
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
        screen_name: [{ required: true, message: '目标账号名', trigger: 'blur' }],
        project: [{ required: true, message: '选择所属项目', trigger: 'change' }],
        available: [{ required: true, message: '是否可用,有效', trigger: 'change' }]
      },
      downloadLoading: false,
      dialogUploadFormVisible: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchPagePostMaterials(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleUpload() {
      if (this.$refs.uploadFile) {
        this.$refs.uploadFile.clearFiles()
      }
      this.dialogUploadFormVisible = true
    },
    // 点击按钮手动上传，会先触发beforeUpload，再执行上传
    submit() {
      this.$refs.uploadFile.submit()
    },
    // 文件上传前对文件类型、文件大小判断限制
    beforeUpload(file) {
      const { name, size } = file
      const index = name.lastIndexOf('.')
      // 判断文件名是否有后缀，没后缀文件错误
      if (index === -1) {
        this.$notify.error({
          title: '错误',
          message: '文件错误，请重新上传！'
        })
        return false
      }
      const fileType = name.substr(index + 1)
      const acceptFileTypes = ['xls', 'xlsx']
      // 判断文件类型
      if (!acceptFileTypes.includes(fileType)) {
        this.$notify.error({
          title: '错误',
          message: '文件类型错误，请重新上传！'
        })
        return false
      }
      // 判断文件大小
      if (size > 10 * 1024 * 1024) {
        this.$notify.error({
          title: '错误',
          message: '文件大小超过10M，请重新上传！'
        })
        return false
      }
      // 默认true
      return true
    },
    // 上传接口调取成功status为200
    uploadSuccess(res) {
      if (res.code === 20000) {
        // 文件上传成功
        this.$notify.success({
          title: '成功',
          message: res.msg,
          dangerouslyUseHTMLString: true
        })
      } else {
        this.uploadError()
      }
      this.dialogUploadFormVisible = false
    },
    // 文件上传失败
    uploadError() {
      this.$notify.error({
        title: '错误',
        message: '文件上传失败！'
      })
    },
    // 文件个数超过限制
    uploadExceed() {
      this.$notify.warning({
        title: '提示',
        message: '您已添加了一个文件，如需替换，请先删除已添加的文件！'
      })
    },
    handleExport() {
      const params = []
      for (const key in this.listQuery) {
        if (this.listQuery[key] !== undefined && this.listQuery[key] !== '') {
          params.push(`${key}=${this.listQuery[key]}`)
        }
      }
      const url = `http://161.117.55.73:8011/boost_interface/vue-element-admin/material/exportYoutubeVideos?${params.join('&')}`
      window.open(url, '_blank')
    }
  }
}
</script>
