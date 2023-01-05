//import relevant modules
import { ethers } from "ethers";
import { Reddio } from '@reddio.com/js'
import React, {  useCallback, useState} from 'react';
import axios from 'axios';
import * as Common from '@/utils/common';
import DigitalAssetTableComponent from '@/components/DigitalAssetTableComponent';

function App() {
	//define global variables and relevant functions to set the variables by useState hook
  const [reddio, setReddio] = useState<Reddio | null>(null);
	const [ethAddress,setEthAddress] = useState('')
  const [privateKey, setPrivateKey] = useState('');
  const [starkKey, setStarkKey] = useState('');
  const [toStarkKey,setToStarkKey] = useState('0x30affb48fcf8bffaa40611a1f7a10e7ce9a4b0c98bae4dced219dd01d3db4fb');
  const [collectionAddress,setCollectionAddress] = useState("0x941661bd1134dc7cc3d107bf006b8631f6e65ad5");
  const [tokenId,setTokenId] = useState(0);
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

       	//Finally, we can generate our own Stark Key and Private Starkkey 
        //from our MetaMask Wallet
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


  async function depositNFT() {

    if(reddio !== null){

      const approve = async () => {
        await reddio.erc721.approve({
          tokenAddress: collectionAddress,
          tokenId: tokenId,
        });
      };

      const { assetId,assetType } = await reddio?.utils.getAssetTypeAndId({
        type: 'ERC721',
        tokenAddress: collectionAddress,
        tokenId: tokenId,
      });

      await reddio.apis.depositERC721({
        starkKey:starkKey,
        tokenAddress:collectionAddress,
        tokenId:tokenId,
      });
      

  }
  }

  async function transferNFT(){

    if(reddio){
      //Authorize the ERC721 contract address to approve the transaction
      const approve = async () => {
        await reddio!.erc721.approve({
          tokenAddress: collectionAddress,
          tokenId: tokenId,
        });
      };

      //Getting NFT's assetId 
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type: 'ERC721',
        tokenAddress: collectionAddress,
        tokenId: tokenId,
      });

      //Transfer NFT on layer 2 to another StarkKey
      const result = await reddio!.apis.transfer({
        starkKey: starkKey,
        privateKey:privateKey,
        contractAddress:collectionAddress,
        amount: 1,
        tokenId: tokenId,
        type:"ERC721",
        receiver: toStarkKey,
      });
      console.log(collectionAddress+" "+tokenId);

      console.log(result);


    }

    
    

  }

  async function withdrawNFTFromL1(){

    if(reddio){

      //getting reddio's assetId and assetType for the NFT token
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type: 'ERC721',
        tokenAddress: collectionAddress,
        tokenId: tokenId,
      });


      //Step 2: withdraw tokens from layer 1

      const resultTwo = await reddio.apis.withdrawalFromL1({
        
        ethAddress: ethAddress,
        assetType: assetType,
        tokenId: tokenId,
        type: 'ERC721',

      });
      //This process usually takes about 4 hour
      console.log(resultTwo)


    }

  }
  async function withdrawNFTFromL2() {
    if(reddio){

      //getting reddio's assetId and assetType for the NFT token
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type: 'ERC721',
        tokenAddress: collectionAddress,
        tokenId: tokenId,
      });

      //Step 1: withdraw tokens from layer 2 (Move assets to withdrawal areas)
      const resultOne = await reddio.apis.withdrawalFromL2({
        starkKey:starkKey,
        privateKey:privateKey,
        receiver:starkKey,
        type:"ERC721",
        contractAddress:collectionAddress,
        tokenId: tokenId.toString(), //needs to be a string
      });
      console.log(resultOne)

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
    else if(name == 'collectionAddressInput'){
      setCollectionAddress(event.target.value);
    }
    else if(name == 'tokenIdInput'){
      setTokenId(Number(event.target.value));
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
    <td>Collection Address</td>
    <td><input type="text" name="collectionAddressInput" value={collectionAddress} onChange={handleChange}></input></td>
  </tr>

  <tr>
    <td>Token ID</td>
    <td><input type="text" name="tokenIdInput" value={tokenId} onChange={handleChange}></input></td>
  </tr>

</table>
<br/>
<button type="button" onClick={depositNFT}>
    Deposit L1 to L2 NFT
</button>

<br/>
<button type="button" onClick={transferNFT}>
    Transfer L2 to L2 NFT
</button>

<br/>
<button type="button" onClick={withdrawNFTFromL2}>
    withdraw NFT from layer 2
</button>

<br/>
<button type="button" onClick={withdrawNFTFromL1}>
    withdraw NFT from layer 1/withdrawal areas
</button>


<br/>
<button type="button" onClick={()=> Common.loadDigitalAssetByOwner('0x1baf1b9991271727e8ebabf242cb5c707ae72f356481908a344109c08f11c3')}>
    get collection
</button>

<div>
  <DigitalAssetTableComponent reddioObject={reddio} starkKey={starkKey} privateKey={privateKey}/></div>

      </header>
    </div>
  );
}

export default App;