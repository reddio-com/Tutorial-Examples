//import relevant modules
import { ethers } from "ethers";
import { Reddio } from '@reddio.com/js'
import React, {  useCallback, useState} from 'react';

function App() {
	//define global variables and relevant functions to set the variables by useState hook
  const [reddio, setReddio] = useState<Reddio | null>(null);
  const defaultArray = {
    "ethAddressInput":"",
    "privateKeyInput":"",
    "starkKeyInput":"",
    "tokenContractAddressInput":"",
    "toStarkKeyInput":"0x30affb48fcf8bffaa40611a1f7a10e7ce9a4b0c98bae4dced219dd01d3db4fb",
    "tokenAmountInput":0,
  }
  const [eventArray,setEventArray] = useState(defaultArray);

  async function connectToWallet(){
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
          const keypair = await reddio.keypair.generateFromEthSignature();

          //We will set ethAddress/starkKey/privateStarkKey on our array
          setEventArray({...eventArray, 
                        "ethAddressInput" : ethAddress,
                         "starkKeyInput" : keypair["publicKey"],
                         "privateKeyInput": keypair["privateKey"]})
        } catch (error) {
          console.error(error);
        }
      };
      
      generateKey();
     }
   }

  async function depositERC20()
   {
     //Authorize the ERC20 contract address to approve the transaction
     if(reddio !== null){
       const transaction = await reddio?.erc20.approve({
        //Amounts that you want to approve 
        amount: Number(eventArray["tokenAmountInput"]),
         //ERC20's contract address 
         tokenAddress: eventArray["tokenContractAddressInput"], 
       })
 
       //Waiting for approval
       await transaction?.wait()
 
       //Deposit ERC20
       await reddio?.apis.depositERC20({
         //Your starkKey (public key on layer 2)
         starkKey:eventArray["starkKeyInput"],
         //Amounts you want to deposit
         quantizedAmount:Number(eventArray["tokenAmountInput"]),
         //ERC20's contract address 
         tokenAddress:eventArray["tokenContractAddressInput"],
       });
     }
    }

  async function transferERC20(){
  if(reddio !== null){
    //getting RDD20 token's assetId if reddio object is defined 
    const { assetId } = await reddio.utils.getAssetTypeAndId({
      type:"ERC20",
      tokenAddress:eventArray["tokenContractAddressInput"],
    });

    //transfer the amount to another starkKey
    const { data: res } = await reddio.apis.transfer({
      starkKey: eventArray["starkKeyInput"],
      privateKey:eventArray["privateKeyInput"],
      contractAddress:eventArray["tokenContractAddressInput"],
      amount: Number(eventArray["tokenAmountInput"]),
      tokenId: assetId,
      type:'ERC20',
      receiver: eventArray["toStarkKeyInput"],
    });
    console.log(res);

  }

}

  async function withdrawERC20FromL2(){
    if(reddio !== null){
      //getting reddio's assetId and assetType for the ERC20 token
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type:"ERC20",
        tokenAddress:eventArray["tokenContractAddressInput"],
      });

      //Step 1: withdraw tokens from layer 2 (usually takes 4 hour)
      const { data: res } = await reddio.apis.withdrawalFromL2({
        starkKey:eventArray["starkKeyInput"],
        privateKey:eventArray["privateKeyInput"],
        amount:Number(eventArray["tokenAmountInput"]),
        contractAddress:eventArray["tokenContractAddressInput"],
        tokenId:assetId,
        type:"ERC20",
        receiver:eventArray["starkKeyInput"],
      });
  }
}


  async function withdrawERC20FromL1(){
    if(reddio !== null){
      //getting reddio's assetId and assetType for the ERC20 token
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type:"ERC20",
        tokenAddress:eventArray["tokenContractAddressInput"],
      });

      //Step 2: withdraw tokens from layer 1
      await reddio.apis.withdrawalFromL1({
        ethAddress: eventArray["ethAddressInput"],
        assetType: assetType,
        type: 'ERC20'
      })
  }
    
  }
 
	//when form values starts to change set the values to relevant variables
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const eventName = event.target.name;
    const eventValue = event.target.value;
    setEventArray({...eventArray, [eventName] : eventValue})
    
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
    <td><input type="text" name="ethAddressInput" value={eventArray.ethAddressInput} onChange={handleChange} disabled></input></td>
  </tr>
  <tr>
    <td>Stark privateKey</td>
    <td><input type="text" name="privateKeyInput" value={eventArray.privateKeyInput} onChange={handleChange}></input></td>
  </tr>
  <tr>
    <td>From starkKey</td>
    <td><input type="text" name="starkKeyInput" value={eventArray.starkKeyInput} onChange={handleChange}></input></td>
  </tr>
  <tr>
    <td>To starkKey</td>
    <td><input type="text" name="toStarkKeyInput" value={eventArray.toStarkKeyInput} onChange={handleChange}></input></td>
  </tr>
  <tr>
    <td>ERC20 Amount</td>
    <td><input type="number" name="tokenAmountInput" value={eventArray.tokenAmountInput} onChange={handleChange}></input></td>
  </tr>
  <tr>
    <td>Token Contract Address</td>
    <td><input type="text" name="tokenContractAddressInput" value={eventArray.tokenContractAddressInput} onChange={handleChange}></input></td>
  </tr>

</table>
<br/>
<button type="button" onClick={depositERC20}>
    Deposit L1 to L2
</button>
<br/>
<button type="button" onClick={transferERC20}>
    transfer L2 to L2
</button>
<br/>
<button type="button" onClick={withdrawERC20FromL2}>
    withdraw from L2
</button>

<br/>
<button type="button" onClick={withdrawERC20FromL2}>
    withdraw from L1
</button>


      </header>
    </div>
  );
}

export default App;