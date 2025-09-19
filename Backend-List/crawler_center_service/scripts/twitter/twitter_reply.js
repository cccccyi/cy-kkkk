{
    "homeUrl": "https://x.com",
    "networkSwitch": true,
    "loadImages": true,
    "keepNetworkLog": false,
    "checkMemoryRate": false,
    "browserShowLink": false,
    "continueCrawlTimeout": "3600",
    "crawlOptions": {
        "crawlerSwitch": true,
        "site": "blockchain",
        "crawlerType": "twitterBlock",
        "crawlerAccountFid": "{{screenName}}"
    },
    "targets": [{
        "name": "accountNeedPhone",
        "checkers": [{
            "type": "checkText",
            "selector": ".TextGroup .TextGroup-list li:nth-child(2)",
            "operator": "contain",
            "expected": "Verify your phone number"
        }]
    },{
        "name": "accountNeedPhone",
        "checkers": [{
            "type": "checkVisible",
            "selector": "div[role='group'] input[type='tel']"
        }]
    },{
        "name": "accountNeedChangePwd",
        "checkers": [{
            "type": "checkVisible",
            "selector": ".Section .PageHeader"
        }]
    }, {
        "name": "accountEmailIssue",
        "checkers": [{
            "type": "checkVisible",
            "selector": "form[action*='/account/access'] input[value='Send email']"
        }]
    },{
        "name": "accountNotLogin",
        "checkers": [{
            "type": "checkText",
            "selector": "div[role='alert']>div[dir='auto']>span",
            "operator": "contain",
            "expected": "we could not find your account"
        }]
    },{
        "name": "accountNeedActive",
        "checkers": [{
            "type": "checkVisible",
            "selector": "#CaptchaFrame"
        }]
    },{
        "name": "accountNeedActive",
        "checkers": [{
            "type": "checkVisible",
            "selector": "#arkose_iframe"
        }]
    },{
        "name": "accountNeedActive",
        "checkers": [{
            "type": "checkText",
            "selector": "div.PageHeader.Edge",
            "operator": "contain",
            "expected": "Please verify your account"
        }]
    },{
        "name": "accountNeedActive",
        "checkers": [{
            "type": "checkVisible",
            "selector": "div.PageHeader.Edge"
        }]
    }],
    "checkers": {
        "logined": {
            "group": "or",
            "checkers": [{
                "type": "checkVisible",
                "selector": ".DashboardProfileCard-name"
            },{
                "type": "checkVisible",
                "selector": "a[href='/compose/post']"
            },{
                "type": "checkUrl",
                "expected": "x.com/home",
                "operator": "contain"
            }]
        }
    },
    "actions": [{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": "logined",
            "label": "logined"
        }
    },{
        "name": "click",
        "condition":{
            "checkers":{
                "selector": "input[value='Start']",
                "type":"checkVisible"
            }
        },
        "params": {
            "selector": "input[value='Start']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "click",
        "condition":{
            "checkers":{
                "selector": "input.EdgeButton",
                "type":"checkVisible"
            }
        },
        "params": {
            "selector": "input.EdgeButton"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "click",
        "params": {
            "selector": "a[href='/login']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "params": {
            "checkers": {
                "group": "or",
                "checkers": [
                    "logined",
                    {
                        "type": "checkVisible",
                        "selector": "a[href='/login']"
                    },{
                        "type": "checkVisible",
                        "selector": "input[name='session[username_or_email]']"
                    },{
                        "type": "checkVisible",
                        "selector": "input[autocomplete='username']"
                    },{
                        "type": "checkVisible",
                        "selector": "div[role='alertdialog'] div[data-testid='confirmationSheetDialog']"
                    }
                ]
            }
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": "logined",
            "label": "logined"
        }
    },{
        "name": "input",
        "params": {
            "selector": "input[autocomplete='username'][type='text']",
            "value": "{{account}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//button//span[contains(string(), 'Next') or contains(string(), '下一步')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "input",
        "params": {
            "selector": "input[type='password']",
            "value": "{{password}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 2000
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//button//span[contains(string(), 'Log in')]\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "#challenge_response"
            },
            "label": "logined"
        }
    },{
        "name": "jump",
        "params": {
            "checkers": {
                "type": "checkVisible",
                "selector": ".add-on"
            },
            "label": "check_nick_name"
        }
    },{
        "name": "jump",
        "params": {
            "checkers": {
                "type": "checkText",
                "selector": ".Section strong",
                "operator": "contain",
                "expected": "@"
            },
            "label": "check_email"
        }
    },{
        "name": "input",
        "params": {
            "selector": "#challenge_response",
            "value": "{{fullphone}}"
        }
    },{
        "name": "jump",
        "params": {
            "label": "submit_challenge"
        }
    },{
        "name": "input",
        "label": "check_nick_name",
        "params": {
            "selector": "#challenge_response",
            "value": "{{nickName}}"
        }
    },{
        "name": "jump",
        "params": {
            "label": "submit_challenge"
        }
    }, {
        "name": "input",
        "label": "check_email",
        "params": {
            "selector": "#challenge_response",
            "value": "{{firstAnswer}}"
        }
    },{
        "name": "wait",
        "label": "submit_challenge",
        "params": {
            "interval": 3000
        }
    },{
        "name": "click",
        "params": {
            "selector": "#email_challenge_submit"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "wait",
        "label": "logined",
        "params": {
            "checkers": {
                "group": "or",
                "checkers": [
                    "logined",
                    {
                        "type": "checkVisible",
                        "selector": "a[aria-label='Home']"
                    },{
                        "type": "checkVisible",
                        "selector": "a[aria-label='Tweet']"
                    }
                ]
            }
        },
        "timeout": 300000
    },{
        "name": "open",
        "params": {
            "url": "{{tweetURL}}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 8000
        }
    },{
        "name": "click",
        "params": {
            "selector": "button[data-testid='like']"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "params": {
            "checkers": [{
                "type": "checkText",
                "value": "",
                "expected": {{content}},
                "operator": "equal"
            }],
            "label": "skipReply"
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//button[@data-testid='reply']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 1000
        }
    },{
        "name": "wait",
        "params":{
            "checkers": [{
                "type": "checkVisible",
                "selector": ["div[aria-label='Post text']", "div[aria-label='帖子文本']"]
            }],
            "ignorable": false,
            "timeout": 30000
        }
    },{
        "name": "loop",
        "loopTag": "inputLoop",
        "loop_count": "10",
        "actions": [{
            "name": "setAlwaysOnTopTrue"
        },{
            "name": "input",
            "params": {
                "selector": ["div[aria-label='Post text']", "div[aria-label='帖子文本']"],
                "value": {{content}},
                "browserInput": true
            }
        },{
            "name": "setAlwaysOnTopFalse"
        },{
            "name": "jump",
            "condition": {
                "checkers": {
                    "type": "checkNotVisible",
                    "selector": "button[data-testid='tweetButton'][aria-disabled='true']"
                }
            },
            "params": {
                "exit_loop": true
            }
        }]
    },{
        "name": "screenshot",
        "params": {
            "image_name": "input_img.jpg"
        }
    },{
        "name": "call",
        "params": {
            "code": "try{ const btn=document.evaluate(\"//button[string()='回复' or string()='Reply']\",document).iterateNext();if(btn){btn.click();} }catch{}"
        }
    },{
        "name": "wait",
        "label": "skipReply",
        "params": {
            "interval": 5000
        }
    }]
}