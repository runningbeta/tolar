# Tolar HashNET ERC20 Token ([tolar.io](https://tolar.io)) 🔗

Smart contracts for Tolar ERC20 token and crowdsale

[![CircleCI](https://circleci.com/gh/runningbeta/tolar/tree/master.svg?style=svg)](https://circleci.com/gh/runningbeta/tolar/tree/master)
[![codecov](https://codecov.io/gh/runningbeta/tolar/branch/master/graph/badge.svg)](https://codecov.io/gh/runningbeta/tolar)


## Requirements

LTS Node 8.9.4 is required for running tests.

You will alse need [Truffle framework](http://truffleframework.com):
```bash
# Make sure we have the latest truffle version
npm uninstall -g truffle
npm install -g truffle@latest
```

## Getting started

To test this project locally:

```bash
# clone the repo
git clone https://github.com/runningbeta/tolar.git
cd tolar

# install dependencies
npm install

# run tests on development network
truffle test

# run tests on truffle test network
truffle test --network test
# or
npm run test
```

To check the coverage report:

```bash
# run tests with coverage
npm run coverage
```

To run JavaScript and Solidity linter:

```bash
# run eslint and solium
npm run lint:all
```

## Project objectives

Tu support Tolar (TOL) launch as ERC20 token on Ethereum mainnet and later migration to the HashNET blockchain.

### Token metrics

- NAME: Tolar Token
- SYMBOL: TOL
- DECIMALS: 18
- INITIAL_SUPPLY: 1 000 000 000 TOL

### Crowdsale metrics

- Opened: 15.09.2018 14:00 GMT - 20.09.2018 14:00 GMT
- Max cap (presale + crowdsale): 45k ETH
- Goal: no goal (20k+ ETH raised in presale)
- Rate (at public crowdsale): 6894
  - Price of 0,000145054 ETH per 1 TOL

Only whitelisted accounts can participate with an individual cap of 10 ETH.

### Token distribution
- 35% reserved for presale and public crowdsale
  - For presale tokens, there can be bonus tokens awarded which are locked for a configured period (3 months)
  - The amount raised in presale determines the Crowdsale cap
  - Distribution owner claims all unsold tokens at crowdsale end
    - and burns them afterward
- 20% founder tokens, locked for 24 months
- 32% Tolar dev fund, locked for 36 months
  - 5% locked for 12 months
  - 5% locked for 24 months
  - 22% locked for 36 months
- 8% PoS Network Start Nodes, locked for 6 months
  - When HashNET main network is ready to deploy:
    - these tokens are withdrawn;
    - burned by the TolarToken owner;
    - minted and reserved on Tolar HashNET for PoS Network Start Nodes
- 2.5% Developers fund, locked for 24 months
- 2.5% Advisory fund, locked for 24 months

All tokens can be withdrawn (or will be airdropped by the team) at least at some later date (after the Crowdsale ends) that is configured at deploy.

### Token HashNET migration

TolarToken is burnable only after owner finalizes the contract. This will be announced and detailed by the Tolar team after the migration path is ready.

Before that, only the owner can burn TOL tokens. This will be used to burn the Crowdsale unsold tokens (if any), and to migrate to PoS Network Start Nodes when the main network is ready to deploy.

## License

This project is open source and distributed under the [Apache License Version 2.0](./LICENSE) license.
