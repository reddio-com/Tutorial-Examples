import axios from 'axios';


interface DigitalAsset {
  asset_id: string;
  contract_address: string;
  balance_available: number;
  balance_frozen: number;
  type: "ERC721" | "ERC721M" | "ERC20" | "ETH";
  decimals: number;
  symbol: string;
  quantum: number;
  display_value: string;
  display_frozen: string;
  token_id: string;
  base_uri: string;
}

interface DigitalAssetData {
  data: DigitalAssetList;
}
interface DigitalAssetList {
  list: DigitalAsset[];
}

interface DigitalAssetResponse {
  status: string;
  error: string;
  error_code: number;
  data: DigitalAssetData;
}


async function loadDigitalAssetByOwner(ownerStarkKey:string){
  try {
    // Make a GET request to the API endpoint
    const response: DigitalAssetResponse = await axios.get('https://api-dev.reddio.com/v1/balances?stark_key='+ownerStarkKey);

    return response;
  } catch (error) {
    // If there is an error, log it and return an empty object
    console.error(error);
    return null;
  }
}

export { loadDigitalAssetByOwner,DigitalAsset,DigitalAssetResponse,DigitalAssetList };