const { network, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT unit tests", () => {
          let basicNFT, deployer
          beforeEach(async () => {
              ;[deployer, otherAccount] = await ethers.getSigners()
              const BasicNFT = await ethers.getContractFactory("BasicNFT")
              basicNFT = await BasicNFT.deploy()
          })
          describe("Deployment", () => {
              it("Should set the right token counter", async () => {
                  expect(await basicNFT.getTokenCounter()).to.equal(0)
              })
              it("Should set the right token URI", async () => {
                  expect(await basicNFT.tokenURI(0)).to.equal(
                      await basicNFT.TOKEN_URI(),
                  )
              })
              it("Should set the right token name", async () => {
                  expect(await basicNFT.name()).to.equal("Dogie")
              })
              it("Should set the right token symbol", async () => {
                  expect(await basicNFT.symbol()).to.equal("DOG")
              })
          })
          describe("Minting", () => {
              beforeEach(async () => {
                  tx = await basicNFT.mintNft()
                  tx.wait(1)
              })
              it("Should increment the counter after minting", async () => {
                  expect(await basicNFT.getTokenCounter()).to.equal(1)
              })
              it("Should show the balance correctly", async () => {
                  expect(await basicNFT.balanceOf(deployer.address)).to.equal(1)
              })
              it("Should show the owner correctly", async () => {
                  expect(await basicNFT.ownerOf(0)).to.equal(deployer.address)
              })
          })
      })
