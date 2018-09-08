const chalk = require('chalk');
const figlet = require('figlet');

const logScript = title => {
  const art = figlet.textSync('RunningBeta');
  console.log();
  console.log(art);
  console.log(chalk.green(title));
  console.log(chalk.green('-'.repeat(title.length)));
};

const logContract = r => {
  console.log();
  console.log(chalk.blue(`Transaction: ${r.transactionHash}`));
  console.log(`Contract created: ${r.address}`);
  console.log(`Contract name: ${r.constructor.contractName}`);
  console.log(chalk.blue('-'.repeat(79)));
  return Promise.resolve(r);
};

const logTx = r => {
  console.log();
  console.log(chalk.blue(`Transaction: ${r.tx}`));
  console.log(`Transaction index: ${r.receipt.transactionIndex}`);
  console.log(`Block hash: ${r.receipt.blockHash}`);
  console.log(`Block number: ${r.receipt.blockNumber}`);
  console.log(`Gas used: ${r.receipt.gasUsed}`);
  console.log(chalk.blue('-'.repeat(79)));
  return Promise.resolve(r);
};

module.exports = {
  chalk,
  logScript,
  logContract,
  logTx,
};
