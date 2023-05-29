module.exports = {
    "updateEmbed": updateEmbed
}

const QueueingSystem = require('./QueueingSystem.js');
const { EmbedBuilder } = require('discord.js');

async function updateEmbed(interaction, json) {
    let embed = await createEmbed(interaction, json.data);

    let message = null;
    try {
        if (json.messageId !== undefined) {
            message = await interaction.channel.messages.fetch(json.messageId);
        }
    } catch (ignored) { message = null; }
    if (json.hasOwnProperty('messageId') && message !== null) {
        let promise = QueueingSystem.addToQueue(async () => {
            await message.edit({ 'embeds': [embed] });
        });
        await promise;
    } else {
        let promise = QueueingSystem.addToQueue(async () => {
            return (await interaction.channel.send({ 'embeds': [embed] })).id;
        });
        json.messageId = await promise;
    }
}

async function createEmbed(interaction, jsonData) {
    let embed = new EmbedBuilder()
        .setColor("#3f02e6")
        .setTitle('Tableau de service')
        .setDescription('Liste des personnes en service.')
        .setImage("https://c4.wallpaperflare.com/wallpaper/786/983/731/machine-garage-gta-grand-theft-auto-v-gta-5-hd-wallpaper-preview.jpg");

    for (let key in jsonData) {
        let emoji = jsonData[key].status ? ':white_check_mark:' : ':x:';

        let username = '';
        try {
            let user = await interaction.guild.members.fetch(key);
            username = user.displayName;
        } catch (ignored) {
            console.error('Attention the file "service.json" contains an unknown user, the user ID provided: ' + key);
        }

        embed.addFields({
            name: 'Nom: ' + username + ' | Numéro: ' + jsonData[key].userNumber,
            value: 'Status : ' + emoji
        }, { name: '----------------------', value: ' ' });
    }

    return embed;
}