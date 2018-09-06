const minimist = require('minimist');
const moment = require('moment');
const { logScript } = require('./util/logs');

const TokenTimelockEscrow = artifacts.require('TokenTimelockEscrow');

/**
 * Script that can be used to read all data and events from TokenTimelockEscrow contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-timelock-escrow.js --contract 0xbd2e0bd... --raw
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript('Read TimelockEscrow script');

    const args = minimist(process.argv.slice(2), { string: 'contract', boolean: 'raw' });
    console.log(`Using contract: ${args.contract}`);

    const contract = await TokenTimelockEscrow.at(args.contract);

    const token = await contract.token();
    console.log(`Token: ${token}`);
    const releaseTime = await contract.releaseTime();
    console.log(`Release time: ${releaseTime} or ${moment.unix(releaseTime)}`);

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

      if (args.raw) console.log(events);

      for (let i = 0; i < events.length; i++) {
        const eventObj = events[i];
        console.log();
        console.log(eventObj.event);
        console.log('  - Payee: ' + eventObj.args.payee.toString(10));
        console.log('  - Amount: ' + eventObj.args.amount);
      }
    });

    callback();
  } catch (e) {
    console.error('Read error!');
    callback(e);
  }
};
