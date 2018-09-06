const moment = require('moment');
const { utils } = require('web3');

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

const openingTime = moment('2018-09-15T14:00:00+00:00').unix();
const closingTime = moment('2018-09-20T14:00:00+00:00').unix();
const withdrawTime = moment('2018-09-27T14:00:00+00:00').unix();

module.exports = {
  token: 'TolarToken',
  rate: 6894,
  cap: utils.toWei('45000', 'ether'),

  openingTime,
  closingTime,

  withdrawTime,
  bonusTime: closingTime + duration.weeks(12),

  escrow: [
    // founders 20%
    // 10% available after 2yr
    // 10% available after 2yr
    {
      id: 'founder_1',
      address: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
      amount: 0.1,
      duration: closingTime + duration.years(2),
    },
    {
      id: 'founder_2',
      address: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
      amount: 0.1,
      duration: closingTime + duration.years(2),
    },
    // development fund 32%
    //  5% available after 1yr
    //  5% available after 2yr
    // 22% available after 3yr
    {
      id: 'devFund',
      address: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
      amount: 0.05,
      duration: closingTime + duration.years(1),
    },
    {
      id: 'devFund',
      address: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
      amount: 0.05,
      duration: closingTime + duration.years(2),
    },
    {
      id: 'devFund',
      address: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
      amount: 0.22,
      duration: closingTime + duration.years(3),
    },
    // node start fund 8%
    {
      id: 'nodes',
      address: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
      amount: 0.08,
      duration: closingTime + duration.days(90),
    },
    // developers fund 2.5%
    {
      id: 'developers',
      address: '0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e',
      amount: 0.025,
      duration: closingTime + duration.years(2),
    },
    // developers fund 2.5%
    {
      id: 'advisors',
      address: '0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5',
      amount: 0.025,
      duration: withdrawTime,
    },
    // beta
    {
      id: 'runningbeta',
      address: '0x0F4F2Ac550A1b4e2280d04c21cEa7EBD822934b5',
      amount: 0.00189585,
      duration: closingTime + duration.days(180),
    },
  ],
};
