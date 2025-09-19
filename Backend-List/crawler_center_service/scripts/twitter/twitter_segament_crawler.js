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
	"loop_count": 20,
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
    "name": "wait",
    "params": {
        "interval": 5000
    }
}]