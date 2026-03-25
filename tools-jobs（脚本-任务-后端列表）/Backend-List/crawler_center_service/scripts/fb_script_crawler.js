{
    "homeUrl": "https://www.facebook.com",
    "networkSwitch": true,
    "loadImages": true,
    "keepNetworkLog": true,
    "checkMemoryRate": true,
    "targets": [],
    "browserShowLink": false,
    "continueCrawlFlag": true,
    "continueCrawlTimeout": "3600",
    "crawlOptions": {
        "crawlerSwitch": true,
        "crawlerType": "fbGroup"
    },
    "targets":[{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkVisible",
            "selector":"#login_form .login_error_box"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkVisible",
            "selector":".checkpoint"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkVisible",
            "selector":".uiInterstitialContent a[href='/change_contactpoint/dialog/']"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkVisible",
            "selector": "#globalContainer form[action='/change_contactpoint/dialog/submit/']"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkVisible",
            "selector": "#login_form"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkVisible",
            "selector": "#reg_box"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkurl",
            "expected":"facebook.com/login/",
            "operator":"contain"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkurl",
            "expected":"facebook.com/reg/",
            "operator":"contain"
        }]
    },{
        "name":"accountEmailIssue",
        "checkers":[{
            "type":"checkVisible",
            "selector":"#resend_confirm_email"
        }]
    },{
        "name":"accountEmailIssue",
        "checkers":[{
            "type":"checkVisible",
            "selector":"#email_container"
        }]
    },{
        "name":"actionIsClosed",
        "checkers":[{
            "type":"checkVisible",
            "selector":".uiInterstitialContent a[href*='ref=404']"
        }]
    },{
        "name":"actionIsFailed",
        "checkers":[{
            "type":"checkVisible",
            "selector":".uiLayer div[role='dialog']"
        },{
            "type": "checkVisible",
            "selector":".uiLayer div[role='dialog'] .uiList li a[href*='additional_content=']"
        }],
        "data":"Content is illegal"
    },{
       "name":"accountPwdIssue",
        "checkers":[{
            "type":"checkVisible",
            "selector":".uiLayer"
        },{
            "type": "checkVisible",
            "selector":".uiLayer a[href*='/recover/initiate']"
        }]
    },{
       "name":"accountPwdIssue",
        "checkers":[{
            "type":"checkVisible",
            "selector":".uiContextualLayer"
        },{
            "type": "checkVisible",
            "selector":".uiContextualLayer a[href*='/recover/initiate']"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkurl",
            "expected":"facebook.com/checkpoint",
            "operator":"contain"
        }]
    }],
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
            },{
                "type": "checkVisible",
                "selector": "#pass"
            }]
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
                },{
                    "type": "checkVisible",
                    "selector": "#email"
                },{
                    "type": "checkVisible",
                    "selector": "button[aria-disabled='false']"
                },{
                    "type": "checkVisible",
                    "selector": "div[role='button'][aria-label*='all cookies'][tabindex='0']"
                },{
                    "type": "checkVisible",
                    "selector": "#content button"
                }]
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
            },{
                "type": "checkText",
                "selector": "#content",
                "operator": "notcontain",
                "expected": "Your Account Has Been Disabled"
            },{
                "type": "checkText",
                "selector": ".checkpoint",
                "operator": "notcontain",
                "expected": "Your account has been disabled"
            }]
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
                    "logined", 
                    [{
                        "type": "checkVisible",
                        "selector": ".login_error_box"
                    },{
                        "type": "checkVisible",
                        "selector": "#login_form .inputpassword"
                    },{
                        "type": "checkVisible",
                        "selector": ".fbLoggedOutAccountInfo"
                    }]
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
        "name": "wait",
        "params": {
            "interval": 5000
        }
    }]
}
