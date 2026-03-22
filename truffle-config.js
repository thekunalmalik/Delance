/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  networks: {
    // local Ganache development network (Ganache GUI/CLI defaults to port 7545)
    development: {
      host: "127.0.0.1",
      port: 7545,          // update if you run ganache on a different port
      network_id: 5777,    // Ganache chain ID (use 5777 for ganache CLI, 1337 for newer versions)
      gas: 6721975,
      gasPrice: 20000000000 // 20 gwei
    },
    // you can still deploy to public testnets using the mnemonic and a provider
    ropsten: {
      provider: () => new HDWalletProvider(process.env.MNENOMIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY),
      network_id: 3,       // Ropsten's id
      gas: 3000000,
      gasPrice: 10000000000
    },
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNEMONIC,
          process.env.SEPOLIA_RPC_URL      // e.g. https://sepolia.infura.io/v3/… or your QuickNode URL
        ),
      network_id: 11155111,   // Sepolia chain id
      gas: 5500000,
      gasPrice: 20e9,         // 20 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "^0.8.0",    // Fetch solc version 0.8.x
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 200
       },
       evmVersion: "byzantium"
      }
    },
  },
};
