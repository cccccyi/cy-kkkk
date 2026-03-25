{
    "homeUrl": "https://www.facebook.com/",
    "networkSwitch": true,
    "loadImages": true,
    "keepNetworkLog": false,
    "checkMemoryRate": false,
    "browserShowLink": false,
    "ignoreUrls": [".mp4", ".webm", ".gif"],
    "crawlOptions": {
        "crawlFbGuidAccount": "n",
        "crawlFbGuidAccountCount": 3,
        "crawlFbMonitorAccount": "n",
        "crawlFbMonitorAccountCount": 1
    },
    "targets": [
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "#scrollview span[dir='auto']",
                "operator": "contain",
                "expected": "We suspended your account"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                    "type": "checkVisible",
                    "selector": "a[aria-label='Download your information']"
                }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                    "type": "checkVisible",
                    "selector": "div[aria-label='Appeal'][role='button']"
                }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                    "type": "checkVisible",
                    "selector": "a[aria-label='Download Your Information']"
                }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "div[role='main']",
                "operator": "contain",
                "expected": "our account has been disabled"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "#content",
                "operator": "contain",
                "expected": "Your Account Has Been Disabled"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "form",
                "operator": "contain",
                "expected": "Login approval needed"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "form + div + div",
                "operator": "contain",
                "expected": "Your Account Has Been Disabled"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "form > div#error_box",
                "operator": "contain",
                "expected": "Access Denied"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "div[role='main'] span",
                "operator": "contain",
                "expected": "your account has been locked"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "form + div div",
                "operator": "contain",
                "expected": "your account has been locked"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "div[role='main'] span",
                "operator": "contain",
                "expected": " to unlock your account"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "#scrollview div[role='separator'] + div",
                "operator": "contain",
                "expected": "Your account has been disabled"
            }]
        },
        {
            "name": "accountLockIssue",
            "checkers": [{
                "type": "checkText",
                "selector": "#scrollview div[role='separator'] + div",
                "operator": "contain",
                "expected": "Your Account is Temporarily Locked"
            }]
        },
        {
            "name": "accountNeedActive",
            "checkers": [{
                "type": "checkText",
                "selector": "#scrollview div[role='separator'] + div",
                "operator": "contain",
                "expected": "Choose a security check"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkVisible",
                "selector": "#captcha"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkVisible",
                "selector": "div[role='button'][aria-label*='tart security steps']"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkVisible",
                "selector": "#login_form .login_error_box"
            }]
        },
        {
            "name": "accountNeedActive",
            "checkers": [{
                "type": "checkVisible",
                "selector": "div[role='dialog'] a[href*='phone/confirmation']"
            }]
        },
        {
            "name": "accountPwdIssue",
            "checkers": [{
                    "type": "checkVisible",
                    "selector": ".uiLayer"
                },
                {
                    "type": "checkVisible",
                    "selector": ".uiLayer a[href*='/recover/initiate']"
                }
            ]
        },
        {
            "name": "accountPwdIssue",
            "checkers": [{
                    "type": "checkVisible",
                    "selector": ".uiContextualLayer"
                },
                {
                    "type": "checkVisible",
                    "selector": ".uiContextualLayer a[href*='/recover/initiate']"
                }
            ]
        },
        {
            "name": "accountNeedPhone",
            "checkers": [{
                "type": "checkText",
                "selector": "h2.uiHeaderTitle",
                "operator": "contain",
                "expected": "Enter the code from the SMS"
            },{
                "type": "checkText",
                "selector": "",
                "operator": "contain",
                "expected": "Add a Mobile Number"
            },{
                "type": "checkText",
                "selector": "form h2.uiHeaderTitle",
                "operator": "contain",
                "expected": "send you a code to your mobile number"
            }]
        },
        {
            "name": "accountNeedActive",
            "checkers": [{
                "type": "checkText",
                "selector": "form + div + div",
                "operator": "contain",
                "expected": "Your Account Has Been Locked"
            }]
        },
        {
            "name": "accountNotLogin",
            "checkers": [{
                "type": "checkText",
                "selector": "#login_form #error_box div:nth-child(2)",
                "operator": "contain",
                "expected": "Invalid username or password"
            }]
        },
        {
            "name": "accountNotLogin",
            "checkers": [{
                "type": "checkText",
                "selector": "#login_form #error_box div:nth-child(2)",
                "operator": "contain",
                "expected": "账号或密码无效"
            }]
        },
        {
            "name": "accountNotLogin",
            "checkers": [{
                "type": "checkText",
                "selector": "#login_form #error_box div:nth-child(2)",
                "operator": "contain",
                "expected": "没有访问公共主页的权限"
            }]
        },
        {
            "name": "accountNotActive",
            "checkers": [{
                "type": "checkText",
                "selector": "#scrollview div[role='main'] span.qg6bub1s",
                "operator": "contain",
                "expected": "Your account has been disabled"
            }]
        },
        {
            "name": "accountNeedPhone",
            "checkers": [{
                "type": "checkText",
                "selector": "form h2.uiHeaderTitle",
                "operator": "contain",
                "expected": "send you a code to your mobile number"
            }]
        },
        {
            "name": "accountNotLogin",
            "checkers": [{
                "type": "checkText",
                "selector": "#email_container",
                "operator": "contain",
                "expected": "The mobile number you entered isn't connected to an account."
            }]
        },
        {
            "name": "accountNeedPhone",
            "checkers": [{
                "type": "checkText",
                "selector": "form h2.uiHeaderTitle",
                "operator": "contain",
                "expected": "Confirm that it's you another way"
            }]
        }
    ],
    "checkers": {
        "logined": {
            "group": "or",
            "checkers": [{
                    "type": "checkVisible",
                    "selector": "#notNowBox"
                },
                {
                    "type": "checkVisible",
                    "selector": "a img[id*='profile_pic_header']"
                },
                {
                    "type": "checkVisible",
                    "selector": "div[data-pagelet]"
                },
                {
                    "type": "checkVisible",
                    "selector": "a[href*='/friends/']"
                },
                {
                    "type": "checkExist",
                    "selector": "svg[aria-label='Your profile']"
                }
            ]
        }
    },
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 2000
        }
        
    },{
        "name": "jump",
        "params": {
            "label": "logined",
            "checkers": "logined"
        }
    },{
        "name": "jump",
        "params": {
            "label": "normalLogined",
            "checkers": [{
                    "type": "checkVisible",
                    "selector": "#email"
                },
                {
                    "type": "checkVisible",
                    "selector": "#pass"
                }
            ]
        }
    },{
        "name": "click",
        "params": {
            "selector": "button[data-cookiebanner='accept_button']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
        
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "div[role='dialog'] div[aria-label='Get Started']"
            }
        },
        "params": {
            "selector": "div[role='dialog'] div[aria-label='Get Started']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "div[data-visualcompletion='ignore'] div[aria-label='Close Introduction']"
            }
        },
        "params": {
            "selector": "div[data-visualcompletion='ignore'] div[aria-label='Close Introduction']"
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "div[aria-label='Done']"
            }
        },
        "params": {
            "selector": "div[aria-label='Done']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "click",
        "params": {
            "selector": "div[role='button'][aria-label*='all cookies'][tabindex='0']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": "random"
        }
    },{
        "name": "click",
        "params": {
            "selector": "div[role='button'][aria-label*='all cookies'][tabindex='0']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": "random"
        }
    },{
        "name": "click",
        "params": {
            "selector": "button[title='Accept All']"
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "group": "or",
                "checkers": [
                    "logined",
                    {
                        "type": "checkVisible",
                        "selector": "#login_form"
                    },
                    {
                        "type": "checkVisible",
                        "selector": "#email"
                    },
                    {
                        "type": "checkVisible",
                        "selector": "button[aria-disabled='false']"
                    },
                    {
                        "type": "checkVisible",
                        "selector": "div[role='button'][aria-label*='all cookies'][tabindex='0']"
                    },
                    {
                        "type": "checkVisible",
                        "selector": "#content button"
                    }
                ]
            }
        }
    },{
        "name": "wait",
        "params": {
            "checkers": [{
                    "type": "checkText",
                    "selector": ".checkpoint",
                    "operator": "notcontain",
                    "expected": "Your Account Has Been Disabled"
                },
                {
                    "type": "checkText",
                    "selector": "#content",
                    "operator": "notcontain",
                    "expected": "Your Account Has Been Disabled"
                }, {
                    "type": "checkText",
                    "selector": ".checkpoint",
                    "operator": "notcontain",
                    "expected": "Your account has been disabled"
                }
            ]
        }
    },{
        "name": "jump",
        "params": {
            "label": "logined",
            "checkers": "logined"
        }
    },{
        "name": "wait",
        "label": "normalLogined",
        "params": {
            "interval": "random"
        }
    },{
        "name": "input",
        "params": {
            "selector": "#email",
            "value": "{{userName}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": "random"
        }
    },{
        "name": "input",
        "params": {
            "selector": "#pass",
            "value": "{{passWord}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": "random"
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#login_form input[type='submit']"
            }
        },
        "params": {
            "selector": "#login_form input[type='submit']"
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#loginbutton"
            }
        },
        "params": {
            "selector": "#loginbutton"
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "button[name='login']"
            }
        },
        "params": {
            "selector": "button[name='login']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": "random"
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "div[aria-label='Allow all cookies'][tabindex='0']"
            }
        },
        "params": {
            "selector": "div[aria-label='Allow all cookies'][tabindex='0']"
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "#checkpointSubmitButton"
            },
            "timeout": 2000
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "group": "or",
                "checkers": [
                    "logined", [{
                            "type": "checkVisible",
                            "selector": ".login_error_box"
                        },
                        {
                            "type": "checkVisible",
                            "selector": "#login_form .inputpassword"
                        },
                        {
                            "type": "checkVisible",
                            "selector": ".fbLoggedOutAccountInfo"
                        }
                    ]
                ]
            }
        }
    },{
        "name": "jump",
        "params": {
            "checkers": "logined",
            "label": "logined"
        }
    },{
        "name": "input",
        "params": {
            "selector": "#pass",
            "value": "{{passWord}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": "random"
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#login_form input[type='submit']"
            }
        },
        "params": {
            "selector": "#login_form input[type='submit']"
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#loginbutton"
            }
        },
        "params": {
            "selector": "#loginbutton"
        }
    },{
        "name": "wait",
        "params": {
            "checkers": [
                "logined",
                {
                    "type": "checkNotVisible",
                    "selector": "#checkpointSubmitButton"
                }
            ]
        }
    },{
        "name": "wait",
        "label": "logined",
        "params": {
            "interval": "random"
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(string(), 'Not Now')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": {
                "type": "checkVisible",
                "selector": "a[href='/'][aria-label='Home']"
            },
            "label": "continueNext"
        }
    },{
        "name": "open",
        "params" : {
            "url":"https://www.facebook.com/settings?tab=language",
            "timeout":180000
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
          "code": "try{document.querySelector(\"div[role='main'] div[role='button']\").click()}catch(e){}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{document.querySelector(\"div[aria-haspopup='listbox']\").click()}catch(e){}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='English (US)']\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.querySelector(\"div[role='main'] div:nth-child(2)>div[role='button'][tabindex='0']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "label":"continueNext",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const sel=document.querySelector(\"div[aria-label='Account Controls and Settings'] >span svg\") || document.querySelector(\"div[aria-label='Account controls and settings'] >span svg\"); const event=document.createEvent('HTMLEvents');event.initEvent('click', true, true);sel.dispatchEvent(event); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='See all profiles']\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Switch Profile']\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Your profile']//div[@role='listitem']//span[contains(text(), '{{accountName}}')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 15000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/me"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(string(), 'Not Now')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "y",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipSwitchPage"
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/profile.php?id=100066905585943",
            "timeout": 180000
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'started')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'Use Page')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ document.querySelector(\"div[aria-label='See Options']\").click() }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'Switch to Classic Pages')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'I understand')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Continue' and not(@aria-disabled)]//span/span[text()='Continue']\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"(//div[@aria-label='Continue' and not(@aria-disabled)]//span/span[text()='Continue'])[last()]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"(//div[@aria-label='Continue' and not(@aria-disabled)]//span/span[text()='Continue'])[last()]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"(//span[contains(text(), 'Switch Back')])[last()]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "label": "skipSwitchPage",
        "params": {
            "interval": 1000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/notifications"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 15000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(string(), 'invited you to')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 20000
        }
    },{
        "name": "loop",
        "loop_count": 2,
        "actions": [{
            "name": "call",
            "params": {
                "code": "try{ const btn=document.evaluate(\"//span[text()='Review Invite']\",document).iterateNext();if(btn){btn.click();} }catch{}"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 5000
            }
        }]
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Next']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Accept']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Not Now']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "y",
                "expected": "{{skipAcceptPageInvite}}",
                "operator": "equal"
            }],
            "label": "skipAcceptPageInvite"
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/{{invitedPageFid}}"
        }
    },{
        "name": "wait",
        "params": {
            "interface": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Review Invite']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Next']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Accept']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Not Now']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "wait",
        "label": "skipAcceptPageInvite",
        "params": {
            "interval": 1000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "y",
                "expected": "{{skipCrawlYourPages}}",
                "operator": "equal"
            }],
            "label": "skipCrawlYourPages"
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/pages/?category=your_pages&ref=bookmarks"
        }
    },{
        "name": "wait",
        "params": {
            "interface": 5000
        }
    },{
        "name": "loop",
        "loop_count": 2,
        "actions": [{
            "name": "scroll",
            "params": {
                "selector": "end"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 3000
            }
        }]
    },{
        "name": "wait",
        "label": "skipCrawlYourPages",
        "params": {
            "interval": 1000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipCrawlPageData}}",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipCrawlPageData"
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/{{crawlPageFid}}/settings/?tab=admin_roles"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "loop",
        "loop_count": 2,
        "actions": [{
            "name": "scroll",
            "params": {
                "selector": "end"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 3000
            }
        }]
    },{
        "name": "wait",
        "label": "skipCrawlPageData",
        "params": {
            "interval": 1000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipCrawlPageDataNew}}",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipCrawlPageDataNew"
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/{{crawlPageFid}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ document.querySelector(\"div[aria-label='Use Page']\").click(); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[text()='Switch Now']\",document).iterateNext() || document.evaluate(\"//span[text()='Switch']\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 15000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//div[@role='dialog']//span[text()='Switch']\",document).iterateNext() || document.querySelector(\"div[role='dialog'] div[aria-label*='Get']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/settings?tab=videos"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const iframe = document.getElementsByTagName('iframe')[0].contentWindow; const sel=iframe.document.evaluate(\"//form[contains(@action, 'default_short_videos_to_reels_settings')]//span[text()='On']\",iframe.document).iterateNext();if(sel){sel.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const iframe = document.getElementsByTagName('iframe')[0].contentWindow; const sel=document.evaluate(\"//ul[@role='menu']//li/a//span[text()='Off']\",iframe.document).iterateNext();if(sel){sel.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/me"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ document.querySelector(\"div[aria-label='Use Page']\").click(); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(string(), 'Not Now')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipPageSendPost}}",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipPageSendPost"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 1000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{videoURL}}",
                "expected": "",
                "operator": "equal"
            }],
            "label": "skipPageSendPost"
        }
    },{
        "name": "fetchMaterial",
        "params": {
            "url": "{{videoURL}}",
            "name": "{{videoName}}"
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'on your mind')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'Done')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "params":{
            "checkers": [{
                "type": "checkVisible",
                "selector": "div[aria-label='Photo/video']"
            }],
            "ignorable": false,
            "timeout": 30000
        }
    },{
        "name": "paste",
        "params": {
            "value": "{{videoText}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 1000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.querySelector(\"div[aria-label='Photo/video']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "uploadFileDVP",
        "params": {
            "path": "{{videoName}}",
            "selector": "div[role='dialog'] form input[type='file']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 30000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'Switch back for all future videos')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'Use Page')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 60000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.querySelector(\"div[aria-label='Post']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 20000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(string(), 'Not now')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "wait",
        "label": "skipPageSendPost",
        "params": {
            "interval": 1000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/professional_dashboard"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "wait",
        "params":{
            "checkers": [{
                "type": "checkVisible",
                "selector": "a[href*='/professional_dashboard/insights/posts']"
            }],
            "ignorable": false,
            "timeout": 30000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.querySelector(\"a[href*='/professional_dashboard/insights/posts']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ window.location.reload(); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "loop",
        "loop_count": 3,
        "actions": [{
            "name": "call",
            "params": {
                "code": "try{ const eleM=document.querySelector(\"div[role='separator']+div+div+div>div\");if(eleM){eleM.scrollTop=100000;} }catch{}"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 3000
            }
        }]
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.querySelector(\"a[href*='/professional_dashboard/insights/audience']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipScreenshotPost}}",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipScreenshotPost"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "finishNetwork",
        "params": {
            "variable_name": "page_insights_post"
        }
    },{
        "name": "wait",
        "label": "skipScreenshotPost",
        "params": {
            "interval": 1000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/settings?tab=profile_access"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "wait",
        "label": "skipCrawlPageDataNew",
        "params": {
            "interval": 1000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipAccountSendPost}}",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipAccountSendPost"
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/me"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'on your mind')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Select audience']//span[contains(text(), 'Public')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'Done')]\",document).iterateNext();if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "params":{
            "checkers": [{
                "type": "checkVisible",
                "selector": "div[aria-label='Photo/video']"
            }],
            "ignorable": false,
            "timeout": 30000
        }
    },{
        "name": "paste",
        "params": {
            "value": "{{accountPostText}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 1000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.querySelector(\"div[aria-label='Photo/video']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "loop",
        "loopTag": "uploadStartIndex",
        "loop_count": "variablesCount",
        "start_index": "fromLoopTag",
        "variables": "{{accountPostImages}}",
        "actions": [{
            "name": "fetchMaterial",
            "params": {
                "url": "@@url@@",
                "name":"@@name@@"
            }
        }, {
            "name": "wait",
            "params": {
                "interval": 5000
            }
        },{
            "name": "uploadFileDVP",
            "params": {
                "selector": "div[role='dialog'] form input[type='file']",
                "path": "@@name@@"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 20000
            }
        }]
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.querySelector(\"div[aria-label='Post']\");if(btn){btn.click()} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 30000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.facebook.com/me"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "label": "skipAccountSendPost",
        "params": {
            "interval": 1000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ document.querySelector(\"a[href='/']\").click(); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interface": 3000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipCrawlJoinedGroups}}",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipCrawlJoinedGroups"
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ document.querySelector(\"div[aria-label='See all']\").click(); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interface": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ document.querySelector(\"a[href*='/groups/?']\").click(); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "loop",
        "loop_count": 10,
        "actions": [{
            "name": "call",
            "params": {
                "code": "try{ document.querySelector(\"div[aria-label='List of groups']>div>div+div+div\").scrollTo(0, 100000); }catch{}"
            }
        },{
            "name": "call",
            "params": {
                "code": "try{ document.querySelector(\"div[aria-label='List of groups']>div>div+div+div+div\").scrollTo(0, 100000); }catch{}"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 3000
            }
        }]
    },{
        "name": "wait",
        "label": "skipCrawlJoinedGroups",
        "params": {
            "interval": 1000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipCrawlFriendsList}}",
                "expected": "y",
                "operator": "equal"
            }],
            "label": "skipCrawlFriendsList"
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const sel=document.querySelector(\"div[aria-label='Account Controls and Settings'] >span svg\") || document.querySelector(\"div[aria-label='Account controls and settings'] >span svg\");const event=document.createEvent('HTMLEvents');event.initEvent('click', true, true);sel.dispatchEvent(event); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const sel=document.querySelector(\"a[href='/me/'\");const event=document.createEvent('HTMLEvents');event.initEvent('click', true, true);sel.dispatchEvent(event); }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{document.querySelector(\"div[role='tablist'] a[href*='friends']\").click()}catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "loop",
        "loopTag": "reportStartIndex",
        "loop_count": "60",
        "actions": [{
            "name": "scroll",
            "params": {
                "selector": "end"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 3000
            }
        },{
            "name": "jump",
            "condition": {
                "checkers": {
                    "type": "checkNotVisible",
                    "selector": "div[role='progressbar'][data-visualcompletion='loading-state']"
                }
            },
            "params": {
                "exit_loop": true
            }
        }]
    },{
        "name": "wait",
        "label": "skipCrawlFriendsList",
        "params": {
            "interval": 1000
        }
    }]
}