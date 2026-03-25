[{
    "name": "open",
    "params": {
        "url": "https://www.coinglass.com/zh/hyperliquid"
    }
},{
    "name": "wait",
    "params": {
        "interval": 10000
    }
},{
    "name": "data",
    "params": {
        "name": "whalePositionAction",
        "blocks": "",
        "desc":{
            "html": {
                "target": ".orderbook",
                "from": "html"
            }
        },
        "fields": {}
    }
},{
    "name": "loop",
    "loopTag": "positionStartIndex",
    "loop_count": 30,
    "start_index": "fromLoopTag",
    "actions": [{
        "name": "variables",
        "params": {
            "name": "pageNum",
            "selector": ".ant-pagination-item-active"
        }
    },{
        "name": "data",
        "label": "whalePosition",
        "params": {
            "name": "position_@@pageNum@@",
            "scrollToEachItem": true,
            "blocks": "",
            "desc":{
                "html": {
                    "target": ".ant-table-body >table",
                    "from": "html"
                }
            },
            "fields": {}
        }
    },{
        "name": "click",
        "params": {
            "selector": ".ant-pagination-item-active +li"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 1000
        }
    }]
},{
    "name": "data",
    "label": "whalePosition",
    "params": {
        "name": "position_last",
        "scrollToEachItem": true,
        "blocks": "",
        "desc":{
            "html": {
                "target": ".ant-table-body >table",
                "from": "html"
            }
        },
        "fields": {}
    }
}]
