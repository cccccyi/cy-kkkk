<template>
  <div class="newsfocus">
    <div class="deepsearch">
      <center style="font-size: 50px;padding-top: 300px;color: rgb(190,190,190);">coming soon</center>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  const sp = ref('123')
  const cd =ref(true)
  const toChange =()=>{
    //alert(1)
   // sp.value = 456
  }
</script>
<style>
.newsfocus{
  min-height: calc(100vh - 135px);
}
</style>
