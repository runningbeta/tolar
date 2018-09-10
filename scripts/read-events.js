const minimist = require('minimist');
const { logger, logScript } = require('./util/logs');
const to = require('./util/to');

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
    logger.data(`Using contract: ${args.contract}`);

    const Contract = artifacts.require(args.name);
    const [ error, contract ] = await to(Contract.at(args.contract));
    if (error) throw error;

    const events = contract.allEvents({
      fromBlock: 0,
      toBlock: 'latest',
    });

    events.get(function (error, events) {
      if (error) {
        logger.error('Read error!');
        logger.error(error);
        return;
      }

      logger.data(events);
    });

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
