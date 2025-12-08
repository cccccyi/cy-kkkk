{
    "homeUrl": "https://www.discuss.com.hk/logging.php?action=login",
    "networkSwitch": true,
    "keepNetworkLog": true,
    "targets":[{
        "name":"accountNotActive",
        "checkers":[{
            "type":"checkVisible",
            "selector":".g-recaptcha"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type": "checkText",
            "selector": ".message",
            "operator": "contain",
            "expected": "賬號被禁用"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type": "checkText",
            "selector": ".message",
            "operator": "contain",
            "expected": "違規會員"
        }]
    },{
        "name":"accountNotActive",
        "checkers":[{
            "type": "checkText",
            "selector": ".message",
            "operator": "contain",
            "expected": "等待驗證"
        }]
    }],
    "checkers": {
        "logined":{
            "group":"or",
                "checkers":[{
                    "type":"checkurl",
                    "expected":"index.php",
                    "operator":"contain"
                }]
        }
    },
    "actions": [{
        "name": "wait",   
        "params" : {  
            "interval": 10000
        }
    },{
        "name":"wait",
        "params":{
            "checkers":{
                "group":"or",
                "checkers":[
                    "logined",{
                        "type": "checkVisible",
                        "selector": "button[name='loginsubmit']"
                    },{
                        "type": "checkVisible",
                        "selector": ".header__search"
                    }
                ]
            }
        }
    },{
        "name":"jump",
        "params":{
            "label":"logined",
            "checkers":"logined"
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
        "name": "click",
        "params": {
            "selector": "input[name='cookietime']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
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
            "interval": 1000
        }
    },{
        "name":"wait",
        "params":{
            "checkers":{
                "type":"checkNotVisible",
                "selector":"button[name='loginsubmit']"
            }
        }
    },{
        "name": "wait",   
        "params" : {  
            "checkers":{
                "group":"or",
                "checkers":[
                    "logined"
                ]
            }
        }
    },{
        "name": "wait",  
        "label":"logined", 
        "params" : {  
            "interval": 5000
        }
    },{
        "name": "click",
        "params" : {
            "selector": "a[title='Close']"
        },  
        "condition":{
            "checkers": {
                "type":"checkVisible",
                "selector":"a[title='Close']"
            }
        }
    },{
        "name":"open",
        "params":{
            "url": "https://www.discuss.com.hk/post.php?action=newthread&ref=mission"
        }
    },{
        "name": "wait",  
        "params" : {  
            "interval": 10000
        }
    },{
        "name":"wait",
        "params":{
            "type":"complex",
            "checkers":{
                "type": "checkVisible",
                "selector": "#postform"
            },
            "timeout":30000
        }
    },{
        "name": "wait",
        "params": {
            "type": "complex",
            "checkers": {
                "type": "checkVisible",
                "selector": "#subject"
            },
            "timeout": 30000
        }
    },{
        "name": "input",
        "params":{
            "selector":"#subject",
            "value": "{{subject}}"
        }
    },{
        "name": "wait",   
        "params" : {  
            "interval": 3000
        }
    },{
        "name": "attr",
        "params": {
            "selector": "select[name='typeid'] option[value='62']",
            "method": "set",
            "name": "selected",
            "value": true
        }
    },{
        "name": "wait",   
        "params" : {  
            "interval": 5000
        }
    },{
        "name": "switchPage",
        "params": {
            "frame": true,
            "frameHtml": "body",
            "frameSelector": ".tox-edit-area__iframe"
        },
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": ".tox-edit-area__iframe"
            }
        }
    },{
        "name": "wait",   
        "params" : {  
            "interval": 5000
        }
    },{
        "name": "input",
        "params": {
            "selector": "#tinymce",
            "value": {{content}}
        }
    },{
        "name": "wait",   
        "params": {  
            "interval": 5000
        }
    },{
        "name": "backPage",        
        "params":{
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
        "name": "wait",
        "label": "submit_content",
        "params": {
            "interval": 5000
        }
    },{
        "name": "click",
        "params" : {
            "selector": "#px1_closeBtn"
        },  
        "condition":{
            "checkers": {
                "type":"checkVisible",
                "selector":"#px1_closeBtn"
            }
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "click",
        "params" : {
            "selector": ".cc-dismiss"
        },  
        "condition":{
            "checkers": {
                "type":"checkVisible",
                "selector":".cc-dismiss"
            }
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "click",
        "params" : {
            "selector": "#postsubmit"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params" : {
            "code":"document.querySelector(\"#postsubmit\").click()"
        }
    },{
        "name": "wait",
        "label": "submit_content",
        "params": {
            "interval": 30000
        }
    },{
        "name": "screenshot",
        "params": {
            "image_name": "discuss_thread_001.jpg"
        }
    },{
        "name": "wait",
        "label": "googleRecheck",
        "params": {
            "interval": 5000
        }
    }]
}