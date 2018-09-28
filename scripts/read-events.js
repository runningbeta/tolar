const minimist = require('minimist');
const { logger, logScript } = require('./util/logs');
const to = require('./util/to');

const SCRIPT_NAME = 'Read Events script';

/**
 * Script that can be used to read all events from a contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-events.js --contract 0xbd2e0bd... --name ContractName --fromBlock 6326186
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    logger.data(`Using contract: ${args.contract}`);

    const Contract = artifacts.require(args.name);
    const [ error, contract ] = await to(Contract.at(args.contract));
    if (error) throw error;

    const events = contract.allEvents({
      fromBlock: args.fromBlock || 0,
      toBlock: 'latest',
    });

    events.get(function (error, events) {
      if (error) {
        logger.error('Read error!');
        setTimeout(() => callback(error), 1000);
        return;
      }

      logger.data(events);
      setTimeout(() => callback(), 1000);
    });
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    setTimeout(() => callback(e), 1000);
  }
};
