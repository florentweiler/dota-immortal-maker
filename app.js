import { Client, Intents } from 'discord.js';
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_MESSAGE_TYPING]});
import * as dotenv from 'dotenv';
import {youtube} from 'scrape-youtube';
import fs, { readlinkSync } from 'fs';
dotenv.config();
//client.login(conf ? conf["bot-token"] : process.env.TOKEN)

const GUIDES_CHAN_NAME = "Dota-guides";
const FUN_CHAN_NAME = "Dota-fun";
const waitTime = 3600;

let cachedLinks;

const channels = {

    guides: [
        "bananaslamjamma",
        "jenkins",
        "GameLeap Dota 2 Pro Guides",
        "GamerzClass Dota 2"
    ],
    fun: [
        "rizpol",
        "elwono",
        "elwonoccino",
        "DotaCinema",
        "Dota Watafak",
        "Jenkins Clips",
        "Dotown"
    ]
};

let guilds;

client.on("ready", async () => {
    guilds = client.guilds.cache.map(guild => guild.id);
    readCachedLinks()
    for (const guildId of guilds) {
        const guild = await client.guilds.fetch(guildId);
        let channels = await guild.channels.fetch();
        const dotaGuides = channels.find((c) => c.type === "GUILD_TEXT" && c.name === GUIDES_CHAN_NAME.toLowerCase());
        if(!dotaGuides) {
            guild.channels.create("Dota-guides", {
                type:"GUILD_TEXT",
            })    
        }
        const dotaFun = channels.find((c) => c.type === "GUILD_TEXT" && c.name === FUN_CHAN_NAME.toLowerCase());
        if(!dotaFun) {
            guild.channels.create("Dota-fun", {
                type:"GUILD_TEXT",
            })    
        }
    }
    await checkNewVideos()
});

async function postVideo(link, channelCategory) {
    for (const guildId of guilds) {
        const guild = await client.guilds.fetch(guildId);
        let channels = await guild.channels.fetch();
        const dotaChan = channels.find((c) => c.type === "GUILD_TEXT" && c.name === `Dota-${channelCategory}`.toLowerCase());
        console.log('sending link : ' + link + ' to dota-' + channelCategory)
        dotaChan.send(link);
    }
}

async function getResForChannel(channel) {
    let results = [];
    //hour
    const res = await youtube.search(channel, {sp: "EgIIAQ%253D%253D"});
    //day
    //const res = await youtube.search(channel, {sp: "EgQIAhAB"});
    const isDotaChannel = v.channel.name.toLowerCase() !== 'jenkins' || ( v.channel.name.toLowerCase() === 'jenkins' && v.channel.id === "UCTUO_3bYr50vmH0aE7byMjg" );
    results = res.videos.filter((v) => v.channel.name.toLowerCase() === channel.toLowerCase() && isDotaChannel);
    return results;
}


async function checkNewVideos() {
    for (let channelCategory of Object.keys(channels)) {
        for(let channel of channels[channelCategory]) {
            let vids = await getResForChannel(channel);
            for (let video of vids) {
                if(!cachedLinks.includes(video.link.toLowerCase())) {
                    await postVideo(video.link, channelCategory);
                    cachedLinks.push(video.link.toLowerCase());
                    writeCachedLinks();
                }
            }
        }
    }
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    checkNewVideos();
}

function clearCachedLinks() {
    cachedLinks = [];
    fs.writeFileSync('./posted.json', JSON.stringify([]));
}

async function readCachedLinks() {
    cachedLinks = JSON.parse(fs.readFileSync('./posted.json'));
}

async function writeCachedLinks() {
    fs.writeFileSync('./posted.json', JSON.stringify(cachedLinks))
}

client.login(process.env.BOT_TOKEN);

setInterval(() => {
 clearCachedLinks();
}, 24 * 60 * 60 * 1000)