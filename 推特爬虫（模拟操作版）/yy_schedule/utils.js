
const fs = require('fs')
const os = require('os')

const $util = {
    fs: {
        exists: filePath => fs.existsSync(filePath),
        read: filePath => {
            if (!fs.existsSync(filePath)) {
                return ''
            }
            return fs.readFileSync(filePath, 'utf-8')
        },
        readImage: filePath => {
            if (!fs.existsSync(filePath)) {
                return '';
            }
            return fs.readFileSync(filePath)
        },
        mkdir: dirPath => {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath)
            }
        }
    },
    log: {
        append: function(op, notes) {
            const msg = op + ": " + notes
            console.log(msg)
        }
    },
    $json: filePath => {
        if (!filePath || !$g.fs.exists(filePath)) {
            return false;
        }
        let data = false
        try {
            let v = $g.fs.read(filePath)
            if (v && v.length > 0) {
                data = JSON.parse(v)
            }
        } catch(error) {}
        return data
    },
    $json_from_string: v => {
        let data = false
        try {
            data = JSON.parse(v)
        } catch (error) {

        }
        return data
    },
    getIpAddress: () => {
        const ifaces=os.networkInterfaces()
        for (const dev in ifaces) {
            const iface = ifaces[dev]
            for (let i = 0; i < iface.length; i++) {
                const {family, address, internal} = iface[i]
                if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
                    return address
                }
            }
        }
    },
    math: {
        random: function (max) {
            return Math.round((Math.random() * max)) + 1;
        },
        randomBetween: function (start, end) {
            var r = Math.round((Math.random() * (end - start + 1))) + start;
            if (r > end) {
                r = end;
            }
            return r;
        }
    },
    toLocalTime: function (d, fmt) {
        var o = {
          "M+": d.getMonth() + 1,
          "d+": d.getDate(),
          "h+": d.getHours(),
          "m+": d.getMinutes(),
          "s+": d.getSeconds(),
          "q+": Math.floor((d.getMonth() + 3) / 3),
          "S": d.getMilliseconds()
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
        return fmt;
    },
    $time: function (t, format) {
        var tmp;
        if (format == 'ms') {
          tmp = parseInt(t);
          if (t == NaN) return t;
          var d = new Date()
          d.setTime(tmp);
          return $g.toLocalTime(d, 'yyyy-MM-dd hh:mm:ss');
        } else if (format == 's') {
          tmp = parseInt(t);
          if (t == NaN) return t;
          var d = new Date()
          d.setTime(tmp * 1000);
          return $g.toLocalTime(d, 'yyyy-MM-dd hh:mm:ss');
        } else if (format == 'create') {
          t = t || "";
          if (t.length == 0) return t;
          t = processDateSpecialChars(t);
          tmp = $g.createTimeFromEn(t, $g.today);
          if (tmp !== false) return tmp;
          return $g.createTimeFromCh(t, $g.today);
        } else {
          return t.replace('年', '-').replace('月', '-').replace('日', '').replaceAll('/', '-');
        }
        return t;
    }
}

exports.$util = $util