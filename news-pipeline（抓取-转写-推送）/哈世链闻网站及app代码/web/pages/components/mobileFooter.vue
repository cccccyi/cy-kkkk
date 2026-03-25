<template>
    <ClientOnly>
        <div class="mfooter">
            <div class="fm">
                <img alt="Vue logo" class="logoW" src="@/assets/logob2.png" />
                <div class="icons"  style="  margin-right: 30px !important;">
                    <a href=" https://x.com/HashNewsHK" target="_blank">
                        <font-awesome :icon="['fab', 'x-twitter']" />
                    </a>
                </div>
                <div class="icons">
                    <a href="https://t.me/HashNewsHK" target="_blank">
                        <font-awesome :icon="['fas', 'paper-plane']"  />
                    </a>
                </div>
                <!-- <div class="icons">
                    <font-awesome :icon="['fas', 'envelope']" />
                </div> -->
            </div>
        </div>
    </ClientOnly>
</template>
<script setup lang="ts">


</script>
<style lang="scss" scoped>
    @media (min-width: 1100px) {
        .mfooter{
            display: none;
        }
    }
    .mfooter {
        width: 100%;
        background-color: #002fa7;
        height: 135px;
        margin-top: 50px;
        background-color: #002fa7;
        height: 135px;

        .fm {
            margin: 0 auto;
            overflow: hidden;

            .logoW {
                height: 40px;
                float: left;
                margin-top: 42px;
                margin-left: 25px;
            }
            .icons {
                width: 35px;
                height: 35px;
                float: right;
                margin-top: 50px;
                background: white;
                margin-right: 40px;
                border-radius: 50%;
                cursor: pointer;
                color: #072144;
                font-size: 16px;
                line-height: 35px;
                text-align: center;
                cursor: pointer;
                padding-right: 0.5px;
                a{
                    color: #072144;
                }
            }
        }
    }
</style>