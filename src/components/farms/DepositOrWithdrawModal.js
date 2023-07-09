import { Button, Col, Input, Modal, Row } from "antd";
import { stringEthToWei, stringWeiToETH } from "../../utils/format";
import { useEffect, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";

const DepositOrWithdrawModal = (props) => {
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
    modalType,
    closeModal,
    showPendingNotification,
    showSuccessNotification,
    refreshBalances,
  } = props;

  const [allowanceIsLoading, setAllowanceIsLoading] = useState(true);
  const [allowance, setAllowance] = useState(0);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [disableButton, setDisableButton] = useState(false);

  const [buttonLoading, setButtonLoading] = useState(false);
  const [approveButtonLoading, setApproveButtonLoading] = useState(false);

  const uint256MaxAmount =
    "11579208923731619542357098500868790785326998466564056403945758400791312963993";

  const isDeposit = modalType === "Deposit" ? true : false;
  const balanceOrDeposit = () => {
    return modalType === "Deposit" ? balance : deposit;
  };
  const inputGreaterThanAllowance = () => {
    return parseFloat(stringEthToWei(input)) > parseFloat(allowance);
  };

  const handleButtonClick = async () => {
    setButtonLoading(true);
    try {
      let tokenAction;
      if (isDeposit) {
        tokenAction = await masterchef.methods
          .deposit(poolIndex, stringEthToWei(input))
          .send({ from: userAddress })
          .on("transactionHash", (hash) => {
            showPendingNotification("deposit");
          });
      } else {
        tokenAction = await masterchef.methods
          .withdraw(poolIndex, stringEthToWei(input))
          .send({ from: userAddress })
          .on("transactionHash", (hash) => {
            showPendingNotification("withdrawal");
          });
      }
      setButtonLoading(false);
      closeModal();

      const receipt = await web3.eth.getTransactionReceipt(
        tokenAction.transactionHash
      );
      showSuccessNotification(
        isDeposit ? "deposit" : "withdrawal",
        input,
        receipt.transactionHash,
        symbol
      );
      refreshBalances();
    } catch {
      setButtonLoading(false);
    }
  };
  const handleApprove = async () => {
    setApproveButtonLoading(true);

    try {
      const approveToken = await lpContract.methods
        .approve(masterchef._address, uint256MaxAmount)
        .send({ from: userAddress })
        .on("transactionHash", (hash) => {
          showPendingNotification("token approval");
        });
      let newAllowance = approveToken.events.Approval.returnValues.value;
      const receipt = await web3.eth.getTransactionReceipt(
        approveToken.transactionHash
      );
      setAllowance(newAllowance);
      setApproveButtonLoading(false);
      showSuccessNotification(
        "token approval",
        stringWeiToETH(newAllowance),
        receipt.transactionHash,
        symbol
      );
    } catch {
      setApproveButtonLoading(false);
    }
  };
  useEffect(() => {
    const getAllowance = async () => {
      const tokenAllowance = await lpContract.methods
        .allowance(userAddress, masterchef._address)
        .call();

      setAllowance(tokenAllowance);
      setAllowanceIsLoading(false);
    };
    getAllowance();
  }, []);
  return (
    <Modal
      visible={modalType ? true : false}
      footer={null}
      title={`${isDeposit ? "Deposit" : "Withdraw"} ${name} (${symbol})`}
      onCancel={closeModal}
    >
      {allowanceIsLoading ? (
        <LoadingOutlined />
      ) : (
        <div>
          <Row justify="space-between">
            <Col>Amount</Col>
            <Col>
              {isDeposit ? "Balance" : "Deposits"}:{" "}
              {stringWeiToETH(balanceOrDeposit())} {symbol}
            </Col>
          </Row>

          <Input
            size="large"
            type="number"
            suffix={
              <Button
                type="primary"
                onClick={() => {
                  setInput(stringWeiToETH(balanceOrDeposit()));
                  setInputError("");
                  setDisableButton(false);
                }}
              >
                MAX
              </Button>
            }
            value={input}
            onChange={(e) => {
              const regex = /^[0-9.]+$/;
              const value = e.target.value;
              if (value === "" || regex.test(value)) {
                setInput(value);
                if (
                  parseFloat(value) > parseFloat(balanceOrDeposit() / 10 ** 18)
                ) {
                  setInputError(
                    `Insufficient ${isDeposit ? "Balance" : "Deposits"}`
                  );
                  setDisableButton(true);
                } else {
                  setInputError("");
                  setDisableButton(false);
                }
              }
            }}
          />
          {inputError && (
            <p style={{ color: "red", marginBottom: "0px" }}>{inputError}</p>
          )}

          <Button
            type="primary"
            style={{ marginTop: "10px" }}
            block
            onClick={handleButtonClick}
            loading={buttonLoading}
            disabled={
              disableButton ||
              !input ||
              input === "0" ||
              (isDeposit && inputGreaterThanAllowance())
            }
          >
            {isDeposit ? "Deposit" : "Withdraw"}
          </Button>

          {isDeposit &&
            (allowance === "0" ||
              (inputGreaterThanAllowance() &&
                parseFloat(input) <= parseFloat(stringWeiToETH(balance)))) && (
              <Button
                type="primary"
                style={{ marginTop: "10px" }}
                block
                onClick={handleApprove}
                loading={approveButtonLoading}
              >
                Approve Token
              </Button>
            )}
          <p>
            Note: performing a {isDeposit ? "deposit" : "withdrawal"} will claim
            any pending FARM tokens
          </p>
        </div>
      )}
    </Modal>
  );
};

export default DepositOrWithdrawModal;
