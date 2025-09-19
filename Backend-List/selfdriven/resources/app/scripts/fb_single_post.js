[{
    "name": "open",
    "params": {
        "url": "{{postURL}}",
        "timeout": 180000
    }
},{
    "name": "wait",
    "params": {
        "interval": 10000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlerShares}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipCrawlerShares"
    }
},{
    "name": "call",
    "params": {
        "code": "let sleep=ms=>{return new Promise(resolve => setTimeout(resolve, ms))};const run = async function(){let btns=[]; let cursor=0; const result = document.evaluate(\"//div[@role='button']/span[contains(text(), 'share')]\", document); let btn=result.iterateNext(); while(btn){btns.push(btn); btn = result.iterateNext();} for(let btn of btns){console.log(`share cursor: ${cursor++} all:${btns.length}`);btn.scrollIntoViewIfNeeded();await sleep(1000);btn.click();await sleep(3000);const dialog=document.querySelector(\"div[aria-label*='shared'] >div+div+div\");for(let i=0;i<100;i++){console.log(`share i:${i}`);const beforeScrollTop=dialog.scrollTop;dialog.scrollTop=100000;await sleep(3000);const afterScrollTop=dialog.scrollTop;if(afterScrollTop<=beforeScrollTop) break;}const closeBtn=document.querySelector(\"div[aria-label='Close']\");if(closeBtn) closeBtn.click(); await sleep(2000);}}; run();"
    }
},{
    "name": "wait",
    "label": "skipCrawlerShares",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlerComments}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipCrawlerComments"
    }
},{
    "name": "call",
    "params": {
        "code": "let sleep=ms=>{return new Promise(resolve => setTimeout(resolve, ms))};const run = async function(){let index=0; let btn=null; while(btn = document.evaluate(\"//span[contains(text(), 'more comment')]\", document).iterateNext()){console.log(`comment index:${index++}`);btn.scrollIntoViewIfNeeded();btn.click(); await sleep(3000)}}; run();"
    }
},{
    "name": "wait",
    "label": "skipCrawlerComments",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlerPraises}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipCrawlerPraises"
    }
},{
    "name": "call",
    "params": {
        "code": "let sleep=ms=>{return new Promise(resolve => setTimeout(resolve, ms))};const run = async function(){const btns = document.querySelectorAll('span > span.pcp91wgn');console.log(`paraise all post btns: ${btns.length}`);let cursor=0;for(let btn of btns){console.log(`praise cursor:${cursor++}  all:${btns.length}`);btn.scrollIntoViewIfNeeded();btn.click();await sleep(3000);const dialog=document.querySelector(\"div[aria-label='Reactions'] >div+div+div\");for(let i=0;i<100;i++){console.log(`praise i:${i}`);const beforeScrollTop=dialog.scrollTop;dialog.scrollTop=100000;await sleep(3000);const afterScrollTop=dialog.scrollTop;if(afterScrollTop<=beforeScrollTop) break;}const closeBtn=document.querySelector(\"div[aria-label='Close']\");if(closeBtn) closeBtn.click(); await sleep(2000);}}; run();"
    }
},{
    "name": "wait",
    "label": "skipCrawlerPraises",
    "params": {
        "interval": 1000
    }
}]