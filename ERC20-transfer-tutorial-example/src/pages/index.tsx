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
  const [toStarkKey,setToStarkKey] = useState('');
  const [tokenAmount, setTokenAmount] = useState(0);

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

      </header>
    </div>
  );
}

export default App;