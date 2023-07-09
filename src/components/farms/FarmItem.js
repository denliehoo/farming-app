// import classes from "./FarmItem.module.css";
import { Button, Row, Col } from "antd";
import { useState } from "react";
import { stringWeiToETH } from "../../utils/format";
import DepositOrWithdrawModal from "./DepositOrWithdrawModal";
import { useWindowSize } from "../../hooks/useWindowSize";

import {
  LoadingOutlined,
  CheckCircleOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import ConnectWalletPopup from "../shared/ConnectWalletPopUp";
import { connect } from "react-redux";
import { attemptToConnectWallet } from "../../reducers/connectWalletReducer";

const FarmItem = ({ props, attemptToConnectWallet, chain }) => {
  const {
    tokenAddress,
    name,
    symbol,
    lpContract,
    poolIndex,
    balance,
    rewards,
    deposit,
  } = props.farmDetails;
  const {
    web3,
    masterchef,
    userAddress,
    isLoading,
    showNotificationHandler,
    refreshBalances,
  } = props;
  const [modalType, setModalType] = useState("");
  const [claimButtonLoading, setClaimButtonLoading] = useState(false);
  const { width } = useWindowSize();

  // break point 640px
  const showPendingNotification = (type) => {
    showNotificationHandler(
      `Your ${type} has been submitted`,
      "Please wait for transaction to be mined",
      <LoadingOutlined />,
      "topRight",
      15
    );
  };
  const showSuccessNotification = (type, amount, hash, symbol) => {
    showNotificationHandler(
      "Success",
      <span>
        Your {type} of {amount} {symbol} is successful
        <a href={`https://goerli.etherscan.io/tx/${hash}`} target="_blank">
          <ScanOutlined />
        </a>
      </span>,
      <CheckCircleOutlined />,
      "topRight",
      15
    );
  };

  const onClaimHandler = async () => {
    setClaimButtonLoading(true);
    try {
      const claimRewards = await masterchef.methods
        .withdraw(poolIndex, "0") // withdraw and set amount to 0 to claim
        .send({ from: userAddress })
        .on("transactionHash", (hash) => {
          showPendingNotification("claim");
        });
      const receipt = await web3.eth.getTransactionReceipt(
        claimRewards.transactionHash
      );
      showSuccessNotification(
        "claim",
        stringWeiToETH(rewards),
        receipt.transactionHash,
        "FARM"
      );
      refreshBalances();
      setClaimButtonLoading(false);
    } catch {
      setClaimButtonLoading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <Row span={24}>
        <b>
          {name} ({symbol})
        </b>
      </Row>
      {width > 650 ? (
        <div>
          <Row span={24}>
            <Col span={8}>Your Deposits</Col>
            <Col span={8}>Your Rewards</Col>
            <Col span={8}>Your Balance</Col>
          </Row>
          <Row span={24}>
            <Col span={8} style={{ color: "#ffffff" }}>
              {deposit ? stringWeiToETH(deposit) : 0}
            </Col>
            <Col span={8} style={{ color: "#ffffff" }}>
              {rewards ? stringWeiToETH(rewards) : 0}
            </Col>
            <Col span={8} style={{ color: "#ffffff" }}>
              {balance ? stringWeiToETH(balance) : 0}
            </Col>
          </Row>
        </div>
      ) : (
        <div>
          <Row span={24}>
            Your Deposits:
            <span style={{ color: "#ffffff" }}>
              {deposit ? stringWeiToETH(deposit) : 0}
            </span>
          </Row>
          <Row span={24}>
            Your Rewards:
            <span style={{ color: "#ffffff" }}>
              {rewards ? stringWeiToETH(rewards) : 0}
            </span>
          </Row>
          <Row span={24}>
            Your Balance:
            <span style={{ color: "#ffffff" }}>
              {balance ? stringWeiToETH(balance) : 0}
            </span>
          </Row>
        </div>
      )}
      <Row justify="end" style={{ marginTop: "10px" }}>
        {userAddress ? (
          <div>
            <Button
              type="primary"
              disabled={isLoading || rewards === "0"}
              onClick={onClaimHandler}
              loading={claimButtonLoading}
              style={{
                marginLeft: width < 650 ? "0px" : "10px",
                marginBottom: width < 650 ? "5px" : "none",
              }}
              block={width < 650}
            >
              Claim
            </Button>
            {/* on click deposit open modal */}
            <Button
              type="primary"
              disabled={isLoading}
              onClick={() => setModalType("Deposit")}
              style={{
                marginLeft: width < 650 ? "0px" : "10px",
                marginBottom: width < 650 ? "5px" : "none",
              }}
              block={width < 650}
            >
              Deposit
            </Button>
            {/* on click withdraw open modal */}
            <Button
              type="primary"
              disabled={isLoading}
              onClick={() => setModalType("Withdraw")}
              style={{
                marginLeft: width < 650 ? "0px" : "10px",
                marginBottom: width < 650 ? "5px" : "none",
              }}
              block={width < 650}
            >
              Withdraw
            </Button>
          </div>
        ) : (
          <Button type="primary" onClick={() => attemptToConnectWallet(chain)}>
            {window.ethereum ? (
              "Connect Wallet"
            ) : (
              <ConnectWalletPopup placement="top" />
            )}
          </Button>
        )}
      </Row>
      {/* Modals */}
      {modalType && (
        <DepositOrWithdrawModal
          modalType={modalType}
          closeModal={() => setModalType("")}
          farmDetails={props.farmDetails}
          web3={web3}
          masterchef={masterchef}
          userAddress={userAddress}
          showPendingNotification={showPendingNotification}
          showSuccessNotification={showSuccessNotification}
          refreshBalances={refreshBalances}
        />
      )}
    </div>
  );
};
const mapStateToProps = ({ connectWalletReducer }, ownProps) => ({
  props: ownProps,
  chain: connectWalletReducer.chain,
});

const mapDispatchToProps = (dispatch) => ({
  attemptToConnectWallet: (chain) => dispatch(attemptToConnectWallet(chain)),
});

export default connect(mapStateToProps, mapDispatchToProps)(FarmItem);
