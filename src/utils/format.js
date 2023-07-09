const BigNumber = require("bignumber.js");

function stringWeiToETH(numberString) {
  const dividedNumber = Number(numberString) / 10 ** 18;
  const formattedNumber = dividedNumber.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });

  return formattedNumber;
}

function stringEthToWei(numberString) {
  const number = new BigNumber(numberString);
  const multipliedNumber = number.times(new BigNumber(10).pow(18));
  const multipliedString = multipliedNumber.toFixed(0);

  return multipliedString;
}

export { stringWeiToETH, stringEthToWei };
