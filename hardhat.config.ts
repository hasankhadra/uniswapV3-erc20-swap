import dotenv from 'dotenv'
dotenv.config()

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import './tasks'


const { PRIVATE_KEY, ALCHEMY_API_KEY, NETWORK, INFURA_API_KEY, PROVIDER } =
  process.env
const hasCustomNetwork = NETWORK && NETWORK !== 'hardhat'
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
if (hasCustomNetwork) {
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set')
  }

  if (!ALCHEMY_API_KEY) {
    throw new Error('ALCHEMY_API_KEY not set')
  }
}

const API_TEMPLATE_ALCHEMY = 'https://{{network}}.g.alchemy.com/v2/{{key}}'
const API_TEMPLATE_INFURA = 'https://{{network}}.infura.io/v3/{{key}}'

let provider_url = ''

if (PROVIDER === 'alchemy') {
  provider_url = API_TEMPLATE_ALCHEMY.replace('{{network}}', NETWORK!).replace(
    '{{key}}',
    ALCHEMY_API_KEY!
  )
} else if (PROVIDER === 'infura') {
  provider_url = API_TEMPLATE_INFURA.replace('{{network}}', NETWORK!).replace(
    '{{key}}',
    INFURA_API_KEY!
  )
}
console.log('provider_url', provider_url)

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      viaIR: false,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: NETWORK,
  networks: {
    hardhat: {
      forking: {
        blockNumber: 6138907,
        url: "https://goerli.infura.io/v3/" + INFURA_API_KEY,
      },
      gasPrice: 875000000
    },
    localhost: {
      forking: {
        blockNumber: 10058360,
        url: "https://goerli.infura.io/v3/" + INFURA_API_KEY,
      },
      gasPrice: 875000000
    },
    ...(hasCustomNetwork
      ? {
        [NETWORK]: {
          url: provider_url,
          // uncomment to make tx go faster
          gasPrice: 875000000,
          // gas: 10000000,
          accounts: [PRIVATE_KEY]
        }
      }
      : {})
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
}

export default config
