const {ipcRenderer} = require('electron');
ipcRenderer.send('rikai-init', null);
const chrome = {
    extension: {
        __counter: 0,
        getURL: uri => 'file://' + RIKAI_BASE_URL + uri,
        sendMessage: (data, callback) => {
            const callbackId = callback ? 'rikai-callback-' + (++chrome.extension.__counter) : null;
            ipcRenderer.send('rikai-back', {callback: callbackId, payload: data});
            if (callbackId) {
                ipcRenderer.once(callbackId, (e, response) => callback(response))
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
ipcRenderer.on('rikai-log', (event, data) => console.log(data));

setInterval(() => {
    const toolbars = document.getElementsByClassName('header-toolbar');
    if (!toolbars.length || toolbars[0].children[0].id === 'rikai-toggle') {
        return;
    }
    const button = document.createElement('button');
    button.id = 'rikai-toggle';
    const span = document.createElement('span');
    span.style.backgroundImage = 'url(' + chrome.extension.getURL('images/ba.png') + ')';
    button.appendChild(span);
    button.onclick = () => chrome.extension.sendMessage('rikai-toggle');
    toolbars[0].insertBefore(button, toolbars[0].children[0]);
}, 5000);
