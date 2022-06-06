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

  /**  Stack ST/QCH  */
  const ST_QCH_StackingContract = await QuichswapStackingFactory.deploy(
    QCHTokenContract.address,
    SampleTokenContract.address
  );
  await ST_QCH_StackingContract.deployed();
  await QCHTokenContract.addAdmin(ST_QCH_StackingContract.address);

  /**  LP ST/QCH  */
  const STQCHTokenContract = await LPTokenFactory.deploy("STQCHLP");
  await STQCHTokenContract.deployed();
  const STCHTLPContract = await QuichswapLiquidityProvidingFactory.deploy(
    SampleTokenContract.address,
    QCHTokenContract.address,
    STQCHTokenContract.address
  );
  await STCHTLPContract.deployed();
  await STQCHTokenContract.addAdmin(STCHTLPContract.address);

  /**  Stack STQCHLP/QCH  */
  const STQCHLP_QCH_StackingContract = await QuichswapStackingFactory.deploy(
    QCHTokenContract.address,
    STQCHTokenContract.address
  );
  await STQCHLP_QCH_StackingContract.deployed();
  await QCHTokenContract.addAdmin(ST_QCH_StackingContract.address);

  console.log("QCHTokenContract address: ", QCHTokenContract.address);
  console.log("SampleTokenContract address:", SampleTokenContract.address);
  console.log(
    "ST_QCH_StackingContract address:",
    ST_QCH_StackingContract.address
  );
  console.log("STQCHTokenContract address: ", STQCHTokenContract.address);
  console.log("STCHTLPContract address: ", STCHTLPContract.address);
  console.log(
    "STQCHLP_QCH_StackingContract address: ",
    STQCHLP_QCH_StackingContract.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
