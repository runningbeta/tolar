const minimist = require('minimist');
const moment = require('moment');
const { logScript } = require('./util/logs');

const TokenDistributor = artifacts.require('TokenDistributor');

/**
 * Script that can be used to read public params from TokenDistributor contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-distributor.js --contract 0xbd2e0bd...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript('Read TokeDistributor script');

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    const address = args.contract;
    console.log(`Using contract: ${address}`);

    const contract = await TokenDistributor.at(address);

    const owner = await contract.owner();
    console.log(`Contract owner: ${owner}`);

    const isFinalized = await contract.isFinalized();
    console.log(`Contract finalized: ${isFinalized}`);

    const benefactor = await contract.benefactor();
    console.log(`Crowdsale factory - benefactor: ${benefactor}`);

    const rate = await contract.rate();
    console.log(`Crowdsale factory - rate: ${rate}`);

    const wallet = await contract.wallet();
    console.log(`Crowdsale factory - wallet: ${wallet}`);

    const token = await contract.token();
    console.log(`Crowdsale factory - token: ${token}`);

    const cap = await contract.cap();
    console.log(`Crowdsale factory - cap: ${cap}`);

    const openingTime = await contract.openingTime();
    console.log(`Crowdsale factory - openingTime: ${openingTime} or ${moment.unix(openingTime)}`);

    const closingTime = await contract.closingTime();
    console.log(`Crowdsale factory - closingTime: ${closingTime} or ${moment.unix(closingTime)}`);

    const withdrawTime = await contract.withdrawTime();
    console.log(`Crowdsale factory - withdrawTime: ${withdrawTime} or ${moment.unix(withdrawTime)}`);

    const weiRaised = await contract.weiRaised();
    console.log(`Crowdsale factory - weiRaised: ${weiRaised}`);

    const crowdsale = await contract.crowdsale();
    console.log(`Crowdsale contract: ${crowdsale}`);

    const presaleEscrow = await contract.presaleEscrow();
    console.log(`Presale Escrow contract: ${presaleEscrow}`);

    const bonusEscrow = await contract.bonusEscrow();
    console.log(`Bonus Escrow contract: ${bonusEscrow}`);

    const timelockFactory = await contract.timelockFactory();
    console.log(`Timelock Factory contract: ${timelockFactory}`);

    const vestingFactory = await contract.vestingFactory();
    console.log(`Vesting Factory contract: ${vestingFactory}`);

    callback();
  } catch (e) {
    console.error('Read error!');
    callback(e);
  }
};
