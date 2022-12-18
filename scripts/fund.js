const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
  const { deployer } = await getNamedAccounts()
  const fundme = await ethers.getContract("FundMe", deployer)
  console.log("funding contract...")
  const transactionResponse = await fundme.fund({
    value: ethers.utils.parseEther("0.1"),
  })
  await transactionResponse.wait(1)
  console.log("funded!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
