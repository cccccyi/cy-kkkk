
function _showLoading(){
	loading = layer.load(1, {
	  shade: [0.3,'black'] //0.1透明度的白色背景
	});
}
//hideloading
function _hideLoading(){
	 layer.close(loading);
	 layer.closeAll();
}
function getAction(data,url,callback){
	_showLoading();
	$.ajax({
		url:url,
		type:"get",
		data:data,
		headers: {
			'Authorization': 'Bearer '+sessionStorage.getItem('t')
		},
		success:function(data){
			_hideLoading();
			callback(data);
		},
		error:function(xhr,textstatus,thrown){
			_hideLoading();
		}
	});
}
// function postAction(data,url,callback){
// 	_showLoading();
// 	 $.ajax({
// 		url:url,
// 		type:"post",
// 		contentType: 'application/json',
// 		dataType: "json",
// 		data:JSON.stringify(data),
// 		headers: {
// 			'Authorization': 'Bearer '+sessionStorage.getItem('t'),
// 		},
// 		success:function(msg){
// 			_hideLoading();
// 			callback(msg);
// 		},
// 		error:function(xhr,textstatus,thrown){
// 			_hideLoading();
// 		}
// 	});
// }
function postAction(data,url,callback){
	//alert(1);
	_showLoading();
	$.ajax({
		url:url,
		type: "POST",
		data: JSON.stringify(data),
		async:false,//取消异步请求
		headers: {
			'Authorization': 'Bearer '+sessionStorage.getItem('t'),
			'Content-Type': 'application/json'
		},
		success: function(msg) {
			_hideLoading();
			callback(msg);
		},
		error: function(xhr, textstatus, thrown) {
			_hideLoading();
		}
	});
}
function putAction(data,url,callback){
	_showLoading();
	 $.ajax({
		url:url,
		type:"put",
		contentType: 'application/json',
		dataType: "json",
		data:JSON.stringify(data),
		headers: {
			'Authorization': 'Bearer '+sessionStorage.getItem('t')
		},
		success:function(msg){
			_hideLoading();
			callback(msg);
		},
		error:function(xhr,textstatus,thrown){
			_hideLoading();
		}
	});
}
function deleteAction(data,url,callback){
	_showLoading();
	$.ajax({
		url:url,
		type:"delete",
		data:data,
		headers: {
			'Authorization': 'Bearer '+sessionStorage.getItem('t'),
		},
		success:function(msg){
			_hideLoading();
			callback(msg);
		},
		error:function(xhr,textstatus,thrown){
			_hideLoading();
		}
	});
}
function getQueryVariable(variable){
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
	return(false);
}
