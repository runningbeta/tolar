const minimist = require('minimist');
const moment = require('moment');
const { logger, logScript } = require('./util/logs');
const to = require('./util/to');

const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');
const TokenTimelock = artifacts.require('TokenTimelock');
const Token = artifacts.require('ERC20');

const SCRIPT_NAME = '[TimelockFactory] Read script';

/**
 * Script that can be used to read public params from TokenDistributor contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-timelock-factory.js --contract 0xbd2e0bd... --creator 0x5aeda56...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const args = minimist(process.argv.slice(2), { string: ['contract', 'creator'] });
    logger.data(`Using contract: ${args.contract}`);

    const [ error, contract ] = await to(TokenTimelockFactory.at(args.contract));
    if (error) throw error;

    const instantiationCount = await contract.getInstantiationCount(args.creator);
    logger.data(`Creator total instantiation count: ${instantiationCount}`);

    for (let i = 0; i < instantiationCount; i++) {
      const instanceAddr = await contract.instantiations(args.creator, i);
      const timelock = await TokenTimelock.at(instanceAddr);
      logger.data('\n');
      logger.data(`Timelock: ${instanceAddr}`);

      const token = await timelock.token();
      logger.data(`  - Token: ${token}`);
      const balance = await Token.at(token).balanceOf(instanceAddr);
      logger.data(`  - Balance: ${balance}`);
      const beneficiary = await timelock.beneficiary();
      logger.data(`  - Beneficiary: ${beneficiary}`);
      const releaseTime = await timelock.releaseTime();
      logger.data(`  - Release time: ${releaseTime} or ${moment.unix(releaseTime)}`);
    }

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
