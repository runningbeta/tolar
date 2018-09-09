// fn that will retry async job N times before failure
module.exports = async function (job, retries) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await job;
      return result;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
};
