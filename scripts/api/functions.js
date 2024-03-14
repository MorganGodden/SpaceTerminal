const chalk = require('chalk');
const dotenv = require('dotenv');
const os = require('os');
const fs = require('fs');

const { outText } = require('./ui.js');


dotenv.config();

module.exports = { formatTime, formatCredits, st_fetch, getUserData, setUserData };
ansiRegex = new RegExp(['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)','(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'].join('|'))

tmpdir = os.tmpdir() + '/SpaceTerminal';
userdata = tmpdir + '/userdata.json';

options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getUserData('token')
    },
};



function st_fetch(path, func, method, data = null) {
    options["method"] = method;
    if (data) options["body"] = JSON.stringify(data);

    if(!options["headers"]["Authorization"]) options["headers"]["Authorization"] = 'Bearer ' + getUserData('token');
    else if(path == "register") delete options["headers"]["Authorization"];

    function onError(err, doKeyboard = true) {
        const ui = require('./ui.js'); // ! Circular dependency workaround
        ui.outHeader();
        ui.outText("ERROR", "ERROR: " + path, err, null, false);
        if(doKeyboard) {
            console.log("\nPress 'BACKSPACE' to go back.");
            ui.keyboardInput((str, key) => {
                if (key.name == 'backspace') {
                    if(ui.displayLastMenu) ui.displayLastMenu();
                    else ui.mainMenu();
                }
            });
        }
    }


    path = 'https://api.spacetraders.io/v2/' + path;
    fetch(path, options)
        .then(response => response.json())
        .then(response => { 
            if(response.error) {
                const relogin = response.error.code == "401";
                onError(response.error.message.replaceAll(". ", ".\n"), !relogin);
                if(relogin) { 
                    console.log("\nPress 'L' to login again.");
                    console.log("Press 'S' to sign-up.");

                    const ui = require('./ui.js'); // ! Circular dependency workaround
                    ui.keyboardInput((str, key) => {
                        if (key.name == 'l') { ui.login(); }
                        else if (key.name == 's') { ui.signUp(); }
                    });
                }
            }
            else { func(response) }
        })
        .catch(err => onError(err));

    if (data) delete options["body"];
}



// Userdata
function checkTmpDir() {
    if (!fs.existsSync(tmpdir)){
        fs.mkdirSync(tmpdir);
    }
}

function getUserData(key) {
    checkTmpDir();
    if (!fs.existsSync(userdata)) {
        fs.writeFileSync(userdata, JSON.stringify({}));
        return null;
    }
    else {
        data = fs.readFileSync (userdata, 'utf8');
        data = JSON.parse(data);
        return data[key];
    }
}

function setUserData(key, value) {
    checkTmpDir();
    if (!fs.existsSync(userdata)) {
        fs.writeFileSync(userdata, JSON.stringify({}));
    }
    data = fs.readFileSync (userdata, 'utf8');
    data = JSON.parse(data);
    data[key] = value;
    fs.writeFileSync(userdata, JSON.stringify(data));

    return data;
}



function formatTime(time) {
    return time.replace("T", " at ").split(".")[0];
}

function formatCredits(credits) {
    return "" + credits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}