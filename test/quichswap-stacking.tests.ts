import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { getFactories } from "../utils/factories";

const fromWei = ethers.utils.formatEther;
const toWei = ethers.utils.parseEther;

describe("Contract: QuichswapStacking", function () {
  let contracts: {
    tokenContract: Contract;
    sampleTokenContract: Contract;
    stackingContract: Contract;
  };
  let signers: SignerWithAddress[];

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const {
      QuichesTokenFactory,
      SampleTokenFactory,
      QuichswapStackingFactory,
    } = await getFactories();

    const token = await QuichesTokenFactory.deploy();
    const sampleToken = await SampleTokenFactory.deploy();
    const stacking = await QuichswapStackingFactory.deploy(
      token.address,
      sampleToken.address
    );

    await token.addAdmin(stacking.address);
    await sampleToken.mint(signers[1].address, toWei("5000"));
    await sampleToken.mint(signers[2].address, toWei("5000"));

    contracts = {
      tokenContract: token,
      sampleTokenContract: sampleToken,
      stackingContract: stacking,
    };
  });

  /**  Testing account balance  **/
  it("Test that account1 is supplied with stackable tokens", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;
    const { sampleTokenContract } = contracts;

    const accountBalance = await sampleTokenContract.balanceOf(
      account1.address
    );

    expect(fromWei(accountBalance)).to.equal("5000.0");
  });

  /**  Testing stack method  **/
  it("Test smart contract and account balances after stacking", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;
    const { sampleTokenContract, stackingContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("150"));
    await stackingContract.connect(account1).stack(toWei("150"));

    const accountBalance = await sampleTokenContract.balanceOf(
      account1.address
    );

    const contractBalance = await sampleTokenContract.balanceOf(
      stackingContract.address
    );

    expect(fromWei(accountBalance)).to.equal("4850.0");
    expect(fromWei(contractBalance)).to.equal("150.0");
  });

  it("Test total stacked variable after stacking", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1, account2] = signers;
    const { sampleTokenContract, stackingContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("2000.23"));
    await stackingContract.connect(account1).stack(toWei("2000.23"));

    await sampleTokenContract
      .connect(account2)
      .approve(stackingContract.address, toWei("457.5"));
    await stackingContract.connect(account2).stack(toWei("457.5"));

    const totalStacked = await stackingContract.totalStacked();

    expect(fromWei(totalStacked)).to.equal("2457.73");
  });

  it("Test total account stacked after several stacking", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;
    const { sampleTokenContract, stackingContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("1456.11"));
    await stackingContract.connect(account1).stack(toWei("1456.11"));

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("1000.20"));
    await stackingContract.connect(account1).stack(toWei("1000.20"));

    const stackedByUser = await stackingContract.getTotalStackedByOwner(
      account1.address
    );

    expect(fromWei(stackedByUser)).to.equal("2456.31");
  });

  /**  Testing unstack method  **/
  it("Test smart contract and account balances after unstacking", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;
    const { sampleTokenContract, stackingContract, tokenContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("4000"));
    await stackingContract.connect(account1).stack(toWei("4000"));

    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    await stackingContract.connect(account1).unstack(toWei("1150"));
    await stackingContract.connect(account1).unstack(toWei("750"));

    const accountBalance = await sampleTokenContract.balanceOf(
      account1.address
    );

    const contractBalance = await sampleTokenContract.balanceOf(
      stackingContract.address
    );

    const rewardTokenBalance = await tokenContract.balanceOf(account1.address);
    const expectedRewardAmount = 0.95;

    const tokensStackedByAccount =
      await stackingContract.getTotalStackedByOwner(account1.address);

    expect(fromWei(accountBalance)).to.equal("2900.0");
    expect(fromWei(contractBalance)).to.equal("2100.0");
    expect(fromWei(tokensStackedByAccount)).to.equal("2100.0");
    expect(Number(fromWei(rewardTokenBalance))).to.be.at.within(
      expectedRewardAmount - expectedRewardAmount * 0.03,
      expectedRewardAmount + expectedRewardAmount * 0.03
    );
  });

  it("Test total stacked variable after unstacking", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1, account2] = signers;
    const { sampleTokenContract, stackingContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("2000"));
    await stackingContract.connect(account1).stack(toWei("2000"));

    await sampleTokenContract
      .connect(account2)
      .approve(stackingContract.address, toWei("1600"));
    await stackingContract.connect(account2).stack(toWei("1600"));

    await stackingContract.connect(account1).unstack(toWei("1150"));
    await stackingContract.connect(account1).unstack(toWei("750"));

    await stackingContract.connect(account2).unstack(toWei("700"));

    const totalStacked = await stackingContract.totalStacked();

    expect(fromWei(totalStacked)).to.equal("1000.0");
  });

  it("Test total account stacked after several unstacking", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1, account2] = signers;
    const { sampleTokenContract, stackingContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("2000"));
    await stackingContract.connect(account1).stack(toWei("2000"));

    await stackingContract.connect(account1).unstack(toWei("1150"));
    await stackingContract.connect(account1).unstack(toWei("750"));

    const stackedByUser = await stackingContract.getTotalStackedByOwner(
      account1.address
    );

    expect(fromWei(stackedByUser)).to.equal("100.0");
  });

  /**  Testing reward amount method  **/
  it("Test reward amount", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;
    const { sampleTokenContract, stackingContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("800"));
    await stackingContract.connect(account1).stack(toWei("150"));

    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    await stackingContract.connect(account1).stack(toWei("574"));

    await network.provider.send("evm_increaseTime", [1800]);
    await network.provider.send("evm_mine");

    await stackingContract.connect(account1).stack(toWei("76"));

    const rewardAmount = await stackingContract.getTotalRewardAmount(
      account1.address
    );
    const expectedRewardAmount = 0.256;

    expect(Number(fromWei(rewardAmount))).to.be.within(
      expectedRewardAmount - expectedRewardAmount * 0.03,
      expectedRewardAmount + expectedRewardAmount * 0.03
    );
  });

  /**  Testing reward claim method  **/
  it("Test QCH balance after claim rewards", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;
    const { sampleTokenContract, stackingContract, tokenContract } = contracts;

    await sampleTokenContract
      .connect(account1)
      .approve(stackingContract.address, toWei("724"));
    await stackingContract.connect(account1).stack(toWei("150"));
    await stackingContract.connect(account1).stack(toWei("574"));

    await network.provider.send("evm_increaseTime", [3600 * 2]);
    await network.provider.send("evm_mine");

    await stackingContract.connect(account1).claim();

    const rewardsPerHour = await stackingContract.rewardsPerHour();
    const expectedRewardAmount = String(
      (150 + 574) * 2 * Number(fromWei(rewardsPerHour))
    );

    const rewardBalance = await tokenContract.balanceOf(account1.address);

    const availableRewardAmount = await stackingContract.getTotalRewardAmount(
      account1.address
    );

    expect(Number(fromWei(rewardBalance))).to.be.within(
      Number(expectedRewardAmount) - Number(expectedRewardAmount) * 0.03,
      Number(expectedRewardAmount) + Number(expectedRewardAmount) * 0.03
    );

    expect(fromWei(availableRewardAmount)).to.equal("0.0");
  });
});
