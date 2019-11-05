const axios = require('axios');
const MongoClient = require('mongodb').MongoClient;
const CronJob = require('cron').CronJob;

const dbName = 'okex';
const url = process.env.MONGOURL || '';

async function getUser(minute) {
  try {
    const ts = new Date().getTime();
    const response = await axios.get(`https://www.okex.com/v2/spot/instruments/BTC-USDT/candles?granularity=${minute * 60}&size=1000`);
    const data = response.data.data.map(d => {
      return {
        _id: d[0],
        ts: d[0],
        open: +d[1],
        high: +d[2],
        low: +d[3],
        close: +d[4],
        volume: +d[5]
      }
    });

    await updateToMongo(data, minute);
  } catch (error) {
    console.error(error);
  } finally {
    console.log('get okex api data done.');
  }
}

async function updateToMongo(data, minute) {
  const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .catch(err => { console.log(err); });

  if (!client) return;

  try {
    const db = client.db(dbName);
    const collection = db.collection(`btc_future_${minute}`);
    for (let i = 0; i < data.length; i++) {
      if (i % 100 === 0) console.log(`${minute}minutes: processing ${i} records..`);

      const d = data[i];
      await collection.updateOne({ _id: d._id }, { $set: d }, { upsert: true });
    }
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
};

console.log('app working..', process.env.MONGOURL);
// 1 1 1,13 * * *
new CronJob('1 1 1,13 * * *', async () => {
  console.log('\n\nrunning on', new Date());
  await getUser(1); // 1min
  await getUser(3); // 3min
  await getUser(5); // 5min
  await getUser(15); // 15min
  await getUser(60); // 1hour
  await getUser(60 * 2); // 2hour
  await getUser(60 * 4); // 4hour
  console.log('completed on', new Date());
}, null, true, 'America/Los_Angeles');

// getUser(3);
