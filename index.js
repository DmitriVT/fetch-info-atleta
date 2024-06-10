import { ApiPromise, WsProvider } from '@polkadot/api';

const endpoint = 'wss://testnet-rpc.atleta.network:9944';

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

async function main() {
  const api = await connect();

  const walletCount = await getWalletCount(api);
  const totalSupplyOnHands = await getTotalSupplyOnHands(api);
  const totalStaked = await getTotalStaked(api);
  const proposalCount = await getProposalCount(api);
  const governanceWalletCount = await getGovernanceWalletCount(api);

  console.log(`Amount of user wallets: ${walletCount}`);
  console.log(`Supply amount (ATLA): ${totalSupplyOnHands}`);
  console.log(`Staked ATLA amount: ${totalStaked.toString()}`);
  console.log(`Proposals in governance: ${proposalCount}`);
  console.log(`Wallets are involved in governance: ${governanceWalletCount}`);

  process.exit(0);
}

main().catch(console.error);
