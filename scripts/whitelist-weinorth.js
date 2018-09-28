const minimist = require('minimist');
const axios = require('axios');
const { utils } = require('web3');
const { promisify } = require('util');
const { logger, logScript } = require('./util/logs');
const to = require('./util/to');
const setGroupCap = require('./setGroupCap');

const TokenDistributor = artifacts.require('TokenDistributor');

const cloudfunctions = projectId => `https://us-central1-${projectId}.cloudfunctions.net`;
const reports = env => `${cloudfunctions(env)}/reports`;

const SCRIPT_NAME = '[TokenDistributor] Whitelist Weinorth script';

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/whitelist-weinorth.js --distributor 0xbd2e0bd... --env weinorth-dev --appId m34...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const accounts = await promisify(web3.eth.getAccounts)();
    logger.data(`Using owner: ${accounts[0]}`);

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    logger.data(`Weinorth environment: ${args.env}`);

    const endpoint = `${reports(args.env)}/applicants/whitelist?appId=${args.appId}`;
    logger.data(`Reading whitelist from: ${endpoint}`);
    const response = await axios.get(endpoint);
    if (response.status !== 200) {
      throw new Error('Error while fetching whitelisted accounts.');
    }

    const [ error, distributor ] = await to(TokenDistributor.at(distAddress));
    if (error) throw error;

    const whitelist = response.data;
    logger.data(`Total accounts... [${whitelist.length}]`);

    const addresses = [];
    for (let i = 0; i < whitelist.length; i++) {
      if (whitelist[i].approved) addresses.push(whitelist[i].account);
    }

    logger.data(`Whitelist accounts... [${addresses.length}]`);

    const cap = utils.toWei('1000', 'ether');
    await setGroupCap(distributor, addresses, cap);

    setTimeout(() => callback(), 1000);
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    setTimeout(() => callback(e), 1000);
  }
};
