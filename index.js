
require('dotenv').config();
var Bot = require('slackbots');

var settings = {
    token: process.env.TOKEN,
    name: 'sleepy'
};
var bot = new Bot(settings);

bot.on('start', function() {
    bot.postMessageToChannel('general', 'Hello channel!');
    // bot.postMessageToUser('dwleonhardt', 'whatever');
    // bot.postMessageToGroup('some-private-group', 'hello group chat!');
});
bot.on('message', function(data) {
    // all ingoing events https://api.slack.com/rtm
    console.log(data);
    if (data.text == 'sleep') {
    bot.postMessageToUser('dwleonhardt', 'Goodnight!');
    }
});
