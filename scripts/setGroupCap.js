const { utils } = require('web3');
const { chunk } = require('lodash');
const { chalk, logTx } = require('./util/logs');
const { filterInvalid } = require('./util/addresses');

const CHUNK_SIZE = 40;

// async filter helper function
async function filter (arr, callback) {
  const fail = Symbol('filter fail');
  return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i => i !== fail);
}

module.exports = async function (contract, addresses, cap) {
  console.log();
  console.log(`Using contract: ${contract.address}`);
  console.log(`Setting cap of ${cap} wei or ${utils.fromWei(cap)} ETH for group:`);
  console.log(`Group size: ${addresses.length}`);

  const ignoreChecksum = true;
  const validAddresses = filterInvalid(addresses, ignoreChecksum);
  console.log(`Valid addresses: ${validAddresses.length}`);
  console.log(`Invalid addresses: ${addresses.length - validAddresses.length}`);

  // fn to filter addreses with cap already set
  const filterWithCap = cap => async address => {
    const userCap = await contract.getUserCap(address);
    const filtered = userCap.toString(10) === cap;
    if (filtered) console.log(`Filter ${address} cap already ${userCap}`);
    return !filtered;
  };

  console.log('Reading blockchain state - filtering');
  const toWhitelist = await filter(validAddresses, filterWithCap(cap));
  console.log(`Filtered total: ${validAddresses.length - toWhitelist.length}`);
  console.log(`Group to whitelist size: ${toWhitelist.length}`);

  if (toWhitelist.length === 0) {
    console.log();
    console.log(chalk.magenta('No addresses to whitelist!'));
    return Promise.resolve();
  }

  console.log();
  console.log(`Splitting in chunks of: ${CHUNK_SIZE}`);
  const transactions = chunk(toWhitelist, CHUNK_SIZE)
    .map((c, i) => {
      return contract.setGroupCap(c, cap)
        .then(logTx)
        .then(r => {
          console.log(`Chunk: #${i}: `);
          console.log(c);
          return Promise.resolve(r);
        });
    });
  const resp = await Promise.all(transactions);

  console.log();
  console.log(chalk.magenta('Set group cap success!'));
  return resp;
};
