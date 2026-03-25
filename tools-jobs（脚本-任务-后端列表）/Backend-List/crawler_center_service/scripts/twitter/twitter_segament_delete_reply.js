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
    "name": "click",
    "params": {
        "selector": "div[data-testid='cellInnerDiv'] article[data-testid='tweet'] button[aria-label='更多']",
        "index": 1
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.evaluate(\"//div[@role='menuitem']//span[text()='删除']\",document).iterateNext();if(btn){btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "click",
    "params": {
        "selector": "button[data-testid='confirmationSheetConfirm']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
}]