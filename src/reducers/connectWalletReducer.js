import Web3 from "web3";
import FarmMasterChef from "../truffle_abis/FarmMasterChef.json";

// config for chain ids
const chainIds = {
  goerli: "0x5",
  // goerli: "0x539", // temporarily change to ganache
};

const initialState = {
  address: "",
  walletConnected: false,
  chain: "goerli",
  masterchef: {},
  web3: {},
};

// actions here
const connectWalletAction = (payload) => ({
  type: "CONNECTWALLET",
  payload,
});

const changeWalletAction = (payload) => ({
  type: "CHANGEWALLET",
  payload,
});

const disconnectWalletAction = () => ({
  type: "DISCONNECTWALLET",
});

const connectSmartContractAction = (payload) => ({
  type: "CONNECTSMARTCONTRACT",
  payload,
});

const changeChainConnectWalletReducer = (payload) => ({
  type: "CHANGECHAIN",
  payload,
});

const attemptToConnectWallet = (chain) => {
  return async (dispatch) => {
    ///
    try {
      // Request account access if needed
      await window.ethereum.enable();
      // Acccounts now exposed
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId(); // int type

      let onCorrectChain = true;
      // if network id not equal to the goerli, attempt to change chain
      // if connect to ganache instead, think just hardcode chainIds[chain] to that of ganache instead
      if (web3.utils.toHex(networkId) !== chainIds[chain]) {
        // attempt to connect
        onCorrectChain = await attemptToChangeChain(chain);
        if (!onCorrectChain) {
          dispatch(disconnectWalletAction());
          return false;
        }
      }
      await dispatch(connectWalletAction({ address: accounts[0], web3: web3 }));

      /*
      // ****** DO NOT DELETE THIS COMMENT
      // This is for if smart contract deployed through truffle
      // load the FarmMasterChef Contract
      const masterchefData = FarmMasterChef.networks[networkId];
      if (masterchefData) {
        const masterchef = new web3.eth.Contract(
          FarmMasterChef.abi,
          masterchefData.address
        );

        // ******
      */

      // ****** DO NOT DELETE THIS COMMENT
      // This is for if smart contract deployed through remix
      if (onCorrectChain) {
        const masterchef = new web3.eth.Contract(
          FarmMasterChef.abi,
          "0x3eBDF96C2932BAe3c27d617143B3c5675599cd54" // farm masterchef address here
        );

        // ******

        dispatch(connectSmartContractAction(masterchef));
        return true;
      } else {
        // if no network...
        console.log("Error: Wrong chain or no network detected");
        dispatch(disconnectWalletAction());
        return false;
      }
    } catch (error) {
      console.log(error);
      dispatch(disconnectWalletAction());
      return false;
    }

    ///
  };
};

const attemptToChangeChain = async (chain) => {
  // try to switch, if can't switch (either because user reject or dont have the chain id), then will give error
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIds[chain] }],
    });
    return true;
  } catch {
    console.log("User rejected");
    return false;
  }
};

// reducer here
const connectWalletReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CONNECTWALLET":
      return {
        ...state,
        address: action.payload.address,
        web3: action.payload.web3,
        walletConnected: true,
      };
    case "CHANGEWALLET":
      return { ...state, address: action.payload, walletConnected: true };
    case "DISCONNECTWALLET":
      return { ...state, address: "", walletConnected: false, masterchef: {} };
    case "CONNECTSMARTCONTRACT":
      return { ...state, masterchef: action.payload };
    case "CHANGECHAIN":
      return { ...state, chain: action.payload };
    default:
      return state;
  }
};

export {
  connectWalletReducer,
  connectWalletAction,
  changeWalletAction,
  disconnectWalletAction,
  connectSmartContractAction,
  attemptToConnectWallet,
  changeChainConnectWalletReducer,
};
