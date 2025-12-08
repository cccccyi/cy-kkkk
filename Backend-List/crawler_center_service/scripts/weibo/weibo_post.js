{
    "homeUrl": "https://weibo.com/",
    "networkSwitch": true,
    "checkMemoryRate": true,
    "targets": [],
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 10000
        }
        
    },{
        "name": "click",
        "params": {
            "selector": "button[title='发微博']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
        
    },{    
        "name": "jump",
        "params": {
            "label": "uploadImg",
            "checkers": {
                "type": "checkVariable",
                "value": {{content}},
                "expected": "",
                "operator": "equal"
            }
        }
    },{
        "name": "postXtweet",
        "params": {
            "selector": "div.woo-modal-main textarea[class*='Form_input']",
            "title": {{title}},
            "value": {{content}},
            "browserInput": true
        }
    },{
        "name": "wait",
        "label": "uploadImg",
        "params": {
            "interval": 5000
        }
    },{    
        "name": "jump",
        "params": {
            "label": "savePost",
            "checkers": {
                "type": "checkVariable",
                "value": "{{image1URL}}",
                "expected": "",
                "operator": "equal"
            }
        }
    },{
        "name": "call",
        "params": {
            "code": "document.querySelectorAll(\"input[type='file']\")[0].setAttribute('id','picBtn');"
        }
    },{
        "name": "fetchMaterial",
        "params": {
            "url": "{{image1URL}}",
            "name": "{{image1Name}}"
        }
    },{
        "name": "uploadFile",
        "params": {
            "selector": "div.woo-modal-main .Image_picbed_1iGAN input[type='file']",
            "path": "{{image1Name}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
    },{
        "name": "wait",
        "label": "savePost",
        "params": {
            "interval": 5000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//div[@class = 'woo-modal-main']//button[contains(string(), '发送')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 10000
        }
        
    }]
}
