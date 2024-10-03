const dotenv = require("dotenv");
const { Client, GatewayIntentBits, userMention, roleMention, TextInputStyle } = require('discord.js');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const schedule = require('node-schedule')

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const channelId = process.env.PRICE_CHANNEL;


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateBotTitleAndStatus();
  // postTokenPrice();

  schedule.scheduleJob('59 * * * *', () => {
    postTokenPrice();
  })
});

async function updateBotTitleAndStatus() {
  try {
    // Update bot's display name 
    await client.user.setUsername(`Sales Alert`);

    // Update bot's custom status
    client.user.setActivity(`Sol | Btc | Eth | Pol | Base`, { type: 4 })

  } catch (error) {
    console.error("Error updating bot title and status:", error);
  }
}

async function postTokenPrice() {
  const channel = client.channels.cache.get(channelId);
  if (!channel) return console.error("Channel not found");

  const sol = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'solana' })).data.message;
  const btc = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'bitcoin' })).data.message;
  const eth = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'ethereum' })).data.message;
  const pol = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'polygon' })).data.message;
  const base = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'base' })).data.message;

  console.log(sol)
  console.log(btc)
  console.log(eth)
  console.log(pol)
  console.log(base)

  const solData = await removeNoise(sol, 'SOL');
  const btcData = await removeNoise(btc, 'BTC');
  const ethData = await removeNoise(eth, 'ETH');
  const polData = await removeNoise(pol, 'POL');
  const baseData = await removeNoise(base, 'ETH');

  console.log(solData)
  console.log(btcData)
  console.log(ethData)
  console.log(polData)
  console.log(baseData)

  let listOfSol = '';
  for (let i = 0; i < solData.length; i++) {
    listOfSol = listOfSol.concat(`:coin: ${i+1}) **${solData[i][0].substring(1, solData[i][0].length)}** with **${solData[i][5]}** sales.  Floor price is **${solData[i][1]}**\n`);
  }

  const processedBtcData = await proceeBtc(btcData);
  let listOfBtc = '';
  for (let i = 0; i < processedBtcData.length; i++) {
    listOfBtc = listOfBtc.concat(`:coin: ${i+1}) **${processedBtcData[i][0].substring(1, processedBtcData[i][0].length)}** with **${processedBtcData[i][4]}** sales and **${processedBtcData[i][5]}** pending for sale. Floor price is **${processedBtcData[i][1]}**.\n`);
  }
  console.log(listOfBtc)

  let listOfEth = '';
  for (let i = 0; i < ethData.length; i++) {
    listOfEth = listOfEth.concat(`:coin: ${i+1}) **${ethData[i][0].substring(1, ethData[i][0].length)}** with **${ethData[i][5]}** sales.  Floor price is **${ethData[i][1]}**\n`);
  }

  let listOfPol = '';
  for (let i = 0; i < polData.length; i++) {
    listOfPol = listOfPol.concat(`:coin: ${i+1}) **${polData[i][0].substring(1, polData[i][0].length)}** with **${polData[i][5]}** sales.  Floor price is **${polData[i][1]}**\n`);
  }

  let listOfBase = '';
  for (let i = 0; i < baseData.length; i++) {
    listOfBase = listOfBase.concat(`:coin: ${i+1}) **${baseData[i][0].substring(1, baseData[i][0].length)}** with **${baseData[i][5]}** sales.  Floor price is **${baseData[i][1]}**\n`);
  }

  const embed = {
    color: 0x0099ff,
    title: '**Magiceden - Top Sales Collections**',
    description: `**Solana**
    ${listOfSol}\n
    **Bitcoin**
    ${listOfBtc}\n
    **Ethereum**
    ${listOfEth}\n
    **Polygon**
    ${listOfPol}\n
    **Base**
    ${listOfBase}`,
    thumbnail: {
      url: `attachment://avatar.png`
    }
  };

  await channel.send({
    embeds: [embed],
    files: [{ attachment: path.join(__dirname, 'assets', 'avatar.png'), name: 'avatar.png' }]
  });

  // await channel.send(``);
}

async function proceeBtc(data) {
  data.forEach(subArray => {
    let salesAmount = subArray[4];
    let pendingAmount = subArray[5];
    let temp = subArray[5].slice();

    // Check if there is "pending" in sales amount and process the item
    if (salesAmount.includes('pending')) {
      
      let sales = salesAmount.split(' ')[0];
      let pending = pendingAmount;

      // Perform the "string minus" operation
      let correctedAmount = sales.slice(0, sales.length - pending.length);

      // Update the subArray with the new corrected value
      subArray[4] = `${correctedAmount}`;
      subArray[5] = `${temp}`

      // Optionally log the change
      console.log(`Updated subArray: ${subArray[4]}`);
    }
  });

  return data;
}

async function removeNoise(data, substring) {
  data.forEach(subArray => {
    let name = subArray[0];
    let price = subArray[1];

    // Check if there is "pending" in sales amount and process the item
    if (name.includes('%')) {
      
      let realName = name.slice(0, name.length - 4);
      subArray[0] = realName;

    }

    const temp = subArray[1].split(substring)[0];
    subArray[1] = temp.concat(substring);
  });

  return data;
}

async function startBot() {
  try {
    client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error logging in the bot:", error);
  }
}

startBot();
