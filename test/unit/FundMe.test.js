const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundme, deployer, mockV3Aggregator
      const sendValue = ethers.utils.parseEther("1") // it eill convert 1 to 1 ether  by putting 18 zeros
      beforeEach(async () => {
        //deploy our fundme contract using hardhat deploy
        //const accounts = await ethers.getSigners() //result the list of accounts from hardhat-helper file based on network
        deployer = (await getNamedAccounts()).deployer // to get account holder name whos deploying the contract
        await deployments.fixture(["all"]) //fixture function run all script sunder deploy folder
        fundme = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async () => {
        it("sets the aggregator address correctly", async () => {
          const response = await fundme.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", async () => {
        it("fails if you dont send enough ETH", async () => {
          await expect(fundme.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })

        it("updated the amount funded data structure", async () => {
          await fundme.fund({ value: sendValue })
          const response = await fundme.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })

        it("Add funder to array of funders", async () => {
          await fundme.fund({ value: sendValue })
          const funder = await fundme.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundme.fund({ value: sendValue })
        })

        it("withdraw ETH froma single funder", async () => {
          // arrange values
          const startingFundMeBalance = await fundme.provider.getBalance(
            fundme.address
          )
          const startingDeployerBalance = await fundme.provider.getBalance(
            deployer
          )

          //action
          const transactionResponse = await fundme.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed * effectiveGasPrice

          //assert
          const endingFundMeBalance = await fundme.provider.getBalance(
            fundme.address
          )
          const endingDeployerBalance = await fundme.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })

        it("allows to withdraw with multiple funders", async () => {
          //arrange values
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundme.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await fundme.provider.getBalance(
            fundme.address
          )
          const startingDeployerBalance = await fundme.provider.getBalance(
            deployer
          )
          //action
          const transactionResponse = await fundme.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed * effectiveGasPrice

          //assert
          const endingFundMeBalance = await fundme.provider.getBalance(
            fundme.address
          )
          const endingDeployerBalance = await fundme.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //make sure that the funders are reset properly
          await expect(fundme.getFunder(0)).to.be.reverted
          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundme.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const fundMeConnectedContract = await fundme.connect(accounts[1])
          await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          )
        })
      })
    })
