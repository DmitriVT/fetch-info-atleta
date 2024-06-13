import { ApiPromise, WsProvider } from '@polkadot/api';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = 'wss://testnet-rpc.atleta.network:9944';

const influxUrl = `http://${process.env.DOCKER_INFLUXDB_INIT_HOST}:${process.env.DOCKER_INFLUXDB_INIT_PORT}`;
const influxToken = process.env.DOCKER_INFLUXDB_INIT_ADMIN_TOKEN;
const influxOrg = process.env.DOCKER_INFLUXDB_INIT_ORG;
const influxBucket = process.env.DOCKER_INFLUXDB_INIT_BUCKET;

async function connect() {
  const wsProvider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider: wsProvider });
  return api;
}

async function getWalletCount(api) {
  const accountKeys = await api.query.system.account.keys();
  return accountKeys.length;
}

async function getTotalSupplyOnHands(api) {
  const accountInfos = await api.query.system.account.entries();
  let totalSupply = BigInt(0);

  accountInfos.forEach(([, accountInfo]) => {
    const free = BigInt(accountInfo.data.free.toString());
    const reserved = BigInt(accountInfo.data.reserved.toString());
    totalSupply += free + reserved;
  });

  return totalSupply;
}

async function getTotalStaked(api) {
  const stakingInfo = await api.query.staking.ledger.entries();
  let totalStaked = BigInt(0);

  stakingInfo.forEach(([, stakingLedger]) => {
    if (stakingLedger.isSome) {
      const total = stakingLedger.unwrap().total.toBigInt();
      totalStaked += total;
    }
  });

  return totalStaked;
}

async function getProposalCount(api) {
  const proposals = await api.derive.democracy.proposals();
  return proposals.length;
}

async function getGovernanceWalletCount(api) {
  const governanceAccounts = new Set();
  const proposals = await api.derive.democracy.proposals();
  proposals.forEach(({ proposer }) => governanceAccounts.add(proposer.toString()));
  const referenda = await api.derive.democracy.referendums();
  referenda.forEach(({ votes }) => {
    votes.forEach(({ accountId }) => governanceAccounts.add(accountId.toString()));
  });
  return governanceAccounts.size;
}

function formatBigIntToFloat(bigint, decimals = 2) {
  const str = bigint.toString();
  const len = str.length;
  const integerPart = str.slice(0, len - 18) || '0'; // Assuming the original number is in ATLA units
  const fractionalPart = str.slice(len - 18, len - 18 + decimals).padEnd(decimals, '0');
  return parseFloat(`${integerPart}.${fractionalPart}`);
}

async function fetchDataAndWrite(api, writeApi) {
  try {
    const walletCount = await getWalletCount(api);
    const totalSupplyOnHands = await getTotalSupplyOnHands(api);
    const totalStaked = await getTotalStaked(api);
    const proposalCount = await getProposalCount(api);
    const governanceWalletCount = await getGovernanceWalletCount(api);

    const points = [
      new Point('walletCount').intField('value', walletCount),
      new Point('totalSupplyOnHands').floatField('value', formatBigIntToFloat(totalSupplyOnHands)),
      new Point('totalStaked').floatField('value', formatBigIntToFloat(totalStaked)),
      new Point('proposalCount').intField('value', proposalCount),
      new Point('governanceWalletCount').intField('value', governanceWalletCount),
    ];

    writeApi.writePoints(points);
    await writeApi.flush();

    console.log('Data successfully written to InfluxDB');
  } catch (error) {
    console.error('Error fetching data or writing to InfluxDB:', error);
  }
}

async function main() {
  let api;
  let client;
  let writeApi;

  while (true) {
    try {
      console.log("Connecting to Polkadot.js API...");
      api = await connect();
      console.log("Connected to Polkadot.js API");

      console.log("Connecting to InfluxDB...");
      client = new InfluxDB({ url: influxUrl, token: influxToken });
      writeApi = client.getWriteApi(influxOrg, influxBucket);
      writeApi.useDefaultTags({ host: process.env.DOCKER_INFLUXDB_INIT_HOST });
      console.log("Connected to InfluxDB");

      setInterval(() => fetchDataAndWrite(api, writeApi), 600000);
      break;
    } catch (error) {
      console.error('Error connecting:', error);
      console.log('Retrying in 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

main().catch(console.error);