'use strict';

const fs = require('fs');

const {ipcMain} = require('electron');
const windows = [{tabs: [{id: 0}]}];
const localStorage = {};
const alert = data => sender.send("rikai-log", data);

let i = 0;
let sender = null;

const chrome = {
    __events: {},
    browserAction: {
        onClicked: {
            __listeners: [],
            addListener: f => chrome.browserAction.onClicked.__listeners.push(f)
        },
        setBadgeBackgroundColor: data => data,
        setBadgeText: data => data
    },
    extension: {
        getBackgroundPage: () => '?',
        getURL: uri => __dirname + '/rikaikun/' + uri
    },
    runtime: {
        onMessage: {
            __listeners: [],
            addListener: f => chrome.runtime.onMessage.__listeners.push(f)
        }
    },
    tabs: {
        sendMessage: (id, data) => sender.send('rikai-front', data),
        onSelectionChanged: {
            addListener: f => f(0)
        }
    },
    windows: {
        getAll: (data, f) => f(windows)
    }
};

ipcMain.on('rikai-init', (event, data) => sender = event.sender);
ipcMain.on('rikai-back', (event, data) => {
    if (data.payload.type === 'makehtml' && !data.payload.entry.data) {
        data.payload.entry.data = [];
    }
    const callback = data.callback ? (response) => sender.send(data.callback, response) : null;
    chrome.runtime.onMessage.__listeners.forEach(f => f(data.payload, {tab: {id: 0}}, callback));
});
ipcMain.on('rikai-toggle', (event, data) => chrome.browserAction.onClicked.__listeners.forEach(f => f(0)));

// Sorry mom! :(
eval(
    fs.readFileSync(__dirname + '/rikaikun/data.js').toString() +
    fs.readFileSync(__dirname + '/rikaikun/rikaichan.js').toString() +
    fs.readFileSync(__dirname + '/rikaikun/background.js').toString() +
    'rcxDict.prototype.fileRead = (url, charset) => fs.readFileSync(url.replace("file://", "")).toString();'
);

module.exports = (window) => {
    window.webContents.executeJavaScript("const RIKAI_BASE_URL = '" + __dirname + "/rikaikun/'");
    window.webContents.executeJavaScript(
        fs.readFileSync(__dirname + '/chrome-api-polyfill.js').toString()
    );
    window.webContents.executeJavaScript(
        fs.readFileSync(__dirname + '/rikaikun/rikaicontent.js').toString()
    );
};

