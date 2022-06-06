import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { getFactories } from "../utils/factories";

const fromWei = ethers.utils.formatEther;
const toWei = ethers.utils.parseEther;

describe("Contract: QuichesToken", function () {
  let contract: Contract;
  let signers: SignerWithAddress[];

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const { QuichesTokenFactory } = await getFactories();
    contract = await QuichesTokenFactory.deploy();
  });

  it("Test the mint token without adding the account from the admin list", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await expect(
      contract.connect(account1).mint(account1.address, toWei("10"))
    ).to.revertedWith("Adminable: caller is not admin");
  });

  it("Test the token mint by adding the account from the admin list", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await contract.addAdmin(account1.address);

    await contract.connect(account1).mint(account1.address, toWei("10"));
    const accountBalance = await contract.balanceOf(account1.address);

    expect(fromWei(accountBalance)).to.equal("10.0");
  });

  it("Test the token mint by adding and removing the account from the admin list", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1] = signers;

    await contract.addAdmin(account1.address);
    await contract.removeAdmin(account1.address);

    await expect(
      contract.connect(account1).mint(account1.address, toWei("10"))
    ).to.revertedWith("Adminable: caller is not admin");
  });

  it("Test the token mint by adding the account from the admin list", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_, account1, account2] = signers;

    await contract.addAdmin(account1.address);

    await contract.connect(account1).mint(account1.address, toWei("10"));
    await contract.connect(account1).transfer(account2.address, toWei("7"));
    const account1Balance = await contract.balanceOf(account1.address);
    const account2Balance = await contract.balanceOf(account2.address);

    expect(fromWei(account1Balance)).to.equal("3.0");
    expect(fromWei(account2Balance)).to.equal("7.0");
  });
});
