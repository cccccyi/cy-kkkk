"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const fs = require('fs');
const { arg } = require("./common");
const { url } = require("inspector");
const { exit } = require("process");
// const brwEngine = require("./browser_engine");
let ipcMain = electron_1.ipcMain;
let baseDir = path.dirname(process.resourcesPath);
let downloadDir = path.join(baseDir, 'downloads');
let dataDir = path.join(baseDir, 'data');
let mouseDir = path.join(baseDir, 'input', 'mouse');
let brw = path.join(baseDir, 'brw');
let proxy = path.join(baseDir, 'proxy');
let dynamic = path.join(baseDir, 'dynamic');
let mainWindow = null;
mkdir(downloadDir);
// let proxyServer = "socks5://127.0.0.1:8288";
// let proxyServer = "socks5://test:123456@64.64.232.216:2016";
// let proxyServer = "socks5://127.0.0.1:1080";
let proxyServer = false;

const session = electron_1.session;
let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36';
// let userAgent = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Mobile Safari/537.36';
if (fs.existsSync(brw)) {
    userAgent = fs.readFileSync(brw, 'utf-8');
    fs.unlink(brw, (err) => {
        if (err) throw err;
    })
}
if (fs.existsSync(proxy)) {
    proxyServer = fs.readFileSync(proxy, 'utf-8');
    fs.unlink(proxy, (err) => {
        if (err) throw err;
    })
}
if (fs.existsSync(dynamic)) {
    fs.unlink(dynamic, (err) => {
        if (err) throw err;
    })
}
electron_1.app.allowRendererProcessReuse = true;
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
ipcMain.on('cap', function(evt, obj) {
    var saveImage = function(img) {
        if (img && img.toJPEG) {
            var tmpPath = obj.path + '.jpg';
            fs.writeFileSync(tmpPath, img.toJPEG(90));
            fs.renameSync(tmpPath, obj.path);
        }
    }
    if (mainWindow) {
        if (obj.rc) mainWindow.capturePage(obj.rc).then(saveImage);
        else mainWindow.capturePage().then(saveImage);
    }
});

function mkdir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function initData() {
    mkdir(dataDir);
    electron_1.app.setPath('userData', dataDir);
    electron_1.app.setPath('userCache', dataDir);
}

function initCommandLine() {
    electron_1.app.commandLine.appendSwitch('auto-detect', 'false');
    electron_1.app.commandLine.appendSwitch('no-proxy-server');
    electron_1.app.commandLine.appendSwitch('enable-webfonts-intervention-v2', 'Disabled');
    electron_1.app.commandLine.appendSwitch('disable-site-isolation-trials');
}

function decorateURL(url) {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.append('utm_source', 'default_app');
    return parsedUrl.toString();
}
async function createWindow() {
    await electron_1.app.whenReady();
    const options = {
        width: 900,
        height: 600,
        autoHideMenuBar: true,
        backgroundColor: '#FFFFFF',
        webPreferences: {
            preload: path.resolve(__dirname, 'helper.js'),
            // contextIsolation: true,
            sandbox: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            webSecurity: false
        },
        useContentSize: true,
        show: false
    };
    if (process.platform === 'linux') {
        options.icon = path.join(__dirname, 'icon.png');
    }
    mainWindow = new electron_1.BrowserWindow(options);
    mainWindow.webContents.userAgent = userAgent;
    mainWindow.on('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
        event.preventDefault();
        // electron_1.shell.openExternal(decorateURL(url));
        mainWindow.loadURL(url);
    });

    return mainWindow;
}
initData();
initCommandLine();

function removeCookies(domain, url) {
    session.defaultSession.cookies.get({
        domain: domain
    }).then(function(o) {
        if (o && o.length > 0) {
            for (var p in o) {
                session.defaultSession.cookies.remove(url, o[p]['name']).then(function(cookies) {
                    console.log(cookies);
                });
            }
        }
    });
}
exports.loadURL = async(appUrl) => {
    let args = process.argv,
        url = false,
        proxyServer = false;
    // console.log(args.length, "=========");
    for (let i = 1; i < args.length; i++) {
        var aArg = args[i].split('=');
        switch (aArg[0]) {
            case '--url':
                url = aArg[1];
                break;
            case '--proxy':
                proxyServer = aArg[1];
                break;
        }
    }
    if (!url) {
        console.log("url not found. eg: ./electron --no-sandbox --url=http://www.google.com --proxy=socks5://127.0.0.1:8288");
        electron_1.app.quit();
        return;
    }
    mainWindow = await createWindow();
    // mainWindow.loadURL(appUrl);
    if (!proxyServer) {
        mainWindow.loadURL(url);
    } else {
        mainWindow.webContents.session.setProxy({ proxyRules: proxyServer.trim() }).then(function() {
            mainWindow.loadURL(url);
        });
    }
    var newSession = mainWindow.webContents.session;
    mainWindow.maximize();
    // mainWindow.openDevTools();
    mainWindow.focus();
    setTimeout(async function() {
        // brwEngine.execScript(mainWindow);
    }, 3000);
};