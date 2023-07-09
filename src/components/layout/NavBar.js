import classes from "./NavBar.module.css";
import { Menu, Drawer } from "antd";
import { connect } from "react-redux";
import {
  changeWalletAction,
  disconnectWalletAction,
  attemptToConnectWallet,
} from "../../reducers/connectWalletReducer";
import { useEffect, useRef, useState } from "react";
import goerliLogo from "../../assets/images/goerliLogo.svg";
import IconComponent from "../shared/IconComponent";
import { useWindowSize } from "../../hooks/useWindowSize";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import ConnectWalletPopup from "../shared/ConnectWalletPopUp";

const NavBar = ({
  changeWalletAction,
  disconnectWalletAction,
  attemptToConnectWallet,
  address,
  walletConnected,
  chain,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [userClickNetwork, setIsUserClickNetwork] = useState(false);
  const { width } = useWindowSize();
  const userClickNetworkRef = useRef(userClickNetwork);

  const openDrawer = () => {
    setShowDrawer(true);
  };
  const closeDrawer = () => {
    setShowDrawer(false);
  };

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        await attemptToConnectWallet(chain);
      } else {
        console.log("MetaMask is not installed");
      }
    };

    checkMetaMaskConnection();
  }, []);

  useEffect(() => {
    width > 500 && closeDrawer();
  }, [width]);

  useEffect(() => {
    userClickNetworkRef.current = userClickNetwork;
  }, [userClickNetwork]);

  useEffect(() => {
    if (walletConnected && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        changeWalletAction(accounts[0]);
      });
      window.ethereum.on("chainChanged", async (chainId) => {
        if (!userClickNetworkRef.current) {
          disconnectWalletAction();
          await attemptToConnectWallet(chain);
          setIsUserClickNetwork(false);
        }
      });
    } else {
    }
  }, [walletConnected, userClickNetwork]);

  const connectWalletHandler = async () => {
    if (!walletConnected) {
      await attemptToConnectWallet(chain);
    }
  };

  const addressOrConnectButton = (
    <span>
      {address ? (
        <span>{address.substring(0, 4) + "..." + address.slice(-4)}</span>
      ) : window.ethereum ? (
        <span onClick={connectWalletHandler}>Connect Wallet</span>
      ) : (
        <ConnectWalletPopup />
      )}
    </span>
  );
  const walletConnectPortion =
    walletConnected && address
      ? {
          label: addressOrConnectButton,
          key: "connectWallet",
          children: [
            {
              label: <div onClick={disconnectWalletAction}>Disconnect</div>,
              key: "disconnectWallet",
            },
          ],
        }
      : { label: addressOrConnectButton, key: "connectWallet" };

  const rightItems = [
    {
      label: (
        <span>
          <IconComponent imgUrl={goerliLogo} /> Goerli
        </span>
      ),
      key: "networkName",
    },
    walletConnectPortion,
  ];
  return (
    <nav className={classes.navBar}>
      <div className={classes.leftItem}>
        <div
          style={{ fontSize: "large", paddingTop: "10px", paddingLeft: "30px" }}
        >
          Farming App
        </div>
      </div>

      <div className={classes.rightItems}>
        {width < 500 ? (
          <>
            <div className={classes.hamburgerMenu} onClick={openDrawer}>
              <MenuOutlined />
            </div>
            <Drawer
              title={null}
              headerStyle={{ border: 0 }}
              placement="right"
              onClose={closeDrawer}
              visible={showDrawer}
              width={width}
              closeIcon={<CloseOutlined style={{ color: "#00b4d8" }} />}
            >
              <Menu
                items={rightItems}
                mode={"inline"}
                className={classes.antdMenu}
              />
            </Drawer>
          </>
        ) : (
          <>
            <Menu
              items={rightItems}
              mode={"horizontal"}
              className={classes.antdMenu}
            />
          </>
        )}
      </div>
    </nav>
  );
};

const mapStateToProps = ({ connectWalletReducer }) => ({
  address: connectWalletReducer.address,
  walletConnected: connectWalletReducer.walletConnected,
  chain: connectWalletReducer.chain,
});

const mapDispatchToProps = (dispatch) => ({
  changeWalletAction: (payload) => dispatch(changeWalletAction(payload)),
  disconnectWalletAction: () => dispatch(disconnectWalletAction()),
  attemptToConnectWallet: (chain) => dispatch(attemptToConnectWallet(chain)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NavBar);
