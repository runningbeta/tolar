const minimist = require('minimist');
const moment = require('moment');
const { logger, logScript } = require('./util/logs');
const to = require('./util/to');

const TokenTimelockEscrow = artifacts.require('TokenTimelockEscrow');

const SCRIPT_NAME = '[TimelockEscrow] Read script';

/**
 * Script that can be used to read all data and events from TokenTimelockEscrow contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-timelock-escrow.js --contract 0xbd2e0bd... --raw
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const args = minimist(process.argv.slice(2), { string: 'contract', boolean: 'raw' });
    logger.data(`Using contract: ${args.contract}`);

    const [ error, contract ] = await to(TokenTimelockEscrow.at(args.contract));
    if (error) throw error;

    const token = await contract.token();
    logger.data(`Token: ${token}`);
    const releaseTime = await contract.releaseTime();
    logger.data(`Release time: ${releaseTime} or ${moment.unix(releaseTime)}`);

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

      if (args.raw) logger.data(events);

      for (let i = 0; i < events.length; i++) {
        const eventObj = events[i];
        logger.data('\n');
        logger.data(eventObj.event);
        logger.data('  - Payee: ' + eventObj.args.payee.toString(10));
        logger.data('  - Amount: ' + eventObj.args.amount);
      }
    });

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
