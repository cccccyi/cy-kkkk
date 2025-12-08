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
            },{
                "type": "checkurl",
                "expected": "index.php",
                "operator": "contain"
            },{
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
            "url": "https://www.uwants.com/"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
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
        "name": "click",
        "params": {
            "selector": "a.member_icon.top-btn"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "click",
        "params": {
            "selector": "a[href*='space.php?action=viewpro&uid']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "click",
        "params": {
            "selector": "#viewpro_header_avatar"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "fetchMaterial",
        "params": {
            "url": "http://161.117.55.73:8011/uwants_images/{{uploadPhoto}}",
            "name": "{{uploadPhoto}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "uploadFileDVP",
        "params": {
            "selector": "#avatar_file_input",
            "path": "{{uploadPhoto}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 20000
        }
    },{
        "name": "click",
        "params": {
            "selector": "#avatar_save"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "call",
        "params": {
            "code": "window.location.reload();"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    }]
}
