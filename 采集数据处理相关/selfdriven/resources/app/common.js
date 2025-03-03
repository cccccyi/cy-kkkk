var $g = null;
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) == str;
  };
}
if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function (substring, position) {
    substring = String(substring);

    var subLen = substring.length | 0;

    if (!subLen) return true; //Empty string

    var strLen = this.length;

    if (position === void 0) position = strLen;
    else position = position | 0;

    if (position < 1) return false;

    var fromIndex = (strLen < position ? strLen : position) - subLen;

    return (fromIndex >= 0 || subLen === -fromIndex) && (
      position === 0
      // if position not at the and of the string, we can optimise search substring
      //  by checking first symbol of substring exists in search position in current string
      ||
      this.charCodeAt(fromIndex) === substring.charCodeAt(0) //fast false
    ) && this.indexOf(substring, fromIndex) === fromIndex;
  };
}
if (typeof String.prototype.replaceAll !== 'function') {
  String.prototype.replaceAll = function (s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
  }
}

function Common() {

}
Common.create = function (_$g) {
  $g = _$g;
  $g.isWin = $g.system.os.name == "windows" || $g.system.os.name == "win32";
  $g.$json = function (filePath) {
    if (!filePath || !$g.fs.exists(filePath)) {
      return false;
    }
    var data = false;
    $g.$nothrow(function () {
      var v = $g.fs.read(filePath);
      if (v && v.length > 0) data = JSON.parse(v);
    }, function (stack, err) {
      $g.debug(err.toString());
    });
    return data;
  }
  $g.$json_from_string = function (v) {
    var data = false;
    $g.$nothrow(function () {
      if (v && v.length > 0) data = JSON.parse(v);
    });
    return data;
  }
  $g.indexOfArray = function (arr, check) {
    arr = $g.$ARR(arr);
    for (var ui = 0; ui < arr.length; ++ui) {
      if (check.indexOf(arr[ui]) != -1) {
        return ui;
      }
    }
    return -1;
  }
  $g.inArray = function (arr, check) {
    arr = $g.$ARR(arr);
    for (var ui = 0; ui < arr.length; ++ui) {
      if (check == arr[ui]) {
        return ui;
      }
    }
    return -1;
  }
  $g.extend = function (a, b, unwanted) {
    unwanted = unwanted || [];
    for (var p in b) {
      if ($g.inArray(unwanted, p) == -1) a[p] = b[p];
    }
    return a;
  }
  $g.clone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  $g.fs.$remove = function (path) {
    if ($g.fs.exists(path)) {
      $g.fs.remove(path);
    }
  }
  $g.fs.$rename = function (path1, path2) {
    $g.fs.$remove(path2);
    $g.fs.move(path1, path2);
  }
  $g.fs.$cp = function (path1, path2) {
    $g.fs.$remove(path2);
    if ($g.fs.exists(path1)) {
      $g.fs.copy(path1, path2);
    }
  }
  $g.fs.$mkdir = function (path) {
    if (!$g.fs.exists(path)) {
      $g.fs.makeDirectory(path);
    }
  }
  $g.fs.$md5 = function (path, fn, sync) {
    var _fn = function (err, stdout, stderr) {
      if (!$g.isWin && !err && stdout) {
        stdout = stdout.split(' ');
        stdout = stdout[0];
      }
      fn(err, stdout, stderr);
    }
    if ($g.isWin) {
      if (sync && $g.childProcess.execFileSync) {
        var err = false,
          buf = '',
          stderror = false;
        try {
          buf = $g.childProcess.execFileSync('md5sum.exe', [path]);
        } catch (e) {
          err = true;
          stderror = e.toString();
        }
        _fn(err, buf, stderror);
      } else {
        try {
          $g.childProcess.execFile('md5sum.exe', [path], null, _fn);
        } catch (e) {
          _fn(true, '', e.toString());
        }
      }
    } else {
      try {
        $g.childProcess.execFile('md5sum', ['-b', path], null, _fn);
      } catch (e) {
        _fn(true, '', e.toString());
      }
    }
  }
  $g.fs.content = function (path1) {
    if ($g.fs.exists(path1)) {
      return $g.fs.read(path1);
    }
    return '';
  }
  $g.$nothrow = function (callback, cbErr, context) {
    try {
      if (context) {
        callback.call(context);
      } else {
        callback();
      }
    } catch (err) {
      if ($g.utils.isFunction(cbErr)) {
        if (context) {
          cbErr.call(context, err.stack, err);
        } else {
          cbErr(err.stack, err);
        }
      }
    }
  }
  $g.$ARR = function (ele) {
    if ($g.utils.isNull(ele)) {
      return [];
    }
    var elements = null;
    if ($g.utils.isArray(ele)) {
      elements = ele;
    } else {
      elements = [ele];
    }
    return elements;
  }
  $g.$N = function (e) {
    return e ? e : null;
  }
  $g.each = function (object, callback) {
    var name, i = 0,
      length = object.length,
      isObj = length === undefined || $g.utils.isFunction(object);
    if (isObj) {
      for (name in object) {
        if (callback(name, object[name]) === false) {
          break;
        }
      }
    } else {
      for (; i < length;) {
        if (callback(i, object[i++]) === false) {
          break;
        }
      }
    }
    return object;
  }
  $g.isEmpty = function (str) {
    return !str || str.length == 0;
  }
  $g.isTruthy = function (a) {
    if ($g.utils.isUndefined(a)) {
      return false;
    }
    if ($g.utils.isNull(a)) {
      return false;
    }
    if ($g.utils.isString(a)) {
      return !$g.isEmpty(a);
    }
    return !!a;
  }
  $g.$NUM = function (a, defaultValue) {
    if (!$g.utils.isUndefined(a) && $g.utils.isNumber(a)) {
      return a;
    }
    return defaultValue;
  }
  $g.replaceAll = function (s, s1, s2) {
    return s.replace(new RegExp(s1, "gm"), s2);
  }
  $g.endWith = function (s1, s2) {
    return s1.endsWith(s2);
  }
  $g.path = {
    isAbsolute: function (path) {
      if ($g.isEmpty(path)) {
        return false;
      }
      return $g.fs.isAbsolute(path);
    },
    parent: function (path) {
      if ($g.isEmpty(path)) {
        return "";
      }
      var p = path.lastIndexOf($g.sep);
      if (p == -1) {
        return "";
      }
      return path.substring(0, p);
    }
  }
  $g.math = {
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
  }
  $g.dumpArgs = function () {
    $g.utils.dump($g.system.args);
  }
  $g.trim = function (str) {
    return str.replace(/(^\s+)|(\s+$)/g, "");
  }
  $g.ltrim = function (str) {
    return str.replace(/(^\s+)/g, "");
  }
  $g.rtrim = function (str) {
    return str.replace(/(\s+$)/g, "");
  }
  $g.trimLast = function (str, chr) {
    if (!str || str.length == 0) return '';
    if (str.substr(str.length - chr.length) == chr) {
      return str.substr(0, str.length - chr.length);
    }
    return str;
  }
  $g.trimBeforeCr = function (str) {
    var pos1 = str.indexOf('\n');
    var pos2 = str.indexOf('\r');
    if (pos1 == -1 && pos2 == -1) {
      return str;
    } else if (pos1 == -1 && pos2 != -1) {
      return str.substring(0, pos2);
    } else if (pos1 != -1 && pos2 == -1) {
      return str.substring(0, pos1);
    }
    return str.substring(0, pos1 < pos2 ? pos1 : pos2);
  }
  $g.trimAfterCr = function (str) {
    var pos1 = str.lastIndexOf('\n');
    var pos2 = str.lastIndexOf('\r');
    if (pos1 == -1 && pos2 == -1) {
      return str;
    } else if (pos1 == -1 && pos2 != -1) {
      return str.substring(pos2 + 1);
    } else if (pos1 != -1 && pos2 == -1) {
      return str.substring(pos1 + 1);
    }
    var pos = pos1 < pos2 ? pos2 : pos1;
    return str.substring(pos + 1);
  }
  $g.trimBeforeLastSpace = function (str) {
    str = $g.trim(str);
    if (str.length == 0) {
      return str;
    }
    var pos = str.lastIndexOf(' ');
    if (pos == -1) {
      return str;
    }
    return str.substring(0, pos);
  }
  $g.trimBeforeNumOfSpaces = function (str, total) {
    str = $g.trim(str);
    if (str.length == 0) {
      return str;
    }
    while (total > 0) {
      var tppos = str.lastIndexOf(' ');
      if (tppos == -1) {
        break;
      }
      str = str.substr(0, tppos);
      --total;
    }
    return str;
  }
  $g.trimAllSpaces = function (str) {
    str = str.replace(/\s+/g, "").replace(/[\xF0-\xF7].../g, "").replace(/"/g, "");
    str = str.replace(/######/g, "").replace(/\./g, "").replace(/,/g, "");
    if ($g.trimFaceImg) {
      str = str.replace(/\[.+\]/g, "");
    }
    str = str.replace(/[\[\]\{\}\(\)\\']+/g, "");
    return str;
  }
  $g.$trimArr = function (str, aTrim) {
    if (!aTrim) return str;
    aTrim = $g.$ARR(aTrim);
    for (var i = 0; i < aTrim.length; ++i) {
      str = $g.$trim(str, aTrim[i]);
    }
    return str;
  }
  $g.createNumber = function (str) {
    str = str.replace(/[\s,]+/g, '');
    var n = parseFloat(str);
    if (isNaN(n)) return '0';
    if (str.indexOf('千万') !== -1) {
      return parseInt((n * 10000000)).toString();
    }
    if (str.indexOf('百万') !== -1 || str.indexOf('M') !== -1) {
      return parseInt((n * 1000000)).toString();
    }
    if (str.indexOf('万') !== -1) {
      return parseInt((n * 10000)).toString();
    }
    if (str.indexOf('千') !== -1) {
      return parseInt((n * 1000)).toString();
    }
    if (str.indexOf('K') !== -1) {
      return parseInt((n * 1000)).toString();
    }
    if (str.indexOf('B') !== -1) {
      return parseInt((n * 1000000000)).toString();
    }
    return parseInt(n).toString();
  }
  $g.$trim = function (str, aTrim) {
    str = $g.trim(str);
    if (!$g.utils.isString(aTrim) || aTrim.length == 0) {
      return str;
    }
    if (aTrim == "encode") {
      str = encodeURIComponent(str);
    } else if (aTrim == "beforeDigit") {
      for (var i = 0, cnt = str.length; i < cnt; ++i) {
        if (!isNaN(parseInt(str.charAt(i)))) {
          return str.substr(0, i);
        }
      }
    } else if (aTrim == "afterDigit") {
      for (var i = 0, cnt = str.length; i < cnt; ++i) {
        if (!isNaN(parseInt(str.charAt(i)))) {
          return str.substr(i);
        }
      }
    } else if (aTrim == "beforeCR") {
      str = $g.trimBeforeCr(str);
    } else if (aTrim == "number") {
      return $g.createNumber(str);
    } else if (aTrim == "digit") {
      var re = /(\d+)/g;
      str = str.replaceAll(',', '');
      if (re.test(str)) {
        str = parseInt(RegExp.$1).toString();
      } else {
        str = '0';
      }
      return str;
    } else if (aTrim == "afterCR") {
      str = $g.trimAfterCr(str);
    } else if (aTrim.startsWith("prepend:")) {
      var rpl = aTrim.substring(8);
      if (rpl.length > 0 && !str.startsWith(rpl)) {
        return rpl + str;
      }
    } else if (aTrim.startsWith("append:")) {
      var rpl = aTrim.substring(7);
      if (rpl.length > 0 && !str.endsWith(rpl)) {
        return str + rpl;
      }
    } else if (aTrim.startsWith("before:")) {
      var rpl = aTrim.substring(7);
      if (rpl.length > 0) {
        var digitStart = parseInt(rpl);
        if (!isNaN(digitStart)) {
          str = str.substring(0, digitStart);
        } else {
          var pos = str.indexOf(rpl);
          if (pos != -1) {
            return str.substring(0, pos);
          }
        }
      }
    } else if (aTrim.startsWith("ebefore:")) {
      var rpl = aTrim.substring(8);
      if (rpl.length > 0) {
        var digitStart = parseInt(rpl);
        if (!isNaN(digitStart)) {
          str = str.substring(0, digitStart);
        } else {
          var pos = str.lastIndexOf(rpl);
          if (pos != -1) {
            return str.substring(0, pos);
          }
        }
      }
    } else if (aTrim.startsWith("after:")) {
      var rpl = aTrim.substring(6);
      if (rpl.length > 0) {
        var digitStart = parseInt(rpl);
        if (!isNaN(digitStart)) {
          str = str.substring(digitStart);
        } else {
          var pos = str.lastIndexOf(rpl);
          if (pos != -1) {
            return str.substring(pos + rpl.length);
          }
        }
      }
    } else if (aTrim.startsWith("eafter:")) {
      var rpl = aTrim.substring(7);
      if (rpl.length > 0) {
        var digitStart = parseInt(rpl);
        if (!isNaN(digitStart)) {
          str = str.substring(digitStart);
        } else {
          var pos = str.indexOf(rpl);
          if (pos != -1) {
            return str.substring(pos + rpl.length);
          }
        }
      }
    } else if (aTrim.startsWith("afterIfFind:")) {
      var rpl = aTrim.substring(12);
      if (rpl.length > 0) {
        var pos = str.lastIndexOf(rpl);
        if (pos != -1) {
          return str.substring(pos + rpl.length);
        }
      }
    } else if (aTrim.startsWith("between:")) {
      var args = aTrim.split(":");
      if (args.length > 3) {
        args = [];
        var re = /'(.+)':'(.+)'/g;
        if (re.test(aTrim)) {
          args = [0, RegExp.$1, RegExp.$2]
        }
      }
      if (args.length == 3) {
        var digitStart = parseInt(args[1]);
        if (!isNaN(digitStart)) {
          var end = parseInt(args[2]);
          str = str.substring(digitStart, end);
        } else {
          var pos = str.indexOf(args[1]);
          if (pos != -1) {
            var pos2 = str.indexOf(args[2], pos + 1);
            if (pos2 != -1) {
              return str.substring(pos + args[1].length, pos2);
            } else {
              return str.substr(pos + args[1].length);
            }
          }
        }
      }
      return "";
    } else if (aTrim == "removeSpaces") {
      str = $g.trimAllSpaces(str);
    } else if (aTrim.startsWith("remove:")) {
      var rpl = aTrim.substring(7);
      str = $g.replaceAll(str, rpl, "");
    } else if (aTrim.startsWith("removeLast:")) {
      var rpl = aTrim.substring(11);
      if (str.endsWith(rpl)) str = str.substr(0, str.length - rpl.length);
    }
    return str;
  }
  $g.objFromQueryString = function (o) {
    o = o.split(';');
    var d = {};
    for (var i = 0; i < o.length; ++i) {
      var s = $g.trim(o[i]);
      s = s.split('=');
      d[s[0]] = s[1];
    }
    return d;
  }
  $g.formatBeforeTime = function (t) {
    return t;
  }

  function checkCHPMDate(v) {
    return v.indexOf('凌晨') != -1 ||
      v.indexOf('早晨') != -1 ||
      v.indexOf('上午') != -1 ||
      v.indexOf('中午') != -1 ||
      v.indexOf('下午') != -1 ||
      v.indexOf('傍晚') != -1 ||
      v.indexOf('晚上') != -1;
  }

  function processDateSpecialChars(timeStr) {
    var timeArr = timeStr.split(",");
    if (timeArr.length == 3 && /:/.test(timeArr[0])) {
      var time = timeArr[0].replace(/[^0-9:]+/, "");
      return timeArr[1] + timeArr[2] + " " + time;
    }
    return timeStr;
  }
  var g_months = {
    'JAN': 0,
    'FEB': 1,
    'MAR': 2,
    'APR': 3,
    'MAY': 4,
    'JUN': 5,
    'JUL': 6,
    'AUG': 7,
    'SEP': 8,
    'OCT': 9,
    'NOV': 10,
    'DEC': 11
  };

  function removeEmptyString(arr) {
    var d = [];
    for (var i = 0; i < arr.length; ++i) {
      var t = arr[i].trim();
      if (t.length > 0) d.push(t);
    }
    return d;
  }

  function checkDateTimeString(v, today) {
    if (!v || !$g.utils.isString(v) || v.length === 0) return v;
    v = v.trim();
    var pos = v.indexOf(':');
    if (pos == -1 && v.indexOf('-') == -1 && v.indexOf('/') == -1) return v;
    var newV = removeEmptyString(v.split(' '));
    if (newV.length == 1 && pos != -1) {
      // for date sample: 20:08
      return today.getFullYear() + '/' + today.getMonth() + '/' + today.getDay() + ' ' + v + ':00';
    }
    if (newV.length <= 2) return v;
    if (newV.length == 3) {
      if (newV[1].indexOf(':') != -1 || newV[2].indexOf(':') != -1) {
        return newV[0] + ' ' + newV[1] + ':' + newV[2];
      }
    } else if (/\w+/.test(v)) {
      var date = new Date(v);
      var time_str = date.getTime().toString();
      return time_str.substr(0, 10);
    }
    return v;
  }
  $g.formatHandlerDate = function (v, today) {
    if (v == 'TODAY') {
      today.setDate(today.getDate());
    } else if (v == 'YESTERDAY') {
      today.setDate(today.getDate() - 1);
    } else {
      var re = /(\d+)/g;
      var date = v.split(' ');
      if (date.length > 1 && re.test(date[0])) {
        var day = date[0];
        date[0] = date[1];
        date[1] = day;
      }
      date[0] = date[0].substring(0, 3);
      if (date.length == 2) {
        date[2] = today.getFullYear();
      }
      return date.join(' ');
    }
    var date = today.toDateString();
    var pos = date.indexOf(' ');
    return date.substring(pos + 1).toUpperCase();
  }
  $g.createTimeFromEn = function (v, today) {
    if (v.endsWith('hr') || v.endsWith('hrs')) {
      var kk = v.split(" ");
      v = parseInt(kk[0]);
      v = v + " hours ago";
    }
    if (v.endsWith('mins')) {
      var kk = v.split(" ");
      v = parseInt(kk[0]);
      v = v + " minutes ago";
    }
    if (v.endsWith('ago')) {
      if (v.endsWith('h ago')) {
        var kk = v.split("h");
        v = parseInt(kk[0]);
        v = v + " hours ago";
      } else if (v.endsWith('m ago')) {
        var kk = v.split("m");
        v = parseInt(kk[0]);
        v = v + " minutes ago";
      }
    }
    if (v.endsWith('ago')) {
      v = v.split(' ');
      if (v[0] == 'an') v[0] = 1;
      var delta = parseInt(v[0]);
      if (v[1] == 'minutes' || v[1] == 'minute') {
        today.setMinutes(today.getMinutes() - delta);
      } else if (v[1] == 'hours' || v[1] == 'hour') {
        today.setHours(today.getHours() - delta);
      } else if (v[1] == 'days' || v[1] == 'day') {
        today.setDate(today.getDate() - delta);
      } else if (v[1] == 'seconds' || v[1] == 'second') {
        today.setSeconds(today.getSeconds() - delta);
      } else if (v[1] == 'months' || v[1] == 'month') {
        today.setMonth(today.getMonth() - delta);
      }
      return parseInt(today.getTime() / 1000).toString();
    } else if (v == 'just now') {
      return parseInt(today.getTime() / 1000).toString();
    } else if (v == 'Yesterday') {
      today.setDate(today.getDate() - 1);
      return parseInt(today.getTime() / 1000).toString();
    }
    v = v.toUpperCase();
    if (!v.endsWith('PM') && !v.endsWith('AM')) return false;
    var tag = ' AT ',
      base = 0;
    if (v.endsWith('PM')) base = 12;
    var pos = v.indexOf(tag);
    if (pos == -1) {
      return false;
    }
    var date = $g.formatHandlerDate(v.substring(0, pos), today);
    if (date.length == 0) return false;
    var hours = v.substring(pos + tag.length);
    hours = hours.substring(0, hours.length - 2);
    hours = hours.trim();
    if (hours.length == 0) return false;
    hours = hours.split(':');
    date = date.replaceAll(',', '');
    date = date.split(' ');
    if (date.length != 3) return false;
    today.setFullYear(date[2]);
    today.setMonth(g_months[date[0]]);
    today.setDate(parseInt(date[1]));
    if (hours[0] == 12 && base == 0) hours[0] = 0;
    if (hours[0] == 12 && base == 12) base = 0;
    today.setHours(base + parseInt(hours[0]));
    today.setMinutes(parseInt(hours[1]));
    today.setSeconds(0);
    today.setMilliseconds(0);
    return parseInt(today.getTime() / 1000).toString();
  }
  $g.createTimeFromCh = function (v, today) {
    var s = v,
      sec = parseInt(today.getTime() / 1000).toString();
    var ma_month = ['Jan', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
    var m_month = s.trim().split(" ");
    var m_month_digit = $g.inArray(ma_month, m_month[1]);
    if (m_month_digit !== -1) {
      var m_month_digit = m_month_digit + 1;
      return m_month[2] + "-" + m_month_digit + "-" + m_month[0] + " " + m_month[3] + ":00";
    }
    if (v == "昨天" || v == "昨日") {
      today.setDate(today.getDate() - 1);
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      today.setMilliseconds(0);
      v = parseInt(today.getTime() / 1000).toString();
    } else if (v == "前天") {
      today.setDate(today.getDate() - 2);
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      today.setMilliseconds(0);
      v = parseInt(today.getTime() / 1000).toString();
    } else if (v.endsWith("天前")) {
      var re = /(\d+)/g,
        d = 1;
      if (re.test(v)) {
        d = parseInt(RegExp.$1);
      }
      today.setDate(today.getDate() - d);
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      today.setMilliseconds(0);
      v = parseInt(today.getTime() / 1000).toString();
    } else if (v.startsWith('刚刚')) {
      v = sec;
    } else if (v.startsWith('今天') || v.startsWith('今日')) {
      var pos = v.indexOf(' ');
      if (pos != -1) {
        var nd = v.substr(pos + 1);
        nd = nd.split(':');
        var h = parseInt(nd[0]);
        var m = parseInt(nd[1]);
        today.setHours(h);
        today.setMinutes(m);
        today.setSeconds(0);
        today.setMilliseconds(0);
        v = parseInt(today.getTime() / 1000).toString();
      } else {
        v = sec;
      }
    } else if (v.startsWith('昨天')) {
      var pos = v.indexOf(' ');
      if (pos != -1) {
        var nd = v.substr(pos + 1);
        nd = nd.split(':');
        var h = parseInt(nd[0]);
        var m = parseInt(nd[1]);
        today.setDate(today.getDate() - 1);
        today.setHours(h);
        today.setMinutes(m);
        today.setSeconds(0);
        today.setMilliseconds(0);
        v = parseInt(today.getTime() / 1000).toString();
      } else {
        v = sec;
      }
    } else if (v.startsWith("January") || v.startsWith("February") || v.startsWith("March") || v.startsWith("April") || v.startsWith("May") || v.startsWith("June") || v.startsWith("July") || v.startsWith("August") || v.startsWith("September") || v.startsWith("October") || v.startsWith("November") || v.startsWith("December")) {
      var v = Date(v);
      var kk = v.split(" ");
      return kk[3] + "-" + (g_months[kk[1].toUpperCase()] + 1) + "-" + kk[2] + " " + kk[4];
    } else if (v.endsWith('下午') || v.endsWith('中午') || v.endsWith('上午') || v.endsWith('晚上') || v.endsWith('凌晨') || v.endsWith('早上') || v.endsWith('pm') || v.endsWith('am')) {
      var kk = v.split(" ");
      if (kk.length !== 0 && kk[1] == 'at') {
        var chs = kk[0];
        var bz = chs.split('/');
        if (v.endsWith('pm') || v.endsWith('am')) {
          bz[1] = g_months[bz[1].toUpperCase()] + 1;
        } else {
          bz[1] = bz[1].substr(0, bz[1].length - 1);
        }
        if (v.endsWith('晚上') || v.endsWith('下午') || v.endsWith('pm')) {
          var dd = kk[2].substr(0, kk[2].length - 2);
          var ds = dd.split(":");
          ds[0] = parseInt(ds[0]) + 12;
          if (ds[0] > 23) ds[0] = "00";
          ds = ds[0] + ":" + ds[1] + ":" + ds[2];
        } else {
          ds = kk[2].substr(0, kk[2].length - 2);
        }
        var tm = bz[2] + "-" + bz[1] + "-" + bz[0] + " " + ds;
        return tm;
      }
    } else if (v.endsWith('分')) {
      var kk = v.split(" ");
      var tt = kk[1].substr(0, 2);
      var nd = [];
      var re = /(\d+)/g;
      nd = v.match(re);
      if (tt == '晚上' || tt == '下午') {
        nd[3] = parseInt(nd[3]) + 12;
        if (nd[3] > 23) nd[3] = "00";
      }
      return nd[0] + "-" + nd[1] + "-" + nd[2] + " " + nd[3] + ":" + nd[4] + ":" + "00";
    } else if (checkCHPMDate(v)) {
      var base = 0;
      if (v.indexOf('下午') != -1 ||
        v.indexOf('傍晚') != -1 ||
        v.indexOf('晚上') != -1) {
        base = 12;
      }
      v = v.replace('#', ':');
      if (v.startsWith('今日')) {
        var nv = v.split(' ');
        nv = nv[1].trim();
        var nd = [];
        var re = /(\d+):(\d+)/g;
        if (re.test(nv)) {
          nd[0] = RegExp.$1;
          nd[1] = RegExp.$2;
        } else {
          nd = [0, 0];
        }
        var h = base + parseInt(nd[0]);
        var m = parseInt(nd[1]);
        today.setDate(today.getDate());
        today.setHours(h);
        today.setMinutes(m);
        today.setSeconds(0);
        today.setMilliseconds(0);
        v = parseInt(today.getTime() / 1000).toString();
      } else {
        var nv = v.split(' ');
        var nd = [];
        var re = /(\d+):(\d+)/g;
        if (re.test(nv[1].trim())) {
          nd[0] = RegExp.$1;
          nd[1] = RegExp.$2;
        } else {
          nd = [0, 0];
        }
        var h = base + parseInt(nd[0]);
        var m = parseInt(nd[1]);
        v = nv[0].replace('年', '-');
        v = v.replace('月', '-');
        v = v.replace('日', '');
        v += ' ' + h + ':' + m + ':00';
      }
    } else {
      var pos = v.indexOf('分钟前');
      pos = pos != -1 ? pos : v.indexOf('分鐘前');
      if (pos != -1) {
        var nd = v.substr(0, pos).trim();
        var m = parseInt(nd);
        today.setMinutes(today.getMinutes() - m);
        today.setSeconds(0);
        today.setMilliseconds(0);
        v = parseInt(today.getTime() / 1000).toString();
      } else {
        pos = v.indexOf('秒前');
        if (pos != -1) {
          var nd = v.substr(0, pos).trim();
          var m = parseInt(nd);
          today.setSeconds(today.getSeconds() - m);
          today.setMilliseconds(0);
          v = parseInt(today.getTime() / 1000).toString();
        } else {
          pos = v.indexOf('小时前');
          pos = pos != -1 ? pos : v.indexOf('小時前');
          if (pos != -1) {
            var nd = v.substr(0, pos).trim();
            var m = parseInt(nd);
            today.setHours(today.getHours() - nd);
            today.setMilliseconds(0);
            v = parseInt(today.getTime() / 1000).toString();
          } else {
            var arr = v.split(' ');
            if (arr[0].indexOf('月') != -1) {
              if (arr[0].indexOf('年') == -1) {
                v = today.getFullYear() + '-' + v;
              }
            } else {
              arr = arr[0].split('-');
              if (arr.length == 2) v = today.getFullYear() + '-' + v;
            }
            v = v.replace('年', '-');
            v = v.replace('月', '-');
            v = v.replace('日', '');
            v = v.replace('#', ':');
          }
        }
      }
    }
    return checkDateTimeString(v, today);
  }
  $g.toLocalTime = function (d, fmt) {
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
  }
  $g.$time = function (t, format) {
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
  $g.$number = function (t) {
    return t;
  }


  return Common;
}

// for arguments
Common.arg = {};
Common.arg.getArg = function (nameOrCb, defaultValue) {
  var tmp = $g.system.args;
  if ($g.utils.isString(nameOrCb)) {
    var name = nameOrCb + "=";
    for (var i = 0, cnt = tmp.length; i < cnt; ++i) {
      if (tmp[i].startsWith(name)) {
        var aArg = tmp[i].split('=');
        return aArg.length > 1 ? aArg[1] : defaultValue;
      }
    }
    return defaultValue ? defaultValue : null;
  }
  for (var i = 0, cnt = tmp.length; i < cnt; ++i) {
    var aArg = tmp[i].split('=');
    if (aArg.length > 1) {
      aArg[1] = aArg[1].replace(/######/gm, " ")
    }
    if (nameOrCb(aArg[0], aArg.length > 1 ? aArg[1] : null)) {
      break;
    }
  }
}

// for task log
Common.log = function (path) {
  //this.logs = "";
  this.logPath = path + $g.sep + "log";
  this.resultPath = path + $g.sep + "ret";
  $g.fs.write(this.logPath, "");
}
Common.log.prototype = {
  append: function (op, notes) {
    const date = new Date();
    const currentTime = `${date.getFullYear()}-${$g.utils.dateRepaire(date.getMonth()+1)}-${$g.utils.dateRepaire(date.getDate())} ${$g.utils.dateRepaire(date.getHours())}:${$g.utils.dateRepaire(date.getMinutes())}:${$g.utils.dateRepaire(date.getSeconds())}`
    const log = currentTime + "  " + op + ": " + notes ;
    console.log(log);
    $g.fs.append(this.logPath, log+"\n");
    $g.continueLogTime = new Date().getTime();
  },
  finish: function (result) {
    $g.fs.write(this.resultPath, result);
  }
}

module.exports = Common;