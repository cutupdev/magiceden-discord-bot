const dotenv = require("dotenv");
const { Client, GatewayIntentBits, userMention, roleMention, TextInputStyle } = require('discord.js');
const axios = require('axios');
const path = require('path');
const schedule = require('node-schedule')
const { Connection, PublicKey } = require('@solana/web3.js');
const { createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddress, getMint, getAccount, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');

dotenv.config();

const SUPPLY = 420000069;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const channelId = process.env.PRICE_CHANNEL;

// Initialize Solana connection and wallet
const SOLANA_NETWORK = "https://api.mainnet-beta.solana.com"; // Mainnet endpoint
const connection = new Connection(SOLANA_NETWORK);

client.once('ready', async () => {
  // console.log(`Logged in as ${client.user.tag}`);
  // updateBotTitleAndStatus();

  // schedule.scheduleJob('0 * * * *', () => {
  //     const now = new Date();
  //     if (now.getUTCHours() === 0) {
  //         updateBotTitleAndStatus();
  //         postNewDayMessage();
  //         postBigPriceChanged();
  //         searchPool();
  //     } else {
  //         updateBotTitleAndStatus();
  //     }
  // })

  // schedule.scheduleJob('30 * * * *', () => {
  //     postTokenPrice();
  // })
  // var url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

  // const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`); // Replace with the actual API URL

  // console.log(response);
  // getEthTopCollections()
  getBtcTopCollections()
});

async function getEthTopCollections() {
  const url = `https://api-mainnet.magiceden.dev/v3/rtp/ethereum/collections/trending/v1?period=1h&limit=50&sortBy=sales&normalizeRoyalties=false&useNonFlaggedFloorAsk=false`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accept: '*/*',
      Authorization: 'Bearer '
    },
  });

  console.log(response)

  return response;
}

async function getBtcTopCollections() {
  // const url = 'https://api-mainnet.magiceden.dev/collection_stats/search/bitcoin?window=1h&sort=sales&direction=desc&offset=0&limit=100' ; 

  // const response = await fetch(url, {
  //   method: "GET",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });

  // console.log(response)

  // return response;

  const options = {
    method: 'GET',
    url: 'https://api-mainnet.magiceden.dev/collection_stats/search/bitcoin?window=1h&sort=sales&direction=desc&offset=0&limit=100'
  };

  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });
}

async function postNewHourlyMessage() {
  const channel = client.channels.cache.get(channelId);
  if (!channel) return console.error("Channel not found");

  const price = await getTokenPrice();
  const supply = await getTokenSupply();
  const change = await getPriceChangeRate();
  const mcap = supply * price;
  const holders = await getTokenHolders();
  console.log('price ===> ', price, 'supply ===> ', supply, 'market cap ===> ', price * supply, 'holders ===> ', holders);
  await searchPool();

  if (!price) return;

  // const embed = {
  //     color: 0x00ff99,
  //     title: '**$TOKE - Mycelium McToken**',
  //     description: `$TOKE is DePIN's very own memecoin and liquidity token with 100% of supply airdropped and a community-run DAO.\n
  //                     **Price:**
  //                     1 - **$${price.toFixed(5)}** - ${roleMention("1219295859049500704")} - [# :hamburger: | mctoken](https://discord.com/channels/1217921180195880970/1217972542569189436/)
  //                     1m - **$${(price * 1000000).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** - ${roleMention("1219295965710909572")} - [# :moneybag: | mcmillionaire](https://discord.com/channels/1217921180195880970/1217972663809605642/)
  //                     5m - **$${(price * 5000000).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** - ${roleMention("1219296054042820630")} - [# :whale: | mcwhale](https://discord.com/channels/1217921180195880970/1217949779493916883/)\n
  //                     **Info:**
  //                     Mkt Cap - **$${mcap.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}**
  //                     Supply - **${supply.toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} (${change.supplyChange.toFixed(3)}%:fire:)**
  //                     Holders - **${holders.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}**`,
  //     thumbnail: {
  //         url: `attachment://token-avatar.png`
  //     }
  // };

  // await channel.send({
  //     embeds: [embed],
  //     files: [{ attachment: path.join(__dirname, 'assets', 'token-avatar.png'), name: 'token-avatar.png' }]
  // });

  await channel.send(`<:MoonMan_upgrade_Helm:1269655486303698955> **DAILY PRICE SUMMARY**\n\n:hamburger: **$${price.toFixed(5)}** - 1 $TOKE\n:moneybag: **$${(price * 1000000).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** - 1m $TOKE\n:whale: **$${(price * 5000000).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** - 5m $TOKE\n\n:chart_with_upwards_trend: **$${mcap.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** - Market Cap\n:coin: **${supply.toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** - Max Supply\n:fire: **${change.supplyChange.toFixed(3)}%** - Burned\n:man_astronaut: **${holders.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** - Holders`);
}

async function startBot() {
  try {
    client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error logging in the bot:", error);
  }
}

startBot();