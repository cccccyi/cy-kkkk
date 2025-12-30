// ==UserScript==
// @name         Twitter 自动私信/调用set-call
// @namespace    https://yourdomain.com
// @version      1.0
// @description  获取用户，判断私信按钮并处理
// @match        https://x.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';

    // ========== 可配置的延迟参数 ==========
    const CONFIG = {
        // 获取用户后跳转到主页的延迟时间（毫秒）
        FETCH_USER_REDIRECT_DELAY: 13000,
        
        // 用户主页加载完成后的延迟时间（毫秒）
        // 用于确保页面完全加载，特别适用于网络慢的情况
        PROFILE_LOAD_DELAY: 10000,
        
        // 点击私信按钮后等待私信页面加载的时间（毫秒）
        // 等待8秒确保页面跳转和渲染完成
        DM_PAGE_WAIT_DELAY: 8000,
        
        // 填充私信内容后发送前的等待时间（毫秒）
        // 给系统时间处理输入内容
        SEND_MESSAGE_DELAY: 1000,
        
        // 点击发送按钮后等待消息发送完成的时间（毫秒）
        MESSAGE_SEND_WAIT_DELAY: 2000,
        
        // 任务完成后跳转到首页的延迟时间（毫秒）
        TASK_COMPLETE_REDIRECT_DELAY: 3000,
        
        // 私信输入框渲染完成的额外等待时间（毫秒）
        // 在私信页面内部使用
        INPUT_RENDER_DELAY: 1000,
        
        // 重试时的等待时间（毫秒）
        RETRY_DELAY: 1000,
        
        // 页面间跳转的基础等待时间（毫秒）
        NAVIGATION_BASE_DELAY: 2000,
        
        // DOM元素检测的轮询间隔时间（毫秒）
        // 用于检测私信按钮等元素的轮询间隔
        DOM_CHECK_POLL_INTERVAL: 1000,
        
        // 双击模拟的间隔时间（毫秒）
        // 模拟真实双击的间隔时间
        DOUBLE_CLICK_INTERVAL: 150
    };

    const API_NEXT = "http://localhost:3000/api/next-unfollowed";
    const API_SET_CALL = "http://localhost:3000/api/set-call/";

    // 状态提示窗
    function showMsg(text) {
        let box = document.getElementById("tm_status_box");
        if (!box) {
            box = document.createElement("div");
            box.id = "tm_status_box";
            box.style.position = "fixed";
            box.style.top = "10px";
            box.style.right = "10px";
            box.style.background = "rgba(0,0,0,0.8)";
            box.style.color = "#fff";
            box.style.padding = "8px 12px";
            box.style.borderRadius = "8px";
            box.style.zIndex = "999999";
            box.style.fontSize = "13px";
            box.style.fontFamily = "Arial, sans-serif";
            document.body.appendChild(box);
        }
        box.textContent = text;
        console.log("[AutoDM]", text);
    }

    // 清理本地存储
    function clearLocalUser() {
        GM_deleteValue("current_user");
    }

    // 获取下一个未私信用户
    function fetchNextUser() {
        showMsg("📡 获取下一个用户...");
        GM_xmlhttpRequest({
            method: "GET",
            url: API_NEXT,
            onload(res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data.success && data.data && data.data.user) {
                        const user = data.data.user;
                        GM_setValue("current_user", user);
                        showMsg(`✅ 获取用户: ${user.screen_name}，${CONFIG.FETCH_USER_REDIRECT_DELAY/1000}秒后跳转主页...`);
                        setTimeout(() => {
                            window.location.href = `https://x.com/${user.screen_name}`;
                        }, CONFIG.FETCH_USER_REDIRECT_DELAY);
                    } else {
                        showMsg("ℹ️ 没有可处理的用户");
                    }
                } catch(e) {
                    showMsg("❌ 解析next-unfollowed接口失败");
                    console.error(e);
                }
            },
            onerror() {
                showMsg("❌ 请求next-unfollowed失败");
            }
        });
    }

    // 调用 set-call 接口
    function setCall(userId, callValue) {
        showMsg(`🔧 用户不可私信，调用set-call/${userId}`);
        GM_xmlhttpRequest({
            method: "POST",
            url: API_SET_CALL + userId,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ call: callValue }),
            onload(res) {
                showMsg(`✅ set-call/${userId} 完成`);
                // 单次执行完毕，清理状态
                clearLocalUser();
                showMsg("🎯 单次任务执行完毕！");
                // 任务完成后跳转到首页的延迟时间
                setTimeout(() => {
                    showMsg("➡️ 跳转到首页，获取下一个用户...");
                    window.location.href = "https://x.com/home";
                }, CONFIG.TASK_COMPLETE_REDIRECT_DELAY);
            },
            onerror() {
                showMsg(`❌ set-call/${userId} 失败`);
                // 失败时也清理状态并跳转
                clearLocalUser();
                showMsg("🎯 单次任务执行完毕！");
                // 任务完成后跳转到首页的延迟时间
                setTimeout(() => {
                    showMsg("➡️ 跳转到首页，获取下一个用户...");
                    window.location.href = "https://x.com/home";
                }, CONFIG.TASK_COMPLETE_REDIRECT_DELAY);
            }
        });
    }

    // 检查私信按钮并执行相应操作
    function checkDMButton(user) {
        showMsg(`🔍 检查 ${user.screen_name} 是否可私信...`);
        // DOM轮询确保渲染完成
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            // 使用更可靠的选择器组合检测私信按钮
            const dmButton = document.querySelector('button[aria-label="私信"][data-testid="sendDMFromProfile"]');
            if (dmButton) {
                clearInterval(interval);
                showMsg(`✉️ 可私信，填充私信内容...`);
                // 直接填充私信内容
                fillDMContent(user);
            } else if (attempts > 10) { // 约10秒未找到
                clearInterval(interval);
                showMsg(`❌ 不可私信，调用set-call...`);
                setCall(user.id, 5);
            }
        }, CONFIG.DOM_CHECK_POLL_INTERVAL);
    }

    // 在私信页面填充内容
    function fillDMContentInPage(user) {
        const text = "您好老师，非常喜欢您的推文，关注您了，可以给个关注吗，祝大赚，财运爆棚。期待(*❦ω❦)回关，多谢多谢！";
        
        showMsg(`📝 填充私信内容: ${text}`);
        showMsg("⏳ 等待输入框完全渲染...");
        
        // 延迟确保输入框完全渲染
        setTimeout(() => {
            // 查找私信输入框（尝试多个可能的选择器）
            const input = document.querySelector('div[role="textbox"]') || 
                          document.querySelector('[data-testid="dmComposerTextInput"]') ||
                          document.querySelector('textarea[placeholder*="私信"]') ||
                          document.querySelector('textarea');
            
            if (input) {
                // 先点击输入框确保获得焦点
                input.click();
                showMsg("🖱️ 已点击输入框");
                
                // 聚焦到输入框
                input.focus();
                showMsg("🎯 已聚焦到输入框");
                
                // 清空输入框内容
                input.value = "";
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // 填充内容
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // 触发更多事件确保内容被正确识别
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                
                showMsg("✅ 私信内容填充完成，准备发送...");
                
                // 等待配置的延迟时间后点击发送按钮
                setTimeout(() => {
                    clickSendButton(user);
                }, CONFIG.SEND_MESSAGE_DELAY);
                
                // 添加页面焦点监听器
                window.addEventListener('focus', () => {
                    showMsg("🔄 检测到页面重新获得焦点，尝试发送消息...");
                    // 如果发送按钮还没找到，尝试再次点击
                    const sendButton = document.querySelector("#dm-main-container > div > div > div > div.absolute.bottom-0.left-1\\/2.-translate-x-1\\/2.isolate.w-full.max-w-3xl.p-4.z-10 > div > div > div > form > div > div > div > button");
                    if (!sendButton) {
                        // 重新点击输入框激活发送按钮
                        input.click();
                        input.focus();
                        showMsg("🖱️ 重新激活输入框");
                    }
                }, { once: false });
                
            } else {
                showMsg("❌ 未找到私信输入框");
                clearLocalUser();
            }
        }, CONFIG.INPUT_RENDER_DELAY); // 私信输入框渲染延迟
    }
    
    // 最高强度聚焦函数 - 使用多种方法强制聚焦
    function ultraHighIntensityFocus(element) {
        if (!element) return false;
        
        try {
            // 方法1: 强制滚动到元素并设置tabIndex
            element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
            element.tabIndex = -1;
            element.tabIndex = 0;
            
            // 方法2: 模拟真实的键盘操作序列
            // 先发送Tab键确保焦点在页面上
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
            document.dispatchEvent(tabEvent);
            
            // 方法3: 使用油猴脚本的强制聚焦技巧
            // 模拟复制操作来强制聚焦（油猴特有）
            try {
                GM_setClipboard('', 'text');
            } catch(e) {
                // 如果GM_setClipboard不可用，继续其他方法
            }
            
            // 方法4: 模拟复杂的鼠标操作序列
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // 鼠标移动到元素
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY
            });
            
            // 双击模拟 - 第一次点击
            const firstMouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0,
                buttons: 1,
                detail: 1
            });
            
            const firstMouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0,
                buttons: 0,
                detail: 1
            });
            
            const firstClickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0,
                detail: 1
            });
            
            // 双击模拟 - 第二次点击（短时间内）
            const secondMouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0,
                buttons: 1,
                detail: 2
            });
            
            const secondMouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0,
                buttons: 0,
                detail: 2
            });
            
            const secondClickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0,
                detail: 2
            });
            
            // 双击事件
            const dblClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0
            });
            
            // 依次触发双击事件序列
            document.dispatchEvent(mouseMoveEvent);
            element.dispatchEvent(firstMouseDownEvent);
            element.dispatchEvent(firstMouseUpEvent);
            element.dispatchEvent(firstClickEvent);
            
            // 短暂延迟模拟真实双击间隔
            setTimeout(() => {
                element.dispatchEvent(secondMouseDownEvent);
                element.dispatchEvent(secondMouseUpEvent);
                element.dispatchEvent(secondClickEvent);
                element.dispatchEvent(dblClickEvent);
            }, CONFIG.DOUBLE_CLICK_INTERVAL); // 模拟真实双击间隔
            
            // 方法5: 多种聚焦方法同时执行
            setTimeout(() => {
                element.focus();
                document.activeElement.blur(); // 清除可能的其他焦点
                element.focus(); // 重新聚焦
            }, 50);
            
            // 方法6: 强制页面获得焦点
            window.focus();
            document.body.focus();
            document.documentElement.focus();
            
            // 方法7: 使用selection API强制聚焦
            try {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(element);
                selection.removeAllRanges();
                selection.addRange(range);
            } catch(e) {
                // 忽略可能的错误
            }
            
            return true;
            
        } catch(e) {
            console.error('高强度聚焦失败:', e);
            return false;
        }
    }
    
    // 备用高强度聚焦函数 - 模拟真实用户行为
    function highIntensityFocus(element) {
        if (!element) return false;
        
        // 方法1: 使用tab键导航到元素（模拟用户键盘操作）
        element.tabIndex = 0;
        element.focus();
        
        // 方法2: 模拟完整的鼠标事件序列（mousedown -> mouseup -> click）
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 创建鼠标事件
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            button: 0
        });
        
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            button: 0
        });
        
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            button: 0
        });
        
        // 依次触发鼠标事件
        element.dispatchEvent(mouseDownEvent);
        element.dispatchEvent(mouseUpEvent);
        element.dispatchEvent(clickEvent);
        
        // 方法3: 强制聚焦到页面
        window.focus();
        document.body.focus();
        document.documentElement.focus();
        
        return true;
    }
    
    // 点击发送按钮并调用API
    function clickSendButton(user, retryCount = 0) {
        const maxRetries = 3;
        
        // 如果页面失去焦点，使用高强度聚焦
        if (document.hasFocus && !document.hasFocus()) {
            showMsg("⚠️ 检测到页面失去焦点，使用高强度聚焦...");
            
            // 重新聚焦到页面和body
            window.focus();
            document.body.focus();
            document.documentElement.focus();
            
            // 尝试聚焦到页面中心
            const centerElement = document.querySelector('#react-root');
            if (centerElement) {
                centerElement.focus();
            }
        }
        
        showMsg("🚀 点击发送按钮...");
        
        // 查找发送按钮
        const sendButton = document.querySelector("#dm-main-container > div > div > div > div.absolute.bottom-0.left-1\\/2.-translate-x-1\\/2.isolate.w-full.max-w-3xl.p-4.z-10 > div > div > div > form > div > div > div > button");
        if (sendButton) {
            sendButton.click();
            showMsg("✉️ 消息发送中...");
            
            // 等待发送完成，然后调用API_SET_CALL
            setTimeout(() => {
                showMsg("📡 调用API更新用户状态...");
                GM_xmlhttpRequest({
                    method: "POST",
                    url: API_SET_CALL + user.id,
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify({ call: 1 }),
                    onload(res) {
                        showMsg(`✅ 私信发送完成，API调用成功！`);
                        // 清理状态并完成任务
                        clearLocalUser();
                        showMsg("🎯 单次任务执行完毕！");
                        // 任务完成后跳转到首页的延迟时间
                        setTimeout(() => {
                            showMsg("➡️ 跳转到首页，获取下一个用户...");
                            window.location.href = "https://x.com/home";
                        }, CONFIG.TASK_COMPLETE_REDIRECT_DELAY);
                    },
                    onerror() {
                        showMsg(`❌ API调用失败，但私信可能已发送`);
                        // 即使API调用失败，也完成任务并跳转
                        clearLocalUser();
                        showMsg("🎯 单次任务执行完毕！");
                        // 任务完成后跳转到首页的延迟时间
                        setTimeout(() => {
                            showMsg("➡️ 跳转到首页，获取下一个用户...");
                            window.location.href = "https://x.com/home";
                        }, CONFIG.TASK_COMPLETE_REDIRECT_DELAY);
                    }
                });
            }, CONFIG.MESSAGE_SEND_WAIT_DELAY); // 消息发送等待时间
        } else {
            // 如果找不到发送按钮且还有重试次数，尝试重新点击输入框
            if (retryCount < maxRetries) {
                showMsg(`⚠️ 未找到发送按钮，尝试重新激活输入框 (${retryCount + 1}/${maxRetries})...`);
                
                // 重新点击输入框激活页面
                const input = document.querySelector("#dm-main-container > div > div > div > div.absolute.bottom-0.left-1\\/2.-translate-x-1\\/2.isolate.w-full.max-w-3xl.p-4.z-10 > div > div > div > form > div > div > textarea");
                if (input) {
                    // 使用最高强度聚焦
                    ultraHighIntensityFocus(input);
                    showMsg("🖱️ 使用最高强度聚焦重新激活输入框");
                    
                    // 等待重试延迟时间后重试
                    setTimeout(() => {
                        clickSendButton(user, retryCount + 1);
                    }, CONFIG.RETRY_DELAY);
                } else {
                    showMsg("❌ 连输入框都找不到了");
                    clearLocalUser();
                }
            } else {
                showMsg("❌ 已达到最大重试次数，放弃发送");
                clearLocalUser();
            }
        }
    }

    // 在用户主页点击私信按钮
    function fillDMContent(user) {
        showMsg("✉️ 点击私信按钮...");
        
        // 查找并点击私信按钮
        const dmButton = document.querySelector('button[aria-label="私信"][data-testid="sendDMFromProfile"]');
        if (dmButton) {
            dmButton.click();
            showMsg(`⏳ 点击成功，等待${CONFIG.DM_PAGE_WAIT_DELAY/1000}秒后填充私信内容...`);
            
            // 等待私信页面加载完成
            setTimeout(() => {
                fillDMContentInPage(user);
            }, CONFIG.DM_PAGE_WAIT_DELAY);
        } else {
            showMsg("❌ 未找到私信按钮");
            clearLocalUser();
        }
    }

    // 主逻辑 - 单次执行版本
    (function main() {
        const currentUser = GM_getValue("current_user", null);
        const isHome = location.pathname === "/home";
        const isProfile = /^\/[^\/]+$/.test(location.pathname); // /screen_name

        if (currentUser) {
            if (isProfile) {
                // 用户主页，增加延迟确保页面完全加载
                showMsg(`🎯 开始处理用户: ${currentUser.screen_name}`);
                showMsg("⏳ 等待页面完全加载...");
                setTimeout(() => {
                    checkDMButton(currentUser);
                }, CONFIG.PROFILE_LOAD_DELAY); // 用户主页加载延迟
            } else {
                // 如果在其他页面，跳转到用户主页
                showMsg("➡️ 跳转到用户主页...");
                window.location.href = `https://x.com/${currentUser.screen_name}`;
            }
        } else {
            if (isHome) {
                // 首页才获取新用户
                showMsg("🚀 开始单次任务，获取用户...");
                fetchNextUser();
            } else {
                // 不在首页且没有用户信息，回首页获取
                showMsg("➡️ 返回首页获取用户...");
                setTimeout(() => { window.location.href = "https://x.com/home"; }, CONFIG.NAVIGATION_BASE_DELAY);
            }
        }
    })();

})();
