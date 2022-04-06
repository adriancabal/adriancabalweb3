import Web3 from "web3";

const getWeb3 = async () => {
    // new Promise((resolve, reject) => {
        console.log("promise getWeb3");
        if (window.ethereum) {
            console.log("in window.ethereum");
            const web3 = new Web3(window.ethereum);
            console.log("web3GetWeb3: ", web3);
            try {
                // Request account access if needed
                // await window.ethereum.enable();
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log("getweb3-accounts: ", accounts);
                // Accounts now exposed
                return web3;
                // resolve(web3);
            } catch(error) {
                console.log("getWeb3Error: ", error);
                return null;
                // reject(error);
            }
        }

        // Legacy dapp browsers...
        else if(window.web3) {
            console.log("in window.web3");
            // Use Mist/Metamask's provider.
            const web3 = window.web;
            console.log("Injected web3 detected.");
            return web3;
            // resolve(web3);
        } 
        else {
            console.log("window.ethereum or window.web3 is missing");
            // reject("window.ethereum or window.web3 is missing");
        }



        // Wait for loading completion to avoid race condiions with web3 injection timing.
        // window.addEventListener("load", async () => {
        //     console.log("load web3");
        //     // Modern dapp browsers...
        //     if (window.ethereum) {
        //         console.log("in window.ethereum");
        //         const web3 = new Web3(window.ethereum);
        //         console.log("web3GetWeb3: ", web3);
        //         try {
        //             // Request account access if needed
        //             // await window.ethereum.enable();
        //             const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        //             console.log("getweb3-accounts: ", accounts);
        //             // Accounts now exposed
        //             resolve(web3);
        //         } catch(error) {
        //             reject(error);
        //         }
        //     }

        //     // Legacy dapp browsers...
        //     else if(window.web3) {
        //         console.log("in window.web3");
        //         // Use Mist/Metamask's provider.
        //         const web3 = window.web;
        //         console.log("Injected web3 detected.");
        //         resolve(web3);
        //     } 
        //     else {
        //         reject("window.ethereum or window.web3 is missing");
        //     }

        //     // Fallback to localhost; use dev console port by default...
        //     // else {
        //     //     const provider = new Web3.providers.HttpProvider(
        //     //         "http://127.0.0.1:8545"
        //     //     );
        //     //     const web3 = new Web3(provider);
        //     //     console.log("No web3 instance injected, using Local web3.");
        //     //     resolve(web3);
        //     // }
        // });
    };

export default getWeb3;