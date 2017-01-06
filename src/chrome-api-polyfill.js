const {ipcRenderer} = require('electron');
ipcRenderer.send('rikai-init', null);
const chrome = {
    extension: {
        __counter: 0,
        getUrl: uri => 'file://' + RIKAI_BASE_URL + uri,
        sendMessage: (data, callback) => {
            const callbackId = callback ? 'rikai-callback-' + (++chrome.extension.__counter) : null;
            ipcRenderer.send('rikai-back', {callback: callbackId, payload: data});
            if (callbackId) {
                ipcRenderer.once(callbackId, callback);
            }
        }
    },
    runtime: {
        onMessage: {
            __listeners: [],
            addListener: f => chrome.runtime.onMessage.__listeners.push(f)
        }
    }
};
ipcRenderer.on('rikai-front', (event, data) => chrome.runtime.onMessage.__listeners.forEach(f => f(data, null, null)));
