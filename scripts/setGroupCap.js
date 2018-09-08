const { utils } = require('web3');
const { chunk } = require('lodash');
const { logger, logTx } = require('./util/logs');
const { filterInvalid } = require('./util/addresses');

const CHUNK_SIZE = 40;

// async filter helper function
async function filter (arr, callback) {
  const fail = Symbol('filter fail');
  return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i => i !== fail);
}

module.exports = async function (contract, addresses, cap) {
  logger.data('\n');
  logger.data(`Using contract: ${contract.address}`);
  logger.data(`Setting cap of ${cap} wei or ${utils.fromWei(cap)} ETH for group:`);
  logger.data(`Group size: ${addresses.length}`);

  const ignoreChecksum = true;
  const validAddresses = filterInvalid(addresses, ignoreChecksum);
  logger.data(`Valid addresses: ${validAddresses.length}`);
  logger.data(`Invalid addresses: ${addresses.length - validAddresses.length}`);

  // fn to filter addreses with cap already set
  const filterWithCap = cap => async address => {
    const userCap = await contract.getUserCap(address);
    const filtered = userCap.toString(10) === cap;
    if (filtered) logger.data(`Filter ${address} cap already ${userCap}`);
    return !filtered;
  };

  logger.data('Reading blockchain state - filtering');
  const toWhitelist = await filter(validAddresses, filterWithCap(cap));
  logger.data(`Filtered total: ${validAddresses.length - toWhitelist.length}`);
  logger.data(`Group to whitelist size: ${toWhitelist.length}`);

  if (toWhitelist.length === 0) {
    logger.info('\n');
    logger.info('No addresses to whitelist!');
    return Promise.resolve();
  }

  logger.data('\n');
  logger.data(`Splitting in chunks of: ${CHUNK_SIZE}`);
  const transactions = chunk(toWhitelist, CHUNK_SIZE)
    .map((c, i) => {
      return contract.setGroupCap(c, cap)
        .then(logTx)
        .then(r => {
          logger.data(`Chunk: #${i}: `);
          logger.data(c);
          return Promise.resolve(r);
        });
    });
  const resp = await Promise.all(transactions);

  logger.info('\n');
  logger.info('Set group cap success!');
  return resp;
};
