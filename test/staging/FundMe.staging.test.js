const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundme, deployer
      const sendValue = ethers.utils.parseEther("1")
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        fundme = await ethers.getContract("FundMe", deployer)
      })

      it("allows people to fund and withdraw", async () => {
        await fundme.fund({ value: sendValue })
        await fundme.withdraw()
        const endingBalance = await fundme.provider.getBalance(fundme.address)
        assert(endingBalance.toString(), "0")
      })
    })
