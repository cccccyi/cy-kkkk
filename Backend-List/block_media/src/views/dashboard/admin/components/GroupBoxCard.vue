<template>
  <el-card v-loading="loading" class="box-card-component" style="margin-left:8px;">
    <div style="position:relative;">
      <div style="padding-top:35px;" class="progress-item">
        <span style="display:inline-block;margin-bottom:10px;">公开群组有占比 {{publicCount}} / {{allCount}}</span>
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentage" />
      </div>
    </div>
  </el-card>
</template>

<script>
import PanThumb from '@/components/PanThumb'
import Mallki from '@/components/TextHoverEffect/Mallki'
import { fetchGroupBoxInfo } from '@/api/dashboard'

export default {
  components: { PanThumb, Mallki },
  data() {
    return {
      loading: true,
      percentage: 0,
      allCount: 0,
      publicCount: 0
    }
  },
  mounted() {
    this.$nextTick(() => {
      fetchGroupBoxInfo({}).then(response => {
        this.loading = false
        this.percentage = response.data.percentage
        this.publicCount = response.data.publicCount
        this.allCount = response.data.allCount
      })
    })
  },
  methods: {
    format(percentage){
      return percentage
    }
  }
}
</script>

<style lang="scss" >
.box-card-component{
  .el-card__header {
    padding: 0px!important;
  }
}
</style>
<style lang="scss" scoped>
.box-card-component {
  .box-card-header {
    position: relative;
    height: 220px;
    img {
      width: 100%;
      height: 100%;
      transition: all 0.2s linear;
      &:hover {
        transform: scale(1.1, 1.1);
        filter: contrast(130%);
      }
    }
  }
  .mallki-text {
    position: absolute;
    top: 0px;
    right: 0px;
    font-size: 20px;
    font-weight: bold;
  }
  .panThumb {
    z-index: 100;
    height: 70px!important;
    width: 70px!important;
    position: absolute!important;
    top: -45px;
    left: 0px;
    border: 5px solid #ffffff;
    background-color: #fff;
    margin: auto;
    box-shadow: none!important;
    ::v-deep .pan-info {
      box-shadow: none!important;
    }
  }
  .progress-item {
    margin-bottom: 10px;
    font-size: 14px;
  }
  @media only screen and (max-width: 1510px){
    .mallki-text{
      display: none;
    }
  }
}
</style>
