# Polkadot Blockchain Statistics

This project retrieves various statistics from a Polkadot blockchain using the `@polkadot/api` library. It includes information such as the number of wallets, the total supply on hand, the total staked amount, the number of proposals in governance, the number of wallets involved in governance.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- You have installed Node.js and npm/yarn.
- You have internet access to connect to the Polkadot blockchain endpoint.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Installation

1. Clone the repo

   ```sh
   git clone https://github.com/DmitriVT/fetch-info-atleta.git

2. Change to the project directory

   ```sh
   cd fetch-info-atleta

3. Install the dependencies

   ```sh
   npm install

3. or

   ```sh
   yarn install


## Usage

To get a local copy up and running, follow these simple steps.

1. Open the index.js file and ensure the endpoint URL is correct. By default, it uses:

   ```js
   const endpoint = 'wss://testnet-rpc.atleta.network:9944';

2. Run the script

   ```sh
   node index.js

## Output
The script will output the following statistics to the console:

- Amount of user wallets
- Supply amount (ATLA)
- Staked ATLA amount
- Proposals in governance
- Wallets involved in governance