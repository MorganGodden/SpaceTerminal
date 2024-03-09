const functions = require('./functions.js');
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
        
        body = {};
        response.data.map((contract, i) => {
            id = contract.id.substring(0, 8) + "...";
            id = (contract.accepted) ? chalk.green(id) : chalk.red(id);
            body[i + 1] = id + " (" + contract.factionSymbol + ")";
        });

        functions.outMenu("CONTRACTS", body);

        console.log("\nPress a number to view contract details");
        console.log("Press 'N' to request a new contract.");
        console.log("Press 'BACKSPACE' to go back.");
        functions.keyboardInput((str, key) => {
            if(key.name <= response.data.length && key.name >= 1) {
                displayContractDetails(response.data[str - 1]);
            }
            else if(key.name == 'n') { selectShip(); }
            else if(key.name == 'backspace') { functions.mainMenu(); } 
        });
    });
}

function displayContractDetails(contract) {
    functions.clearLastLn(4);

    body = {};
    Object.assign(body, contract);
    body.id = contract.id + " (" + contract.factionSymbol + ")";
    body.factionSymbol = null
    body.terms = null;

    if(contract.accepted) {
        body.fulfilled = null;
        body.expiration = null;
        body.deadlineToAccept = null;
        body.deadline = functions.formatTime(contract.terms.deadline);
    }
    else {
        body.expiration = functions.formatTime(contract.expiration);
        body.deadlineToAccept = functions.formatTime(contract.deadlineToAccept);
    }

    functions.outMenu("DETAILS", body, false);
    
    console.log("\nPress 'T' to view terms.");
    console.log("Press 'BACKSPACE' to go back.");
    functions.keyboardInput((str, key) => {
        if(key.name == 'backspace') {
            displayContracts();
        }
        else if(key.name == 't') {
            displayContractTerms(contract);
        }
    });
}

function displayContractTerms(contract) {
    functions.clearLastLn(3);

    body = {};
    Object.assign(body, contract.terms);
    if(contract.accepted) body.deadline = null;
    body.payment = functions.formatCredits(body.payment.onAccepted) + " initially\n" + functions.formatCredits(body.payment.onFulfilled) + " on completion";

    
    bodyDeliver = "";
    body.deliver.map((item) => {
        bodyDeliver += item.tradeSymbol + " to " + item.destinationSymbol + " (" + item.unitsFulfilled + "/" + item.unitsRequired + ")\n";
    });
    body.deliver = bodyDeliver.substring(0, bodyDeliver.length - 1);

    functions.outMenu("TERMS", body, false);
    
    console.log("");
    if(!contract.accepted) console.log("Press 'A' to accept the contract.");
    console.log("Press 'BACKSPACE' to go back.");
    functions.keyboardInput((str, key) => {
        if(key.name == 'backspace') {
            displayContracts();
        }
        else if(!contract.accepted && key.name == 'a') {
            console.log("Accepting contract... (" + contract.id + ")");
            functions.st_fetch('my/contracts/' + contract.id + '/accept', (response) => {
                if(!response.error) {
                    displayContracts();
                } else {
                    console.log(response.error);
                    displayContractDetails(response);
                }
            }, 'POST');
        }
    });
}

function displayNewContract(response) {
    body = response.data;
    if(response.error) {
        body = response.error;
    }
    functions.outMenu("NEW CONTRACT", body);

    console.log("\nPress 'BACKSPACE' to go back.");
    functions.keyboardInput((str, key) => {
        if(key.name == 'backspace') {
            displayContracts();
        }
    });
}