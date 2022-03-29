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
      className="my-2 w-full rounded-sm p-2 outline-none  text-black border-none"
      // disabled={false}
      disabled={!contract}
    />
  )
};

function App() {
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [donateFormData, setDonateFormData] = useState({ amount : null });
  const [totalDonations, setTotalDonations] = useState(0);
  const [web3, setWeb3] = useState(null);

  useEffect(() => {
    console.log("in componentDidMount useEffect");
    if(!web3){
      const initWeb3 = async ()=> {
        console.log("initializing Web3...");
        const web3 = await getWeb3(); //Get network provider and web3 instance
        const accounts = await web3.eth.getAccounts(); // Use web3 to get the user's accounts
  
        // Get the contaxct instance.
        const networkId = await web3.eth.net.getId();
        console.log("networkId:", networkId);
        const deployedNetwork = DonationContract.networks[networkId];
        console.log("DonationContract.networks: ", DonationContract.networks);
        const contractInstance = new web3.eth.Contract(
          DonationContract.abi,
          deployedNetwork && deployedNetwork.address,
        );
        console.log("contractAdress: ", contractInstance.options.address);
        console.log("account: ", accounts[0]);
        // contractInstance.options.address = "0x344B727dCe7f39Ef2594e8eDE5c83e0d7092F652";
        const totalDonatedAmount = await contractInstance.methods.getDonatedAmount().call();
        // set state hooks web3, accounts, and contract
        setWeb3(web3);
        setAccounts(accounts);
        setContract(contractInstance);
        setTotalDonations(totalDonatedAmount);
      }
  
      //call initWeb3
      initWeb3()
      .catch("initWeb3error: "+console.error);
    } else {
      console.log("web3 already initialized");
    }
  }, []);

  

  const onClickDonate = (e) => {
    const { amount } = donateFormData;
    console.log("onClickDonate: ", amount);
    if(!amount) return;
    sendTransaction();
  };

  const sendTransaction = async () => {
    try {
      if(!contract){
        alert("install metamask!");
      }
      // contract.options.address = "0x080048fC100d3cEa43a066152769874DC30D388C";
      console.log("contract: ", contract.options.address);
      const { amount } = donateFormData;
      console.log("before wei");
      const weiValue = web3.utils.toWei(amount, 'ether');
      console.log("weiValue: ", weiValue);
      console.log("before bigNumber");
      const bigNumber = web3.utils.toBN(weiValue);
      console.log("bigNumber: " + bigNumber);
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
      console.log("response: ", response);
      if(response) {
        setTotalDonations(response);
        // setTotalDonations((prevState) => ({totalDonations: prevState.totalDonations + response}));
      }
      
    } catch(error){
      throw new Error("Error donating: " + error);
    }
  }
  

  return (
    // <div  style={{backgroundImage:  "url(./images/northern_lights.png})"}}>
    <div className='App'>
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <p 
          // className="Adrian-title"
          className='text-left text-5xl font-bold '
        >
          Adrian Cabal
        </p>

        <Input placeholder={"Amount"} name={"amount"} type={"number"} contract={contract} setDonateFormData={setDonateFormData}/>

        <button 
          className={`flex flex-row justify-center items-center my-5 bg-[${contract ? "red" : "gray"}] p-3 rounded-full ${!contract?null:"hover:bg-[#2546bd]"}`}
          onClick={onClickDonate}
          disabled={!contract}
        >
          Donate
        </button>
        <p 
          className='text-2xl font-bold '
        >
          Total donations:
        </p>
        <p 
          className='text-2xl font-bold '
        >
          {`${totalDonations/(10 **18)} MATIC`}
        </p>
        {/* <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
      </header>
    </div>
  );
}

export default App;
