const { utils } = require('web3');
const { chunk, uniq } = require('lodash');
const { logger, logTx } = require('./util/logs');
const { filterInvalid } = require('./util/addresses');
const asyncRetry = require('./util/asyncRetry');

const ProgressBar = require('progress');

const CHUNK_SIZE = 40;
const NUM_RETRIES = 5;

async function filterWhitelisted (contract, addresses, cap) {
  const bar = new ProgressBar('Filtering [:bar] :percent :etas', { total: addresses.length, width: 50 });

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // slice addresses into jobs
  const jobs = chunk(addresses, CHUNK_SIZE)
    .map(ch => () => Promise.all(ch.map(async a => {
      // retry few times if node is unresponsive
      const userCap = await asyncRetry(contract.getUserCap(a), NUM_RETRIES);
      bar.tick();
      return { address: a, cap: userCap };
    })));

  // execute job at a time so the node connection is not overwhelmed
  const results = [];
  for (let i = 0; i < jobs.length; i++) {
    await sleep(1000);
    const res = await asyncRetry(jobs[i](), NUM_RETRIES);
    results.push(...res);
  }

  return results.filter(r => r.cap.toString(10) !== cap).map(r => r.address);
}

module.exports = async function (contract, addresses, cap) {
  logger.data('\n');
  logger.data(`Using contract: ${contract.address}`);
  logger.data(`Setting cap of ${cap} wei or ${utils.fromWei(cap)} ETH for group:`);
  logger.data(`Group size: ${addresses.length}`);

  const ignoreChecksum = true;
  const validAddresses = uniq(filterInvalid(addresses, ignoreChecksum));
  logger.data(`Valid addresses: ${validAddresses.length}`);
  logger.data(`Invalid addresses: ${addresses.length - validAddresses.length}`);

  const toWhitelist = await filterWhitelisted(contract, validAddresses, cap);
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
    .map((c, i) => () => {
      return contract.setGroupCap(c, cap)
        .then(logTx)
        .then(r => {
          logger.data(`Chunk: #${i}/${transactions.length - 1}: `);
          logger.data(c);
          return Promise.resolve(r);
        });
    });

  for (let i = 0; i < transactions.length; i++) {
    // retry few times if node is unresponsive
    await asyncRetry(transactions[i](), NUM_RETRIES);
  }

  logger.info('\n');
  logger.info('Set group cap success!');
};
