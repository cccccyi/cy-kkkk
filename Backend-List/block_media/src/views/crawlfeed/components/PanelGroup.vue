<template>
  <el-row :gutter="40" class="panel-group">
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('purchases')">
        <div class="card-panel-icon-wrapper icon-money">
          <img :src="groupImg" icon-class="message" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description" style="margin-right:5px;">
          <div class="card-panel-text">
            <span>有效账号:</span>
            <count-to :start-val="0" :end-val="availableAccountCount" :duration="1" class="card-panel-num-line" />
          </div>
          <div class="card-panel-text">
            <span>无效账号:</span>
            <count-to :start-val="0" :end-val="notAvailableAccountCount" :duration="1" class="card-panel-num-line" />
          </div>
        </div>
      </div>
    </el-col>
    <!-- <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('shoppings')">
        <div class="card-panel-icon-wrapper icon-shopping">
          <img :src="pageImg" icon-class="shopping" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description" style="margin-right:5px;">
          <div class="card-panel-text">
            <span>管理主页:</span>
            <count-to :start-val="0" :end-val="fbPageCount" :duration="1" class="card-panel-num-line" />
          </div>
          <div class="card-panel-text">
            <span>覆盖粉丝:</span>
            <count-to :start-val="0" :end-val="fbPageLikesCount" :duration="1" class="card-panel-num-line" />
          </div>
        </div>
      </div>
    </el-col> -->
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('newVisitis')">
        <div class="card-panel-icon-wrapper icon-people">
          <svg-icon icon-class="peoples" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">累计关注目标</div>
          <count-to :start-val="0" :end-val="followedCount" :duration="1" class="card-panel-num" />
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('messages')">
        <div class="card-panel-icon-wrapper icon-message">
          <img :src="friendImg" icon-class="message" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            <div class="card-panel-text">需取关目标</div>
            <count-to :start-val="0" :end-val="unFollowCount" :duration="1" class="card-panel-num-line" />
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script>
import { fetchPanelData } from '@/api/crawlfeed'
import CountTo from 'vue-count-to'

import groupImg from '@/assets/fb_img_group.png'
import friendImg from '@/assets/fb_img_friend.png'
import pageImg from '@/assets/fb_img_page.png'


export default {
  components: {
    CountTo
  },
  data() {
    return {
      groupImg,
      friendImg,
      pageImg,
      availableAccountCount: 0,
      notAvailableAccountCount: 0,
      followedCount: 0,
      unFollowCount: 0
    }
  },
  created() {
    this.getPanelData()
  },
  methods: {
    getPanelData() {
      fetchPanelData({}).then(response => {
        this.availableAccountCount = response.data.availableAccountCount;
        this.notAvailableAccountCount = response.data.notAvailableAccountCount;
        this.followedCount = response.data.followedCount;
        this.unFollowCount = response.data.unFollowCount;
      })
    },
    handleSetLineChartData(type) {
      //this.$emit('handleSetLineChartData', type)
    }
  }
}
</script>

<style lang="scss" scoped>
.panel-group {
  margin-top: 18px;

  .card-panel-col {
    margin-bottom: 32px;
  }

  .card-panel {
    height: 108px;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #fff;
    box-shadow: 4px 4px 40px rgba(0, 0, 0, .05);
    border-color: rgba(0, 0, 0, .05);

    &:hover {
      .card-panel-icon-wrapper {
        color: #fff;
      }

      .icon-people {
        background: #40c9c6;
      }

      .icon-message {
        background: #36a3f7;
      }

      .icon-money {
        background: #f4516c;
      }

      .icon-shopping {
        background: #34bfa3
      }
    }

    .icon-people {
      color: #40c9c6;
    }

    .icon-message {
      color: #36a3f7;
    }

    .icon-money {
      color: #f4516c;
    }

    .icon-shopping {
      color: #34bfa3
    }

    .card-panel-icon-wrapper {
      float: left;
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 6px;
    }

    .card-panel-icon {
      float: left;
      font-size: 48px;
    }

    .card-panel-description {
      // float: right;
      font-weight: bold;
      margin: 26px;
      margin-left: 0px;

      .card-panel-text {
        line-height: 18px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 16px;
        margin-bottom: 12px;
      }

      .card-panel-num {
        font-size: 20px;
      }
    }
  }
}

@media (max-width:550px) {
  .card-panel-description {
    display: none;
  }

  .card-panel-icon-wrapper {
    float: none !important;
    width: 100%;
    height: 100%;
    margin: 0 !important;

    .svg-icon {
      display: block;
      margin: 14px auto !important;
      float: none !important;
    }
  }
}
</style>
