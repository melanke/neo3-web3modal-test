import './style.css'
import { WalletConnectModalSign } from "@walletconnect/modal-sign-html";

let web3Modal

const init = async () => {
  registerInteraction()

  // 1. Define constants
  const projectId = import.meta.env.VITE_PROJECT_ID;
  if (!projectId) {
    throw new Error("You need to provide VITE_PROJECT_ID env variable");
  }

// 2. Create modal client
  web3Modal = new WalletConnectModalSign({
    projectId,
    metadata: {
      name: "My Dapp",
      description: "My Dapp description",
      url: "https://my-dapp.com",
      icons: ["https://my-dapp.com/logo.png"],
    },
  });

  await web3Modal.onSessionDelete(renderSession)

  renderSession()
}

const connect = async () => {
  await web3Modal.connect({
    requiredNamespaces: {
      neo3: {
        chains: ["neo3:mainnet"],
        methods: [
          'invokeFunction',
          'testInvoke',
          'signMessage',
          'verifyMessage',
          'traverseIterator',
          'getWalletInfo',
          'getNetworkVersion',
        ],
        events: [],
      },
    },
  });

  renderSession()
}

const disconnect = async () => {
  await web3Modal.disconnect({
    topic: (await web3Modal.getSession()).topic,
    reason: {
      code: 5900,
      message: 'USER_DISCONNECTED',
    },
  })

  renderSession()
}

const getAccountInfo = async () => {
  const accounts = (await web3Modal.getSession()).namespaces.neo3.accounts
  if (!accounts?.length) {
    return null
  }
  return accounts[0].split(':') ?? null
}

const getAccountAddress = async () => {
  const info = await getAccountInfo()
  return info && info[2]
}

const getChainId = async () => {
  const info = await getAccountInfo()
  return info && `${info[0]}:${info[1]}`
}

const sendRequest = async (request) => {
  return await web3Modal.request({
    topic: (await web3Modal.getSession())?.topic ?? '',
    chainId: await getChainId() ?? '',
    request,
  })
}

const testInvoke = async (params) => {
  return await sendRequest({
    id: 1,
    jsonrpc: '2.0',
    method: 'testInvoke',
    params,
  })
}

const invokeFunction = async (params) => {
  return await sendRequest({
    id: 1,
    jsonrpc: '2.0',
    method: 'invokeFunction',
    params,
  })
}

const getMyBalance = async () => {
  const resp = await testInvoke({
    invocations: [
      {
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'balanceOf',
        args: [
          {
            type: 'Hash160',
            value: (await getAccountAddress()) ?? '',
          },
        ],
      },
    ],
    signers: [{ scopes: 1 }],
  })

  console.log(resp)
  window.alert(JSON.stringify(resp, null, 2))
}

const transferGas = async () => {
  const resp = await invokeFunction({
    invocations: [
      {
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'transfer',
        args: [
          {
            type: 'Hash160',
            value: (await getAccountAddress()) ?? '',
          },
          {
            type: 'Hash160',
            value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv',
          },
          {
            type: 'Integer',
            value: 100000000,
          },
          {
            type: 'Array',
            value: [],
          },
        ],
      },
    ],
    signers: [{ scopes: 1 }],
  })

  console.log(resp)
  window.alert(JSON.stringify(resp, null, 2))
}

const registerInteraction = () => {
  document.getElementById('connect').addEventListener('click', connect)
  document.getElementById('disconnect').addEventListener('click', disconnect)
  document.getElementById('getMyBalance').addEventListener('click', getMyBalance)
  document.getElementById('transferGas').addEventListener('click', transferGas)
}

const renderSession = async () => {
  if (await web3Modal.getSession()) {
    document.getElementById('afterConnect').style.display = 'block'
    document.getElementById('connect').style.display = 'none'
    document.getElementById('address').innerHTML = await getAccountAddress()
  } else {
    document.getElementById('afterConnect').style.display = 'none'
    document.getElementById('connect').style.display = 'block'
    document.getElementById('address').innerHTML = ''
  }
}

init()