const functions = require('./functions.js');
const chalk = require('chalk');


module.exports = {get};

function get() {
    functions.outHeader();
    functions.st_fetch('my/ships', (response) => displayShips(response.data))
}


function displayShips(data) {
    i = 1
    body = {}
    data.map(ship => {
        body[i] = ship.symbol;
        i++;
    });

    functions.outMenu("SHIPS", body);

    console.log("\nPress a number to view ship details. Or 'BACKSPACE' to go back.");
    functions.keyboardInput((str, key) => {
        if(key.name <= i && key.name >= 1) {
            var ship = data[str - 1];
            displayShipDetails(ship);
        }

        else if(key.name == 'backspace') {
            functions.mainMenu();
        }
    });
}


function displayShipDetails(ship) {
    functions.outHeader();

    registration = ship.registration;
    stat = ship.nav.status
    stat = (stat == "DOCKED") ? chalk.green(stat) : chalk.yellow(stat);
    mode = ship.nav.flightMode
    
    functions.outMenu("SHIP DETAILS", {
        "NAME": registration.name + " (" + registration.factionSymbol + ")",
        "TYPE": registration.role,
        "LOCA": ship.nav.waypointSymbol + " (" + stat + ", " + mode + ")",
        "FUEL": ship.fuel.current + "/" + ship.fuel.capacity,
        "CREW": ship.crew.current + "/" + ship.crew.capacity,
        "CRGO": ship.cargo.units + "/" + ship.cargo.capacity,
    });

    console.log("\nPress 'C' to view crew.")
    console.log("Press 'G' to view cargo.")
    console.log("Press 'N' for navigation.")
    console.log("Press 'BACKSPACE' to go back.")

    functions.keyboardInput((str, key) => {
        switch(key.name) {
            case 'c': displayShipCrew(ship); break;
            case 'g': displayShipCargo(ship); break;
            case 'n': displayShipNavigation(ship); break;
            case 'backspace': get(); break;
        }
    });
}


function displayShipNavigation(ship) {
    functions.clearLastLn(5);

    stat = ship.nav.status
    route = ship.nav.route;

    departure = route.departure
    departure = `${departure.symbol} (${departure.type} @ ${departure.x}x, ${departure.y}y)`;

    origin = route.origin
    origin = `${origin.symbol} (${origin.type} @ ${origin.x}x, ${origin.y}y)`

    destination = route.destination
    destination = `${destination.symbol} (${destination.type} @ ${destination.x}x, ${destination.y}y)`

    body = {
        "DEPT": departure,
        "ORGN": origin,
        "DEST": destination,
        "ARTM": functions.formatTime(route.arrival),
        "DPTM": functions.formatTime(route.departureTime),
    }
    functions.outMenu("NAVIGATION", body, false);

    console.log("\n");
    if(stat != "DOCKED") console.log("Press 'D' to dock.");
    if(stat != "IN_ORBIT") console.log("Press 'O' to orbit.");
    console.log("Press 'BACKSPACE' to go back.");

    functions.keyboardInput((str, key) => {
        switch(key.name) {
            case 'd': if(stat != "DOCKED") dockShip(ship); break;
            case 'o': if(stat != "IN_ORBIT") orbitShip(ship); break;
            case 'backspace': displayShipDetails(ship); break;
        }
    });
}


function displayShipCargo(ship) {
    functions.clearLastLn(5);
    functions.outMenu("CARGO", {
        "INVT": ship.cargo.inventory
    }, false);

    functions.back(displayShipDetails, ship);
}


function displayShipCrew(ship) {
    functions.clearLastLn(5);
    functions.outMenu("CREW", ship.crew, false);
    functions.back(displayShipDetails, ship);
}



// Functionality
function dockShip(ship) {
    functions.st_fetch('my/ships/' + ship.symbol + '/dock', (response) => {
        if(response.data) {
            functions.st_fetch('my/ships/' + ship.symbol, (response) => {
                ship = response.data;
                displayShipDetails(ship);
                displayShipNavigation(ship);
            });
        }
    }, "POST");
}

function orbitShip(ship) {
    functions.st_fetch('my/ships/' + ship.symbol + '/orbit', (response) => {
        if(response.data) {
            functions.st_fetch('my/ships/' + ship.symbol, (response) => {
                ship = response.data;
                displayShipDetails(ship);
                displayShipNavigation(ship);
            });
        }
    }, "POST");
}