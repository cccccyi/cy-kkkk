{
    "homeUrl": "{{tg_url}}",
    "networkSwitch": true,
    "checkMemoryRate": true,
	"targets": [],   
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 10000
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