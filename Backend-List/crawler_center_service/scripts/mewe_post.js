{
    "homeUrl": "https://mewe.com",
    "networkSwitch": true,
    "keepNetworkLog": true,
    "checkers": {
        "logined": {
            "group": "or",
            "checkers": [{
                "type": "checkVisible",
                "selector": "div[id*='em'] a[href*='myworld']"
            }]
        }
    },
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "label": "logined",
            "checkers": "logined"
        }
    }, {
        "name": "open",
        "params": {
            "url": "https://mewe.com/login"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "input",
        "params": {
            "selector": "input#email-input",
            "value": "{{userName}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "document.querySelector('input#email-input').blur();"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "click",
        "params": {
            "selector": "button.btn-secondary"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "input",
        "params": {
            "selector": "input#password-input",
            "value": "{{passWord}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "click",
        "params": {
            "selector": "button[type='submit']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 60000
        }
    },{
        "name": "wait",
        "label": "logined",
        "params": {
            "checkers": "logined"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "click",
        "params": {
            "selector": ".dialog_wrapper svg.svg_cancel"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "type": "checkVisible",
                "selector": "div[id*='em'] .postbox-placeholder_text"
            },
            "timeout": 2000
        }
    },{
        "name": "click",
        "params": {
            "selector": "div[id*='em'] .postbox-placeholder_text"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "input",
        "params": {
            "selector": "div[id*='em'] .postbox_header_post div .quill-editor",
            "value": {{content}}
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "type": "checkVisible",
                "selector": "div[id*='em'] .postbox_controls_share button"
            },
            "timeout": 2000
        }
    },{
        "name": "jump",
        "params": {
            "label": "post_content",
            "checkers": {
                "type": "checkText",
                "value": "{{corpus_path}}",
                "expected": "",
                "operator": "equal"
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
                "url": "http://161.117.55.73:8011/mewe_images/@@name@@",
                "name": "@@name@@"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 5000
            }
        },{
            "name": "uploadFile",
            "condition": {
                "checkers": {
                    "type": "checkexist",
                    "selector": "div[id*='em'] input[type='file'][id='fake-upload-photo']"
                }
            },
            "params": {
                "selector": "div[id*='em'] input[type='file'][id='fake-upload-photo']",
                "path": "@@name@@"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 10000
            }
        }]
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "group": "or",
                "checkers": [{
                    "type": "checkVisible",
                    "selector": "div[id*='em'].postbox .postbox_media_photo_img"
                },{
                    "type": "checkVisible",
                    "selector": "div[id*='em'].postbox button[title*='emove'] svg"
                }]
            }
        }
    },{
        "name": "wait",
        "params": {
            "interval": 1000
        }
    },{
        "name": "wait",
        "label": "post_content",
        "params": {
            "checkers": "logined"
        }
    },{
        "name": "click",
        "params": {
            "selector": ".postbox_controls_share_sharedto"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "click",
        "params": {
            "selector": ".sharing-info[for='sharing-public'] span"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "click",
        "params": {
            "selector": "div[id*='em'] .postbox_controls_share button"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "screenshot",
        "params": {
            "image_name": "mewe_post_001.jpg"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    }]
}