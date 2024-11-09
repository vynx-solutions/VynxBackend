const express = require("express");
const app = express.Router();
const User = require("../model/user.js");
const Profiles = require("../model/profiles.js");
const config = require("../Config/config.json");

if (config.bEnableGiveVbucks) {
    app.post("/givevbucks", async (req, res) => {
        const { username, giveamount } = req.body;
        const secretKey = req.headers['x-secret-key'];

        if (config.bEnableGiveVbucksDebugLogs) {
            console.log('Received request to /givevbucks');
        }

        if (secretKey !== config.bSecretKey) {
            if (config.bEnableGiveVbucksDebugLogs) {
                console.log('Invalid secret key');
            }
            return res.status(403).send('Forbidden: Invalid secret key');
        }

        if (!username) return res.status(400).send('The username was not entered.');
        if (!giveamount) return res.status(400).send('The giveamount was not entered.');

        try {
            const user = await User.findOne({ username: username });
            if (!user) return res.status(404).send('User not found.');

            const profile = await Profiles.findOneAndUpdate(
                { accountId: user.accountId },
                { $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': parseInt(giveamount) } }
            );

            if (!profile) return res.status(404).send('Profile not found.');

            if (config.bEnableGiveVbucksDebugLogs) {
                console.log(`Successfully updated V-Bucks by ${giveamount} for user ${user.username}.`);
            }

            return res.status(200).json({
                message: `Successfully updated V-Bucks by ${giveamount} for user ${user.username}.`
            });
        } catch (err) {
            console.error('Launcher Api Error:', err);
            return res.status(500).send('Error encountered, look at the console');
        }
    });
} else {
    if (config.bEnableGiveVbucksDebugLogs) {
        console.log('Route /givevbucks is disabled in config.');
    }
}

module.exports = app;
