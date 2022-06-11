/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { getFactories } from "../utils/factories";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  /** Factories  **/
  const {
    QuichesTokenFactory,
    SampleTokenFactory,
    LPTokenFactory,
    QuichswapStackingFactory,
    QuichswapLiquidityProvidingFactory,
  } = await getFactories();

  /**  Tokens  **/
  const QCHTokenContract = await QuichesTokenFactory.deploy();
  await QCHTokenContract.deployed();

  const SampleTokenContract = await SampleTokenFactory.deploy();
  await SampleTokenContract.deployed();

  /**  Stack QCH/QCH  */
  const QCH_StackingContract = await QuichswapStackingFactory.deploy(
    QCHTokenContract.address,
    SampleTokenContract.address
  );
  await QCH_StackingContract.deployed();
  await QCHTokenContract.addAdmin(QCH_StackingContract.address);

  /**  Stack ST/QCH  */
  const ST_StackingContract = await QuichswapStackingFactory.deploy(
    QCHTokenContract.address,
    SampleTokenContract.address
  );
  await ST_StackingContract.deployed();
  await QCHTokenContract.addAdmin(ST_StackingContract.address);

  /**  LP ST/QCH  */
  const STQCH_LPTokenContract = await LPTokenFactory.deploy("STQCHLP");
  await STQCH_LPTokenContract.deployed();
  const STQCH_LiquidityProvidingContract =
    await QuichswapLiquidityProvidingFactory.deploy(
      SampleTokenContract.address,
      QCHTokenContract.address,
      STQCH_LPTokenContract.address
    );
  await STQCH_LiquidityProvidingContract.deployed();
  await STQCH_LPTokenContract.addAdmin(
    STQCH_LiquidityProvidingContract.address
  );

  /**  Stack STQCHLP/QCH  */
  const STQCHLP_StackingContract = await QuichswapStackingFactory.deploy(
    QCHTokenContract.address,
    STQCH_LPTokenContract.address
  );
  await STQCHLP_StackingContract.deployed();
  await QCHTokenContract.addAdmin(ST_StackingContract.address);

  console.log({
    SampleTokenContract: SampleTokenContract.address,
    QCHTokenContract: QCHTokenContract.address,
    STQCH_LPTokenContract: STQCH_LPTokenContract.address,
    ST_StackingContract: ST_StackingContract.address,
    QCH_StackingContract: QCH_StackingContract.address,
    STQCH_LiquidityProvidingContract: STQCH_LiquidityProvidingContract.address,
    STQCHLP_StackingContract: STQCHLP_StackingContract.address,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
