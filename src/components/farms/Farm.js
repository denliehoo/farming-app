import classes from "./Farm.module.css";
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import FarmItem from "./FarmItem";
import { Col, Row, notification } from "antd";
import LpToken from "../.././truffle_abis/LpToken.json";
import FarmToken from "../.././truffle_abis/FarmToken.json";
import { stringWeiToETH } from "../../utils/format";
import { RedoOutlined, LoadingOutlined } from "@ant-design/icons";

const Farm = ({ props, web3, masterchef, address: userAddress }) => {
  const [farms, setFarms] = useState([]);
  const defaultFarms = [
    { name: "LPTOKEN-1", symbol: "LP1" },
    { name: "LPTOKEN-2", symbol: "LP2" },
    { name: "LPTOKEN-3", symbol: "LP3" },
  ];
  const [isLoading, setIsLoading] = useState(true);
  const [api, contextHolder] = notification.useNotification();
  const [isRefresh, setIsRefresh] = useState(false);
  const [userFarmBalance, setUserFarmBalance] = useState(0);

  const showNotificationHandler = (
    message,
    description,
    icon,
    placement,
    duration
  ) => {
    api.open({
      message: message,
      description: description,
      icon: icon,
      placement: placement,
      duration: duration,
    });
  };

  useEffect(() => {
    setIsLoading(true);
    const getPoolInfo = async () => {
      const poolLength = await masterchef.methods.poolLength().call();
      const temp = [];
      const farmTokenAddress = await masterchef.methods.farm().call();
      const farmToken = new web3.eth.Contract(FarmToken.abi, farmTokenAddress);
      const farmTokenBalance = await farmToken.methods
        .balanceOf(userAddress)
        .call();
      for (let i = 0; i < poolLength; i++) {
        const poolInfo = await masterchef.methods.poolInfo(i).call();
        const tokenAddress = poolInfo.lpToken;
        const contract = new web3.eth.Contract(LpToken.abi, tokenAddress);

        const userBalance = await contract.methods
          .balanceOf(userAddress)
          .call();
        const userRewards = await masterchef.methods
          .pendingFarm(i.toString(), userAddress)
          .call();
        const userDeposits = await masterchef.methods
          .userInfo(i.toString(), userAddress)
          .call();

        temp.push({
          tokenAddress: tokenAddress,
          name: `LPTOKEN-${i + 1}`,
          symbol: `LP${i + 1}`,
          lpContract: contract,
          poolIndex: i.toString(),
          balance: userBalance.toString(),
          rewards: userRewards.toString(),
          deposit: userDeposits.amount.toString(),
        });
      }
      setFarms(temp);
      setUserFarmBalance(stringWeiToETH(farmTokenBalance));
      setIsLoading(false);
    };
    if (masterchef) {
      getPoolInfo();
    }
  }, [masterchef, isRefresh, userAddress]);
  return (
    <div>
      <Row span={24} justify="center">
        {contextHolder}
        <Col
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Row>
            <div
              style={{
                textAlign: "center",
                fontSize: "24px",
                marginBottom: "10px",
              }}
            >
              <b>Deposit LPTOKENS, Earn FARM</b>
            </div>
          </Row>
          <Row justify="space-between" style={{ width: "50%" }}>
            <Col>
              <Row>You have {isLoading ? 0 : userFarmBalance} FARM Tokens</Row>
            </Col>
            <Col>
              <p
                onClick={() => setIsRefresh(!isRefresh)}
                style={{ cursor: "pointer" }}
              >
                Refresh Balances{" "}
                {isLoading ? <LoadingOutlined /> : <RedoOutlined />}
              </p>
            </Col>
          </Row>
          {(isLoading ? defaultFarms : farms).map((f) => (
            <div className={classes.card}>
              <FarmItem
                farmDetails={f}
                web3={web3}
                masterchef={masterchef}
                userAddress={userAddress}
                showNotificationHandler={showNotificationHandler}
                refreshBalances={() => setIsRefresh(!isRefresh)}
                isLoading={isLoading}
              />
            </div>
          ))}
        </Col>
      </Row>
    </div>
  );
};

const mapStateToProps = ({ connectWalletReducer }, ownProps) => ({
  props: ownProps,
  masterchef: connectWalletReducer.masterchef,
  address: connectWalletReducer.address,
  web3: connectWalletReducer.web3,
});

export default connect(mapStateToProps)(Farm);
