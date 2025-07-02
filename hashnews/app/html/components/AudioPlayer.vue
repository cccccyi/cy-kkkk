<template>
  <!-- <div class="audio-player" :style="{ width: width }"> -->
  <div class="audio-player" @click="togglePlay">
    <button >
      <font-awesome-icon class="cgtBtn" v-if="isPlaying" style="font-size: 19px;" :icon="['fas', 'pause']" />
      <font-awesome-icon class="cgtBtn" v-if="!isPlaying" :icon="['fas', 'volume-high']" />
    </button>

    <!-- <div class="progress-container" @click="seek($event)">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div> -->
    <span  class="time">{{ formatTime(duration - currentTime) }}</span>

    <audio ref="audio" :src="src" @timeupdate="updateTime" @loadedmetadata="initDuration" @ended="onEnded" />
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'

  const props = defineProps({
    src: { type: String, required: true },
    width: { type: String, default: '100%' }, // 支持 "300px" 或 "100%"
  })

  const audio = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const progress = ref(0)

  const togglePlay = () => {
    if (!audio.value) return

    if (isPlaying.value) {
      isPlaying.value = false  // 先立即切换状态
      audio.value.pause()
    } else {
      isPlaying.value = true   // 先立即切换状态
      window.dispatchEvent(new CustomEvent('pause-other-audios', { detail: audio.value }))
      audio.value.play().catch(() => {
        isPlaying.value = false // 如果播放失败，状态回滚
      })
    }
  }

  const updateTime = () => {
    currentTime.value = audio.value.currentTime
    progress.value = (currentTime.value / duration.value) * 100
  }

  const initDuration = () => {
    duration.value = audio.value.duration
  }

  const seek = (e) => {
    const container = e.currentTarget
    const clickX = e.offsetX
    const totalWidth = container.clientWidth
    const newTime = (clickX / totalWidth) * duration.value
    audio.value.currentTime = newTime
    updateTime()
  }

  const onEnded = () => {
    isPlaying.value = false
    currentTime.value = 0
    progress.value = 0
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handlePauseOther = (e) => {
    if (audio.value && audio.value !== e.detail) {
      audio.value.pause()
      isPlaying.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('pause-other-audios', handlePauseOther)
  })

  onUnmounted(() => {
    window.removeEventListener('pause-other-audios', handlePauseOther)
    if (audio.value) audio.value.pause()
  })
</script>

<style lang="scss" scoped>
  /* .audio-player {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    box-sizing: border-box;
    border-radius: 50px;
    background: rgba(200, 200, 200, 0.3);
    
  } */
  .audio-player {
   /* width: 50px; */
   width: 70px;
  }
  button {
    border: none;
    background: none;
    font-size: 20px;
    cursor: pointer;
    flex-shrink: 0;

    .cgtBtn {
      font-size: 18px;
      position: relative;
      top: -4px;
      /* color: rgb(60, 58, 58); */
      color: #bbc7c7;
      width: 20px;
    }
  }

  .progress-container {
    position: relative;
    flex: 1;
    height: 6px;
    background: rgba(150, 150, 150, 0.3);
    cursor: pointer;
    border-radius: 10px;
  }

  .progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 6px;
    background: #3b82f6;
    border-radius: 10px;
  }

  .time {
    font-size: 12px;
    position: relative;
    top:-4px;
    color: #9aa3a3;
  }

  @media (max-width: 1100px) {
  
  }
</style>