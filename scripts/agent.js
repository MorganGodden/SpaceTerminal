const functions = require('./functions.js');


module.exports = {get};

function get() {
    functions.outHeader();
    functions.st_fetch('my/agent', (response) => {
        data = response.data;
        // Output
        functions.outMenu("AGENT", {
            "ACNT": data.symbol + " (" + data.accountId + ")",
            "FACT": data.startingFaction + " (" + data.headquarters + ")",
            "CRDT": functions.formatCredits(data.credits),
            "SHPS": data.shipCount
        });

        functions.back();
    });
}