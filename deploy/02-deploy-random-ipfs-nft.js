const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
// const { storeNFTs } = require("../utils/upload.mjs")
import storeNFTs from "../utils/upload.mjs"

const CONTRACT_NAME = "RandomIpfsNFT"
const chainId = network.config.chainId
const imagesPath = "../images/randomNFT"

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    let vrfCoordinatorV2Address, subId, tokenUris

    tokenUris = storeNFTs()

    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy()
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subId = txReceipt.logs[0].args.subId
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subId = networkConfig[chainId].subId
    }

    const args = [
        vrfCoordinatorV2Address,
        subId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        imagesPath,
        networkConfig[chainId].mintFee,
        deployer,
    ]

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(basicNft.address, args)
    }
}

module.exports.tags = ["all", "randomipfs", "main"]
