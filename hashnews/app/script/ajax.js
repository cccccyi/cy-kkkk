function getAction(data, url, callback) {
    api.ajax({
        url: url,
        timeout:300,
        method: 'get',
        data: {
            values: data
        },
        // headers: {
        //     'X-Access-Token': localStorage.getItem('t')
        // }
    }, function (ret, err) {
        if (ret) {
            callback(ret);
        } else {
            let error = {
                'code':'0'
            }
            callback(error);
        }
    });
}

function postAction(data, url, callback) {
    api.ajax({
        url: url,
        method: 'post',
        dataType: 'json',
        data: {
            body: data
        },
        headers: {
            'Content-Type': 'application/json'
        }
    }, function (ret, err) {
            console.log(JSON.stringify((err)));
        if (ret) {
            callback(ret);
        } else {
            api.toast({
                msg:'网络错误，请重试'
            })
            api.hideProgress()
        }
    });
}

function postFile(data, url, callback) {
    api.ajax({
        url: url,
        method: 'post',
        data: {
            files: data
        }
    }, function (ret, err) {
        if (ret) {
            callback(ret);
        } else {
            api.toast({
                msg:'网络错误，请重试'
            })
        }
    });
}

function putAction(data, url, callback) {
    api.ajax({
        url: url,
        method: 'put',
        dataType: 'json',
        data: {
            body: data
        },
        headers: {
            'X-Access-Token': localStorage.getItem('t'),
            'Content-Type': 'application/json'
        }
    }, function (ret, err) {
        if (ret) {
            callback(ret);
        } else {
            api.toast({
                msg:'网络错误，请重试'
            })
        }
    });
}

function deleteAction(data, url, callback) {
    api.ajax({
        url: url,
        method: 'delete',
        data: {
            values: data
        },
        headers: {
            'X-Access-Token': localStorage.getItem('t')
        }
    }, function (ret, err) {
        if (ret) {
            callback(ret);
        } else {
            api.toast({
                msg:'网络错误，请重试'
            })
        }
    });
}
    