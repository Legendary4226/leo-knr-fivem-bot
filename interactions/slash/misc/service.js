const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
    // The data needed to register slash commands to Discord.

    data: new SlashCommandBuilder()
        .setName("service")
        .setDescription(
            "Met à jour le tableau des personnes en service."
        ),

    async execute(interaction) {
        /**
         * @type {EmbedBuilder}
         * @description Help command's embed
         */
        const embed = new EmbedBuilder().setColor("#3f02e6");

        let jsonPath = path.normalize(__dirname + '../../../../data/service.json');
        let data = readFile(jsonPath);

        let embedContent = {
            'title': 'Erreur',
            'descr': 'Impossible d\'exécuter la commande, merci de contacter l\'administrateur.'
        };
        function setEmbedContent(embed, title, descr) {
            embed.title = title;
            embed.descr = descr;
        }

        let json = null;
        if (data) try { json = JSON.parse(data); } catch (err) { console.error(err); };

        let context = true;
        if (json) {
            context = json !== null;
            if (context && interaction.channelId !== json.channelId) {
                setEmbedContent(embedContent, 'Permission', 'Tu n\'est pas dans le bon salon pour exécuter cette commande.');
                context = false;
            }
            if (context && !json.data.hasOwnProperty(interaction.user.id)) {
                setEmbedContent(embedContent, 'Permission', 'Tu ne figures pas sur ce tableau, demande au gestionnaire du bot.');
                context = false;
            }
        }

        if (context) {
            json.data[interaction.user.id].status = !json.data[interaction.user.id].status;

            let noError = true;
            try {
                await updateEmbed(interaction, json);
            } catch (err) {
                console.error(err);
                noError = false;
            }

            noError = noError && writeFile(jsonPath, JSON.stringify(json));

            if (noError) setEmbedContent(embedContent, 'Service', 'Ton status de service a bien été mis à jour !');
        }

        embed
            .setTitle(embedContent.title)
            .setDescription(embedContent.descr);

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    },
};

function readFile(path) {
    let data = null;
    try {
        fs.accessSync(path, fs.constants.F_OK || fs.constants.R_OK || fs.constants.W_OK);
        data = fs.readFileSync(path, { encoding: 'utf-8' });
    } catch (err) {
        console.error('No service.json file found or without read/writte permissions.', err);
        data = null;
    }
    return data;
}

function writeFile(path, data) {
    let success = true;
    try {
        fs.accessSync(path, fs.constants.F_OK || fs.constants.R_OK || fs.constants.W_OK);
        fs.writeFileSync(path, data, { encoding: 'utf-8', 'flag': 'w' });
    } catch (err) {
        console.error('No service.json file found or without read/writte permissions.', err);
        success = false;
    }
    return success;
}

async function updateEmbed(interaction, json) {
    let embed = await createEmbed(interaction, json.data);

    let message = null;
    try {
        if (json.messageId !== undefined) {
            message = await interaction.channel.messages.fetch(json.messageId);
        }
    } catch (ignored) { message = null; }
    if (json.hasOwnProperty('messageId') && message !== null) {
        message.edit({ 'embeds': [embed] });
    } else {
        json.messageId = (await interaction.channel.send({ 'embeds': [embed] })).id;
    }
}

async function createEmbed(interaction, jsonData) {
    let embed = new EmbedBuilder()
        .setColor("#3f02e6")
        .setTitle('Tableau de service')
        .setDescription('Liste des personnes en service.');

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