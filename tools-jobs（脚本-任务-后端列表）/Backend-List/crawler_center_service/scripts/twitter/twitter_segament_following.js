[{
    "name": "open",
    "params": {
        "url": "{{url}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@data-testid='placementTracking']//button//span[text()='关注']\",document).iterateNext();if(btn){btn.click();} }catch{}"
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
}]