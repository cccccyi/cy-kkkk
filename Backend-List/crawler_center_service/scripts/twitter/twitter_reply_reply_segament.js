[{
    "name": "open",
    "params": {
        "url": "{{tweetURL}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "click",
    "params": {
        "selector": "button[data-testid='like']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "click",
    "params": {
        "selector": "button[data-testid='like']"
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
            "type": "checkText",
            "value": "",
            "expected": {{content}},
            "operator": "equal"
        }],
        "label": "skipReply"
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const snapshot = document.evaluate(\"//button[@data-testid='reply']\", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);const btn = snapshot.snapshotItem(1);if(btn){btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "wait",
    "params":{
        "checkers": [{
            "type": "checkVisible",
            "selector": ["div[aria-label='Post text']", "div[aria-label='帖子文本']"]
        }],
        "ignorable": false,
        "timeout": 30000
    }
},{
    "name": "loop",
    "loopTag": "inputLoop",
    "loop_count": "10",
    "actions": [{
        "name": "setAlwaysOnTopTrue"
    },{
        "name": "input",
        "params": {
            "selector": ["div[aria-label='Post text']", "div[aria-label='帖子文本']", "div[aria-label='发布你的回复']"],
            "value": {{content}},
            "browserInput": true
        }
    },{
        "name": "setAlwaysOnTopFalse"
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "button[data-testid='tweetButton'][aria-disabled='true']"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "screenshot",
    "params": {
        "image_name": "input_img.jpg"
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//button[string()='回复' or string()='Reply']\",document).iterateNext();if(btn){btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "label": "skipReply",
    "params": {
        "interval": 5000
    }
}]