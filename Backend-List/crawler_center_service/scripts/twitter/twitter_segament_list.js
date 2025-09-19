[{
    "name": "open",
    "params": {
        "url": "https://x.com/{{screenName}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "open",
    "params": {
        "url": "{{listURL}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "click",
    "params": {
        "selector": "a[href*='list'][href*='/info']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "click",
    "params": {
        "selector": "div[role='dialog'] a[href*='list'][href*='/members']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "click",
    "params": {
        "selector": "div[role='dialog'] a[href*='list'][href*='/suggested']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "input",
    "params": {
        "selector": "div[role='dialog'] input",
        "value": "{{screenName}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 10000
    }
},{
    "name": "click",
    "params": {
        "selector": "div[role='dialog'] button[aria-label='Add']"
    }
},{
    "name": "open",
    "params": {
        "url": "{{listURL}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "loop",
    "loop_count": 10,
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
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
}]