const FarmFactory = artifacts.require("FarmFactory");
const FarmToken = artifacts.require("FarmToken");
const FarmMasterChef = artifacts.require("FarmMasterChef");
const LpToken = artifacts.require("LpToken");

module.exports = async function (deployer, network, accounts) {
  const u1 = accounts[0];
  const u2 = accounts[1];

  // creation of FarmFactory & LP Tokens and minting tokens to users
  await deployer.deploy(FarmFactory);
  const factory = await FarmFactory.deployed();

  let createPool = await factory.createPool("LPTOKEN-1", "LP1");
  let createdPoolAddress = createPool.logs[0].args.pool;
  const lp1 = await LpToken.at(createdPoolAddress);

  createPool = await factory.createPool("LPTOKEN-2", "LP2");
  createdPoolAddress = createPool.logs[0].args.pool;
  const lp2 = await LpToken.at(createdPoolAddress);

  createPool = await factory.createPool("LPTOKEN-3", "LP3");
  createdPoolAddress = createPool.logs[0].args.pool;
  const lp3 = await LpToken.at(createdPoolAddress);

  await deployer.deploy(FarmToken);
  const token = await FarmToken.deployed();

  await deployer.deploy(FarmMasterChef, token.address);
  const masterchef = await FarmMasterChef.deployed();
  //  update masterchef address in farmtoken so that masterchef can mint tokens
  await token.updateMasterChef(masterchef.address);

  // mint tokens to users and approve spendings for token
  const toWei = (num) => {
    return (num * 10 ** 18).toString();
  };
  await factory.mintPoolTokens(0, toWei(100), u1);
  await factory.mintPoolTokens(0, toWei(100), u2);
  await factory.mintPoolTokens(1, toWei(100), u1);
  await factory.mintPoolTokens(1, toWei(100), u2);
  await factory.mintPoolTokens(2, toWei(100), u1);
  await factory.mintPoolTokens(2, toWei(100), u2);

  const uint256MaxAmount =
    "11579208923731619542357098500868790785326998466564056403945758400791312963993";
  await lp1.approve(masterchef.address, uint256MaxAmount);
  await lp1.approve(masterchef.address, uint256MaxAmount, { from: u2 });
  await lp2.approve(masterchef.address, uint256MaxAmount);
  await lp2.approve(masterchef.address, uint256MaxAmount, { from: u2 });
  await lp3.approve(masterchef.address, uint256MaxAmount);
  await lp3.approve(masterchef.address, uint256MaxAmount, { from: u2 });

  // add pools to masterchef
  await masterchef.add("50", lp1.address, true);
  await masterchef.add("30", lp2.address, true);
  await masterchef.add("20", lp3.address, true);
};
