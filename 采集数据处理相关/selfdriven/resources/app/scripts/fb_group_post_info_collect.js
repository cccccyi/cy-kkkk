[{
    "name": "open",
    "params": {
        "url": "https://www.facebook.com/{{post_fid}}",
        "timeout": 10000
    }
},{
    "name": "wait",        
    "params": {
        "interval": 5000
    }
},{
    "name": "call",
    "params": {
        "code": "try{document.querySelector(\"div[aria-label='Like']\").scrollIntoViewIfNeeded()}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 2000
    }
},{
    "name": "call",
    "params": {
        "code": "try{window.scrollTo(0, window.scrollY-50)}catch{}"
    }
},{
    "name": "wait",
    "params": {
        "interval": 1000
    }
},{
	"name": "screenshot",
	"params": {
		"image_name": "post_screenshot_{{post_fid}}.jpg"
	}
}]