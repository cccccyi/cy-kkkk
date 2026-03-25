[{
    "name": "open",
    "params": {
        "url": "{{url}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 8000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@data-testid='placementTracking']//button//span[text()='关注']\",document).iterateNext();if(btn){btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 4000
    }
},{
    "name": "click",
    "params": {
        "selector": "button[aria-label='私信']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 10000
    }
},{
    "name": "click",
    "params": {
        "selector": "div[data-testid='dmComposerTextInput']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "input",
    "params": {
        "selector": "div[data-testid='dmComposerTextInput']",
        "value": {{content}},
        "browserInput": true
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.querySelector(\"button[data-testid='dmComposerSendButton']\");if(btn){btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
}]