const { network, ethers, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { expect } = require("chai")
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNFT unit tests", () => {
          let randomIpfsNft, randomIpfsNftAddress, deployer, chainId, mintFee
          beforeEach(async () => {
              ;[deployer, otherAccount] = await ethers.getSigners()
              await deployments.fixture(["mocks", "randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNFT")
              randomIpfsNftAddress = await randomIpfsNft.getAddress()
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              chainId = network.config.chainId
              mintFee = networkConfig[chainId].mintFee
          })
          describe("Deployment", () => {
              it("Should set the right  token counter", async () => {
                  expect(await randomIpfsNft.getTokenCounter()).to.equal(0)
              })
              it("Should set the right mint fee", async () => {
                  expect(await randomIpfsNft.getMintFee()).to.equal(mintFee)
              })
              it("Should set the right chance array", async () => {
                  expect((await randomIpfsNft.getChanceArray()).toString()).to.equal("10,30,100")
              })
              it("Should set the right dog token uri", async () => {
                  expect(await randomIpfsNft.getDogTokenUris(0)).to.include("ipfs://")
              })
          })
          describe("requestNft", () => {
              it("Should revert if sent zero value", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNFT__SentValueLessThanMintFee",
                  )
              })
              it("Should revert if sent value less than mint fee", async () => {
                  await expect(
                      randomIpfsNft.requestNft({ value: mintFee - ethers.parseEther("0.0001") }),
                  ).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNFT__SentValueLessThanMintFee",
                  )
              })
              it('Should emit "NftRequested" event', async () => {
                  await expect(randomIpfsNft.requestNft({ value: mintFee }))
                      .to.emit(randomIpfsNft, "NftRequested")
                      .withArgs(1, deployer.address)
              })
              it('Should emit "RandomWordsRequested" event', async () => {
                  await expect(randomIpfsNft.requestNft({ value: mintFee }))
                      .to.emit(vrfCoordinatorV2Mock, "RandomWordsRequested")
                      .withArgs(
                          networkConfig[chainId].gasLane, // keyHash
                          1, // requestId
                          anyValue, // preSeed
                          1, // subId
                          3, // minimumRequestConfirmations
                          networkConfig[chainId].callbackGasLimit, // callbackGasLimit
                          anyValue, // numWords
                          await randomIpfsNftAddress, // sender
                      )
              })
              it("Should update s_requestIdToSender", async () => {
                  await randomIpfsNft.requestNft({ value: mintFee })
                  await expect(await randomIpfsNft.s_requestIdToSender(1)).to.equal(
                      deployer.address,
                  )
              })
              it("Should mint NFT after request", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              expect(await randomIpfsNft.tokenURI(0)).to.includes("ipfs://")
                              expect(await randomIpfsNft.getTokenCounter()).to.equal(1)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject()
                          }
                      })
                      try {
                          const responce = await randomIpfsNft.requestNft({ value: mintFee })
                          const receipt = await responce.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              receipt.logs[1].args.requestId,
                              randomIpfsNftAddress,
                          )
                      } catch (error) {
                          console.log(error)
                      }
                  })
              })
          })
          describe("getBreedFromModdedRng", () => {
              it("Should return PUG if moddedRng < 10", async () => {
                  for (let moddedRng = 0; moddedRng < 10; moddedRng++) {
                      expect(await randomIpfsNft.getBreedFromModdedRng(moddedRng)).to.equal(0)
                  }
              })
              it("Should return SHIBA_INU if moddedRng >= 10 and < 40", async () => {
                  for (let moddedRng = 10; moddedRng < 40; moddedRng++) {
                      expect(await randomIpfsNft.getBreedFromModdedRng(moddedRng)).to.equal(1)
                  }
              })
              it("Should return ST_BERNARD if moddedRng >= 40 and < 100", async () => {
                  for (let moddedRng = 40; moddedRng < 100; moddedRng++) {
                      expect(await randomIpfsNft.getBreedFromModdedRng(moddedRng)).to.equal(2)
                  }
              })
              it("Should return RandomIpfsNFT__RangeOutOfBounds if moddedRng >= 100", async () => {
                  expect(await randomIpfsNft.getBreedFromModdedRng(100)).to.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNFT__RangeOutOfBounds",
                  )
              })
          })
          describe("withdraw", () => {
              it("Should revert if not owner requested", async () => {
                  expect(
                      randomIpfsNft.connect(otherAccount).withdraw(),
                  ).to.be.revertedWithCustomError(randomIpfsNft, "OwnableInvalidOwner")
              })
              it("Should withdraw if owner requested (1 requester)", async () => {
                  await randomIpfsNft.requestNft({
                      value: mintFee,
                  })
                  const startingContractBalasnce = await ethers.provider.getBalance(
                      randomIpfsNft.target,
                  )
                  const startingDeployerBalance = await ethers.provider.getBalance(deployer)
                  const transactionResponse = await randomIpfsNft.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasPrice, gasUsed } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  const endingContractBalance = await ethers.provider.getBalance(
                      randomIpfsNft.target,
                  )
                  const endingDeployerBalance = await ethers.provider.getBalance(deployer)
                  expect(endingContractBalance).to.equal(0)
                  expect(startingContractBalasnce + startingDeployerBalance).to.equal(
                      endingDeployerBalance + gasCost,
                  )
              })
              it("Should withdraw if owner requested (multiple requesters)", async () => {
                  const accounts = await ethers.getSigners()
                  for (const account of accounts) {
                      const ConnectedContract = await randomIpfsNft.connect(account)
                      await ConnectedContract.requestNft({
                          value: mintFee,
                      })
                  }
                  const startingContractBalasnce = await ethers.provider.getBalance(
                      randomIpfsNft.target,
                  )
                  const startingDeployerBalance = await ethers.provider.getBalance(deployer)
                  const transactionResponse = await randomIpfsNft.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasPrice, gasUsed } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  const endingContractBalance = await ethers.provider.getBalance(
                      randomIpfsNft.target,
                  )
                  const endingDeployerBalance = await ethers.provider.getBalance(deployer)

                  expect(endingContractBalance).to.equal(0)
                  expect(startingContractBalasnce + startingDeployerBalance).to.equal(
                      endingDeployerBalance + gasCost,
                  )
              })
          })
      })
