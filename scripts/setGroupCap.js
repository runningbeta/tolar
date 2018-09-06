const { utils } = require('web3');
const { chunk } = require('lodash');
const { chalk, logTx } = require('./util/logs');

const CHUNK_SIZE = 40;

module.exports = async function (contract, addresses, cap) {
  console.log();
  console.log(`Using contract: ${contract.address}`);
  console.log(`Setting cap of ${cap} wei or ${utils.fromWei(cap)} ETH for group:`);
  console.log(`Group size: ${addresses.length}`);
  console.log(`Splitting in chunks of: ${CHUNK_SIZE}`);

  const transactions = chunk(addresses, CHUNK_SIZE)
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
