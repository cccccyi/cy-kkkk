[{
    "name": "open",
    "params": {
        "url": "{{tweet_url}}",
        "timeout": 10000
    }
},{
    "name": "wait",        
    "params": {
        "interval": 5000
    }
},{
    "name": "call",
    "params": {
		"code": "try{ const ele=document.evaluate(\"//div[contains(text(), 'your reply')]\",document).iterateNext();if(ele){ele.scrollIntoViewIfNeeded()} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{window.scrollTo(0, window.scrollY-180)}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "screenshot",
    "params": {
        "image_name": "tweet_screenshot_{{tweet_id}}.jpg"
    }
}]