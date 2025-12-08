var _fs = require("fs");
var _os = require('os');
var _path = require("path");

function fsRewrite() {
    this.workingDirectory = process.cwd();
    this.separator = "\\";
    this.read = function(filePath){
        if (!_fs.existsSync(filePath)) return '';
        return _fs.readFileSync(filePath, "utf-8");
    }
    this.readImage = function(filePath){
        if (!_fs.existsSync(filePath)) return '';
        return _fs.readFileSync(filePath);
    }
    this.move = function(path1, path2){
        return _fs.renameSync(path1, path2);
    }
    this.copy = function(path1, path2){
        var readable = _fs.readFileSync(path1);
        _fs.writeFileSync(path2, readable);
    }
    this.isAbsolute = function(path){
        return _path.isAbsolute(path);
    }
    this.write = function(path, message){
        if(typeof path != "string"){
            return;
        }
        if (message === undefined) {
            message = ''
        }
        message = `${message}`
        return _fs.writeFileSync(path, message);
    }
    this.append = function(path, message){
        if(typeof path != "string"){
            return;
        }
        if (message === undefined) {
            message = ''
        }
        message = `${message}`
        return _fs.appendFileSync(path, message);
    }
    this.directWrite = function(path, message){
        return _fs.writeFileSync(path, message);
    }
    this.remove = function(path){
        return _fs.unlinkSync(path);
    }
    this.removeDir = function(path){
        if(_fs.existsSync(path)) {
            const files = _fs.readdirSync(path);
            for (const file of files) {
                const curPath = _path.join(path, file);
                if(_fs.statSync(curPath).isDirectory()) {
                    this.removeDir(curPath);
                } else { // delete file
                    _fs.unlinkSync(curPath);
                }
            }
            _fs.rmdirSync(path);
        }
    }
    this.exists = function(filepath){
        return _fs.existsSync(filepath);
    }
    this.mkdir = function(filepath){
        return _fs.mkdirSync(filepath);
    }
    this.size = function(filepath) {
        if (!_fs.existsSync(filepath)) return 0;
        var s = _fs.statSync(filepath);
        return s ? s.size : 0;
    }
    this.makeDirectory = function(p) {
        _fs.mkdirSync(p);
    }
    this.createWriteStream = function(p) {
        return _fs.createWriteStream(p);
    }
}

function systemRewrite(){
    this.args = process.argv;
    this.platform = _os.platform();
    this.os = {
        name : this.platform == "win32" ? 'windows' : this.platform
    }
}

exports.fs = new fsRewrite();
exports.system = new systemRewrite();