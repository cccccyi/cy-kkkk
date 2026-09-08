"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
const electron = require("electron");
// const html2canvas = require('html2canvas');
// const htmlToImage = require('html-to-image');
var ipcRenderer = electron.ipcRenderer;
let clientUtils = {};
(function (exports) {
  "use strict";
  exports.create = function create(options) {
    return new this.ClientUtils(options);
  };
  exports.ClientUtils = function ClientUtils(options) {
    var BASE64_ENCODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var BASE64_DECODE_CHARS = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
      52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
      41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
    );
    var SUPPORTED_SELECTOR_TYPES = ['css', 'xpath'];
    this.options = options || {};
    this.options.scope = this.options.scope || document;

    this.__call = function __call(method, args) {
      if (method === "__call") {
        return;
      }
      try {
        return this[method].apply(this, args);
      } catch (err) {
        err.__isCallError = true;
        return err;
      }
    };

    this.click = function click(selector) {
      return this.mouseEvent('click', selector);
    };

    this.decode = function decode(str) {
      var c1, c2, c3, c4, i = 0,
        len = str.length,
        out = "";
      while (i < len) {
        do {
          c1 = BASE64_DECODE_CHARS[str.charCodeAt(i++) & 0xff];
        } while (i < len && c1 === -1);
        if (c1 === -1) {
          break;
        }
        do {
          c2 = BASE64_DECODE_CHARS[str.charCodeAt(i++) & 0xff];
        } while (i < len && c2 === -1);
        if (c2 === -1) {
          break;
        }
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
        do {
          c3 = str.charCodeAt(i++) & 0xff;
          if (c3 === 61)
            return out;
          c3 = BASE64_DECODE_CHARS[c3];
        } while (i < len && c3 === -1);
        if (c3 === -1) {
          break;
        }
        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
        do {
          c4 = str.charCodeAt(i++) & 0xff;
          if (c4 === 61) {
            return out;
          }
          c4 = BASE64_DECODE_CHARS[c4];
        } while (i < len && c4 === -1);
        if (c4 === -1) {
          break;
        }
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
      }
      return out;
    };

    this.echo = function echo(message) {
      console.log("[casper.echo] " + message);
    };

    this.elementVisible = function elementVisible(elem) {
      var style;
      try {
        style = window.getComputedStyle(elem, null);
      } catch (e) {
        return false;
      }
      var hidden = style.visibility === 'hidden' || style.display === 'none';
      if (hidden) {
        return false;
      }
      if (style.display === "inline") {
        return true;
      }
      return elem.clientHeight > 0 && elem.clientWidth > 0;
    }

    this.encode = function encode(str) {
      var out = "",
        i = 0,
        len = str.length,
        c1, c2, c3;
      while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i === len) {
          out += BASE64_ENCODE_CHARS.charAt(c1 >> 2);
          out += BASE64_ENCODE_CHARS.charAt((c1 & 0x3) << 4);
          out += "==";
          break;
        }
        c2 = str.charCodeAt(i++);
        if (i === len) {
          out += BASE64_ENCODE_CHARS.charAt(c1 >> 2);
          out += BASE64_ENCODE_CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
          out += BASE64_ENCODE_CHARS.charAt((c2 & 0xF) << 2);
          out += "=";
          break;
        }
        c3 = str.charCodeAt(i++);
        out += BASE64_ENCODE_CHARS.charAt(c1 >> 2);
        out += BASE64_ENCODE_CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += BASE64_ENCODE_CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += BASE64_ENCODE_CHARS.charAt(c3 & 0x3F);
      }
      return out;
    };

    this.exists = function exists(selector) {
      try {
        return this.findAll(selector).length > 0;
      } catch (e) {
        return false;
      }
    };

    this.fetchText = function fetchText(selector) {
      var text = '',
        elements = this.findAll(selector);
      if (elements && elements.length) {
        Array.prototype.forEach.call(elements, function _forEach(element) {
          text += element.innerText || element.textContent;
        });
      }
      return text;
    };

    this.fill = function fill(args) {
      var form = args[0],
        vals = args[1],
        findType = args[2];
      if (typeof vals === "string") vals = JSON.parse(vals);
      var out = {
        errors: [],
        fields: [],
        files: []
      };
      if (!(form instanceof HTMLElement) || typeof form === "string") {
        this.log("attempting to fetch form element from selector: '" + form + "'", "info");
        try {
          form = this.findOne(form);
        } catch (e) {
          if (e.name === "SYNTAX_ERR") {
            out.errors.push("invalid form selector provided: '" + form + "'");
            return out;
          }
        }
      }

      if (!form) {
        out.errors.push("form not found");
        return out;
      }

      var finders = {
        css: function (inputSelector, formSelector) {
          return this.findAll(inputSelector, form);
        },
        names: function (elementName, formSelector) {
          return this.findAll('[name="' + elementName + '"]', form);
        },
        xpath: function (xpath, formSelector) {
          return this.findAll({
            type: "xpath",
            path: xpath
          }, form);
        }
      };
      for (var fieldSelector in vals) {
        if (!vals.hasOwnProperty(fieldSelector)) {
          continue;
        }
        var field = finders[findType || "names"].call(this, fieldSelector, form),
          value = vals[fieldSelector];
        if (!field || field.length === 0) {
          out.errors.push('no field matching ' + findType + ' selector "' + fieldSelector + '" in form');
          continue;
        }
        try {
          out.fields[fieldSelector] = this.setField(field, value);
        } catch (err) {
          if (err.name === "FileUploadError") {
            out.files.push({
              type: findType,
              selector: fieldSelector,
              path: err.path
            });
          } else if (err.name === "FieldNotFound") {
            out.errors.push('Unable to find field element in form: ' + err.toString());
          } else {
            out.errors.push(err.toString());
          }
        }
      }
      return out;
    };

    this.findAll = function findAll(selector, scope) {
      scope = scope || this.options.scope;
      try {
        var pSelector = this.processSelector(selector);
        if (pSelector.type === 'xpath') {
          return this.getElementsByXPath(pSelector.path, scope);
        } else {
          return Array.prototype.slice.call(scope.querySelectorAll(pSelector.path));
        }
      } catch (e) {
        this.log('findAll(): invalid selector provided "' + selector + '":' + e, "error");
      }
    };
    this.getHTML = function getHTML(selector, scope) {
      scope = scope || this.options.scope;
      try {
        var pSelector = this.processSelector(selector);
        return scope.querySelector(pSelector.path).outerHTML;
      } catch (e) {
        this.log('getHTML(): invalid selector provided "' + selector + '":' + e, "error");
      }
    };
    this.findOne = function findOne(selector, scope) {
      scope = scope || this.options.scope;
      try {
        var pSelector = this.processSelector(selector);
        if (pSelector.type === 'xpath') {
          return this.getElementByXPath(pSelector.path, scope);
        } else {
          return scope.querySelector(pSelector.path);
        }
      } catch (e) {
        this.log('findOne(): invalid selector provided "' + selector + '":' + e, "error");
      }
    };

    this.getBase64 = function getBase64(url, method, data) {
      return this.encode(this.getBinary(url, method, data));
    };

    this.getBinary = function getBinary(url, method, data) {
      try {
        return this.sendAJAX(url, method, data, false);
      } catch (e) {
        if (e.name === "NETWORK_ERR" && e.code === 101) {
          this.log("getBinary(): Unfortunately, casperjs cannot make cross domain ajax requests", "warning");
        }
        this.log("getBinary(): Error while fetching " + url + ": " + e, "error");
        return "";
      }
    };

    this.getWindowSize = function getWindowSize() {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    this.getDocumentHeight = function getDocumentHeight() {
      return Math.max(
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
        Math.max(document.body.clientHeight, document.documentElement.clientHeight)
      );
    };

    this.isScrollBottom = function () {
      var scrollTop = 0;
      var scrollTop = Math.max(parent.document.documentElement.scrollTop, parent.document.body.scrollTop);
      var documentHeight = this.getDocumentHeight();
      var clientHeight = document.documentElement.clientHeight;
      var distance = documentHeight - clientHeight - scrollTop;
      if (distance < 5) return true;
      return false;
    }

    this.getElementBounds = function getElementBounds(selector) {
      try {
        var clipRect = this.findOne(selector).getBoundingClientRect();
        return {
          top: clipRect.top,
          left: clipRect.left,
          width: clipRect.width,
          height: clipRect.height
        };
      } catch (e) {
        this.log("Unable to fetch bounds for element " + selector, "warning");
      }
    };

    this.getElementsBounds = function getElementsBounds(selector) {
      var elements = this.findAll(selector);
      var self = this;
      try {
        return Array.prototype.map.call(elements, function (element) {
          var clipRect = element.getBoundingClientRect();
          return {
            top: clipRect.top,
            left: clipRect.left,
            width: clipRect.width,
            height: clipRect.height
          };
        });
      } catch (e) {
        this.log("Unable to fetch bounds for elements matching " + selector, "warning");
      }
    };

    this.getElementBgImageBase64 = async function getElementBgImageUrl(selector) {
      var element = this.findOne(selector);
      var style = window.getComputedStyle(element);
      var url = style.getPropertyValue('background-image');
      url = url.substring(5, url.length-2);
      console.log('url', url);
      var imageBase64 = await getImageBase64(url);
      console.log('imageBase64', imageBase64);
      return imageBase64;
    };

    this.getElementInfo = function getElementInfo(selector) {
      var element = this.findOne(selector);
      element.scrollIntoViewIfNeeded();
      var bounds = this.getElementBounds(selector);
      var attributes = {};
      [].forEach.call(element.attributes, function (attr) {
        attributes[attr.name.toLowerCase()] = attr.value;
      });
      return {
        nodeName: element.nodeName.toLowerCase(),
        attributes: attributes,
        tag: element.outerHTML,
        html: element.innerHTML,
        text: element.innerText || element.textContent,
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
        visible: this.visible(selector)
      };
    };

    this.getElementsInfo = function getElementsInfo(selector) {
      var bounds = this.getElementsBounds(selector);
      var eleVisible = this.elementVisible;
      return [].map.call(this.findAll(selector), function (element, index) {
        var attributes = {};
        [].forEach.call(element.attributes, function (attr) {
          attributes[attr.name.toLowerCase()] = attr.value;
        });
        var nn = element.nodeName.toLowerCase();
        if (nn === 'input' || nn === 'textarea') attributes.value = element.value;
        return {
          nodeName: nn,
          attributes: attributes,
          tag: element.outerHTML,
          html: element.innerHTML,
          text: element.innerText || element.textContent,
          x: bounds[index].left,
          y: bounds[index].top,
          width: bounds[index].width,
          height: bounds[index].height,
          visible: eleVisible(element)
        };
      });
    };

    this.getElementByXPath = function getElementByXPath(expression, scope) {
      scope = scope || this.options.scope;
      var a = document.evaluate(expression, scope, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (a.snapshotLength > 0) {
        return a.snapshotItem(0);
      }
    };

    this.getElementsByXPath = function getElementsByXPath(expression, scope) {
      scope = scope || this.options.scope;
      var nodes = [];
      var a = document.evaluate(expression, scope, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (var i = 0; i < a.snapshotLength; i++) {
        nodes.push(a.snapshotItem(i));
      }
      return nodes;
    };

    this.getFieldValue = function getFieldValue(inputName, options) {
      options = options || {};

      function getSingleValue(input) {
        var type;
        try {
          type = input.getAttribute('type').toLowerCase();
        } catch (e) {
          type = 'other';
        }
        if (['checkbox', 'radio'].indexOf(type) === -1) {
          return input.value;
        }
        // single checkbox or… radio button (weird, I know)
        if (input.hasAttribute('value')) {
          return input.checked ? input.getAttribute('value') : undefined;
        }
        return input.checked;
      }

      function getMultipleValues(inputs) {
        var type;
        type = inputs[0].getAttribute('type').toLowerCase();
        if (type === 'radio') {
          var value;
          [].forEach.call(inputs, function (radio) {
            value = radio.checked ? radio.value : value;
          });
          return value;
        } else if (type === 'checkbox') {
          var values = [];
          [].forEach.call(inputs, function (checkbox) {
            if (checkbox.checked) {
              values.push(checkbox.value);
            }
          });
          return values;
        }
      }
      var formSelector = '';
      if (options.formSelector) {
        formSelector = options.formSelector + ' ';
      }
      var inputs = this.findAll(formSelector + '[name="' + inputName + '"]');

      if (options.inputSelector) {
        inputs = inputs.concat(this.findAll(options.inputSelector));
      }

      if (options.inputXPath) {
        inputs = inputs.concat(this.getElementsByXPath(options.inputXPath));
      }

      switch (inputs.length) {
        case 0:
          return undefined;
        case 1:
          return getSingleValue(inputs[0]);
        default:
          return getMultipleValues(inputs);
      }
    };

    this.getFormValues = function getFormValues(selector) {
      var form = this.findOne(selector);
      var values = {};
      var self = this;
      [].forEach.call(form.elements, function (element) {
        var name = element.getAttribute('name');
        if (name && !values[name]) {
          values[name] = self.getFieldValue(name, {
            formSelector: selector
          });
        }
      });
      return values;
    };

    this.log = function log(message, level) {
      console.log("[casper:" + (level || "debug") + "] " + message);
    };

    this.mouseEvent = function mouseEvent(type, selector) {
      var elem = this.findOne(selector);
      if (!elem) {
        this.log("mouseEvent(): Couldn't find any element matching '" + selector + "' selector", "error");
        return false;
      }
      try {
        var evt = new MouseEvent(type, {
          bubbles: true,
          cancelable: true
        });
        elem.dispatchEvent(evt);
        return true;
      } catch (e) {
        this.log("Failed dispatching " + type + "mouse event on " + selector + ": " + e, "error");
        return false;
      }
    };

    this.processSelector = function processSelector(selector) {
      var selectorObject = {
        toString: function toString() {
          return this.type + ' selector: ' + this.path;
        }
      };
      if (typeof selector === "string") {
        // defaults to CSS selector
        selectorObject.type = "css";
        selectorObject.path = selector;
        return selectorObject;
      } else if (typeof selector === "object") {
        // validation
        if (!selector.hasOwnProperty('type') || !selector.hasOwnProperty('path')) {
          throw new Error("Incomplete selector object");
        } else if (SUPPORTED_SELECTOR_TYPES.indexOf(selector.type) === -1) {
          throw new Error("Unsupported selector type: " + selector.type);
        }
        if (!selector.hasOwnProperty('toString')) {
          selector.toString = selectorObject.toString;
        }
        return selector;
      }
      throw new Error("Unsupported selector type: " + typeof selector);
    };

    this.removeElementsByXPath = function removeElementsByXPath(expression) {
      var a = document.evaluate(expression, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
      for (var i = 0; i < a.snapshotLength; i++) {
        a.snapshotItem(i).parentNode.removeChild(a.snapshotItem(i));
      }
    };

    this.scrollTo = function scrollTo(x, y) {
      window.scrollTo(parseInt(x || 0, 10), parseInt(y || 0, 10));
    };

    this.scrollToBottom = function scrollToBottom() {
        this.scrollTo(0, this.getDocumentHeight());
      },

      this.sendAJAX = function sendAJAX(url, method, data, async, settings) {
        var xhr = new XMLHttpRequest(),
          dataString = "",
          dataList = [];
        method = method && method.toUpperCase() || "GET";
        var contentType = settings && settings.contentType || "application/x-www-form-urlencoded";
        xhr.open(method, url, !!async);
        this.log("sendAJAX(): Using HTTP method: '" + method + "'", "debug");
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
        if (method === "POST") {
          if (typeof data === "object") {
            for (var k in data) {
              dataList.push(encodeURIComponent(k) + "=" + encodeURIComponent(data[k].toString()));
            }
            dataString = dataList.join('&');
            this.log("sendAJAX(): Using request data: '" + dataString + "'", "debug");
          } else if (typeof data === "string") {
            dataString = data;
          }
          xhr.setRequestHeader("Content-Type", contentType);
        }
        xhr.send(method === "POST" ? dataString : null);
        return xhr.responseText;
      };

    this.setField = function setField(field, value) {
      /*jshint maxcomplexity:99 */
      var logValue, fields, out;
      value = logValue = (value || "");

      if (field instanceof NodeList || field instanceof Array) {
        fields = field;
        field = fields[0];
      }

      if (!(field instanceof HTMLElement)) {
        var error = new Error('Invalid field type; only HTMLElement and NodeList are supported');
        error.name = 'FieldNotFound';
        throw error;
      }

      if (this.options && this.options.safeLogs && field.getAttribute('type') === "password") {
        // obfuscate password value
        logValue = new Array(value.length + 1).join("*");
      }

      this.log('Set "' + field.getAttribute('name') + '" field value to ' + logValue, "debug");

      try {
        field.focus();
      } catch (e) {
        this.log("Unable to focus() input field " + field.getAttribute('name') + ": " + e, "warning");
      }

      var nodeName = field.nodeName.toLowerCase();

      switch (nodeName) {
        case "input":
          var type = field.getAttribute('type') || "text";
          switch (type.toLowerCase()) {
            case "checkbox":
              if (fields.length > 1) {
                var values = value;
                if (!Array.isArray(values)) {
                  values = [values];
                }
                Array.prototype.forEach.call(fields, function _forEach(f) {
                  f.checked = values.indexOf(f.value) !== -1 ? true : false;
                });
              } else {
                field.checked = value ? true : false;
              }
              break;
            case "file":
              throw {
                name: "FileUploadError",
                  message: "File field must be filled using page.uploadFile",
                  path: value
              };
            case "radio":
              if (fields) {
                Array.prototype.forEach.call(fields, function _forEach(e) {
                  e.checked = (e.value === value);
                });
              } else {
                out = 'Provided radio elements are empty';
              }
              break;
            default:
              field.value = value;
              break;
          }
          break;
        case "select":
        case "textarea":
          field.value = value;
          break;
        default:
          out = 'Unsupported field type: ' + nodeName;
          break;
      }

      // firing the `change` and `input` events
      ['change', 'input'].forEach(function (name) {
        var event = document.createEvent("HTMLEvents");
        event.initEvent(name, true, true);
        field.dispatchEvent(event);
      });

      // blur the field
      try {
        field.blur();
      } catch (err) {
        this.log("Unable to blur() input field " + field.getAttribute('name') + ": " + err, "warning");
      }
      return out;
    };

    this.visible = function visible(selector) {
      return [].some.call(this.findAll(selector), this.elementVisible);
    };

    this.tagElements = function (b, s, tag) {
      var nodes = document.querySelectorAll(b),
        c = 0;
      for (var i = 0, cnt = nodes.length; i < cnt; ++i) {
        var n = nodes[i];
        if (!n.getAttribute(tag)) {
          n.setAttribute(tag, s.toString());
          ++s;
          ++c;
        }
      }
      return c;
    };
  };
})(typeof clientUtils === "object" ? clientUtils : window);


function getImageBase64(url) {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(this, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function FileListItem(a) {
  a = [].slice.call(Array.isArray(a) ? a : arguments)
  for (var c, b = c = a.length, d = !0; b-- && d;) d = a[b] instanceof File
  if (!d) throw new TypeError("expected argument to FileList is File or array of File objects")
  for (b = (new ClipboardEvent("")).clipboardData || new DataTransfer; c--;) b.items.add(a[c])
  return b.files
}

let tools = {
  getScrollTop: () => {
    var scrollTop = 0;
    if (document.documentElement && document.documentElement.scrollTop) {
      scrollTop = parent.document.documentElement.scrollTop;
    } else if (document.body) {
      scrollTop = parent.document.body.scrollTop;
    }
    return scrollTop;
  },
  addUrlInput: () => {
    let urlInputObj = document.querySelector('.__injectObj');
    if (urlInputObj)
      urlInputObj.style.display = "block";
    else {
      urlInputObj = document.createElement("div");
      urlInputObj.setAttribute('class', '__injectObj');
      var oneInput = document.createElement("input");
      oneInput.setAttribute("type", "text");
      oneInput.setAttribute("class", "inputtext");
      oneInput.setAttribute("id", "inject-input");
      oneInput.setAttribute("style", "width:1000px");
      var oneButton = document.createElement("button");
      oneButton.setAttribute('type', 'button');
      oneButton.setAttribute('id', 'inject-button');
      oneButton.innerText = "OPEN";
      urlInputObj.appendChild(oneInput);
      urlInputObj.appendChild(oneButton);
      document.body.appendChild(urlInputObj);
      oneButton.onclick = () => {
        let href = document.querySelector("#inject-input").value;
        if (!href.match(/http[s]:\/\//)) {
          href = "http://" + href;
        }
        window.location.href = href;
      }
    }
    let top = 0;
    urlInputObj.setAttribute("style", "background:#e2e2e2;position:fixed;border:solid 3px #2F74A7;cursor:pointer;top:" + top + "px;left:0px;z-index:9999999999");

  }
}
var dom = null;
function _h__h_() {
  if (!document || !document.createElement) {
    setTimeout(_h__h_, 500);
    return;
  }
  window.clientUtilsObj = clientUtils.create({});
  setTimeout(() => {
    ipcRenderer.send('didFinishLoad', 1);
  }, 5000)
  ipcRenderer.on('upload-file', function (e, data) {
    let file = new File([data.data], data.name, {
      type: data.type
    });
    var files = [file];
    //var node = document.querySelector(data.selector);
    var doc = window.clientUtilsObj.options.scope || document
    var node = doc.querySelector(data.selector)
    node.setAttribute('style', 'z-index:1000;display:block!important');
    node.addEventListener('click', function (e) {
      e.preventDefault();
    });
    setTimeout(function () {
      node.files = new FileListItem(files);
      var event = document.createEvent("HTMLEvents");
      event.initEvent("change", true, true);
      node.dispatchEvent(event);
      console.log("dispatchEvent");
    }, 2000)
  });
  ipcRenderer.on("execScript", (event, data) => {
    if (data.func == 'executeJavaScript') {
      let ret = eval(data.args);
      // console.log("======================");
      // console.log(data.args, t);
      // console.log("======================");
      ipcRenderer.send('executeScriptResult', ret);
      return;
    }
    if (data.func == '__capFullDom') {
      // var rc = data.args[0];
      // var path = data.args[1];
      window.__capFullDom();
      return;
    }
    if (data.func == '__cap') {
      var ticket = data.args[0];
      window.__cap(ticket);
      return;
    }
    if (data.func == 'switchChildFrame') {
      var selector = data.selector;
      if (!dom) {
        dom = document;
      }
      if (typeof selector == "number") {
        console.log("number", selector);
        dom = window.frames[selector].document;
      } else if (typeof selector == "string") {
        console.log("string", selector);
        dom = dom.querySelector(selector).contentWindow.document;
      }
      window.clientUtilsObj = clientUtils.create({
        scope: dom
      });
      return;
    }
    if (data.func == 'switchParentFrame') {
      window.clientUtilsObj = clientUtils.create({
        scope: document
      });
      return;
    }
    window.clientUtilsObj[data.func](data.args);
  });
  window.__cap = function (ticket) {
    if (typeof ticket !== 'string' || !/^[a-f0-9]{48}$/.test(ticket)) return;
    ipcRenderer.send('cap', { ticket: ticket });
  }
  window.__capFullDom = function () {
    // html2canvas(document.body, {
    //   useCORS: true,
    //   allowTaint: false,
    //   scale: 2
    // }).then(function (canvas) {
    //   var pageData = canvas.toDataURL("image/jpeg", 1.0);
    //   console.log(pageData);
    //   ipcRenderer.send('capFullDom', pageData);
    // });
  }
  window.__message = function (message) {
    ipcRenderer.send('message', message);
  }
  window.__start = function () {
    ipcRenderer.send('startTask', '');
  }
  window.__pause = function () {
    ipcRenderer.send('pauseTask', '');
  }
  setInterval(() => {
    var injectInputObj = document.querySelector("#inject-input");
    if (!injectInputObj) {
      tools.addUrlInput();
      injectInputObj = document.querySelector("#inject-input");
    }
    if (injectInputObj && (injectInputObj.value != window.location.href)) {
      injectInputObj.setAttribute("value", window.location.href);
    }
  }, 6000)
}
_h__h_();
// setTimeout(_h__h_, 200);
