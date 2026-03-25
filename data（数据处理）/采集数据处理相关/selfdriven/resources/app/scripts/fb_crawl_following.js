[{
    "name": "open",
    "params": {
        "url": "{{crawlerUrl}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 10000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//div[@role='tablist']//a[contains(@href, 'friends') or contains(@href, 'followers')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkNotVisible",
            "selector": "div[role='tablist'] a[href*='following']"
        }],
        "label": "skipCrawlMonitorFbFollowing"
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='tablist'] a[href*='following']\").click()}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "loop",
    "loopTag": "reportStartIndex",
    "loop_count": "{{scrollCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
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
    "label": "skipCrawlMonitorFbFollowing",
    "params": {
        "interval": 3000
    }
}]