import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";
import { EmojiProvider, Emoji } from 'react-apple-emojis'
import '@material/react-text-field/dist/text-field.css';
import emojiData from 'react-apple-emojis/lib/data.json'
import { Line, Circle } from 'rc-progress';
import TextField, {HelperText, Input} from '@material/react-text-field';


export default function App() {

    const [state, setState] = useState({ currentAccount: "", loading: false ,percentage: 0, waves: [], message: ""});

  const contractAddress  = "0xb6D8Bb55EaEa3AA194d77CECc84b3aD0a110d619"
          const contractABI = abi.abi;
  

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return; 
      } else { 
        console.log("We have the ethereum object", ethereum);
      } 

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setState({...state, currentAccount: account})
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

/**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  
  const wave = async () => {
    if(state.message == ""){
      alert("You need a message!")
    } else {
     try {
      const { ethereum } = window;
      setState(state => ({...state, percent: 20, loading: true}));
      
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        setState(state => ({...state, percent: 40 }));
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        setState(state => ({...state, percent: 60 }));
        /*
        * Execute the actual wave from your smart contract
        */
        
        let message = state.message
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        setState(state => ({...state, percent: 80 }));
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setState(state => ({...state, percent: 100, loading: false }));
        
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    } 
    }
}

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setState(state => ({...state, waves: wavesCleaned}));
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
}

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();

    let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    setState(state => ({
      ...state, waves: [...state.waves,       
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      }]
    }));
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
  }, [])


  let waveButton = ""        

  if(state.loading){
    waveButton = <div>
          <br/><br/>
      <div className="spinner"><Circle style={{   margin: 10, width: 200}} percent={state.percent} strokeWidth="4" strokeColor="#D3D3D3" />
    </div></div>
  } else {
    waveButton = <div className="wave">
          <TextField
          label='Message'
          helperText={<HelperText>That's the message you're leaving. Think twice!</HelperText>}><Input
           value={state.message}
           onChange={(e) => setState(state => ({...state, message: e.currentTarget.value}))} />
        </TextField>
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
    </div> 
  }
  
return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="realHeader">  
        The Decentralized Guestbook
        </div><br />
        <div className="header">
              <EmojiProvider data={emojiData}>
              <Emoji name="waving-hand" width="32px"/>
        </EmojiProvider> Hey there!
        </div> 

        <div className="bio">
          It's me, Baran, and I am back at it with the decentralized guest book.<br/> Tell us what's on your mind!
        </div>
        
        <br/>
        {waveButton}

        {/*
        * If there is no currentAccount render this button
        */}
        {!state.currentAccount && !state.loading && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {state.waves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
