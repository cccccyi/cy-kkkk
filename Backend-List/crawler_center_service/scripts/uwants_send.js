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
        "name": "call",
        "params": {
            "code": "document.querySelector(\"#top_function_gp .top_create_post_bar .top_create_post_box\").click()"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "document.querySelector(\"#darkness #taguser_tips_close\").click()"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "jump",
        "params": {
            "label": "directPost",
            "checkers": {
                "type": "checkVisible",
                "selector": "div[role='textbox']"
            }
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": ".tips_close"
            }
        },
        "params": {
            "selector": ".tips_close"
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "type": "checkVisible",
                "selector": "#subject"
            },
            "timeout": 30000
        }
    },{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": ".tips_close"
            }
        },
        "params": {
            "selector": ".tips_close"
        }
    },{
        "name": "input",
        "params": {
            "selector": "#subject",
            "value": "{{subject}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "switchPage",
        "params": {
            "frame": true,
            "frameHtml": "body",
            "frameSelector": "#posteditor_iframe"
        },
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": ".editor_text iframe"
            }
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "input",
        "params": {
            "selector": "#wysiwyg",
            "value": {{content}}
        }
    }, {
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "backPage",
        "params": {
            "frame": true
        }
    },{
        "name": "jump",
        "params": {
            "label": "submit_content",
            "checkers": {
                "type": "checkVariable",
                "value": "{{corpus_path}}",
                "expected": "",
                "operator": "empty"
            }
        }
    },{
        "name": "loop",
        "loopTag": "uploadStartIndex",
        "loop_count": "variablesCount",
        "start_index": "fromLoopTag",
        "variables": "{{corpus_path}}",
        "actions": [{
            "name": "fetchMaterial",
            "params": {
                "url": "http://161.117.55.73:8011/uwants_images/@@name@@",
                "name": "@@name@@"
            }
        }, {
            "name": "wait",
            "params": {
                "interval": 5000
            }
        }, {
            "name": "uploadFileDVP",
            "params": {
                "selector": "#dropzone #multiple_upload_btn",
                "path": "@@name@@"
            }
        }]
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "label": "submit_content"
        }
    },{
        "name": "wait",
        "label": "directPost",
        "params": {
            "type": "complex",
            "checkers": {
                "type": "checkVisible",
                "selector": "div[role='textbox']"
            },
            "timeout": 30000
        }
    },{
        "name": "input",
        "params": {
            "selector": "#forum-thread-form input[placeholder='標題']",
            "value": "{{subject}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "input",
        "params": {
            "selector": "div[role='textbox']",
            "value": {{content}}
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "label": "submit_content",
            "checkers": {
                "type": "checkVariable",
                "value": "{{corpus_path}}",
                "expected": "",
                "operator": "empty"
            }
        }
    },{
        "name": "loop",
        "loopTag": "uploadStartIndex",
        "loop_count": "variablesCount",
        "start_index": "fromLoopTag",
        "variables": "{{corpus_path}}",
        "actions": [{
            "name": "fetchMaterial",
            "params": {
                "url": "http://161.117.55.73:8011/uwants_images/@@name@@",
                "name": "@@name@@"
            }
        }, {
            "name": "wait",
            "params": {
                "interval": 5000
            }
        }, {
            "name": "uploadFileDVP",
            "params": {
                "selector": "#dropzone #multiple_upload_btn",
                "path": "@@name@@"
            }
        }]
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "label": "submit_content",
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
        "name": "call",
        "params": {
            "code": "document.querySelector(\"button[type='submit']\").click()"
        }
    },{
        "name": "call",
        "params": {
            "code": "document.querySelector(\"#postsubmit\").click()"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 15000
        }
    },{
        "name": "call",
        "params": {
            "code": "window['postUrlValue'] = window.location.href"
        }
    },{
        "name": "variables",
        "params": {
            "fromJsVar": true,
            "name": "postUrlValue"
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "group": "or",
                "checkers": [{
                    "type": "checkText",
                    "value": "@@postUrlValue@@",
                    "expected": "?tid=",
                    "operator": "contain"
                }]
            },
            "timeout": 30000
        }
    },{
        "name": "open",
        "params": {
            "url": "@@postUrlValue@@"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 15000
        }
    },{
        "name": "crawlerEx",
        "params": [{
            "names": [
                "postUrl"
            ],
            "name": "postUrl",
            "fromVariables": "postUrlValue"
        }]
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "screenshot",
        "params": {
            "image_name": "uwants_thread_001.jpg"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    }]
}
