const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const path = require('path');

const FileEditor = require('../../../service/FileEditor.js');
const ServiceUtils = require('../../../service/ServiceUtils.js');

/**
 * @type {import('../../../typings.js').SlashInteractionCommand}
 */
module.exports = {

    data: new SlashCommandBuilder()
        .setName("service")
        .setDescription("Met à jour le tableau des personnes en service.")
        .addUserOption(option => {
            return option
                .setName("utilisateur")
                .setDescription("[Modérateurs] L'utilisateur pour lequel changer le status.");
        }),

    async execute(interaction) {
        const userToForceUpdate = interaction.options.getMember("utilisateur");

        const embed = new EmbedBuilder().setColor("#3f02e6");

        let jsonPath = path.normalize(__dirname + '../../../../data/service.json');
        let data = FileEditor.readFile(jsonPath);

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
        let userId = interaction.user.id;
        if (json) {
            context = json !== null;

            if (context && json.hasOwnProperty('moderationRole') && userToForceUpdate) {
                let moderationRole = await interaction.guild.roles.fetch(json.moderationRole);

                if (!moderationRole) {
                    setEmbedContent(embedContent, 'Configuration', 'Le rôle de modération est mal configuré, demande au gestionnaire du bot.');
                    context = false;
                }

                if (context && interaction.member.roles.highest.position >= moderationRole.position) {
                    userId = userToForceUpdate.id;
                } else if (moderationRole) {
                    setEmbedContent(embedContent, 'Permission', 'Tu ne peux pas modifier le status de quelqu\'un d\'autre.');
                    context = false;
                }
            }

            if (context && interaction.channelId !== json.channelId) {
                setEmbedContent(embedContent, 'Permission', 'Tu n\'est pas dans le bon salon pour exécuter cette commande.');
                context = false;
            }
            if (context && !json.data.hasOwnProperty(interaction.user.id)) {
                setEmbedContent(embedContent, 'Erreur', 'Tu ne figures pas sur ce tableau, demande au gestionnaire du bot.');
                context = false;
            }
        }

        if (context) {
            json.data[userId].status = !json.data[userId].status;

            let noError = true;
            try {
                await ServiceUtils.updateEmbed(interaction, json);
            } catch (err) {
                console.error(err);
                noError = false;
            }

            noError = noError && FileEditor.writeFile(jsonPath, JSON.stringify(json, null, '\t'));

            if (noError && userId === interaction.user.id) {
                setEmbedContent(embedContent, 'Service', 'Ton status de service a bien été mis à jour !');
            } else {
                setEmbedContent(embedContent, 'Service', 'Le status de service de l\'utilisateur a bien été mis à jour !');
            }
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
