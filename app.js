import { Client, Intents } from 'discord.js';
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_MESSAGE_TYPING]});
import * as dotenv from 'dotenv';
import {youtube} from 'scrape-youtube';
import fs, { readlinkSync } from 'fs';
dotenv.config();
//client.login(conf ? conf["bot-token"] : process.env.TOKEN)

const CHAN_NAME = "Dota-guides";
const waitTime = 3600;

let cachedLinks;

const channels = [
    "bananaslamjamma",
    "jenkins",
    "GameLeap Dota 2 Pro Guides",
    "GamerzClass Dota 2"
];

let guilds;

client.on("ready", async () => {
    guilds = client.guilds.cache.map(guild => guild.id);
    readCachedLinks()
    for (const guildId of guilds) {
        const guild = await client.guilds.fetch(guildId);
        let channels = await guild.channels.fetch();
        const dotaGuides = channels.find((c) => c.type === "GUILD_TEXT" && c.name === CHAN_NAME.toLowerCase());
        if(!dotaGuides) {
            guild.channels.create("Dota-guides", {
                type:"GUILD_TEXT",
            })    
        }
    }
    await checkNewVideos()
});

async function postVideo(link) {
    for (const guildId of guilds) {
        const guild = await client.guilds.fetch(guildId);
        let channels = await guild.channels.fetch();
        const dotaGuides = channels.find((c) => c.type === "GUILD_TEXT" && c.name === CHAN_NAME.toLowerCase());
        console.log('sending link : ' + link)
        dotaGuides.send(link);
    }
}

async function getResForChannel(channel) {
    let results = [];
    //hour
    const res = await youtube.search(channel, {sp: "EgIIAQ%253D%253D"});
    //day
    //const res = await youtube.search(channel, {sp: "EgQIAhAB"});
    results = res.videos.filter((v) => v.channel.name.toLowerCase() === channel.toLowerCase());
    return results;
}


async function checkNewVideos() {
    for (let channel of channels) {
        let vids = await getResForChannel(channel);
        for (let video of vids) {
            if(!cachedLinks.includes(video.link.toLowerCase())) {
                await postVideo(video.link);
                cachedLinks.push(video.link.toLowerCase());
                writeCachedLinks();
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