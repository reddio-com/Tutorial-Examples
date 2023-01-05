//import relevant modules
import { ethers } from "ethers";
import { Reddio } from '@reddio.com/js'
import React, {  useCallback, useState} from 'react';

function App() {
	//define global variables and relevant functions to set the variables by useState hook
  const [reddio, setReddio] = useState<Reddio | null>(null);
	const [ethAddress,setEthAddress] = useState('')
  const [privateKey, setPrivateKey] = useState('');
  const [starkKey, setStarkKey] = useState('');
  const [toStarkKey,setToStarkKey] = useState('0x30affb48fcf8bffaa40611a1f7a10e7ce9a4b0c98bae4dced219dd01d3db4fb');
  const [tokenAmount, setTokenAmount] = useState(0);

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

       //Fourth, we will set the ETH address to our form.
       const signer = provider.getSigner();
       const ethAddress = await signer.getAddress(); 
       setEthAddress(ethAddress);

       

       //Finally, we can create a new reddio instance (Goerli testnet) 
       //And assign global variable to it
       const reddio = new Reddio({
         provider,
         env: 'test',
       });
       setReddio(reddio);

      const generateKey = async () => {
        try {
          const keypair = await reddio.keypair.generateFromEthSignature();
          setStarkKey(keypair["publicKey"]);
          setPrivateKey(keypair["privateKey"]);
        } catch (error) {
          console.error(error);
        }
      };
      
      generateKey();
     }
   }

   async function depositETH()
   {
     if(reddio !== null){
       //Deposit ETH to layer 2 if reddio object is defined
       await reddio?.apis.depositETH({
       //Your starkKey (public key on layer 2)
       starkKey:starkKey,
       //Amounts you want to deposit
       quantizedAmount:Number(tokenAmount),
       });
      }
	 }

   async function transferETH(){
    if(reddio !== null){
      //getting RDD20 token's assetId if reddio object is defined 
			const { assetId } = await reddio.utils.getAssetTypeAndId({
        type:"ETH",
      });

      //transfer the amount to another starkKey
      const { data: res } = await reddio.apis.transfer({
        starkKey: starkKey,
        privateKey:privateKey,
        amount: tokenAmount,
        tokenId: assetId,
        type:'ETH',
        receiver: toStarkKey,
      });
      console.log(res);

    }

  }

  async function withdrawETH(){
    if(reddio !== null){
      //getting reddio's assetId and assetType for the ERC20 token
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type:"ETH",
      });

      //Step 1: withdraw tokens from layer 2
      const { data: res } = await reddio.apis.withdrawalFromL2({
        starkKey:starkKey,
        privateKey:privateKey,
        amount:tokenAmount,
        tokenId:assetId,
        type:"ETH",
        receiver:starkKey,
      });

      console.log(res);

      //Step 2: withdraw tokens from layer 1
      const resTwo = await reddio.apis.withdrawalFromL1({
        ethAddress: ethAddress,
        assetType: assetType,
        type: 'ETH'
      })

      console.log(resTwo);

      //This process usually takes about 4 hour
      console.log("Withdraw successfully")
    }
  }
	//when form values starts to change set the values to relevant variables
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if(name == 'starkKeyInput'){
      setStarkKey(event.target.value);
    }
    else if(name == 'tokenAmountInput'){
			setTokenAmount(Number(event.target.value));
    }
    else if(name == 'toStarkKey'){
      setToStarkKey(event.target.value);
    }
    else if(name == 'privateKeyInput'){
      setPrivateKey(event.target.value);
    }
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
    <td><input type="text" name="ethAddressInput" value={ethAddress} onChange={handleChange} disabled></input></td>
  </tr>
  <tr>
    <td>Stark privateKey</td>
    <td><input type="text" name="privateKeyInput" value={privateKey} onChange={handleChange}></input></td>
  </tr>
  <tr>
    <td>From starkKey</td>
    <td><input type="text" name="starkKeyInput" value={starkKey} onChange={handleChange}></input></td>
  </tr>
  <tr>
    <td>To starkKey</td>
    <td><input type="text" name="toStarkKeyInput" value={toStarkKey} onChange={handleChange}></input></td>
  </tr>
  <tr>
    <td>ETH Amount</td>
    <td><input type="number" name="tokenAmountInput" value={tokenAmount} onChange={handleChange}></input></td>
  </tr>
</table>
<br/>
<button type="button" onClick={depositETH}>
    Deposit L1 to L2
</button>
<br/>
<button type="button" onClick={transferETH}>
    transfer L2 to L2
</button>
<br/>
<button type="button" onClick={withdrawETH}>
    withdraw L2 to L1
</button>



      </header>
    </div>
  );
}

export default App;