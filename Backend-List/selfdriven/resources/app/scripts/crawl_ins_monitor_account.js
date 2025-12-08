[{
    "name": "open",
    "params": {
        "url": "{{monitorInsUrl}}",
        "timeout": 18000
    }
},{
    "name": "wait",
    "params": {
        "interval": 10000
    }
},{
    "name": "jump",
    "params": {
        "checkers": {
            "group": "or",
            "checkers": [{
                "type": "checkText",
                "selector": "head title",
                "operator": "contain",
                "expected": "Page not found"
            },{
                "type": "checkText",
                "selector": "head title",
                "operator": "contain",
                "expected": "找不到页面"
            }]
        },
        "label": "crawlEnd"
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipUserInfo}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipUserInfo"
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
            "type": "checkNotVisible",
            "selector": "main[role='main'] article h2"
        }
    }
},{
    "name": "wait",
    "label": "skipUserInfo",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipUserFollower}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipUserFollower"
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"main[role='main'] header ul li a[href*='follower']\").click()}catch(e){}"
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
            "type": "checkVisible",
            "selector": "main[role='main'] article div>div>div a"
        }
    }
},{
    "name": "loop",
    "loop_count": "{{monitorLoopCount}}",
    "loopTag": "datatStartIndex",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "div[role='dialog'] div[role='dialog'] div div[style*='max-height'] div._aano div._aanq"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[role='dialog'] div[role='dialog'] div div[style*='max-height'] div._aano div._aanq"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='dialog'] button svg\").click()}catch(e){}"
    }
},{
    "name": "wait",
    "label": "skipUserFollower",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipUserFollowing}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipUserFollowing"
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"main[role='main'] header ul li a[href*='following']\").click()}catch(e){}"
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
            "type": "checkVisible",
            "selector": "main[role='main'] article div>div>div a"
        }
    }
},{
    "name": "loop",
    "loop_count": "{{monitorLoopCount}}",
    "loopTag": "datatStartIndex",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "div[role='dialog'] div[role='dialog'] div div[style*='max-height'] div._aano div._aanq"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[role='dialog'] div[role='dialog'] div div[style*='max-height'] div._aano div._aanq"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='dialog'] button svg\").click()}catch(e){}"
    }
},{
    "name": "wait",
    "label": "skipUserFollowing",
    "params": {
        "interval": 1000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipUserHashtag}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipUserHashtag"
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"main[role='main'] header ul li a[href*='following']\").click()}catch(e){}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "click",
    "params": {
        "selector": "div[role='dialog'] div[role='tablist'] div[role='tab']:nth-child(2)"
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
            "type": "checkVisible",
            "selector": "main[role='main'] article div>div>div a"
        }
    }
},{
    "name": "loop",
    "loop_count": "{{monitorLoopCount}}",
    "loopTag": "datatStartIndex",
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "div[role='dialog'] div[role='dialog'] div div[style*='max-height'] div._aano div._aanq"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[role='dialog'] div[role='dialog'] div div[style*='max-height'] div._aano div._aanq"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[role='dialog'] button svg\").click()}catch(e){}"
    }
},{
    "name": "wait",
    "label": "skipUserHashtag",
    "params": {
        "interval": 1000
    }
},{
    "name": "wait",
    "params": {
        "checkers": {
            "type": "checkVisible",
            "selector": "main[role='main'] article div>div>div a"
        }
    }
},{
    "name": "loop",
    "loop_count": "{{monitorPostLoopCount}}",
    "loopTag": "datatStartIndex",
    "actions": [{
        "name": "scroll",
        "params": {
            "nextScreen": true
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "div[data-visualcompletion='loading-state']"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipComments}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipComments"
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
            "type": "checkVisible",
            "selector": "main[role='main'] article div>div>div a"
        }
    }
},{
    "name": "loop",
    "loop_count": "{{monitorLoopCount}}",
    "loopTag": "datatStartIndex",
    "actions": [{
        "name": "click",
        "condition": {
            "checkers": {
                "type": "checkVisible",
                "selector": "section div[role='presentation'][tabindex] div>ul>li button"
            }
        },
        "params": {
            "selector": "section div[role='presentation'][tabindex] div>ul>li button"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    },{
        "name": "jump",
        "condition": {
            "checkers": {
                "type": "checkNotVisible",
                "selector": "section div[role='presentation'][tabindex] div>ul>li button"
            }
        },
        "params": {
            "exit_loop": true
        }
    }]
},{
    "name": "wait",
    "label": "skipComments",
    "params": {
        "interval": 5000
    }
},{
    "name": "jump",
    "params": {
        "checkers": [{
            "type": "checkText",
            "value": "{{skipLikes}}",
            "expected": "y",
            "operator": "equal"
        }],
        "label": "skipLikes"
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
            "type": "checkVisible",
            "selector": "main[role='main'] article div>div>div a"
        }
    }
},{
    "name": "click",
    "condition": {
        "checkers": {
            "type": "checkVisible",
            "selector": "section div[role='presentation'][tabindex] section div span a[role='link']"
        }
    },
    "params": {
        "selector": "section div[role='presentation'][tabindex] section div span a[role='link']"
    }
},{
    "name": "wait",
    "label": "skipLikes",
    "params": {
        "interval": 5000
    }
},{
    "name": "wait",
    "label": "crawlEnd",
    "params": {
        "interval": 1000
    }
},{
    "name": "data",
    "params": {
        "blocks": "",
        "name": "ins_title",
        "desc": {
            "ins_id": {
                "target": "<value>",
                "value": "{{insID}}"
            },
            "ins_name": {
                "target": "<value>",
                "value": "{{insUsername}}"
            },
            "ins_title": {
                "target": "head title"
            }
        }
    }
}]