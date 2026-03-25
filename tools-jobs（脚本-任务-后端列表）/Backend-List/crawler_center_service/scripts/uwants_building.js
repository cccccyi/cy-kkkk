{
    "homeUrl": "https://www.uwants.com/logging.php?action=login",
    "networkSwitch": true,
    "keepNetworkLog": true,
    "targets": [{
        "name": "accountNotActive",
        "checkers": [{
            "type": "checkVisible",
            "selector": ".g-recaptcha"
        }]
    },{
        "name": "accountNotActive",
        "checkers": [{
            "type": "checkText",
            "selector": ".message",
            "operator": "contain",
            "expected": "賬號被禁用"
        }]
    },{
        "name": "accountNotActive",
        "checkers": [{
            "type": "checkText",
            "selector": ".login_error_msg[style*='display']",
            "operator": "contain",
            "expected": "用戶名無效"
        }]
    }],
    "checkers": {
        "logined": {
        "group": "or",
            "checkers": [{
                "type": "checkVisible",
                "selector": "#top-mine-btn"
            }, {
                "type": "checkurl",
                "expected": "index.php",
                "operator": "contain"
            }, {
                "type": "checkVisible",
                "selector": "#chat_btn #top-chat-btn"
            }]
        }
    },
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "group": "or",
                "checkers": [
                    "logined", {
                        "type": "checkVisible",
                        "selector": "#home-top-bar a[href *='/logging.php?action=login']"
                    },{
                        "type": "checkVisible",
                        "selector": "button[name='loginsubmit']"
                    },{
                        "type": "checkVisible",
                        "selector": "#top-mine-btn"
                    }
                ]
            }
        }
    },{
        "name": "jump",
        "params": {
            "label": "logined",
            "checkers": "logined"
        }
    },{
        "name": "input",
        "params": {
            "selector": "#username",
            "value": "{{userName}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "input",
        "params": {
            "selector": "#password",
            "value": "{{passWord}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "jump",
        "params": {
            "label": "googleRecheck",
            "checkers": {
                "type": "checkVisible",
                "selector": ".g-recaptcha"
            }
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "button[name='loginsubmit']"
            }
        },
        "params": {
            "selector": "button[name='loginsubmit']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "wait",
        "label": "logined",
        "params": {
            "interval": 5000
        }
    },{
        "name": "open",
        "params": {
            "url": "https://www.uwants.com/memcp.php"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "variables",
        "params": {
            "name": "discuss_code",
            "selector": ".credits_info li:first-child",
            "trim": "after::"
        }
    },{
        "name": "wait",
        "params": {
            "interval": "random"
        }
    },{
        "name": "crawlerEx",
        "params": {
            "name": "credits_info",
            "fromVariables": "discuss_code"
        }
    },{
        "name": "open",
        "params": {
            "url": "{{operateUrl}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//span[contains(text(), 'Close Ad')]\",document).iterateNext(); if(btn){ btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "click",
        "params": {
            "selector": "a[title='Close']"
        },
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "a[title='Close']"
            }
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#quickpost #message_wysiwyg"
            }
        }
    },{
        "name": "call",
        "params": {
            "code": "try{document.querySelector(\"#quickpost #message_wysiwyg\").scrollIntoView()}catch(e){}"
        }
    },{
        "name": "input",
        "params": {
            "selector": "#quickpost #message_wysiwyg",
            "value": "{{content}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "click",
        "params": {
            "selector": "#px1_closeBtn"
        },
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#px1_closeBtn"
            }
        }
    },{
        "name": "click",
        "params": {
            "selector": ".cc-dismiss"
        },
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": ".cc-dismiss"
            }
        }
    },{
        "name": "click",
        "params": {
            "selector": "#postsubmit"
        },
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#postsubmit"
            }
        }
    },{
        "name": "wait",
        "label": "googleRecheck",
        "params": {
            "interval": 20000
        }
    },{
        "name": "screenshot",
        "params": {
            "image_name": "uwants_post_001.jpg"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    }]
}
