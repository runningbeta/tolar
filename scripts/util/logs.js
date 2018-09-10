const minimist = require('minimist');
const figlet = require('figlet');
const winston = require('winston');

const config = {
  levels: {
    error: 0,
    tx: 1,
    warn: 2,
    data: 3,
    info: 4,
  },
  colors: {
    error: 'red',
    tx: 'blue',
    warn: 'yellow',
    data: 'grey',
    info: 'green',
  },
};

winston.addColors(config.colors);

const args = minimist(process.argv.slice(2));

const logger = winston.createLogger({
  levels: config.levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ message: true }),
        winston.format.printf(info => `${info.message}`),
      ),
    }),
    new winston.transports.File({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
      filename: `output.${args.network}.log`,
    }),
  ],
  level: 'info',
});

const logScript = title => {
  const art = figlet.textSync('RunningBeta');
  logger.data('\n' + art);
  logger.info(title);
  logger.info('-'.repeat(title.length));
  logger.data(JSON.stringify(process.argv, null, 2));
  logger.data(`Writing logs to output.${args.network}.log`);
};

const logContract = r => {
  logger.tx(`Transaction: ${r.transactionHash}`);
  logger.data(`Contract created: ${r.address}`);
  logger.data(`Contract name: ${r.constructor.contractName}`);
  logger.tx('-'.repeat(79));
  return Promise.resolve(r);
};

const logTx = r => {
  logger.tx(`Transaction: ${r.tx}`);
  logger.data(`Transaction index: ${r.receipt.transactionIndex}`);
  logger.data(`Block hash: ${r.receipt.blockHash}`);
  logger.data(`Block number: ${r.receipt.blockNumber}`);
  logger.data(`Gas used: ${r.receipt.gasUsed}`);
  logger.tx('-'.repeat(79));
  return Promise.resolve(r);
};

module.exports = {
  logger,
  logScript,
  logContract,
  logTx,
};
