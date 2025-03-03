[{
    "name": "open",
    "params": {
        "url": "{{crawlerUrl}}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 5000
    }
},{
    "name": "loop",
    "loop_count": 3,
    "actions": [{
        "name": "scroll",
        "params": {
            "selector": "end"
        }
    },{
        "name": "wait",
        "params": {
            "interval": 5000
        }
    }]
},{
    "name": "call",
    "params": {
        "code": "try{const btn=document.evaluate(\"//a[contains(@href, 'about')]//span[contains(text(), 'About') or contains(text(), 'See') or contains(text(), 'Learn')]\",document).iterateNext();if(btn){btn.click()}}catch{}"
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
            "type": "checkNotVisible",
            "selector": "a[href*='about_']"
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
    "name": "wait",
    "params": {
        "interval": "random"
    }
}]