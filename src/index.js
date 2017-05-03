
'use strict'

const express = require('express')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const _ = require('lodash')
const config = require('./config')
const commands = require('./commands')
const helpCommand = require('./commands/help')

let bot = require('./bot')

let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => { return require('url').parse(req.url).path }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => { res.send('\n 👋 🌍 \n') })

app.post('/commands/starbot', (req, res) => {
  let payload = req.body

  if (!payload || payload.token !== config('STARBOT_COMMAND_TOKEN')) {
    let err = '✋  Star—what? An invalid slash token was provided\n' +
              '   Is your Slack slash token correctly configured?'
    console.log(err)
    res.status(401).end(err)
    return
  }

  let cmd = _.reduce(commands, (a, cmd) => {
    return payload.text.match(cmd.pattern) ? cmd : a
  }, helpCommand)

  cmd.handler(payload, res)
})

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\n🚀  Starbot LIVES on PORT ${config('PORT')} 🚀`)

  if (config('SLACK_TOKEN')) {
    console.log(`🤖  beep boop: @starbot is real-time\n`)
    bot.listen({ token: config('SLACK_TOKEN') })
  }
})

// copy here
require('dotenv').config();
var Bot = require('slackbots');

var settings = {
    token: process.env.TOKEN,
    name: 'sleepy'
};
var sBot = new Bot(settings);

sBot.on('start', function() {
    sBot.postMessageToChannel('general', 'Hello channel!');
    // bot.postMessageToUser('dwleonhardt', 'whatever');
    // bot.postMessageToGroup('some-private-group', 'hello group chat!');
});
sBot.on('message', function(data) {
    // all ingoing events https://api.slack.com/rtm
    // console.log(data);
    if (data.text == 'sleep') {
    bot.postMessageToUser('dwleonhardt', 'Goodnight!');
    }
});
