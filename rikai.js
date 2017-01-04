'use strict';

let MainWindow = null;
let sender = null;

const {ipcMain} = require('electron');
const windows = [{tabs: [{id: 0}]}];

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
        getUrl: uri => __dirname + '/rikaikun/' + uri
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
        getAll: (data, f) => f(windows);
    }
};

ipcMain.on('rikai-init', (event, data) => sender = event.sender);
ipcMain.on('rikai-back', (event, data) => {
    const callback = data.callback ? (response) => sender.send(data.callback, response) : null;
    chrome.runtime.onMessage.__listeners.forEach(f => f(data.payload, {tab: {id: 0}}, callback));
});
ipcMain.on('rikai-toggle', (event, data) => chrome.browserAction.onClicked.__listeners.forEach(f => f(0)));

// Sorry mom! :(
const fs = require('fs');
eval(fs.readFileSync(chrome.extension.getUrl('data.js')).toString());
eval(fs.readFileSync(chrome.extension.getUrl('rikaichan.js')).toString());
eval(fs.readFileSync(chrome.extension.getUrl('background.js')).toString());

module.exports = (window) => {
    MainWindow = window;
    MainWindow.webContents.executeJavaScript("\
const {ipcRenderer} = require('electron');\
ipcRenderer.send('rikai-init', null);\
const chrome = {\
    extension: {\
        __counter: 0,\
        getUrl: uri => 'file://" + chrome.extension.getUrl('') + "' + uri,\
        sendMessage: (data, callback) => {\
            const callbackId = callback ? 'rikai-callback-' + (++chrome.extension.__counter) : null;\
            ipcRenderer.send('rikai-back', {callback: callbackId, payload: data});\
            if (callbackId) {\
                ipcRenderer.once(callbackId, callback);\
            }\
        }\
    },\
    runtime: {\
        onMessage: {\
            __listeners: [],\
            addListener: f => chrome.runtime.onMessage.__listeners.push(f)\
        }\
    }\
};\
ipcRenderer.on('rikai-front', (event, data) => chrome.runtime.onMessage.__listeners.forEach(f => f(data, null, null)));\
    ");
};

