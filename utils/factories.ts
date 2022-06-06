// @ts-ignore
// eslint-disable-next-line node/no-unpublished-import
import { ethers } from "hardhat";

export const getFactories = async () => ({
  QuichesTokenFactory: await ethers.getContractFactory("QuichesToken"),
  SampleTokenFactory: await ethers.getContractFactory("SampleToken"),
  LPTokenFactory: await ethers.getContractFactory("LPToken"),
  QuichswapStackingFactory: await ethers.getContractFactory(
    "QuichswapStacking"
  ),
  QuichswapLiquidityProvidingFactory: await ethers.getContractFactory(
    "QuichswapLiquidityProviding"
  ),
});
