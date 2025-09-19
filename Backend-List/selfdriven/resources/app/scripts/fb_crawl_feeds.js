[{
    "name": "open",
    "params": {
        "url": "https://www.facebook.com",
        "timeout": 18000
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ document.querySelector(\"a[href*='sk=h_chr']\").click() }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "loop",
    "loop_count": {{scrollFeedsCount}},
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const span=document.evaluate(\"//span[contains(text(), 'all caught up on Most Recent posts') or contains(text(), 'all caught up on most recent posts') or contains(text(), 'No More Posts')]\",document).iterateNext(); if(span){window.loadingFlag='no'}else{window.loadingFlag='yes'} }catch{}"
        }
    },{
        "name": "variables",
        "params": {
            "name": "loadingFlag",
            "fromJsVar": true
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkText",
                "variable": "loadingFlag",
                "operator": "equal",
                "expected": "no"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "wait",
    "params": {
        "interval": "random"
    }
},{
    "name": "open",
    "params": {
        "url": "https://www.facebook.com/me",
        "timeout": 10000
    }
},{
    "name": "wait",        
    "params": {
        "interval":5000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='tablist'] a[href*='friends']\").click()}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//a[contains(@href, 'following')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "loop",
    "loopTag": "reportStartIndex",
    "loop_count": 5,
    "actions":[{
        "name": "scroll",
        "params": {
            "selector": "end",
             "emulate": true
        }
    },{
        "name": "wait",
        "params":{
            "interval": 5000
        }
    }]
}]