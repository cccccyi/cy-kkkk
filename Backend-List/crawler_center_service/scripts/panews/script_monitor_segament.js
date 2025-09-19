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
    "name": "loop",
    "loop_count": 1,
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
    }]
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
}]