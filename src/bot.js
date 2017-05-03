//
// 'use strict'
//
// const slack = require('slack')
// const _ = require('lodash')
// const config = require('./config')
//
// let bot = slack.rtm.client()
//
// bot.started((payload) => {
//   this.self = payload.self;
// });
//
// bot.message((msg) => {
//   if (!msg.user) return
//   if (!_.includes(msg.text.match(/<@([A-Z0-9])+>/igm), `<@${this.self.id}>`)) return
//
//   slack.chat.postMessage({
//     token: config('SLACK_TOKEN'),
//     icon_emoji: config('ICON_EMOJI'),
//     channel: msg.channel,
//     username: 'Starbot',
//     text: `beep boop: I hear you loud and clear!"`
//   }, (err, data) => {
//     if (err) throw err
//
//     let txt = _.truncate(data.message.text)
//
//     console.log(`🤖  beep boop: I responded with "${txt}"`)
//   })
// })

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

module.exports = bot
