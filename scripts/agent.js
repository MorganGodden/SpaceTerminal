const functions = require('./api/functions.js');
const ui = require('./api/ui.js');


module.exports = {get};

function get() {
    request = functions.st_fetch('my/agent', (response) => {
        const data = response.data;
        // Output
        ui.outMenu("AGENT", {
            "ACNT": data.symbol + " (" + data.accountId + ")",
            "FACT": data.startingFaction + " (" + data.headquarters + ")",
            "CRDT": functions.formatCredits(data.credits),
            "SHPS": data.shipCount
        }, () => { ui.back(); });
    });
}