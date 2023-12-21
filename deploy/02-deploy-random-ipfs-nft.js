const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

// const CONTRACT_NAME = "RandomIpfsNFT"
const chainId = network.config.chainId
const imagesPath = "./images/randomNFT/"

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    let vrfCoordinatorV2Address, subId, tokenUris

    if (networkConfig[chainId].uploadToNftStorage) {
        tokenUris = await handleTokenUris(imagesPath)
    } else {
        tokenUris = [
            "ipfs://bafyreibjcbsbr5fzduajeajg262kgvoudkdtqx6qi3la37mpzdi7rybbe4/metadata.json",
            "ipfs://bafyreiawa5q6idc7sd7pfwjkplagxtpun6ot25yked2iboagcktw75y72y/metadata.json",
            "ipfs://bafyreia2jr7f5ryfhqdaj4or3btmybc5rx3f4fitd54ztq52ycd5oxhjwq/metadata.json",
        ]
    }

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.getAddress()
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subId = txReceipt.logs[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subId, networkConfig[chainId].fundAmount)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subId = networkConfig[chainId].subId
    }

    const args = [
        vrfCoordinatorV2Address,
        subId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
        deployer,
    ]

    const randomIpfsNft = await deploy("RandomIpfsNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    await vrfCoordinatorV2Mock.addConsumer(subId, randomIpfsNft.address)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris(imagesPath) {
    console.log("Uploading the images to nft.storage...")
    try {
        let tokenUris
        await import("../utils/upload.mjs").then(async (upload) => {
            tokenUris = await upload.storeNFTs(imagesPath)
        })
        console.log("The images were successfully uploaded")
        return tokenUris
    } catch (error) {
        console.log(error)
    }
}

module.exports.tags = ["all", "randomipfs", "main"]
