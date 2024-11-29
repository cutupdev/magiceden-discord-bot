const dotenv = require("dotenv");
const { Client, GatewayIntentBits, userMention, roleMention, TextInputStyle } = require('discord.js');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const schedule = require('node-schedule');
const { get } = require("http");

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const channelId = process.env.PRICE_CHANNEL;

const startPosition = 0;


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateBotTitleAndStatus();
  postTokenPrice();
  // postTokenPrice();

  schedule.scheduleJob('58 * * * *', () => {
    postTokenPrice();
  })
});

async function updateBotTitleAndStatus() {
  try {
    // Update bot's display name 
    await client.user.setUsername(`Sales Alert`);

    // Update bot's custom status
    client.user.setActivity(`Sol | Btc | Eth | Pol | Base | Arb | Ape`, { type: 4 })

  } catch (error) {
    console.error("Error updating bot title and status:", error);
  }
}

async function postTokenPrice() {
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) return console.error("Channel not found");
  
    const sol = (await axios.post('http://localhost:8080/api/v1/magiceden', { coin: 'solana' })).data.message;
    let btc = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'bitcoin' })).data.message;
    const eth = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'ethereum' })).data.message;
    const pol = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'polygon' })).data.message;
    const base = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'base' })).data.message;
    const arb = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'arbitrum' })).data.message;
    const ape = (await axios.post('http://localhost:8000/api/v1/magiceden', { coin: 'apechain' })).data.message;
  
    console.log(sol)
    console.log(btc)
    console.log(eth)
    console.log(pol)
    console.log(base)
    console.log(arb)
    console.log(ape)
  
    let listOfSol = '';
    for (let i = 0; i < sol.length; i++) {
      console.log('input ===> ', sol[i][1], "SOL" )
      listOfSol = listOfSol.concat(`:coin: ${i+1}) **${sol[i][1].slice(1, sol[i][1].split('SOL')[0].length).split('+')[0]}** with **${sol[i][6]}** sales.  Floor price is **${sol[i][2].split('SOL')[0] + `SOL`}**\n`);
    }
  
    btc = await proceeBtc(btc);
    console.log(btc);
    let listOfBtc = '';
    for (let i = 0; i < btc.length; i++) {
      listOfBtc = listOfBtc.concat(`:coin: ${i+1}) **${btc[i][1].slice(1, btc[i][1].length).split('+')[0]}** with **${btc[i][4]}** sales and **${btc[i][5]}** pending for sale. Floor price is **${btc[i][2].split('BTC')[0]}BTC**.\n`);
    }
  
    let listOfEth = '';
    for (let i = 0; i < eth.length; i++) {
      listOfEth = listOfEth.concat(`:coin: ${i+1}) **${eth[i][1].slice(1, eth[i][1].split('ETH')[0].length).split('+')[0]}** with **${eth[i][6]}** sales.  Floor price is **${eth[i][2].split('ETH')[0] + `ETH`}**\n`);
    }
  
    let listOfPol = '';
    for (let i = 0; i < pol.length; i++) {
      listOfPol = listOfPol.concat(`:coin: ${i+1}) **${pol[i][1].slice(1, pol[i][1].split('POL')[0].length).split('+')[0]}** with **${pol[i][6]}** sales.  Floor price is **${pol[i][2].split('POL')[0] + `POL`}**\n`);
    }
  
    let listOfBase = '';
    for (let i = 0; i < base.length; i++) {
      listOfBase = listOfBase.concat(`:coin: ${i+1}) **${base[i][1].slice(1, base[i][1].split('ETH')[0].length).split('+')[0]}** with **${base[i][6]}** sales.  Floor price is **${base[i][2].split('ETH')[0] + `ETH`}**\n`);
    }
  
    let listOfArb = '';
    for (let i = 0; i < arb.length; i++) {
      listOfArb = listOfArb.concat(`:coin: ${i+1}) **${arb[i][1].slice(1, arb[i][1].split('ETH')[0].length).split('+')[0]}** with **${arb[i][6]}** sales.  Floor price is **${arb[i][2].split('ETH')[0] + `ETH`}**\n`);
    }
  
    let listOfApe = '';
    for (let i = 0; i < ape.length; i++) {
      listOfApe = listOfApe.concat(`:coin: ${i+1}) **${ape[i][1].slice(1, ape[i][1].split('APE')[0].length).split('+')[0]}** with **${ape[i][6]}** sales.  Floor price is **${ape[i][2].split('APE')[0] + `APE`}**\n`);
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
      ${listOfBase}\n
      **Arbitrum**
      ${listOfArb}\n
      **Apechain**
      ${listOfApe}`,
      thumbnail: {
        url: `attachment://avatar.png`
      }
    };
  
    await channel.send({
      embeds: [embed],
      files: [{ attachment: path.join(__dirname, 'assets', 'avatar.png'), name: 'avatar.png' }]
    });
  } catch (err) {
    console.log('Something went wrong ===> ', err);
  }
}

async function proceeBtc(data) {
  data.forEach(subArray => {
    let salesAmount = subArray[5];
    let pendingAmount = subArray[6];
    let temp = subArray[6].slice();

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
