KEY=$(cat .env | grep INFURA | sed "s/.*=//")

yarn hardhat node --port 7777 --fork https://mainnet.infura.io/v3/${KEY}
