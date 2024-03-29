const chalk = require('chalk');

const functions = require('./api/functions.js');
const ui = require('./api/ui.js');


module.exports = {get};

function get() {
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

            ui.outMenu(name + " (" + faction.symbol + ")", {
                "HQ": faction.headquarters,
                "TRTS": traits.join(", "),
                "DESC": desc
            }, null, false);
        });

        ui.back();
    })
}