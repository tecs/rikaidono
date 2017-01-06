'use strict';

// TODO: Find this automatically
const discordPath = '/usr/share/discord-canary/resources';
const unpackPath = __dirname + '/unpack';
const targetPath = discordPath + '/rikai';
const extensionPath = targetPath + '/rikaikun';
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
            "mainWindow.webContents.on('did-finish-load', () => require('../rikai/rikai-dono')(mainWindow));\n    $1"
        )
        .replace(
            /(webPreferences: {)/,
            "$1\n        webSecurity: false,"
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
        fs.copySync(__dirname + '/src', targetPath);

        console.log('Cleaning up temporary files...');
        fs.removeSync(unpackPath);

        console.log('All done!');
    });
};

if (fs.existsSync(targetPath)) {
    console.log('Extension files found, skipping download.')
    install();
} else {
    fs.mkdirSync(targetPath);
    console.log('Downloading extension files...');
    ghdownload({user: 'melink14', repo: 'rikaikun'}, extensionPath)
        .on('end', (e) => {
            if (e) {
                return console.error(e);
            }
            install();
        })
}

