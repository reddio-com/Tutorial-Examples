import { ethers } from "ethers";
import { Reddio } from '@reddio.com/js';
import React, { useState, useEffect } from 'react';
import * as Common from '@/utils/common';

interface DigitalAssetInput{
  reddioObject:Reddio|null,
  starkKey:string,
  privateKey:string,

}
async function fetchAPI(fetchURL:string) {
  if(fetchURL){
    const res = await fetch(fetchURL);
    return res.json();
  }
}


export default function DigitalAssetTableComponent(inputPara: DigitalAssetInput) {
  const [ownerData, setOwnerData] = useState<Common.DigitalAssetResponse | null>(null);
  const [assetList, setAssetList] = useState<Common.DigitalAsset[]>([]);
  const [reddio, setReddio] = useState<Reddio | null>(null);


  async function transferSingleNFT(singleAsset:Common.DigitalAsset){
    setReddio(inputPara.reddioObject);

    if(reddio){
      const approve = async () => {
        await reddio!.erc721.approve({
          tokenAddress: singleAsset.contract_address,
          tokenId: singleAsset.token_id,
        });
      };
      console.log("Wait Approval "+singleAsset.asset_id);

      const { assetId,assetType } = await reddio.utils.getAssetTypeAndId({
        type: 'ERC721',
        tokenAddress: singleAsset.contract_address,
        tokenId: singleAsset.token_id,
      });
      console.log("Get Asset Id "+singleAsset.asset_id);
      console.log("Use Object");
      console.log(singleAsset);
  
      const result = await reddio!.apis.transfer({
        starkKey: inputPara.starkKey,
        privateKey:inputPara.privateKey,
        contractAddress:singleAsset.contract_address,
        amount: 1,
        tokenId: singleAsset.token_id,
        type:singleAsset.type,
        receiver: "0x30affb48fcf8bffaa40611a1f7a10e7ce9a4b0c98bae4dced219dd01d3db4fb",
      });
      console.log(result);
      console.log("Transfer Successful "+singleAsset.asset_id);

    }

    
    

  }


  async function transferAllTo(){

    for (const singleAssetObject of assetList){
        transferSingleNFT(singleAssetObject);
        //console.log(singleAssetObject);
    }
    
  
  }
  

  // Function to add or remove an asset from the selectedAssets array
  function toggleSelectedAsset(asset: Common.DigitalAsset) {
    // Check if the asset is already present in the array
    const assetIndex = assetList.indexOf(asset);
    if (assetIndex == -1) {
      // If the asset is not present in the array, add it
      setAssetList([...assetList, asset]);
    } else {
      // If the asset is already present in the array, remove it
      const newSelectedAssets = [...assetList];
      newSelectedAssets.splice(assetIndex, 1);
      setAssetList(newSelectedAssets);
    }
  }


  useEffect(() => {
    async function fetchData() {
      const data = await Common.loadDigitalAssetByOwner(inputPara.starkKey);
      if (data !== null) {

        setOwnerData(data);
        console.log(ownerData);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      
      {
      ownerData ? (
        <div>
        <table>
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Contract Address</th>
              <th>Available Balance</th>
              <th>Token ID</th>

            </tr>
          </thead>
          <tbody>
          {ownerData.data.data.list?.filter(asset => asset.type === "ERC721M" || asset.type === "ERC721" ).filter(asset => asset.balance_available === 1 ).map((asset:Common.DigitalAsset) => {

 
  return (
    <tr key={asset.asset_id}>
      <td>{asset.asset_id}</td>
      <td>{asset.contract_address}</td>
      <td>{asset.balance_available}</td>
      <td>{asset.token_id}</td>
      <button onClick={() => {
  toggleSelectedAsset(asset);
}}>
  {assetList.includes(asset)
                  ? 'Delete from list'
                  : 'Add to list'}
</button>

    </tr>
  )
})}
          </tbody>
          
        </table>
        <button onClick={transferAllTo}> Transfer To</button>
        </div>
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  );
}

