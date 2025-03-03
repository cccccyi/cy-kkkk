[{
    "name": "open",
    "params": {
        "url": "https://www.facebook.com/settings?tab=videos"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ document.querySelector(\"iframe[src*='setting']\").contentDocument.querySelector('#autoplay_setting').click(); }catch(err){}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn = document.evaluate(\"//a[@role='menuitemcheckbox']/span/span[text()= 'Off']\", document.querySelector(\"iframe[src*='setting']\").contentDocument).iterateNext(); btn.click(); }catch(err){}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipSearchKeyword}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipSearchKeyword"
    }
},{
    "name": "input",
    "params": {
        "selector": "input[aria-label='Search Facebook']",
        "value": "{{searchKeyword}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "input",
    "params": {
        "type": "enter",
        "selector": "input[aria-label='Search Facebook']"
    }
},{
    "name": "wait",
    "params": {
        "interval": 10000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ document.querySelector(\"a[href*='/search/posts/']\").click() }catch{}"
    }
},{
    "name": "loop",
    "loop_count": "{{monitorFbPostsLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
        "code": "try{ const span=document.evaluate(\"//span[contains(text(), 'End of results') or contains(text(), 'find any results')]\",document).iterateNext(); if(span){window.loadingFlag='no'}else{window.loadingFlag='yes'} }catch{}"
        }
    },{
        "name": "variables",
        "params": {
            "name": "loadingFlag",
            "fromJsVar": true
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkText",
                "variable": "loadingFlag",
                "operator": "equal",
                "expected": "no"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{ document.querySelector(\"a[href*='/search/pages/']\").click() }catch{}"
    }
},{
    "name": "loop",
    "loop_count": "{{monitorFbPostsLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
        "code": "try{ const span=document.evaluate(\"//span[contains(text(), 'End of results') or contains(text(), 'find any results')]\",document).iterateNext(); if(span){window.loadingFlag='no'}else{window.loadingFlag='yes'} }catch{}"
        }
    },{
        "name": "variables",
        "params": {
            "name": "loadingFlag",
            "fromJsVar": true
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkText",
                "variable": "loadingFlag",
                "operator": "equal",
                "expected": "no"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{ document.querySelector(\"a[href*='/search/groups/']\").click() }catch{}"
    }
},{
    "name": "loop",
    "loop_count": "{{monitorFbPostsLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
        "code": "try{ const span=document.evaluate(\"//span[contains(text(), 'End of results') or contains(text(), 'find any results')]\",document).iterateNext(); if(span){window.loadingFlag='no'}else{window.loadingFlag='yes'} }catch{}"
        }
    },{
        "name": "variables",
        "params": {
            "name": "loadingFlag",
            "fromJsVar": true
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkText",
                "variable": "loadingFlag",
                "operator": "equal",
                "expected": "no"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{ document.querySelector(\"a[href*='/search/people/']\").click() }catch{}"
    }
},{
    "name": "loop",
    "loop_count": "{{monitorFbPostsLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
        "code": "try{ const span=document.evaluate(\"//span[contains(text(), 'End of results') or contains(text(), 'find any results')]\",document).iterateNext(); if(span){window.loadingFlag='no'}else{window.loadingFlag='yes'} }catch{}"
        }
    },{
        "name": "variables",
        "params": {
            "name": "loadingFlag",
            "fromJsVar": true
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkText",
                "variable": "loadingFlag",
                "operator": "equal",
                "expected": "no"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{ document.querySelector(\"a[href*='/search/places/']\").click() }catch{}"
    }
},{
    "name": "loop",
    "loop_count": "{{monitorFbPostsLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "call",
        "params": {
        "code": "try{ const span=document.evaluate(\"//span[contains(text(), 'End of results') or contains(text(), 'find any results')]\",document).iterateNext(); if(span){window.loadingFlag='no'}else{window.loadingFlag='yes'} }catch{}"
        }
    },{
        "name": "variables",
        "params": {
            "name": "loadingFlag",
            "fromJsVar": true
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkText",
                "variable": "loadingFlag",
                "operator": "equal",
                "expected": "no"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "wait",
    "label": "skipSearchKeyword",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlMonitorFb}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "endCrawlLabel"
    }
},{
    "name": "open",
    "params": {
        "url": "{{monitorFbUrl}}",
        "timeout": 180000
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "loop",
    "loop_count": "{{monitorFbPostsLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    }]
},{
    "name": "open",
    "params": {
        "url": "https://baidu.com"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlAbout}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "endCrawlLabel"
    }
},{
    "name": "open",
    "params": {
        "url": "{{monitorFbUrl}}",
        "timeout": 180000
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//div[@role='main']//div[@role='button']//span[text()='See all']\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": "3000"
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//a[contains(@href, 'about')]//span[contains(text(), 'About') or contains(text(), 'See') or contains(text(), 'Learn')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkNotVisible",
            "selector": "a[href*='/about_']"
        }],
        "label": "skipAboutTabs"
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_privacy_and_legal_info']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_privacy_and_legal_info']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_profile_transparency']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_profile_transparency']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_work_and_education']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_work_and_education']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_places']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_places']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_contact_and_basic_info']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_contact_and_basic_info']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_family_and_relationships']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_family_and_relationships']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_details']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_details']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='about_life_events']\").click()}catch{}"
    }
},{
    "name": "wait",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "a[href*='about_life_events']"
        }
    },
    "params": {
        "interval": 3000
    }
},{
    "name": "wait",
    "label": "skipAboutTabs",
    "params": {
        "interval": 2000
    }
},{
    "name": "loop",
    "loop_count": 3,
    "actions": [{
        "name": "scroll",
        "params": {
            "nextScreen": true
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    }]
},{
    "name": "wait",
    "params": {
        "code": "try{const btn=document.evaluate(\"//div[@role='tablist']//span[contains(text(), 'Past')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const sleep=ms=>{return new Promise(resolve => setTimeout(resolve, ms))}; const close_win=()=>{const close_btn=document.querySelector(\"div[role='dialog'] div[aria-label='Close']\");if(close_btn) close_btn.click()};  const run_call = async function(){ let index=0; let btn=null; while(btn=document.evaluate(\"//div[text()='See More' or text()='See more']\", document).iterateNext()){ btn.click();btn.innerText='smclick';await sleep(3000);close_win(); } close_win(); }; run_call(); }catch{}"  
    }
}, {
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "call",
    "params": {
        "code": "window.scrollTo(0, 100)"
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlMonitorFbFriends}}",
            "expected": "y",
            "operator": "equal"
        },{
            "type": "checkNotVisible",
            "selector": "div[role='tablist'] a[href*='friends']"
        }],
        "label": "skipCrawlMonitorFbFriends"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='tablist'] a[href*='friends']\").click()}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "loop",
    "loopTag": "reportStartIndex",
    "loop_count": "{{monitorFbFriendsLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[role='progressbar'][data-visualcompletion='loading-state']"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "open",
    "params": {
        "url": "{{monitorFbUrl}}",
        "timeout": 180000
    }
},{
    "name": "wait",
    "label": "skipCrawlMonitorFbFriends",
    "params": {
        "interval": 3000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlMonitorFbFollowing}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipCrawlMonitorFbFollowing"
    }
},{
    "name": "call",
    "params": {
        "code": "window.scrollTo(0, 100)"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//div[@role='tablist']//a[contains(@href, 'friends') or contains(@href, 'followers')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkNotVisible",
            "selector": "div[role='tablist'] a[href*='following']"
        }],
        "label": "skipCrawlMonitorFbFollowing"
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='tablist'] a[href*='following']\").click()}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "loop",
    "loopTag": "reportStartIndex",
    "loop_count": "{{monitorFbFollowingLoopCount}}",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[role='progressbar'][data-visualcompletion='loading-state']"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "open",
    "params": {
        "url": "{{monitorFbUrl}}",
        "timeout": 180000
    }
},{
    "name": "wait",
    "label": "skipCrawlMonitorFbFollowing",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkNotVisible",
            "selector": "div[role='tablist'] a[href*='member']"
        }],
        "label": "skipCrawlMember"
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='tablist'] a[href*='member']\").click()}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "loop",
    "loopTag": "reportStartIndex",
    "loop_count": "2",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[role='progressbar'][data-visualcompletion='loading-state']"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"a[href*='members/admins']\").click()}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "loop",
    "loopTag": "reportStartIndex",
    "loop_count": "2",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[role='progressbar'][data-visualcompletion='loading-state']"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "open",
    "params": {
        "url": "{{monitorFbUrl}}",
        "timeout": 180000
    }
},{
    "name": "wait",
    "label": "skipCrawlMember",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": {
            "checkers": [{
                "type": "checkText",
                "value": "{{skipCrawlActivity}}",
                "expected": "y",
                "operator": "equal"
            }],
            "group": "and"
        },
        "label": "skipCrawlActivity"
    }
},{
    "name": "jump",
    "params": {
        "checkers": {
            "checkers": [{
                "type": "checkNotVisible",
                "selector": "a[href$='/events/']"
            }],
            "group": "and"
        },
        "label": "skipCrawlActivity"
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.querySelector(\"a[href$='/events/']\"); if(btn) {btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const sleep=ms=>{return new Promise(resolve => setTimeout(resolve, ms))}; const run_call=async function(){ let index=0; let btn=null; while(btn=document.evaluate(\"//span[text()='See More' or text()='See more']\", document).iterateNext()){ btn.click();await sleep(2000);index++;if(index>10){break;}} };  run_call(); }catch{}"  
    }
},{
    "name": "wait",
    "label": "skipCrawlActivity",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipTopFans}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipTopFans"
    }
},{
    "name": "call",
    "params": {
        "code": "window.scrollTo(0, 100)"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//div[@aria-haspopup='menu']//span[text()='More']\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//a[contains(@href, 'community')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//div[@role='button']/span[text()='See all']\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const sleep=ms=>{return new Promise(resolve => setTimeout(resolve, ms))}; const run_call=async function(){let cursor=0;const dialog=document.querySelector(\"div[aria-label*='Top fans of'] >div+div+div\");if(!dialog) return;for(let i=0;i<20;i++){console.log(`top fans i:${i}`);const beforeScrollTop=dialog.scrollTop;dialog.scrollTop=100000;await sleep(3000);const afterScrollTop=dialog.scrollTop;if(afterScrollTop<=beforeScrollTop) break;}const closeBtn=document.querySelector(\"div[aria-label='Close']\"); if(closeBtn) closeBtn.click(); await sleep(1000)}; run_call(); }catch{}"
    }
},{
    "name": "wait",
    "label": "skipTopFans",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipCrawlAlbum}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipCrawlAlbum"
    }
},{
    "name": "call",
    "params": {
        "code": "window.scrollTo(0, 100)"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//div[@role='tablist']//a[contains(@href, 'photo') or contains(@href,'media')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 3000
    }
},{
    "name": "jump",
    "params": {
        "checkers": {
            "checkers": [{
                "type": "checkNotVisible",
                "selector": "div[role='tablist'] a[href*='photos_albums']"
            },{
                "type": "checkNotVisible",
                "selector": "a[href*='tab=album']"
            },{
                "type": "checkNotVisible",
                "selector": "a[role='tab'][href*='media/albums']"
            }],
            "group": "and"
        },
        "label": "skipCrawlAlbum"
    }
},{
    "name": "call",
    "params": {
        "code": "try{ const btn=document.querySelector(\"div[role='tablist'] a[href*='photos_albums']\") || document.querySelector(\"a[href*='tab=album']\") || document.querySelector(\"a[role='tab'][href*='media/albums']\"); if(btn) {btn.click();} }catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "data",
    "params": {
        "name": "albumUrlList",
        "blocks": ["div > a[href*='media/set/?set=']"],
        "fields": {
            "url": {
                "target": "<self>",
                "from": "href",
                "variables": "url_list"
            }
        }
    }
},{
    "name": "loop",
    "loopTag": "postStartIndex",
    "loop_count": 10,
    "actions": [{
        "name": "open",
        "params": {
            "url": "@@url_list.##.url@@"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    },{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 3000
        }
    }]
},{
    "name": "wait",
    "label": "skipCrawlAlbum",
    "params": {
        "interval": 1000
    }
},{
    "name": "wait",
    "label": "endCrawlLabel",
    "params": {
        "interval": 1000
    }
}]