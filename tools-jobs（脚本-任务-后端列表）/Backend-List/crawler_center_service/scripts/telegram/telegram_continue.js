{
    "homeUrl": "{{tg_url}}",
    "networkSwitch": true,
    "loadImages": true,
    "keepNetworkLog": false,
    "checkMemoryRate": false,
    "browserShowLink": false,
    "continueCrawlTimeout": "3600",
    "crawlOptions": {
        "crawlerSwitch": true,
        "site": "telegram",
        "crawlerType": "twitterBlock",
        "crawlerAccountFid": "{{user_name}}"
    },
    "targets": [],
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 6000
        }
    },{
        "name": "setAlwaysOnTopTrue"
    },{
        "name": "wait",
        "params": {
            "interval": 2000
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
            "interval": 5000
        }
    }]
}