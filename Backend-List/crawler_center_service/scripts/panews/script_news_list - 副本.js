{
    "homeUrl": "{{url}}",
    "networkSwitch": true,
    "loadImages": true,
    "keepNetworkLog": true,
    "checkMemoryRate": false,
    "targets": [],
    "browserShowLink": false,
    "continueCrawlFlag": true,
    "continueCrawlTimeout": "7200",
    "crawlOptions": {
        "crawlerSwitch": false,
        "crawlerType": ""
    },
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "open",
        "params" : {
            "url": "https://www.panewslab.com/zh/news/index.html",
            "timeout": 180000
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "open",
        "params" : {
            "url": "https://www.theblock.co/latest?start=0",
            "timeout": 180000
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "open",
        "params" : {
            "url": "https://www.theblock.co/research",
            "timeout": 180000
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "open",
        "params" : {
            "url": "https://www.binance.com/zh-CN/support/announcement/new-cryptocurrency-listing?c=48&navId=48",
            "timeout": 180000
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    }]
}
