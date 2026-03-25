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
        "code": "try{ const sleep=ms=>{return new Promise(resolve => setTimeout(resolve, ms))};  const run_scroll = async function(){for(let i=0;i<200;i++){window.scrollTo(0, 1000000000000); console.log(i);await sleep(1000);}}; run_scroll(); }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
}]