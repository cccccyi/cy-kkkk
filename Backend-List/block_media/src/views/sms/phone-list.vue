<template>
  <div>
    <el-card class='box-card'>
      <div slot="header">
        <a class="link-type link-title" target="_blank" href="https://panjiachen.github.io/vue-element-admin-site/guide/advanced/theme.html">
          Theme documentation
        </a>
      </div>
      <div class="box-item">
        <span class="field-label">Change Theme : </span>
        <aside style="margin-top:15px;">
          Tips: It is different from the theme-pick on the navbar is two different skinning methods, each with different application scenarios. Refer to the documentation for details.
        </aside>
      </div>
    </el-card>
  </div>
</template>

<script>

export default {
  name: 'SmsPhoneList',
  data() {
    return {

    }
  }
}
</script>

<style scoped>
.box-card {
  width: 400px;
  max-width: 100%;
  margin: 20px auto;
}

</style>
