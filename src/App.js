import logo from './logo.svg';
import { useEffect,useState } from 'react';
import './App.css';
import getWeb3 from "./getWeb3";
import DonationContract from "./contracts/Donation.json";
// import background from './images/northern_lights_png.png';



const Input = ({ placeholder, name, type, value, contract, setDonateFormData }) => {
  // const { amount } = donateFormData;
  return (
    <input
      placeholder={!contract ? "Loading Web3..." : placeholder}
      type={type}
      step="0.0001"
      value={value}
      onChange={(e) => setDonateFormData((prevState) => ({...prevState, [name]: e.target.value}))}
      className="my-2 w-3/4 rounded-sm p-2 outline-none  text-black border-none"
      // disabled={false}
      disabled={!contract}
    />
  )
};

function App() {
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [donateFormData, setDonateFormData] = useState({ amount : null });
  const [totalDonations, setTotalDonations] = useState({matic: 0, bnb: 0});
  const [web3, setWeb3] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [networkChosen, setNetworkChosen] = useState(80001);

  useEffect(() => {
    console.log("in componentDidMount useEffect");
    console.log("web3:", web3);
    
    if(!web3){
      const initWeb3 = async ()=> {
        console.log("initializing Web3...");
        // const web3 = await getWeb3(); //Get network provider and web3 instance
        // setWeb3(web3);

        //blockchain network change detected
        window.ethereum.on('chainChanged', async function(network_id){
          network_id = parseInt(network_id);
          console.log("networkChangedTo: ", typeof network_id);
          console.log("networkChange: web3: ", web3);
          await updateWeb3NetworkStates(network_id, web3);
        });

        //accounts change detected
        // detect Metamask account change
        window.ethereum.on('accountsChanged', function (accounts) {
          console.log('accountsChanges',accounts);

        });
      }
  
      //call initWeb3
      initWeb3()
      .catch("initWeb3error: "+console.error);
    } else {
      console.log("web3 already initialized");
    }
  }, []);

  const connectWeb3Account = async () => {
    console.log("connecting wallet...");
    let _web3 = await getWeb3();
    setWeb3(_web3);

    const network_id = await _web3.eth.net.getId();
    await updateWeb3NetworkStates(network_id, _web3);

    if(network_id !== networkChosen){
      await switchNetwork(networkChosen, _web3);
    } 
  }

  const switchNetwork = async (network, _web3) => {
      const chainName = network===80001 ? 
        "Mumbai" : 
        "Binance Testnet";
      const rpcUrls = network === 80001 ? 
        "https://rpc-mumbai.matic.today" : 
        "https://data-seed-prebsc-1-s1.binance.org:8545";
      const currencyName = network === 80001 ? "Matic" : "Bnb";
      const blockExplorerUrls = network === 80001 ? 
        "https://mumbai.polygonscan.com/" :
        "https://testnet.bscscan.com";
      try {
        await _web3.currentProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: _web3.utils.toHex(network)}],
        });
        setNetworkChosen(network);
      } catch (error) {
        console.log("erro swtichingNetworkr: ", error);
        if (error.code === 4902) {
          try {
            await _web3.currentProvider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: _web3.utils.toHex(network),
                  chainName: chainName,
                  rpcUrls: [rpcUrls],
                  nativeCurrency: {
                    name: currencyName,
                    symbol: currencyName,
                    decimals: 18,
                  },
                  blockExplorerUrls: [blockExplorerUrls],
                },
              ],
            });
            setNetworkChosen(network);
          } catch (error) {
            alert(error.message);
          }
        }
      }
      const network_id = await _web3.eth.net.getId();
      await updateWeb3NetworkStates(network_id, _web3);
  }

  const updateWeb3NetworkStates = async (network_id, _web3) => {
    console.log("in updateWeb3NetworkStates");
    if(!_web3){
      _web3 = await getWeb3();
      setWeb3(_web3);
    }
    console.log("updateWeb3NetworkStates2");
    console.log("network_id: " + typeof network_id + " " + network_id);
    if(network_id === 80001 || network_id === 97){
    
      console.log("updatingWeb3Network...");
      console.log("web3: ", _web3);
      console.log("networkChosen2: ", networkChosen);
      
      setNetworkChosen(network_id);
      const accounts = await _web3.eth.getAccounts(); 
      const deployedNetwork = DonationContract.networks[network_id];
      console.log("deployedNetworkAddress: ", deployedNetwork.address);
      const contractInstance = new _web3.eth.Contract(
        DonationContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      const totalDonatedAmount = await contractInstance.methods.getDonatedAmount().call();
      setNetworkId(network_id);
      setAccounts(accounts);
      setContract(contractInstance);
      setTotalDonations((prevState) => ({...prevState, [network_id === 80001 ? "matic" : "bnb"]: totalDonatedAmount }));

    }
  }

  const onClickDonate = async (e) => {
    const { amount } = donateFormData;
    console.log("onClickDonate: ", amount);
    if(!amount) return;
    await sendTransaction();
  };

  const onClickOpenMetamaskDownloadPage = () => {
    window.open("https://metamask.io/download/", "_blank");
  }

  // const onClickConnectPolygonTestnetGuide = () => {
  //   window.open("https://blog.polysynth.com/how-to-connect-polygon-testnet-to-metamask-wallet-472bca410d64", "_blank");
  // }

  const onClickGoToPolygonFaucet = () => {
    window.open("https://faucet.polygon.technology/", "_blank");
  }

  const onClickGoToBSCFaucet = () => {
    window.open("https://testnet.binance.org/faucet-smart", "_blank");
  }
  

  const sendTransaction = async () => {
    try {
      if(!contract){
        alert("install metamask!");
      }
      const { amount } = donateFormData;
      const weiValue = web3.utils.toWei(amount, 'ether');
      const bigNumber = web3.utils.toBN(weiValue);
      // console.log("bigNumber: " + bigNumber);
      console.log("from: " , accounts[0]);
      // const response = await contract.methods.donate().call();
      await contract.methods.donate().send({ 
        from: accounts[0],
        // value: bigNumber,
        // gas: 6000000,
        // gas: 250000,
        // gasPrice: "2500000",
        // gasPrice: "10000000000"
        value: `${weiValue}`,
      });
      // gas used:            245600 (0x3bf60)
      // gas price:           2.500000014 gwei

      const response = await contract.methods.getDonatedAmount().call();
      console.log("getDonatedAmountrResponse: ", response);
      if(response) {
        setTotalDonations((prevState) => ({...prevState, [networkId === 80001 ? "matic" : "bnb"]: response }));
      }
      
    } catch(error){
      throw new Error("Error donating: " + error);
    }
  }

  const grayColor = "bg-[#94928e]";
  const buttonColor = !!contract ? "bg-[red]" : grayColor;
  const polygonButtonColor = networkChosen ===80001 ? "bg-[#bc42f5]" : "bg-[#94928e]";
  const polygonButtonHoverColor = "hover:bg-[#bc42f5]";
  const bscButtonHoverColor = "hover:bg-[#f5c542]";
  console.log("networkChosen$ ",  networkChosen);
  const bscButtonColor = networkChosen === 97 ? "bg-[#f5c542]" : "bg-[#94928e]";
  console.log("bscButtonColor: ", bscButtonColor);
  const bscButtonTextColor = networkChosen === 97 ? "text-[#000000]" : "text-white";
  const connectWalletButtonColor = window.ethereum ? accounts ? "bg-[transparent]": "bg-[#4287f5]": grayColor;
  const connectWalletButtonOnHoverColor = accounts ? "bg-[transparent]" : "bg-[#2546bd]";
  const connectWalletButtonTextColor = accounts ? "text-[#62ff00]": "text-white";
  // const connectWalletButtonTextColor = accounts ? "text-[#3fd615]": "text-white";
  const connectWalletTextSize = accounts ? "text-2xl" : null;
  const faucetLinkColor = networkChosen === 80001 ? "text-[#e79bf2]" : "text-[#d9e62e]";
  
  return (
    // <div  style={{backgroundImage:  "url(./images/northern_lights.png})"}}>
    <div className='bg-northern-lights bg-no-repeat bg-top-left bg-cover bg-center flex flex-col  items-center text-center w-screen min-h-screen'>
      <div className='w-full pl-8 mt-8'>
          <p 
            className='text-left text-5xl font-bold text-white'
          >
            Adrian Cabal
          </p>
          <p 
          className='text-left text-3xl font-bold text-white ml-8 mt-5 text-[#f57242]'
        >
          hosted on IPFS
          </p>
          
      </div>
      <div className="flex-col flex justify-center items-center text-white mt-24">

        
        <p 
          className='text-left text-3xl font-bold pb-5 mt-3'
        >
          Smart Contract Donation
        </p>

        {/* If Metamask is not installed in browser, display install metamask button. */}
        {!window.ethereum &&
          <p 
            className='text-left text-xl font-bold pb-4 mt-5 text-[#f57242]'
          >
            You currently do not have metamask installed in your browser.
          </p>
        }
        {!window.ethereum &&
            <button 
            className={`flex flex-row justify-center w-2/4 text-lg items-center bg-[#f57242] p-3 my-3 mb-6 rounded-full ${!contract?null:"hover:bg-[#f58742]"}`}
            onClick={onClickOpenMetamaskDownloadPage}
            // href="https://google.com"
          >
            
            Install Metamask
          </button>
        }
        <div className='flex flex-row'>
          <p 
            className='text-xl font-bold pb-5 mt-5'
          >
            {"Choose network:"}
          </p>
          <button
            className={`flex flex-row h-1/2 justify-center w-1/2 items-center my-5 ${polygonButtonColor} p-3 ml-4 rounded-full ${!contract?null:polygonButtonHoverColor}`}
            onClick={() => {
              accounts ? switchNetwork(80001, web3) : setNetworkChosen(80001);
            }}
          >
            Polygon
          </button>
          <button
            className={`flex flex-row h-1/2 justify-center w-1/2 items-center my-5 ${bscButtonTextColor} ${bscButtonColor} p-3 ml-4 rounded-full ${!contract?null:bscButtonHoverColor}`}
            onClick={() => {
              
              accounts ? switchNetwork(97, web3) : setNetworkChosen(97);
            }}
          >
            BSC
          </button>
        </div>

        

        
        {/* Connect Wallet Button */}
        {
          <button 
            className={`flex flex-row justify-center w-3/4 items-center my-5 mb-5 ${connectWalletTextSize} ${connectWalletButtonColor} ${connectWalletButtonTextColor} p-3 rounded-full ${!contract?null:`hover:${connectWalletButtonOnHoverColor}`}`}
            onClick={connectWeb3Account}
            disabled={!window.ethereum || accounts}
          >
            {accounts ? "Wallet Connected" : "Connect Metamask Wallet"}
          </button>
        }

        {/* Faucet text link */}
        {accounts && (networkChosen === 80001 ||  networkChosen === 97) &&
          <p
            className={`text-xl font-bold pb-5 mb-10 ${faucetLinkColor} hover:cursor-pointer hover:text-[white] `}
            onClick={networkChosen === 80001 ? onClickGoToPolygonFaucet : onClickGoToBSCFaucet}
          >
            {`Get free testnet ${networkChosen === 80001 ? "MATIC" : "BNB"} tokens from ${networkChosen === 80001 ? "Polygon" : "BSC"}  Faucet here`}
          </p>
        }

        

        <Input placeholder={"Enter Amount"} name={"amount"} type={"number"} contract={contract} setDonateFormData={setDonateFormData}/>

        {/* Donate Button */}
        <button 
          className={`flex flex-row justify-center w-1/2 items-center my-5 ${buttonColor} p-3 rounded-full ${!contract?null:"hover:bg-[#2546bd]"}`}
          onClick={onClickDonate}
          disabled={!contract}
        >
          Donate
        </button>
        
      </div>

      { networkId &&
        <p 
          className='text-2xl font-bold text-white mt-5'
        >
          Total donations:
        </p>
      }
      
      { networkId &&
        <div className='flex flex-row mt-4 items-center'>
          {networkChosen === 80001 &&
            <p 
              className='text-2xl font-bold text-white px-5'
            >
              {`${totalDonations.matic/(10 **18)} MATIC`}
            </p>
          }
          {networkChosen === 97 &&
            <p 
              className='text-2xl font-bold text-white px-5'
            >
              {`${totalDonations.bnb/(10 **18)} BNB`}
            </p>
          }
          
        </div>
      }
      
    </div>
  );
}

export default App;
