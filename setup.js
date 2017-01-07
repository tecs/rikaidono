'use strict';

const fs = require('fs-extra');
const path = require('path');

let discordPath = '';

switch (process.platform) {
    case 'darwin':
        discordPath = '/Applications/Discord.app/Contents/Resources';
        break;

    case 'win32':
        discordPath = 'C:\\Users\\' + process.env.USERPROFILE + '\\AppData\\Local\\Discord\\';
        discordPath += fs.readdirSync(discordPath).filter(file => fs.lstatSync(discordPath + file).isDirectory())[0];
        discordPath += '\\lib\\net45\\resources';
        break;

    case 'linux':
        discordPath = '/usr/share/discord-canary/resources';
        break;

    default:
        console.error('But, why?');
        process.exit();
}

const unpackPath = path.join(__dirname, 'unpack');
const targetPath = path.join(discordPath, 'rikai');
const extensionPath = path.join(targetPath, 'rikaikun');
const asarPath = path.join(discordPath, 'app.asar');

const asar = require('asar');
const ghdownload = require('github-download');

const install = () => {
    console.log('Unpacking application...')
    asar.extractAll(asarPath, unpackPath);

    console.log('Patching Discord source...');
    const indexFile = fs.readFileSync(path.join(unpackPath, 'index.js'))
        .toString()
        .replace(
            /(mainWindow\.loadURL)/,
            "mainWindow.webContents.on('did-finish-load', () => require('../rikai/rikaidono')(mainWindow));\n    $1"
        )
        .replace(
            /(webPreferences: {)/,
            "$1\n        webSecurity: false,"
        );
    fs.writeFileSync(path.join(unpackPath, 'index.js'), indexFile);

    console.log('Creating a new application archive...');
    asar.createPackage(unpackPath, path.join(__dirname, 'app.asar'), e => {
        if (e) {
            return console.error(e);
        }

        console.log('Creating a backup and deploying patched application...');
        fs.renameSync(asarPath, asarPath + '.bak');
        fs.renameSync(path.join(__dirname, 'app.asar'), asarPath);
        fs.copySync(path.join(__dirname, 'src'), targetPath);

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

