[{
    "name": "open",
    "params": {
        "url": "https://www.facebook.com/groups/{{group_fid}}/user/{{account_fid}}/",
        "timeout": 10000
    }
},{
    "name": "wait",        
    "params": {
        "interval":5000
    }
},{
    "name": "loop",
    "loopTag": "reportStartIndex",
    "loop_count": 1,
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