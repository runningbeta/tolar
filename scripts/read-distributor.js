const minimist = require('minimist');
const moment = require('moment');
const { logger, logScript } = require('./util/logs');

const TokenDistributor = artifacts.require('TokenDistributor');

const SCRIPT_NAME = '[TokenDistributor] Read script';

/**
 * Script that can be used to read public params from TokenDistributor contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-distributor.js --contract 0xbd2e0bd...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    const address = args.contract;
    logger.data(`Using contract: ${address}`);

    const contract = await TokenDistributor.at(address);

    const owner = await contract.owner();
    logger.data(`Contract owner: ${owner}`);

    const isFinalized = await contract.isFinalized();
    logger.data(`Contract finalized: ${isFinalized}`);

    const benefactor = await contract.benefactor();
    logger.data(`Crowdsale factory - benefactor: ${benefactor}`);

    const rate = await contract.rate();
    logger.data(`Crowdsale factory - rate: ${rate}`);

    const wallet = await contract.wallet();
    logger.data(`Crowdsale factory - wallet: ${wallet}`);

    const token = await contract.token();
    logger.data(`Crowdsale factory - token: ${token}`);

    const cap = await contract.cap();
    logger.data(`Crowdsale factory - cap: ${cap}`);

    const openingTime = await contract.openingTime();
    logger.data(`Crowdsale factory - openingTime: ${openingTime} or ${moment.unix(openingTime)}`);

    const closingTime = await contract.closingTime();
    logger.data(`Crowdsale factory - closingTime: ${closingTime} or ${moment.unix(closingTime)}`);

    const withdrawTime = await contract.withdrawTime();
    logger.data(`Crowdsale factory - withdrawTime: ${withdrawTime} or ${moment.unix(withdrawTime)}`);

    const weiRaised = await contract.weiRaised();
    logger.data(`Crowdsale factory - weiRaised: ${weiRaised}`);

    const crowdsale = await contract.crowdsale();
    logger.data(`Crowdsale contract: ${crowdsale}`);

    const presaleEscrow = await contract.presaleEscrow();
    logger.data(`Presale Escrow contract: ${presaleEscrow}`);

    const bonusEscrow = await contract.bonusEscrow();
    logger.data(`Bonus Escrow contract: ${bonusEscrow}`);

    const timelockFactory = await contract.timelockFactory();
    logger.data(`Timelock Factory contract: ${timelockFactory}`);

    const vestingFactory = await contract.vestingFactory();
    logger.data(`Vesting Factory contract: ${vestingFactory}`);

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
