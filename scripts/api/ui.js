const chalk = require('chalk');
const readline = require('readline');
const functions = require('./functions.js');

module.exports = { keyboardInput, login, signUp, mainMenu, outText, outSelector, outMenu, outHeader, optionsIndex, clearLastLn, back };
ansiRegex = new RegExp(['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)','(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'].join('|'))

var displayLastMenu = null;


// Outputs
function signUp() {
    outHeader();
    console.log("Sign up at https://spacetraders.io/ to get your token.");
    console.log("Press 'BACKSPACE' to go back.");
    keyboardInput((str, key) => {
        if (key.name == 'backspace') {
            mainMenu();
        }
    });
}

function login(doHeader = true) {
    if(doHeader) outHeader();
    console.log("Paste your token (right-click): ");

    input = "";
    // Keyboard input, with copy-paste support
    keyboardInput((str, key) => {
        if (key.name == 'return') {
            if(input.length > 100) {
                options.headers.Authorization = 'Bearer ' + input;
                functions.setUserData('token', input);
                mainMenu();
            }
            else {
                outHeader();
                console.log(chalk.red("Invalid token. Please try again."));
                login(false);
            }
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
    if(functions.getUserData('token') == null) {
        login();
        return;
    }

    commands = {
        'f': 'factions.js',
        'a': 'agent.js',
        's': 'ships.js',
        'c': 'contracts.js',
    }

    outMenu("MAIN MENU", commands, () => {
        console.log("\nPress a letter to select a menu. Or 'CTRL + C' to exit.");
        keyboardInput((str, key) => {
            if (commands[key.name] != null) {
                outHeader();
        
                var script = require("../" + commands[key.name]);
                script.get();
            }
        })
    });
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
        outMenu(title, body, () => {
            console.log("\nPress 'UP' or 'DOWN' to navigate.");
            console.log("Press 'ENTER' to select.");
            console.log("Press 'BACKSPACE' to go back.");
        }, doHeader, false);
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


function getUIWidth(title, data) {
    const dataType = typeof data;

    rowCount = 0;
    if (dataType === 'string') {
        data = data.split("\n");
        rowCount = data.length;
    }
    else if (dataType === 'object') {
        rowCount = Object.keys(data).length;
    }

    
    // Menu width based on longest key-value pair
    uiWidth = 0;
    for (var i = 0; i < rowCount; i++) {

        if(dataType === 'object') {
            key = Object.keys(data)[i];
            rows = String(data[key]).split("\n");
            for (var ii = 0; ii < rows.length; ii++) {
                row = rows[ii].replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '');
                length = String(key).length + row.length + 4;
                if (length > uiWidth) uiWidth = length;
            }
        }
        else if (dataType === 'string'){
            length = data[i].length;
            if (length > uiWidth) uiWidth = length;
        }
    }

    // Menu width based on title
    strippedTitle = title.replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '');
    if ((strippedTitle.length + 4) > uiWidth) uiWidth = strippedTitle.length;

    // Title dashes
    titleDashes = uiWidth - strippedTitle.length - 2;
    if (titleDashes < 0) titleDashes = 0;

    return [uiWidth, titleDashes];
}


function outUI(type, title, body, width, then, doHeader = true) {
    if(doHeader) outHeader();

    body = ("╭ " + chalk.bold(title) + " " + ("─".repeat(width[1] + 2)) + "╮\n") + body // Title
    body = body + ("\n╰" + ("─".repeat(width[0] + 2)) + "╯"); // Footer

    if(type == "ERROR") {
        body = body.replaceAll("│", chalk.redBright("│"))
                   .replaceAll("╭", chalk.redBright("╭"))
                   .replaceAll("╰", chalk.redBright("╰"))
                   .replaceAll("╮", chalk.redBright("╮"))
                   .replaceAll("╯", chalk.redBright("╯"))
                   .replaceAll("─", chalk.redBright("─"))
                   .replace(title, chalk.red(title));
    }

    console.log(body);

    if (then) then();
}


function outText(type, title, data, then, doHeader = true) {
    const menuWidth = getUIWidth(title, data);

    // Body rows
    data = data.split("\n");
    var bodyOutput = "";
    for (var i = 0; i < data.length; i++) {
        rowSpaces = menuWidth[0] - data[i].length;
        if (rowSpaces < 0) rowSpaces = 0;

        bodyOutput += ("│ " + data[i] + " ".repeat(rowSpaces) + " │\n");
    }
    bodyOutput = bodyOutput.slice(0, -1); // Remove last newline

    outUI(type, title, bodyOutput, menuWidth, then, doHeader);
}


function outMenu(title, body, then, doHeader = true, doColons = true) {
    displayLastMenu = () => outMenu(title, body, then, doHeader, doColons);
    const menuWidth = getUIWidth(title, body);

    // Body rows
    var bodyOutput = "";
    for (var key in body) {
        if(body[key] == null) continue; // If null
        val = String(body[key]) || "";
        
        rows = val.split("\n");
        for (var i = 0; i < rows.length; i++) {
            valLength = rows[i].replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '').length;
            rowLength = String(key).length + valLength + 2;
            rowSpaces = menuWidth[0] - rowLength;
            if (rowSpaces < 0) rowSpaces = 0;

            rowKey = (i == 0) ? chalk.gray(key.toUpperCase() + ((doColons) ? ":" : "")) : " ".repeat(String(key).length + 1);
            bodyOutput += ("│ " + rowKey + " " + rows[i] + " ".repeat(rowSpaces + ((doColons) ? 0 : 1)) + " │\n");
        }
    }
    bodyOutput = bodyOutput.slice(0, -1); // remove last newline

    outUI("NORMAL", title, bodyOutput, menuWidth, then, doHeader);
}


function outHeader() {
    console.clear()
    console.log("╭" + ("─".repeat(30)) + "╮")
    console.log("│" + chalk.red.bold('⠀⣠⢴⡾⢟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡴⢃⡠⠋⣠⠋ ') + '│\n│' + chalk.red.bold('⠞⣱⠋⢰⠁⢿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⢖⣋⡥⢖⣫⠔⠋⡠ ⠀') + '│\n│' + chalk.red.bold('⢖⠹⢤⣈⣙⠚⠶⠤⠤⠤⠴⠶⣒⣒⣚⣩⠭⢵⣒⣻⠭⢖⠏⠁ ⠚⠁   ') + '│');
    console.log("│  " + chalk.gray("─".repeat(26)) + "  │")
    console.log("│  " + chalk.green.bold(" The SpaceTerminal Client ") + "  │")
    console.log("╰" + ("─".repeat(30)) + "╯");
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