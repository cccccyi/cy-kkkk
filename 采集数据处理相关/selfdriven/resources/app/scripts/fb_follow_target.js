[{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{target_name}}",
            "expected": "",
            "operator": "equal"
        }],
        "label": "skipSearchName"
    }
},{
    "name": "open",
    "params": {
        "url": "https://www.facebook.com/search/pages/?q={{target_name}}"
    }
},{
    "name": "wait",        
    "params": {
        "interval": 5000
    }
},{
    "name": "click",
    "params": {
        "selector": "div[aria-label='Search results'] a[role='presentation']"
    }
},{
    "name": "wait",        
    "params": {
        "interval":10000
    }
},{
    "name": "wait",
    "label": "skipSearchName",
    "params": {
        "interval": 1000
    }
},{
    "name": "open",
    "params": {
        "url": "https://www.facebook.com/{{target_fid}}",
        "timeout": 10000
    }
},{
    "name": "wait",        
    "params": {
        "interval":10000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Follow' or @aria-label='Like']\",document).iterateNext(); if(btn){ btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Following' or @aria-label='Liked']\",document).iterateNext(); if(btn){ btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Follow settings']//span[contains(text(), 'Favorites')]\",document).iterateNext(); if(btn){ btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Follow settings']//span[contains(text(), 'Update')]\",document).iterateNext(); if(btn){ btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@aria-label='Follow' or @aria-label='Like']\",document).iterateNext(); if(btn){ btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
}]