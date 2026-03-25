<template>
  <div class="app-container">
    <div class="filter-container">
      <el-select v-model="listQuery.site" placeholder="来源平台" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in siteOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.keyword" placeholder="内容搜索" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-select v-model="listQuery.new_type" placeholder="类型" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in typeOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
      <el-select v-model="listQuery.twitter_status" placeholder="发推状态" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>&nbsp;
      <el-input v-model="listQuery.author_name" placeholder="作者" clearable class="filter-item" style="width:120px" />&nbsp;
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>&nbsp;
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
    >
      <el-table-column label="ID" align="center" width="60px">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="内容">
        <template slot-scope="{row}">
          <el-container>
            <el-aside width="180px" style="background:#fff;padding:0;margin:0;">
              <div>
                <el-tag type="success">{{ `平台-${row.site}` }}</el-tag>
                <el-tag v-if="row.primary_category" type="primary">{{ '分类-' + row.primary_category }}</el-tag>
              </div>
              <el-image v-if="row.img" :src="row.img" :preview-src-list="[row.img]" referrerPolicy="no-referrer"></el-image>
              <div>
                <el-tag :type="row.new_type==1? 'primary' : 'danger'">{{ row.new_type_str }}</el-tag>
              </div>
              <div v-if="row.read_count">
                <span>浏览量：</span><span>{{ row.read_count }}</span>
              </div>
            </el-aside>
            <el-main>
              <el-link :href="row.new_url" target="_blank" type="primary">{{ row.title }}</el-link>
              <div>
                <span>发布时间：</span>
                <span>{{ row.publish_time_str }}</span>
              </div>
              <div style="display:flex;column-gap:10px;row-gap:8px;flex-wrap:wrap;margin:8px;">
                <el-tag v-for="(tag, index) in row.tags" :key="index" type="success">{{ tag }}</el-tag>
              </div>
              <div class="ellipsis-multiline" :title="row.content">
                {{ row.content }}
              </div>
            </el-main>
          </el-container>
        </template>
      </el-table-column>
      <el-table-column label="作者" width="140px">
        <template slot-scope="{row}">
          <div style="display: flex;align-items: center;column-gap: 5px;">
            <el-image v-if="row.author_img" :src="row.author_img" referrer-policy="no-referrer" style="width:30px;border-radius:15px;" />
            <el-link :href="row.author_url" target="_blank" type="primary">{{ row.author_name }}</el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="推文">
        <template slot-scope="{row}">
          <div>
            <el-tag :type="row.twitter_status | statusFilter">{{ row.twitter_status_str }}</el-tag>
          </div>
          <div v-if="row.duplidate_new_url">
            <el-link :href="row.duplidate_new_url" target="_blank" type="primary" style="color:red;">{{ '重复新闻：' + row.duplicate_id }}</el-link>
          </div>
          <div v-if="row.twitter_tweet_url">
            <el-link :href="row.twitter_tweet_url" target="_blank" type="primary">{{ '发推时间 ' + row.twitter_tweet_post_time + ', 间隔 ' }}<span style="color:red;">{{ row.post_timeout }}</span></el-link>
          </div>
          <div>
            <span>推文内容</span><br/>
            <span>{{ row.twitter_tweet }}</span>
          </div>
          <div style="display:flex;flex-wrap: wrap;justify-content: space-around;">
            <el-image v-for="img in row.twitter_img" :src="img" :preview-src-list="row.twitter_img" :key="img" style="max-width:100px;"></el-image>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80px">
        <template slot-scope="{row,$index}">
          <span class="link-type" @click="handleTweetUpdate(row, $index)">编辑</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading="dialogLoading">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 600px;">
        <el-form-item label="系统生成" prop="twitter_tweet">
          <el-input v-model="temp.twitter_tweet_old" readonly :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="请输入，推特发推文本内容" />
        </el-form-item>
        <el-form-item label="文章内容" prop="gpt_prompt_info">
          <el-input v-model="temp.gpt_prompt_info" readonly :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="GPT提示词 - prompt设定" />
        </el-form-item>
        <el-form-item label="提示词" prop="gpt_prompt_system">
          <el-input v-model="temp.gpt_prompt_system" :autosize="{ minRows: 5, maxRows: 15}" type="textarea" placeholder="GPT提示词 - system设定" />
        </el-form-item>
        <el-form-item label="调试生成" prop="gen_tweet">
          <el-input v-model="temp.gen_tweet" readonly :autosize="{ minRows: 5, maxRows: 10}" type="textarea" placeholder="根据调整的提示词，生成的新推文" />
        </el-form-item>
        <!--
        <el-form-item label="图片" prop="twitter_img">
          <el-upload
            class="upload-demo"
            action="http://82.157.161.88/boost_interface/vue-element-admin/monitor/uploadImage"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :on-success="uploadSuccess"
            :file-list="temp.fileList"
            list-type="picture"
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">只能上传jpg/png文件</div>
          </el-upload>
        </el-form-item>
        <el-dialog :visible.sync="dialogVisible">
          <img width="100%" :src="dialogImageUrl" alt="">
        </el-dialog>
        -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">重新生成</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchPaNewsList, updateTweetInfo } from '@/api/monitor'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        i: 'warning',
        s: 'success',
        r: 'danger'
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
        site: '',
        keyword: '',
        new_type: '',
        twitter_status: '',
        author_name: ''
      },
      siteOptions: [
        { id: 'panews', label: 'PANews' },
        { id: 'theblock', label: 'THEBLOCK' },
        { id: 'binance', label: 'Binance' },
        { id: 'cointelegraph', label: 'CoinTelegraph' }
      ],
      typeOptions: [
        { id: 1, label: '深度' },
        { id: 2, label: '快讯' }
      ],
      statusOptions: [
        { id: 'i', label: '初始状态' },
        { id: 'r', label: '正在执行' },
        { id: 's', label: '执行成功' },
        { id: 'd', label: '被过滤' },
        { id: 'c', label: '被判重' }
      ],
      showReviewer: false,
      temp: {
        id: '',
        twitter_tweet: '',
        twitter_img: '',
        gpt_prompt_system: '',
        twitter_tweet_re: '',
        gen_tweet: '',
        fileList: []
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
      dialogImageUrl: '',
      // cascader
      cascader_value_query: [],
      cascader_value: [],
      cascader_options: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchPaNewsList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleTweetUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.fileList = []
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
          updateTweetInfo(tempData).then((data) => {
            // const index = this.list.findIndex(v => v.id === this.temp.id)
            // this.list.splice(index, 1, this.temp)
            // this.dialogFormVisible = false
            // this.$notify({
            //   title: 'Success',
            //   message: 'Update Successfully',
            //   type: 'success',
            //   duration: 2000
            // })
            // this.getList()
            this.temp.gen_tweet = data.data
            this.dialogLoading = false
          })
        }
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
    },
    // image
    uploadSuccess(res, file) {
      this.temp.fileList.push(res.image_path)
    },
    handleRemove(file) {
      console.log(file)
    },
    handlePreview(file) {
      console.log(file)
    },
    handleDownload(file) {
      console.log(file)
    }
  }
}
</script>
<style scoped>
  .ellipsis-multiline {
    display: -webkit-box;       /* 弹性盒子模型 */
    -webkit-box-orient: vertical; /* 垂直排列子元素 */
    overflow: hidden;           /* 超出内容隐藏 */
    -webkit-line-clamp: 3;      /* 限制显示的行数 */
  }
</style>
