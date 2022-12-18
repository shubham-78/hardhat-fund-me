const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
  const { deployer } = await getNamedAccounts()
  const fundme = await ethers.getContract("FundMe", deployer)
  console.log("withdraw contract...")
  const transactionResponse = await fundme.withdraw()
  await transactionResponse.wait(1)
  console.log("got it!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
