const chalk = require('chalk');
const readline = require('readline');
const dotenv = require('dotenv');
const os = require('os');
const fs = require('fs');
const { clear } = require('console');

dotenv.config();

module.exports = {formatTime, formatCredits, st_fetch, clearLastLn, mainMenu, back, outSelector, outMenu, outHeader, keyboardInput, optionsIndex};
ansiRegex = new RegExp(['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)','(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'].join('|'))

tmpdir = os.tmpdir() + '/SpaceTerminal';
userdata = tmpdir + '/userdata.json';

token = getUserData('token');
options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    },
};

function st_fetch(path, func, method, data = null) {
    options["method"] = method;
    if (data) options["body"] = JSON.stringify(data);

    path = 'https://api.spacetraders.io/v2/' + path
    fetch(path, options)
        .then(response => response.json())
        .then(response => func(response))
        .catch(err => console.error(path + "\n" + err));

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


// Output
function login() {
    outHeader();
    console.log("Paste your token (right-click): ");

    input = "";
    // Keyboard input, with copy-paste support
    keyboardInput((str, key) => {
        if (key.name == 'return' && input.length > 100) {
            token = input;
            options.headers.Authorization = 'Bearer ' + token;
            setUserData('token', token);
            mainMenu();
            return
        }
        else if (key.name == 'backspace') {
            if (input.length > 0) {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
            }
            input = ""
        }
        // If ctrl + v
        else if ((key.ctrl && key.name == 'v')) {
            return;
        }
        else {
            input += str;
            str = (input.length % 50 == 0) ? str + "\n" : str;
            process.stdout.write(chalk.gray(str));
        }
    });
}

function mainMenu() {
    if(token == null) {
        login();
        return;
    }

    commands = {
        'f': 'factions.js',
        'a': 'agent.js',
        's': 'ships.js',
        'c': 'contracts.js',
    }

    outHeader();
    outMenu("MAIN MENU", commands);

    keyboardInput((str, key) => {
        if (commands[key.name] != null) {
            outHeader();
    
            var script = require("./" + commands[key.name]);
            script.get();
        }
    })

    console.log("\nPress a letter to select a menu. Or 'CTRL + C' to exit.");
}


var optionsIndex = 0;
async function outSelector(title, body, options, doHeader = true) {
    optionsIndex = options.length / 2 | 0;

    function out (clearCount) {
        clearLastLn(clearCount);
        body = {
            "▲": chalk.gray(options[optionsIndex-1] || ""),
            "│": chalk.bold(options[optionsIndex]),
            "▼": chalk.gray(options[optionsIndex+1] || ""),
        };
        outMenu(title, body, doHeader, false);
        console.log("\nPress 'UP' or 'DOWN' to navigate.");
        console.log("Press 'ENTER' to select.");
        console.log("Press 'BACKSPACE' to go back.");
    }
    out(0);

    return new Promise((resolve, reject) => {
        keyboardInput((str, key) => {
            if (key.name === 'up' && optionsIndex > 0) { optionsIndex--; out(9); }
            else if (key.name === 'down' && optionsIndex < Object.keys(body).length) { optionsIndex++; out(9); }
            else if (key.name === 'return') {
                clearLastLn(9);
                resolve(options[optionsIndex]);
            }
            else if (key.name === 'backspace') { back(); }
        });
    });
}



function outMenu(title, body, doHeader = true, doColons = true) {
    if(doHeader) outHeader();

    // Menu width based on longest key-value pair
    menuWidth = 0;
    for (var key in body) {
        if(body[key] == null) continue; // If null

        rows = String(body[key]).split("\n");
        for (var i = 0; i < rows.length; i++) {
            row = rows[i].replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '');
            length = String(key).length + row.length + 4;
            if (length > menuWidth) menuWidth = length;
        }
    }

    // Menu width based on title
    strippedTitle = title.replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '');
    if ((strippedTitle.length + 4) > menuWidth) menuWidth = strippedTitle.length + 4;

    
    // Dashes
    titleDashes = menuWidth - strippedTitle.length - 2;
    if (titleDashes < 0) titleDashes = 0;

    console.log("╭ " + chalk.bold(title) + " " + ("─".repeat(titleDashes)) + "╮") // Title


    // Body rows
    for (var key in body) {
        if(body[key] == null) continue; // If null
        val = String(body[key]) || "";
        
        rows = val.split("\n");
        for (var i = 0; i < rows.length; i++) {
            valLength = rows[i].replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '').length;
            rowLength = String(key).length + valLength + 4;
            rowSpaces = menuWidth - rowLength;
            if (rowSpaces < 0) rowSpaces = 0;

            rowKey = (i == 0) ? chalk.gray(key.toUpperCase() + ((doColons) ? ":" : "")) : " ".repeat(String(key).length + 1);
            console.log("│ " + rowKey + " " + rows[i] + " ".repeat(rowSpaces + ((doColons) ? 0 : 1)) + " │")
        }
    }

    console.log("╰" + ("─".repeat(menuWidth)) + "╯");
}



function outHeader() {
    console.clear()
    console.log("╭" + ("─".repeat(30)) + "╮")
    console.log("│" + chalk.red.bold('⠀⣠⢴⡾⢟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡴⢃⡠⠋⣠⠋ ') + '│\n│' + chalk.red.bold('⠞⣱⠋⢰⠁⢿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⢖⣋⡥⢖⣫⠔⠋⡠ ⠀') + '│\n│' + chalk.red.bold('⢖⠹⢤⣈⣙⠚⠶⠤⠤⠤⠴⠶⣒⣒⣚⣩⠭⢵⣒⣻⠭⢖⠏⠁ ⠚⠁   ') + '│');
    console.log("│  " + chalk.gray("─".repeat(26)) + "  │")

    console.log("│  " + chalk.green.bold(" The SpaceTerminal Client ") + "  │")
    console.log("╰" + ("─".repeat(30)) + "╯");
}


function formatTime(time) {
    return time.replace("T", " at ").split(".")[0];
}

function formatCredits(credits) {
    return "" + credits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}




// Keyboard input
function keyboardInput(func) {
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.setRawMode != null) {
        process.stdin.setRawMode(true);
    }

    process.stdin.removeAllListeners('keypress');
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') { process.exit(); }
        return func(str, key);
    });
}

function back(func, arg) {
    console.log("\nPress 'BACKSPACE' to go back: ");
    keyboardInput((str, key) => {
        if (key.name == 'backspace') {
            if(func) func(arg);
            else mainMenu();
        }
    });
}

function clearLastLn(loop = 1) {
    for (i = 0; i < loop; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine();
    }
}