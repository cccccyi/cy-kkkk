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
        "name":"jump",
        "params":{
            "label":"googleRecheck",
            "checkers":{
                "type":"checkVisible",
                "selector":".g-recaptcha"
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
        "label":"logined", 
        "params" : {  
            "interval": 10000
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
        "name": "click",
        "params": {
            "selector": "a[href*='space.php?uid'] >span"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "click",
        "params": {
            "selector": ".pic-edit >a >img"
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
            "frame": ".fancybox-content >iframe",
            "selector": "input#avatarupload",
            "path": "{{uploadPhoto}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "switchPage",
        "params": {
            "frameSelector": ".fancybox-content >iframe"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "click",
        "params": {
            "selector": "form #confirm"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "backPage",
        "params": {
            "frame": "top"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
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