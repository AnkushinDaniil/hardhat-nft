const { ethers } = require("hardhat")

require("dotenv").config()

const UPLOAD_TO_NFT_STORAGE = process.env.UPLOAD_TO_NFT_STORAGE

const networkConfig = {
    31337: {
        name: "hardhat",
        mintFee: ethers.parseEther("0.01"),
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000",
        uploadToNftStorage: UPLOAD_TO_NFT_STORAGE == "true",
        fundAmount: ethers.parseEther("10"),
    },
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        mintFee: ethers.parseEther("0.01"),
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subscriptionId: "6901",
        callbackGasLimit: "500000",
        uploadToNftStorage: UPLOAD_TO_NFT_STORAGE == "true",
        fundAmount: ethers.parseEther("10"),
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
