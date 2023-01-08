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
   const defaultValue = {
     "ethAddress": "",
     "privateKey": "",
     "starkKey": "",
     "receiver": "0x30affb48fcf8bffaa40611a1f7a10e7ce9a4b0c98bae4dced219dd01d3db4fb",
     "collectionAddress":"0x941661bd1134dc7cc3d107bf006b8631f6e65ad5",
     "tokenId": 0,
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


  async function depositNFT() {
    const { starkKey, collectionAddress, tokenId } = eventValue;

    if(reddio !== null){


      //Authorize the ERC721 contract address to approve the transaction
      const approve = async () => {
        await reddio.erc721.approve({
          tokenAddress: collectionAddress,
          tokenId: tokenId,
        });
      };

      await approve();

			//Getting NFT's assetID on layer 2
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type: 'ERC721',
        tokenAddress: collectionAddress,
        tokenId: tokenId,
      });

      //Deposit ERC721 into layer 2
      await reddio.apis.depositERC721({
        starkKey:starkKey,
        tokenAddress:collectionAddress,
        tokenId:tokenId,
      });
      

  }
  }

  async function transferNFT(){
    const { starkKey, collectionAddress,tokenId,privateKey,receiver } = eventValue;

    if(reddio){
      //Authorize the ERC721 contract address to approve the transaction
      const approve = async () => {
        await reddio!.erc721.approve({
          tokenAddress: collectionAddress,
          tokenId: tokenId,
        });
      };

      //Transfer NFT on layer 2 to another StarkKey
      const result = await reddio.apis.transfer({
        starkKey: starkKey,
        privateKey:privateKey,
        contractAddress:collectionAddress,
        tokenId: tokenId,
        type:"ERC721",
        receiver: receiver,
      });

      console.log(result);


    }

    
    

  }


  async function withdrawNFTFromL2() {
    const { ethAddress,starkKey, collectionAddress,tokenId,privateKey,receiver } = eventValue;
    if(reddio){

      //Withdraw tokens from layer 2 (Move assets to withdraw area)
      //This process usually takes about 4 hour
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

  async function withdrawNFTFromL1(){
    const { ethAddress,starkKey, collectionAddress,tokenId,privateKey,receiver } = eventValue;

    if(reddio){

      //getting reddio's assetId and assetType for the NFT token
      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type: 'ERC721',
        tokenAddress: collectionAddress,
        tokenId: tokenId,
      });


      //Step 2: withdraw tokens from layer 1

      const result = await reddio.apis.withdrawalFromL1({
        
        ethAddress: ethAddress,
        assetType: assetType,
        tokenId: tokenId,
        type: 'ERC721',

      });
      
      console.log(result)

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
    <td>Collection Address</td>
    <td><input type="text" name="collectionAddress" value={eventValue.collectionAddress} onChange={handleChange}></input></td>
  </tr>

  <tr>
    <td>Token ID</td>
    <td><input type="text" name="tokenId" value={eventValue.tokenId} onChange={handleChange}></input></td>
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
    withdraw NFT from layer 1
</button>


      </header>
    </div>
  );
}

export default App;