'use strict';

// TODO: Find this automatically
const discordPath = '/usr/share/discord-canary/resources';
const unpackPath = __dirname + '/unpack';
const extensionPath = discordPath + '/rikaikun';
const asarPath = discordPath + '/app.asar';

const fs = require('fs-extra');
const asar = require('asar');
const ghdownload = require('github-download');

const install = () => {
    console.log('Unpacking application...')
    asar.extractAll(asarPath, unpackPath);

    console.log('Patching Discord source...');
    const indexFile = fs.readFileSync(unpackPath + '/index.js')
        .toString()
        .replace(
            /(mainWindow\.loadURL)/,
            "mainWindow.webContents.on('did-finish-load', () => require('../rikai')(mainWindow));\n    $1"
        );
    fs.writeFileSync(unpackPath + '/index.js', indexFile);

    console.log('Creating a new application archive...');
    asar.createPackage(unpackPath, __dirname + '/app.asar', e => {
        if (e) {
            return console.error(e);
        }

        console.log('Creating a backup and deploying patched application...');
        fs.renameSync(asarPath, asarPath + '.bak');
        fs.renameSync(__dirname + '/app.asar', asarPath);
        fs.copySync(__dirname + '/rikai.js', discordPath + '/rikai.js');

        console.log('Cleaning up temporary files...');
        fs.removeSync(unpackPath);

        console.log('All done!');
    });
};

if (fs.existsSync(extensionPath)) {
    console.log('Extension files found, skipping download.')
    install();
} else {
    console.log('Downloading extension files...');
    ghdownload({user: 'melink14', repo: 'rikaikun'}, extensionPath)
        .on('error', (error) => console.error(error))
        .on('end', install)
}

