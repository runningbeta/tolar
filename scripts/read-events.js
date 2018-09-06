const minimist = require('minimist');
const { chalk, logScript } = require('./util/logs');

const SCRIPT_NAME = 'Read Events script';

/**
 * Script that can be used to read all events from a contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-events.js --contract 0xbd2e0bd... --name
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    console.log(`Using contract: ${args.contract}`);

    const Contract = artifacts.require(args.name);
    const contract = await Contract.at(args.contract);

    const events = contract.allEvents({
      fromBlock: 0,
      toBlock: 'latest',
    });

    events.get(function (error, events) {
      if (error) {
        console.error('Read error!');
        console.error(error);
        return;
      }

      console.log(events);
    });

    callback();
  } catch (e) {
    console.error(chalk.red(`${SCRIPT_NAME} error:`));
    callback(e);
  }
};
