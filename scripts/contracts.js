const functions = require('../functions.js');
const chalk = require('chalk');

module.exports = {get};

function get() {
    displayContracts();
}

function selectShip() {
    functions.st_fetch('my/ships', (response) => {
        ships = {}
        i = 1
        response.data.map(ship => {
            ships[i] = ship.symbol;
            i++;
        });

        functions.outMenu("SELECT SHIP", ships)

        console.log("\nPress a number to select a ship.");
        console.log("Press 'BACKSPACE' to go back.");
        functions.keyboardInput((str, key) => {
            if(key.name <= i && key.name >= 1) {
                requestContract(ships[key.name]);
            }

            else if(key.name == 'backspace') {
                functions.mainMenu();
            }
        });
    });
}

function requestContract(ship) {
    functions.st_fetch('my/ships/' + ship + '/negotiate/contract', (response) => {
        data = response.data;
        displayNewContract(response);
    }, 'POST');
}


function displayContracts() {
    functions.st_fetch('my/contracts', (response) => {
        i = 1
        body = {}
        response.data.map(contract => {
            id = contract.id.substring(0, 5) + "...";;
            id = (contract.accepted) ? chalk.green(id) : chalk.red(id);
            type = contract.type;
            body[i] = id + " (" + type + ")";
            i++;
        });

        functions.outMenu("CONTRACTS", body);

        console.log("\nPress a number to view contract details");
        console.log("Press 'N' to request a new contract.");
        console.log("Press 'BACKSPACE' to go back.");
        functions.keyboardInput((str, key) => {
            if(key.name <= i && key.name >= 1) {
                displayContractDetails(response.data[str - 1]);
            }
            else if(key.name == 'n') { selectShip(); }
            else if(key.name == 'backspace') { functions.mainMenu(); } 
        });
    });
}

function displayContractDetails(contract) {
    functions.clearLastLn(4);

    body = contract
    body.id = contract.id + " (" + contract.factionSymbol + ")";
    body.expiration = functions.formatTime(contract.expiration);
    body.deadlineToAccept = functions.formatTime(contract.deadlineToAccept);
    body.factionSymbol = null

    functions.outMenu("DETAILS", body, false);

    console.log("\nPress 'BACKSPACE' to go back.");
    functions.keyboardInput((str, key) => {
        if(key.name == 'backspace') {
            displayContracts();
        }
    });
}

function displayNewContract(response) {
    functions.outMenu("NEW CONTRACT", response);

    functions.keyboardInput((str, key) => {
        if(key.name == 'backspace') {
            functions.mainMenu();
        }
    });
}