const functions = require('./api/functions.js');
const ui = require('./api/ui.js');
const chalk = require('chalk');


module.exports = {get};


function get() {
    functions.st_fetch('my/ships', (response) => displayShips(response.data))
}


function displayShips(data) {
    i = 1
    body = {}
    data.map(ship => {
        body[i] = ship.symbol;
        i++;
    });

    ui.outMenu("SHIPS", body);

    console.log("\nPress a number to view ship details. Or 'BACKSPACE' to go back.");
    ui.keyboardInput((str, key) => {
        if(key.name <= i && key.name >= 1) {
            displayShipDetails(data[str - 1]);
        }

        else if(key.name == 'backspace') {
            ui.mainMenu();
        }
    });
}


function displayShipDetails(ship) {
    ui.outHeader();

    registration = ship.registration;
    stat = ship.nav.status
    stat = (stat == "DOCKED") ? chalk.green(stat) : chalk.yellow(stat);
    
    ui.outMenu("SHIP DETAILS", {
        "NAME": registration.name + " (" + registration.factionSymbol + ")",
        "TYPE": registration.role,
        "LOCA": ship.nav.waypointSymbol + " (" + stat + ", " + ship.nav.flightMode + ")",
        "FUEL": ship.fuel.current + "/" + ship.fuel.capacity,
        "CREW": ship.crew.current + "/" + ship.crew.capacity,
        "CRGO": ship.cargo.units + "/" + ship.cargo.capacity,
    }, () => {
        console.log("\nPress 'C' for crew.");
        console.log("Press 'G' for cargo.");
        console.log("Press 'N' for navigation.");
        console.log("Press 'M' for waypoint market.");
        console.log("Press 'BACKSPACE' to go back.");
    
        ui.keyboardInput((str, key) => {
            switch(key.name) {
                case 'c': displayShipCrew(ship); break;
                case 'g': displayShipCargo(ship); break;
                case 'n': displayShipNavigation(ship); break;
                case 'm': displayWaypointMarket(ship); break;
                case 'backspace': get(); break;
            }
        });
    });
}


function displaySystem(ship) {
    ui.clearLastLn(6);
    functions.st_fetch('/systems/' + ship.nav.systemSymbol, (response) => {
        system = response.data

        body = {
            "LOC": system.symbol + " (" + system.type + " @ " + system.x + "x, " + system.y + "y)",
            "WAYPOINTS": Object.keys(system.waypoints).length 
        };

        
        ui.outMenu("SYSTEM", body, null, false);

        console.log("\nPress 'W' to view waypoints.");
        console.log("Press 'BACKSPACE' to go back.");

        ui.keyboardInput((str, key) => {
            switch(key.name) {
                case 'w': displayWaypoints(ship, system); break;
                case 'backspace': displayShipDetails(ship); break;
            }
        });
    });
}


function displayWaypoints(ship, system) {
    ui.clearLastLn(5);
    waypoints = system.waypoints;

    body = {};
    i = 1;
    waypoints.map(waypoint => {
        body[waypoint.symbol] = waypoint.type + " (" + waypoint.x + "x, " + waypoint.y + "y)";
        i++;
    });

    ui.outMenu("WAYPOINTS", body, null, false);

    console.log("\nPress a number to view waypoint details.");
    console.log("Press 'BACKSPACE' to go back.");

    ui.keyboardInput((str, key) => {
        if(key.name <= i && key.name >= 1) {
            //displayWaypointDetails(waypoints[str - 1]);
        }
        else if(key.name == 'backspace') {
            displayShipDetails(ship);
            displaySystem(ship);
        }
    });
}


function displayWaypointMarket(ship) {
    ui.clearLastLn(6);
    functions.st_fetch('/systems/' + ship.nav.systemSymbol + '/waypoints/' + ship.nav.waypointSymbol + '/market', (response) => {
        market = {};
        if(response.error) { market = response.error }
        else {
            response = response.data;

            i = 1;
            imp = ""; exp = ""; trans = ""; trade = "";
            response.imports.map((good) => { imp += good.name + "; " + ((i % 3 == 0) ? "\n" : ""); i++; });
            response.exports.map((good, i) => exp += good.name + " (" + good.description + ")\n");
            response.transactions.map((good, i) => trans += good.units + " " + good.tradeSymbol + " by " + good.shipSymbol + "\n");
            response.tradeGoods.map((good, i) => trade += good.symbol + " (" + good.tradeVolume + " units, " + functions.formatCredits(good.purchasePrice) + " each)\n");

            imp = (imp == "") ? "N/A" : imp.slice(0, -3);
            exp = (exp == "") ? "N/A" : exp.slice(0, -1);
            trans = (trans == "") ? "N/A" : trans.slice(0, -1);
            trade = (trade == "") ? "N/A" : trade.slice(0, -1);

            market = {
                "SYMBOL": response.symbol,
                "IMPORT": imp,
                "EXPORT": exp,
                "TRANSA": trans,
                "TRDGDS": trade
            };
        }

        ui.outMenu("MARKET", market, null, false);
        console.log("\nPress 'BACKSPACE' to go back.");
        ui.keyboardInput((str, key) => {
            if(key.name == 'backspace') {
                displayShipDetails(ship);
            }
        });
    });
}


function displayShipNavigation(ship) {
    ui.clearLastLn(6);

    stat = ship.nav.status
    route = ship.nav.route;

    var departure = "N/A";
    if(route.departure) {
        departure = route.departure
        departure = `${departure.symbol} (${departure.type} @ ${departure.x}x, ${departure.y}y)`;
    }

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
    ui.outMenu("NAVIGATION", body, null, false);

    console.log("");
    console.log("Press 'R' to route ship.");
    console.log("Press 'F' to change flight mode.");
    console.log("Press 'S' to view system.");
    if(stat != "DOCKED") console.log("Press 'D' to dock.");
    if(stat != "IN_ORBIT") console.log("Press 'O' to orbit.");
    console.log("Press 'BACKSPACE' to go back.");

    ui.keyboardInput((str, key) => {
        switch(key.name) {
            case 'r': displayShipRouting(ship); break;
            case 'f': displayChangeFlightMode(ship); break;
            case 's': displaySystem(ship); break;
            case 'd': if(stat != "DOCKED") dockShip(ship); break;
            case 'o': if(stat != "IN_ORBIT") orbitShip(ship); break;
            case 'backspace': displayShipDetails(ship); break;
        }
    });
}

function displayChangeFlightMode(ship) {
    ui.clearLastLn(6);
    ui.outSelector("FLIGHT MODE", { "CURRENT": ship.nav.flightMode }, ["CRUISE", "BURN", "DRIFT", "STEALTH"], false).then((mode) => {
        // PATCH /my/ships/{symbol}/nav
        functions.st_fetch('my/ships/' + ship.symbol + '/nav', (response) => {
            if(response.error) { console.log(response.error); }
            else {
                ship.nav = response.data;
                displayShipDetails(ship);
                displayShipNavigation(ship);
            }
        }, "PATCH", { "flightMode": mode });
    });
}

function displayShipRouting(ship) {
    ui.clearLastLn(6);
    functions.st_fetch('my/ships/' + ship.symbol + '/route', (response) => {
        
    });
}


function displayShipCargo(ship) {
    ui.clearLastLn(6);
    ui.outMenu("CARGO", {
        "INVT": ship.cargo.inventory
    }, false);

    ui.back(displayShipDetails, ship);
}


function displayShipCrew(ship) {
    ui.clearLastLn(6);
    ui.outMenu("CREW", ship.crew, false);
    ui.back(displayShipDetails, ship);
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