import Cookies from 'js-cookie'
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getCodeImg } from '@/api/login'

// 验证码相关信息
const authCodeInfo = reactive({
  captchaEnabled: true, // 验证码开关
  loading: false, // 是否加载中
  imgUrl: '', // 验证码图片地址
  uuid: '' // 验证码唯一标识
})

/**
 * 获取图片验证码
 * @param data 表单数据
 * @param isClick 是否点击触发
 */
const getValidateCode = async (form, isClick) => {
  try {
    if ((form.userName === '' || form.userName === undefined) && isClick) {
      ElMessage.error('请输入用户账号')
      return
    }

    if ((form.password === '' || form.password === undefined) && isClick) {
      ElMessage.error('请输入用户密码')
      return
    }

    if (authCodeInfo.loading) {
      ElMessage.warning('正在请求验证码，请稍等')
      return
    }

    const { data } = await getCodeImg()
    authCodeInfo.loading = true
    authCodeInfo.captchaEnabled = data.captchaEnabled === undefined ? true : data.captchaEnabled
    authCodeInfo.uuid = data.uuid
    if (authCodeInfo.captchaEnabled) {
      authCodeInfo.imgUrl = data.img
      authCodeInfo.loading = false
    }
  } catch (err) {
    console.log('验证码获取错误:', err)
  }
}

// 从cookie中获取登录用户信息
const getUserCookie = (data) => {
  const userName = Cookies.get('userName')
  const rememberMe = Cookies.get('rememberMe')
  // Remove credentials persisted by older releases; browser-side encryption was reversible.
  Cookies.remove('password')
  const form = {
    userName: userName === undefined ? data.userName : userName,
    password: data.password,
    rememberMe: rememberMe === 'true'
  }
  return form
}

// 只记住用户名；密码不得持久化到浏览器 Cookie。
const setUserCookie = (data) => {
  Cookies.remove('password')
  if (data.rememberMe) {
    Cookies.set('userName', data.userName, { expires: 30 })
    Cookies.set('rememberMe', 'true', { expires: 30 })
  } else {
    Cookies.remove('userName')
    Cookies.remove('rememberMe')
  }
}

export default { getValidateCode, getUserCookie, setUserCookie, authCodeInfo }
