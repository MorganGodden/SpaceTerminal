const chalk = require('chalk');
const readline = require('readline');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {formatTime, st_fetch, clearLastLn, mainMenu, back, outMenu, outHeader, keyboardInput};
ansiRegex = new RegExp(['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)','(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'].join('|'))



options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.TOKEN
    },
};

function st_fetch(path, func, method = 'GET') {
    options["method"] = method;

    path = 'https://api.spacetraders.io/v2/' + path
    fetch(path, options)
        .then(response => response.json())
        .then(response => func(response))
        .catch(err => console.error(path + "\n" + err));
}




// Output
mainMenu()
function mainMenu() {
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
    
            var script = require('./scripts/' + commands[key.name]);
            script.get();
        }
    })

    console.log("\nPress a letter to select a menu. Or 'CTRL + C' to exit.");
}



function outMenu(title, body, doHeader = true) {
    if(doHeader) outHeader();

    menuWidth = 0;
    for (var key in body) {
        if(body[key] == null) continue; // If null

        stripped = String(body[key]).replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '');
        length = String(key).length + stripped.length + 4;
        if (length > menuWidth) menuWidth = length;
    }

    // Dashes
    titleDashes = menuWidth - title.length - 2;
    if (titleDashes < 0) titleDashes = 0;

    console.log("╭ " + chalk.bold(title) + " " + ("─".repeat(titleDashes)) + "╮") // Title
    // Body
    for (var key in body) {
        if(body[key] == null) continue; // If null
        val = String(body[key]) || "";

        length = String(key).length + val.replace(ansiRegex, '').replace(/\u001b\[.*?m/g, '').length + 3;
        rowSpaces = menuWidth - length;
        if (rowSpaces < 0) rowSpaces = 0;

        console.log("│ " + chalk.gray(key.toUpperCase() + ": ") + body[key] + " ".repeat(rowSpaces) + "│");
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




// Keyboard input
function keyboardInput(func) {
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.setRawMode != null) {
        process.stdin.setRawMode(true);
    }

    process.stdin.removeAllListeners('keypress');
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') { process.exit(); }
        func(str, key);
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