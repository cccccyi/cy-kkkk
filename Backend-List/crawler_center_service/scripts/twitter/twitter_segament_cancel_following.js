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
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@data-testid='placementTracking']//button[contains(@aria-label, '正在关注')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@data-testid='confirmationSheetDialog']//button//span[text()='取消关注']\",document).iterateNext();if(btn){btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
}]