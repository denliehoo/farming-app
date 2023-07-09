const FarmFactory = artifacts.require("FarmFactory");
const FarmToken = artifacts.require("FarmToken");
const FarmMasterChef = artifacts.require("FarmMasterChef");
const LpToken = artifacts.require("LpToken");
const { assert } = require("chai");

require("chai").use(require("chai-as-promised")).should();

// Note: this testing is done AFTER the actions taken in the migrations file
// specified at 2_main_migration.js ; i.e. 3 different lptokens were created from
// the factory and minted to u1 and u2, u1 and u2 has approved the tokens for
//  spending by the masterchef, and the 3 lp tokens were added as a pool in masterchef
// add a 50:30:20 ratio
contract("Test for contracts", (accounts) => {
  let factory, token, lp1, lp2, lp3, masterchef;
  const u1 = accounts[0];
  const u2 = accounts[1];

  const toWei = (num) => {
    return (num * 10 ** 18).toString();
  };
  // simulate waiting for next block
  async function waitForNextBlock() {
    await web3.eth.sendTransaction({ from: u1, to: u1, value: 0 });
  }

  before(async () => {
    // Load contracts
    token = await FarmToken.deployed();
    factory = await FarmFactory.deployed();
    masterchef = await FarmMasterChef.deployed();
    let poolAddress = await factory.lpTokens(0);
    lp1 = await LpToken.at(poolAddress);
    poolAddress = await factory.lpTokens(1);
    lp2 = await LpToken.at(poolAddress);
    poolAddress = await factory.lpTokens(2);
    lp3 = await LpToken.at(poolAddress);
  });

  describe("Checks for Factory", async () => {
    it("only owner can create pool", async () => {
      try {
        await factory.createPool("LPTOKEN-4", "LP-4", { from: u2 });
        assert.fail("Should revert since user 2 is not the owner");
      } catch {
        assert.ok("Transaction should fail");
      }
    });
    it("only owner can mint tokens", async () => {
      try {
        await factory.mintPoolTokens("0", toWei(100), u2, { from: u2 });
        assert.fail("Should revert since user 2 is not the owner");
      } catch {
        assert.ok("Transaction should fail");
      }
    });
  });

  describe("Checks for LpToken", async () => {
    it("only masterchef contract can mint tokens", async () => {
      try {
        await lp1.mint(u1, toWei(100));
        assert.fail("Should revert since user 1 is not the owner");
      } catch {
        assert.ok("Transaction should fail");
      }
    });
    it("LpToken contract owner should be factory", async () => {
      const ownerAddress = await lp1.owner();
      assert.equal(ownerAddress, factory.address);
    });
  });

  describe("Checks for Farm Token", async () => {
    it("only owner can update masterchef", async () => {
      try {
        await token.updateMasterChef(masterchef.address, { from: u2 });
        assert.fail("Should revert since user 2 is not the owner");
      } catch {
        assert.ok("Transaction should fail");
      }
    });
    it("only owner (or masterchef) can mint tokens", async () => {
      try {
        await token.mint("0", toWei(100), u2, { from: u2 });
        assert.fail("Should revert since user 2 is not the owner");
      } catch {
        assert.ok("Transaction should fail");
      }
    });
    it("masterchef address in FarmToken should be correct", async () => {
      const masterchefAddressInToken = await token.masterChef();
      assert.equal(masterchefAddressInToken, masterchef.address);
    });
  });

  describe("Checks for Masterchef", async () => {
    it("Users should have lpTokens", async () => {
      const u1Lp1Bal = await lp1.balanceOf(u1);
      const u2Lp3Bal = await lp3.balanceOf(u2);

      assert.equal(u1Lp1Bal.toString(), toWei(100));
      assert.equal(u2Lp3Bal.toString(), toWei(100));
    });
    it("Masterchef should have 3 pools", async () => {
      const poolLength = await masterchef.poolLength();
      assert.equal(poolLength.toString(), "3");
    });
    it("After depositing, U1 should earn rewards after 1 block", async () => {
      await masterchef.deposit("0", toWei(100));
      await masterchef.deposit("1", toWei(100));
      await masterchef.deposit("2", toWei(100));

      await waitForNextBlock(); // to allow rewards to vest..

      const u1lp1rewards = await masterchef.pendingFarm("0", u1);
      const u1lp2rewards = await masterchef.pendingFarm("1", u1);
      const u1lp3rewards = await masterchef.pendingFarm("2", u1);

      assert.equal(u1lp1rewards.toString(), toWei(100));
      assert.equal(u1lp2rewards.toString(), toWei(60));
      assert.equal(u1lp3rewards.toString(), toWei(40));
    });
    it("U1 should now earn lesser rewards now that U2 deposited", async () => {
      await masterchef.deposit("0", toWei(100), { from: u2 });
      await masterchef.deposit("1", toWei(100), { from: u2 });
      await masterchef.deposit("2", toWei(100), { from: u2 });

      await waitForNextBlock(); // to allow rewards to vest..

      const u1lp1rewards = await masterchef.pendingFarm("0", u1);
      const u1lp2rewards = await masterchef.pendingFarm("1", u1);
      const u1lp3rewards = await masterchef.pendingFarm("2", u1);
      const u2lp1rewards = await masterchef.pendingFarm("0", u2);
      const u2lp2rewards = await masterchef.pendingFarm("1", u2);
      const u2lp3rewards = await masterchef.pendingFarm("2", u2);

      // total of 400 Farms since it has been two blocks
      assert.equal(u1lp1rewards.toString(), toWei(150));
      assert.equal(u1lp2rewards.toString(), toWei(90));
      assert.equal(u1lp3rewards.toString(), toWei(60));
      assert.equal(u2lp1rewards.toString(), toWei(50));
      assert.equal(u2lp2rewards.toString(), toWei(30));
      assert.equal(u2lp3rewards.toString(), toWei(20));
    });
    it("U1 and U2 should have no lptokens after depositting", async () => {
      const u1Lp1Bal = await lp1.balanceOf(u1);
      const u2Lp3Bal = await lp3.balanceOf(u2);

      assert.equal(u1Lp1Bal.toString(), "0");
      assert.equal(u2Lp3Bal.toString(), "0");
    });
    it("U1 Should get back tokens and rewards after withdrawing", async () => {
      await masterchef.withdraw(0, toWei(100));
      await masterchef.withdraw(1, toWei(100));
      await masterchef.withdraw(2, toWei(100));

      const u1FarmBal = await token.balanceOf(u1);
      assert.equal(u1FarmBal.toString(), toWei(150 + 90 + 60));

      const u1Lp1Bal = await lp1.balanceOf(u1);
      const u1Lp2Bal = await lp2.balanceOf(u1);
      const u1Lp3Bal = await lp3.balanceOf(u1);

      assert.equal(u1Lp1Bal, toWei(100));
      assert.equal(u1Lp2Bal, toWei(100));
      assert.equal(u1Lp3Bal, toWei(100));

      const u1Lp1UserInfo = await masterchef.userInfo(0, u1);
      const u1Lp2UserInfo = await masterchef.userInfo(0, u1);
      const u1Lp3UserInfo = await masterchef.userInfo(0, u1);
      assert.equal(u1Lp1UserInfo.amount.toString(), 0);
      assert.equal(u1Lp2UserInfo.amount.toString(), 0);
      assert.equal(u1Lp3UserInfo.amount.toString(), 0);
    });

    it("U2 should be getting all the rewards now that U1 withdrew all tokens", async () => {
      await waitForNextBlock();

      const u1lp1rewards = await masterchef.pendingFarm("0", u1);
      const u1lp2rewards = await masterchef.pendingFarm("1", u1);
      const u1lp3rewards = await masterchef.pendingFarm("2", u1);

      const u2lp1rewards = await masterchef.pendingFarm("0", u2);
      const u2lp2rewards = await masterchef.pendingFarm("1", u2);
      const u2lp3rewards = await masterchef.pendingFarm("2", u2);

      assert.equal(u1lp1rewards.toString(), toWei(0));
      assert.equal(u1lp2rewards.toString(), toWei(0));
      assert.equal(u1lp3rewards.toString(), toWei(0));
      assert.equal(u2lp1rewards.toString(), toWei(50 + 100));
      assert.equal(u2lp2rewards.toString(), toWei(30 + 60));
      assert.equal(u2lp3rewards.toString(), toWei(20 + 40));
    });
    it("User 1 should not be able to withdraw 100 tokens again", async () => {
      try {
        await masterchef.withdraw(0, toWei(100));
        assert.fail("Should revert since user1 has 0 tokens in pool id 0");
      } catch {
        assert.ok("Transaction should fail");
      }
    });
  });
  it("Only owner can add more pools", async () => {
    try {
      await masterchef.add("50", lp1, true, { from: u2 });
      assert.fail("Should revert since user1 is now owner");
    } catch {
      assert.ok("Transaction should fail");
    }
  });
  // add more describes where necessary
});
