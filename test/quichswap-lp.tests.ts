import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { getFactories } from "../utils/factories";

const fromWei = ethers.utils.formatEther;
const toWei = ethers.utils.parseEther;

describe("Contract: QuichswapLiquidityProviding", function () {
  let contracts: {
    qchToken: Contract;
    sampleToken: Contract;
    lpToken: Contract;
    lpContract: Contract;
  };
  let signers: SignerWithAddress[];

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const {
      QuichesTokenFactory,
      SampleTokenFactory,
      LPTokenFactory,
      QuichswapLiquidityProvidingFactory,
    } = await getFactories();

    const qchToken = await QuichesTokenFactory.deploy();
    const sampleToken = await SampleTokenFactory.deploy();
    const lpToken = await LPTokenFactory.deploy("QCHSTLP");
    const lpContract = await QuichswapLiquidityProvidingFactory.deploy(
      sampleToken.address,
      qchToken.address,
      lpToken.address
    );

    await qchToken.addAdmin(lpContract.address);
    await qchToken.addAdmin(signers[0].address);
    await lpToken.addAdmin(lpContract.address);
    await lpToken.addAdmin(signers[0].address);
    await sampleToken.mint(signers[1].address, toWei("5000"));
    await sampleToken.mint(signers[2].address, toWei("5000"));
    await qchToken.connect(signers[0]).mint(signers[1].address, toWei("5000"));
    await qchToken.connect(signers[0]).mint(signers[2].address, toWei("5000"));

    contracts = {
      qchToken,
      sampleToken,
      lpToken,
      lpContract,
    };
  });

  it("Test calculate ratio with 1:3", async () => {
    const { lpContract, sampleToken, qchToken } = contracts;
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await sampleToken.mint(lpContract.address, toWei("2000"));
    await qchToken.mint(lpContract.address, toWei("1000"));

    const qchTokenRatio = await lpContract.getToken2Ratio();
    const stTokenRatio = await lpContract.getToken1Ratio();

    expect(Number(fromWei(qchTokenRatio)).toFixed(2)).to.equal("0.33");
    expect(Number(fromWei(stTokenRatio)).toFixed(2)).to.equal("0.67");
  });

  it("Test amount of token2 with 1:3", async () => {
    const { lpContract, sampleToken, qchToken } = contracts;
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await sampleToken.mint(lpContract.address, toWei("2000"));
    await qchToken.mint(lpContract.address, toWei("1000"));

    const amountOfToken1 = 600;
    const amountOfToken2 = await lpContract.getAmountOfToken2(
      toWei(amountOfToken1.toString())
    );

    expect(fromWei(amountOfToken2)).to.equal("300.0");
  });

  it("Test amount of token1 with 1:3", async () => {
    const { lpContract, sampleToken, qchToken } = contracts;
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await sampleToken.mint(lpContract.address, toWei("2000"));
    await qchToken.mint(lpContract.address, toWei("1000"));

    const amountOfToken2 = 300;
    const amountOfToken1 = await lpContract.getAmountOfToken1(
      toWei(amountOfToken2.toString())
    );

    expect(fromWei(amountOfToken1)).to.equal("600.0");
  });

  it("Test revert transaction because of wrong ratio", async () => {
    const { lpContract, sampleToken, qchToken } = contracts;
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await sampleToken.mint(lpContract.address, toWei("2000"));
    await qchToken.mint(lpContract.address, toWei("1000"));

    await expect(
      lpContract.connect(account1).addLiquidity(toWei("500"), toWei("500"))
    ).to.be.revertedWith("Wrong ratio");
  });

  it("Test add liquidity", async () => {
    const { lpContract, sampleToken, qchToken, lpToken } = contracts;
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await sampleToken.mint(lpContract.address, toWei("2000"));
    await qchToken.mint(lpContract.address, toWei("1000"));

    await sampleToken
      .connect(account1)
      .approve(lpContract.address, toWei("600"));
    await qchToken.connect(account1).approve(lpContract.address, toWei("300"));
    await lpContract.connect(account1).addLiquidity(toWei("600"), toWei("300"));

    const lpTokenBalance = await lpToken.balanceOf(account1.address);
    const qchTokenBalance = await qchToken.balanceOf(lpContract.address);
    const sampleTokenBalance = await sampleToken.balanceOf(lpContract.address);

    expect(Number(fromWei(lpTokenBalance))).to.equal(500);
    expect(fromWei(qchTokenBalance)).to.equal("1300.0");
    expect(fromWei(sampleTokenBalance)).to.equal("2600.0");
  });

  it("Test lp token composition", async () => {
    // eslint-disable-next-line no-unused-vars
    const [owner, account1] = signers;
    const { lpContract, sampleToken, qchToken, lpToken } = contracts;

    await sampleToken.mint(lpContract.address, toWei("2000"));
    await qchToken.mint(lpContract.address, toWei("1000"));
    await lpToken.mint(owner.address, toWei("1000"));

    const lpTokenSupply = await lpToken.totalSupply();
    const lpTokenComposition = await lpContract.getLpTokenComposition(
      toWei("250")
    );

    expect(Number(fromWei(lpTokenSupply))).to.equal(1000);
    expect(fromWei(lpTokenComposition[0])).to.equal("500.0");
    expect(fromWei(lpTokenComposition[1])).to.equal("250.0");
  });

  it("Test remove liquidity", async () => {
    const { lpContract, sampleToken, qchToken, lpToken } = contracts;
    // eslint-disable-next-line no-unused-vars
    const [owner, account1] = signers;

    await qchToken.mint(lpContract.address, toWei("1000"));
    await sampleToken.mint(lpContract.address, toWei("1000"));
    await lpToken.mint(owner.address, toWei("1000"));

    const amountToken2 = await lpContract.getAmountOfToken2(toWei("600"));
    await qchToken.connect(account1).approve(lpContract.address, amountToken2);
    await sampleToken
      .connect(account1)
      .approve(lpContract.address, toWei("600"));
    await lpContract.connect(account1).addLiquidity(toWei("600"), amountToken2);
    await lpContract.connect(account1).removeLiquidity(toWei("250"));

    const lpTokenBalance = await lpToken.balanceOf(account1.address);
    const lpTokenSupply = await lpToken.totalSupply();
    const qchTokenBalance = await qchToken.balanceOf(lpContract.address);
    const sampleTokenBalance = await sampleToken.balanceOf(lpContract.address);

    expect(Number(fromWei(lpTokenSupply))).to.equal(1350);
    expect(Number(fromWei(lpTokenBalance))).to.equal(350);
    expect(fromWei(qchTokenBalance)).to.equal("1350.0");
    expect(fromWei(sampleTokenBalance)).to.equal("1350.0");
  });
});
