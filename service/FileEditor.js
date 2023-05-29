module.exports = {
    "readFile": readFile,
    "writeFile": writeFile,
}

const fs = require('fs');

function checkFile(path) {
    let check = true;
    try {
        fs.accessSync(path, fs.constants.F_OK || fs.constants.R_OK || fs.constants.W_OK);
    } catch (err) {
        console.error('File not found or without read/writte permissions.', err);
        check = false;
    }
    return check;
}

function readFile(path) {
    let data = null;
    try {
        if (checkFile(path)) {
            data = fs.readFileSync(path, { encoding: 'utf-8' });
        }
    } catch (err) {
        console.error(err);
        data = null;
    }
    return data;
}

function writeFile(path, data) {
    let success = true;
    try {
        if (checkFile(path)) {
            fs.writeFileSync(path, data, { encoding: 'utf-8', 'flag': 'w' });
        }
    } catch (err) {
        console.error(err);
        success = false;
    }
    return success;
}