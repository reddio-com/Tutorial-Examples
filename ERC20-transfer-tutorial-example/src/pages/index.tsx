//import relevant modules
import { ethers } from "ethers";
import { Reddio } from '@reddio.com/js'
import React, { useState } from 'react';

function App() {
  //define global variables and relevant functions to set the variables by useState hook
  const [reddio, setReddio] = useState<Reddio | null>(null);
  const defaultValue = {
    "ethAddress": "",
    "privateKey": "",
    "starkKey": "",
    "contractAddress": "0x57F3560B6793DcC2cb274c39E8b8EBa1dd18A086",
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

          //We will set ethAddress/starkKey/privateKey on our array
          setEventValue({ ...eventValue, ethAddress, starkKey: publicKey, privateKey })
        } catch (error) {
          console.error(error);
        }
      };

      generateKey();
    }
  }

  async function depositERC20() {
    //Authorize the ERC20 contract address to approve the transaction
    if (reddio !== null) {
      const { starkKey, tokenAmount, contractAddress } = eventValue
      const transaction = await reddio.erc20.approve({
        //Amounts that you want to approve 
        amount: tokenAmount,
        //ERC20's contract address 
        tokenAddress: contractAddress,
      })

      //Waiting for approval
      await transaction?.wait()

      //Deposit ERC20
      await reddio.apis.depositERC20({
        //Your starkKey (public key on layer 2)
        starkKey,
        //Amounts you want to deposit
        quantizedAmount: tokenAmount,
        //ERC20's contract address 
        tokenAddress: contractAddress,
      });
    }
  }

  async function transferERC20() {
    if (reddio !== null) {
      const { starkKey, privateKey, tokenAmount, contractAddress, receiver } = eventValue
      //transfer the amount to another starkKey
      const { data: res } = await reddio.apis.transfer({
        starkKey,
        privateKey,
        contractAddress,
        amount: tokenAmount,
        type: 'ERC20',
        receiver,
      });
      console.log(res);
    }
  }

  async function withdrawERC20FromL2() {
    if (reddio !== null) {
      const { starkKey, privateKey, tokenAmount, contractAddress, receiver } = eventValue
      //Step 1: withdraw tokens from layer 2 (usually takes 4 hour)
      const { data } = await reddio.apis.withdrawalFromL2({
        starkKey,
        privateKey,
        amount: tokenAmount,
        contractAddress,
        type: "ERC20",
        receiver,
      });

      console.log(data);
    }
  }

  //when form values starts to change set the values to relevant variables
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setEventValue({ ...eventValue, [name]: value })
  };

  //writing all the forms that we need
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
            <td>ERC20 Amount</td>
            <td><input type="number" name="tokenAmount" value={eventValue.tokenAmount} onChange={handleChange}></input></td>
          </tr>
          <tr>
            <td>Token Contract Address</td>
            <td><input type="text" name="contractAddress" value={eventValue.contractAddress} onChange={handleChange}></input></td>
          </tr>

        </table>
        <br />
        <button type="button" onClick={depositERC20}>
          Deposit L1 to L2
        </button>
        <br />
        <button type="button" onClick={transferERC20}>
          transfer L2 to L2
        </button>
        <br />
        <button type="button" onClick={withdrawERC20FromL2}>
          withdraw from L2
        </button>
      </header>
    </div>
  );
}

export default App;