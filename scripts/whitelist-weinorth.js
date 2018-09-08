const minimist = require('minimist');
const axios = require('axios');
const { utils } = require('web3');
const { logger, logScript } = require('./util/logs');
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

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    logger.data(`Weinorth environment: ${args.env}`);

    const distributor = await TokenDistributor.at(distAddress);

    const endpoint = `${reports(args.env)}/applicants/whitelist?appId=${args.appId}`;
    logger.data(`Reading whitelist from: ${endpoint}`);
    const response = await axios.get(endpoint);
    if (response.status !== 200) {
      throw new Error('Error while fetching whitelisted accounts.');
    }

    const whitelist = response.data;
    if (distributor) {
      logger.data(`Total accounts... [${whitelist.length}]`);

      const addresses = [];
      for (let j = 0; j < whitelist.length; j++) {
        if (whitelist[j].approved) addresses.push(whitelist[j].account);
      }

      logger.data(`Whitelist accounts... [${addresses.length}]`);
      const cap = utils.toWei('10', 'ether');
      await setGroupCap(distributor, addresses, cap);
    }

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
