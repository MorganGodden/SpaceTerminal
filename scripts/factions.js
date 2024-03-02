const functions = require('../functions.js');
const chalk = require('chalk');


module.exports = {get};

function get() {
    functions.outHeader();
    functions.st_fetch('factions', (response) => {
        // Output faction names
        response.data.map(faction => {
            var name = faction.name;
            name = (faction.isRecruiting) ? chalk.green(name) : chalk.red(name);

            var desc = faction.description;

            
            var traits = []
            faction.traits.map(trait => {
                traits.push(trait.name);
            });

            console.log("\n");
            functions.outMenu(name + " (" + faction.symbol + ")", {
                "HQ": faction.headquarters,
                "TRTS": traits.join(", "),
                "DESC": desc
            }, false);
        });

        functions.back();
    })
}