//import relevant modules
import { ethers } from "ethers";
import { Reddio } from '@reddio.com/js'
import React, { useCallback, useState } from 'react';

function App() {
  //define global variables and relevant functions to set the variables by useState hook
  const [reddio, setReddio] = useState<Reddio | null>(null);
  const defaultValue = {
    "ethAddress": "",
    "privateKey": "",
    "starkKey": "",
    "receiver": "0x30affb48fcf8bffaa40611a1f7a10e7ce9a4b0c98bae4dced219dd01d3db4fb",
    "tokenAmount": 0,
  }
  const [eventValue, setEventValue] = useState(defaultValue);


  async function connectToWallet() {
    if (typeof window !== 'undefined') {
      //First, get the web3 provider if window is not undefined
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      //Second, we need to ask the wallet to switch to specific ETH network
      //We will use Goerli testnet to give example.Its hexValue is 5.
      await provider.send("wallet_switchEthereumChain", [
        { chainId: ethers.utils.hexValue(5) },
      ]);

      //Third, getting the account addresses from provider
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const ethAddress = await signer.getAddress();

      //Finally, we can create a new reddio instance (Goerli testnet) 
      //And assign global variable to it
      const reddio = new Reddio({
        provider,
        env: 'test',
      });
      setReddio(reddio);

      const generateKey = async () => {
        try {
          //Generate stark private key and public key 
          //Store them into array
          const { privateKey, publicKey } = await reddio.keypair.generateFromEthSignature();

          //We will set ethAddress/starkKey/privateStarkKey on our array
          setEventValue({ ...eventValue, ethAddress, starkKey: publicKey, privateKey })
        } catch (error) {
          console.error(error);
        }
      };

      generateKey();
    }
  }

  async function depositETH() {
    if (reddio !== null) {
      //Deposit ETH to layer 2 if reddio object is defined
      const { starkKey, tokenAmount } = eventValue
      await reddio.apis.depositETH({
        //Your starkKey (public key on layer 2)
        starkKey,
        //Amounts you want to deposit
        quantizedAmount: Number(tokenAmount),
      });
    }
  }

  async function transferETH() {
    if (reddio !== null) {
      //getting RDD20 token's assetId if reddio object is defined 
      const { assetId } = await reddio.utils.getAssetTypeAndId({
        type: "ETH",
      });

      const { starkKey, privateKey, tokenAmount, receiver } = eventValue
      //transfer the amount to another starkKey
      const { data: res } = await reddio.apis.transfer({
        starkKey,
        privateKey,
        amount: tokenAmount,
        tokenId: assetId,
        type: 'ETH',
        receiver,
      });
      console.log(res);

    }

  }
  async function withdrawTokensFromL2() {
    if (reddio !== null) {
      //Getting reddio's assetId and assetType for the ERC20 token
      const { assetId } = await reddio.utils.getAssetTypeAndId({
        type: "ETH",
      });

      const { starkKey, privateKey, tokenAmount, receiver } = eventValue
      //Withdraw tokens from layer 2
      //It will usually take 4 hour to withdraw from layer 2 to withdraw area
      const { data: res } = await reddio.apis.withdrawalFromL2({
        starkKey,
        privateKey,
        amount: tokenAmount,
        tokenId: assetId,
        type: "ETH",
        receiver,
      });

      console.log(res);

    }
  }
  async function withdrawTokensFromL1() {
    if (reddio !== null) {
      //Getting reddio's assetId and assetType for the ETH token
      const { assetType } = await reddio.utils.getAssetTypeAndId({
        type: "ETH",
      });

      //Withdraw tokens from withdraw area on layer 1
      const res = await reddio.apis.withdrawalFromL1({
        ethAddress: eventValue.receiver,
        assetType: assetType,
        type: 'ETH'
      })
      console.log(res);
    }
  }
  //when form values starts to change set the values to relevant variables
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setEventValue({ ...eventValue, [name]: value })
  };

  return (
    <div className="App">
      <header className="App-header">

        <button type="button" onClick={connectToWallet}>
          Connect wallet
        </button>
        <table>

          <tr>
            <td>ETH Address</td>
            <td><input type="text" name="ethAddress" value={eventValue.ethAddress} onChange={handleChange} disabled></input></td>
          </tr>
          <tr>
            <td>Stark privateKey</td>
            <td><input type="text" name="privateKey" value={eventValue.privateKey} onChange={handleChange}></input></td>
          </tr>
          <tr>
            <td>From starkKey</td>
            <td><input type="text" name="starkKey" value={eventValue.starkKey} onChange={handleChange}></input></td>
          </tr>
          <tr>
            <td>To starkKey</td>
            <td><input type="text" name="receiver" value={eventValue.receiver} onChange={handleChange}></input></td>
          </tr>
          <tr>
            <td>ETH Amount</td>
            <td><input type="number" name="tokenAmount" value={eventValue.tokenAmount} onChange={handleChange}></input></td>
          </tr>
        </table>
        <br />
        <button type="button" onClick={depositETH}>
          Deposit L1 to L2
        </button>
        <br />
        <button type="button" onClick={transferETH}>
          transfer L2 to L2
        </button>
        <br />
        <button type="button" onClick={withdrawTokensFromL2}>
          withdraw from L2
        </button>

        <br />
        <button type="button" onClick={withdrawTokensFromL1}>
          withdraw from L1
        </button>



      </header>
    </div>
  );
}

export default App;