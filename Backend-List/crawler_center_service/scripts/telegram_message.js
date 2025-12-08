{
    "homeUrl": "https://web.telegram.org/",
    "networkSwitch": true,
    "checkMemoryRate": true,
    "browserShowLink": false,
    "keepNetworkLog": true,
    "targets": [],
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "loop",
        "loopTag": "startIndex",
        "loop_count": "variablesCount",
        "start_index": "fromLoopTag",
        "variables": {{tgTargets}},
        "actions": [{
            "name": "open",
            "params": {
                "url": "https://t.me/@@name@@"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 10000
            }
        },{
            "name": "click",
            "params": {
                "selector": ".tgme_action_web_button"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 10000
            }
        },{
            "name": "click",
            "params": {
                "selector": ".HeaderActions button.tiny"
            }
        },{
            "name": "call",
            "params": {
                "code": "try{const btn=document.evaluate(\"//button[contains(string(), 'Join') or contains(string(), 'JOIN') ]\",document).iterateNext();if(btn){btn.click()}}catch{}"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 10000
            }
        },{
            "name": "jump",
            "condition": {
                "checkers": [{
                    "type": "checkNotVisible",
                    "selector": "#editable-message-text"
                },{
                    "type": "checkNotVisible",
                    "selector": ".input-message-input"
                }]
            },
            "params": {
                "continue_loop": true
            }
        },{
            "name": "input",
            "condition":{
                "checkers": {
                    "type": "checkVisible",
                    "selector": "#editable-message-text"
                }
            },
            "params": {
                "selector": "#editable-message-text",
                "value": {{text}}
            }
        },{
            "name": "input",
            "condition":{
                "checkers": {
                    "type": "checkVisible",
                    "selector": ".input-message-input"
                }
            },
            "params": {
                "selector": ".input-message-input",
                "value": {{text}}
            }
        },{
            "name": "wait",
            "params": {
                "interval": 2000
            }
        },{
            "name": "click",
            "params": [{
                "selector": "button[title='Send Message']"
            },{
                "selector": "button.send"
            }]
        },{
            "name": "wait",
            "params": {
                "interval": 3000
            }
        },{
            "name": "snapshot",
            "params": {
                "prefix": "snapshot_@@name@@"
            }
        },{
            "name": "wait",
            "params": {
                "interval": 3000
            }
        }]
    }]
}
