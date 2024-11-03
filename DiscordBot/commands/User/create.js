const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js");
const Profiles = require("../../../model/profiles.js");
const functions = require("../../../structs/functions.js");

module.exports = {
    commandInfo: {
        name: "create",
        description: "Creates an account on Vynx Backend.",
        options: [
            {
                name: "email",
                description: "Your email.",
                required: true,
                type: 3
            },
            {
                name: "username",
                description: "Your username.",
                required: true,
                type: 3
            },
            {
                name: "password",
                description: "Your password.",
                required: true,
                type: 3
            }
        ],
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;

        const discordId = interaction.user.id;
        const email = options.get("email").value;
        const username = options.get("username").value;
        const password = options.get("password").value;

        const plainEmail = options.get('email').value;
        const plainUsername = options.get('username').value;

        const existingEmail = await User.findOne({ email: plainEmail });
        const existingUser = await User.findOne({ username: plainUsername });

        const emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!emailFilter.test(email)) {
            return interaction.editReply({ content: "You did not provide a valid email address!", ephemeral: true });
        }
        if (existingEmail) {
            return interaction.editReply({ content: "Email is already in use, please choose another one.", ephemeral: true });
        }
        if (existingUser) {
            return interaction.editReply({ content: "Username already exists. Please choose a different one.", ephemeral: true });
        }
        if (username.length >= 25) {
            return interaction.editReply({ content: "Your username must be less than 25 characters long.", ephemeral: true });
        }
        if (username.length < 3) {
            return interaction.editReply({ content: "Your username must be at least 3 characters long.", ephemeral: true });
        }
        if (password.length >= 128) {
            return interaction.editReply({ content: "Your password must be less than 128 characters long.", ephemeral: true });
        }
        if (password.length < 4) {
            return interaction.editReply({ content: "Your password must be at least 4 characters long.", ephemeral: true });
        }

        await functions.registerUser(discordId, username, email, password).then(async resp => {
            let embed = new MessageEmbed()
            .setColor(resp.status >= 400 ? "#ff0000" : "#56ff00")
            .setThumbnail(interaction.user.avatarURL({ format: 'png', dynamic: true, size: 256 }))
            .setTitle("Welcome to Vynx!")
            .setDescription(`We are waiting on the battlebus for you, ${username}! And check dms for a surprise!`)
            .addFields({
                name: "Discord Tag",
                value: interaction.user.tag,
            })
            .setImage("https://i.imgur.com/zOvZgQl.png")
            .setTimestamp()
            .setFooter({
                text: "Vynx Backend"
            });

            if (resp.status >= 400) return interaction.editReply({ embeds: [embed], ephemeral: true });

            (interaction.channel ? interaction.channel : interaction.user).send({ embeds: [embed] });
            interaction.editReply({ content: "You successfully created an account!", ephemeral: true });

            // send bud the info
            let dmEmbed = new MessageEmbed()
            .setColor("#56ff00")
            .setTitle("Your Signup Information")
            .addFields(
                { name: "Username", value: username },
                { name: "Email", value: email },
                { name: "Password", value: password },
                { name: "Discord Tag", value: interaction.user.tag }
            )
            .setTimestamp()
            .setFooter({
                text: "Vynx Backend",
                iconURL: "https://i.imgur.com/zOvZgQl.png"
            });

            interaction.user.send({ embeds: [dmEmbed] });

            // change value for the vbucks
            const amounttogive = 250;

            // Give amount V-Bucks to the new account
            const user = await User.findOne({ discordId: discordId });
            await Profiles.findOneAndUpdate(
                { accountId: user?.accountId },
                {
                    $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': amounttogive },
                    'profiles.lastVbucksClaim': Date.now()
                }
            );

            // tell the buddy they got vbucks
            let vbucksEmbed = new MessageEmbed()
            .setColor("#1eff00")
            .setTitle("Hey on the house!")
            .setDescription("We will deliver you 250 V-Bucks for free!")
            .setThumbnail("https://i.imgur.com/yLbihQa.png")
            .setTimestamp()
            .setFooter({
                text: "Vynx Backend",
                iconURL: "https://i.imgur.com/zOvZgQl.png"
            });

            interaction.user.send({ embeds: [vbucksEmbed] });
        });
    }
}