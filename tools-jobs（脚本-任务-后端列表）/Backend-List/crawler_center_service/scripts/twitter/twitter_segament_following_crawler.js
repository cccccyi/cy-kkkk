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
	"name": "loop",
	"loop_count": 1,
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
		"url": "https://x.com/{{targetScreenName}}/verified_followers"
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
			"interval": 3000
		}
	}]
},{
	"name": "open",
	"params": {
		"url": "https://x.com/{{targetScreenName}}/following"
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
			"interval": 3000
		}
	}]
}]