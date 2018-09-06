const minimist = require('minimist');
const moment = require('moment');
const { logScript } = require('./util/logs');

const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');
const TokenTimelock = artifacts.require('TokenTimelock');
const Token = artifacts.require('ERC20');

/**
 * Script that can be used to read public params from TokenDistributor contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-timelock-factory.js --contract 0xbd2e0bd... --creator 0x5aeda56...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript('Read Timelock Factory script');

    const args = minimist(process.argv.slice(2), { string: ['contract', 'creator'] });
    console.log(`Using contract: ${args.contract}`);

    const contract = await TokenTimelockFactory.at(args.contract);

    const instantiationCount = await contract.getInstantiationCount(args.creator);
    console.log(`Creator total instantiation count: ${instantiationCount}`);

    for (let i = 0; i < instantiationCount; i++) {
      const instanceAddr = await contract.instantiations(args.creator, i);
      const timelock = await TokenTimelock.at(instanceAddr);
      console.log();
      console.log(`Timelock: ${instanceAddr}`);

      const token = await timelock.token();
      console.log(`  - Token: ${token}`);
      const balance = await Token.at(token).balanceOf(instanceAddr);
      console.log(`  - Balance: ${balance}`);
      const beneficiary = await timelock.beneficiary();
      console.log(`  - Beneficiary: ${beneficiary}`);
      const releaseTime = await timelock.releaseTime();
      console.log(`  - Release time: ${releaseTime} or ${moment.unix(releaseTime)}`);
    }

    callback();
  } catch (e) {
    console.error('Read error!');
    callback(e);
  }
};
