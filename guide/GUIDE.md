# Build Your Bots on Heroku, Because Bots are Apps Too

_Traditionally, we forego excessive use of emojis on the Heroku blog. But today, we must make an exception, as we’re going to build and deploy a Slack bot to Heroku_ 🤖

Slack bots come in all shapes and sizes. Whether they're publishing notifications, responding to `/slash` commands and or carrying a conversation, bots are becoming an integral part of the way we work. In this post, we'll show you how to create a bot that will respond to `/slash` commands in order to show the top trending repos in GitHub. A bot could do literally anything that's useful to you and your team as part of your day-to-day, so consider this your introduction to what's possible with a Slack bot.

For a firsthand look at what bots can do, check out the [Heroku's Button Gallery](https://elements.heroku.com/buttons), where users have created all types of bots: from fun bots like [poker](https://elements.heroku.com/buttons/charliehess/slack-poker-bot) and [Jeopardy!](https://elements.heroku.com/buttons/gesteves/trebekbot), to more practical ones like a bot that [tracks the satisfaction of your team members](https://elements.heroku.com/buttons/wearehanno/oskar) or one that [reminds your team to review existing pull requests](https://elements.heroku.com/buttons/pedrorijo91/slack-pr-bot).

A Slack bot can be built in practically any language, though today we're going to build ours with Node, and not just because I ❤ Node. Anything beyond a simple notification bot depends on Slack's WebSocket-based [RTM (Real Time Messaging) API](https://api.slack.com/rtm), and WebSockets & Node go together like Netflix & Chill.

Regardless of which language your bots are written in, you'll need to deploy them somewhere. That's where Heroku comes in to help you build bigger, smarter bots faster. After all, bots are apps too.

## Table of Contents

1. **[Prologue](#prologue)**
2. **[Publishing Notifications to Slack](#publishing-notifications-to-slack)**
3. **[Receiving and Responding to `/slash`]()**
4. **[Connecting a Bot to the Slack RTM API]()**
5. **[Share Your Bot with the Heroku Button]()**
6. **[Epilogue]()**

## Prologue

Let me introduce you to [:tophat: HipHub](https://github.com/mattcreager/hiphub) the example we'll be working with today and the soon-to-be easiest way to stay apprised of hip repos on GitHub, from the comfort of your favorite Slack channel.

### Before you begin

Come build with me. Here's what you'll need:

- A (free) [Heroku account](https://signup.heroku.com)
- The [Heroku Toolbelt](https://toolbelt.heroku.com)
- A Slack team to abuse
- Node (5.7.* preferably)
- The burning desire to scream [IT'S ALIVE](https://media.giphy.com/media/YEL7FJP6ed008/giphy.gif).

> This guide bounces between Slack, Heroku and your local development machine — so I've prefixed the sub-titles with the applicable logo where appropriate.

### :slack_icon: Create a custom Slack integration

We're going to make a [custom integration bot](https://slack.com/apps/build) designed explicitly for your team, though Slack also supports Slack's [App Directory] like [Heroku's](https://slack.com/apps/A0F7VRF7E-heroku) (and either could be deployed on Heroku). As a bonus, I'll show you how to easily distribute your bot using the Heroku Button, so that you can share your creation with everyone – even grandma.

First, visit [`slack.com/apps/build`](https://slack.com/apps/build) and select "Make a Custom Integration" as seen below.

![select a custom intergration](images/1-custom-intergration.png)

### :code_icon: Run HipHub locally

HipHub is essentially a bare-bones [Express](http://expressjs.com/) app, you can find detailed instructions on running it locally in the projects[`README.md`](https://github.com/mattcreager/hiphub/blob/master/README.md).

**Clone the project**

```shell
$ git clone https://github.com/mattcreager/hiphub.git
$ cd hiphub
```

**Install dependencies**

```shell
$ npm install
```

**Copy `.env-example` to `.env`**

```shell
$ cp .env-example .env
```

**Start HipHub**

```shell
$ npm start

🚀 HipHub LIVES on PORT 3000 🚀
```

That's it! Visit [localhost:3000](http://localhost:3000) and make sure HipHub is running.

### :heroku_icon: Deploy HipHub to Heroku

We could push our code to Heroku without ever visiting the command line, but what fun  would that be?

***Create a Heroku app, with the Heroku Toolbelt***

```shell
$ heroku create {optional-app-name}

Creating app... done, stack is cedar-14
https://blooming-scrubland-64464.herokuapp.com/
```

***Push our code***

```shell
$ git push heroku master

Counting objects: 15, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (14/14), done.
Writing objects: 100% (15/15), 5.72 KiB | 0 bytes/s, done.
Total 15 (delta 0), reused 0 (delta 0)
remote: Compressing source files... done.
remote: Building source:
remote:
remote: -----> Node.js app detected
...
remote:        https://blooming-scrubland-64464.herokuapp.com/ deployed to Heroku
remote:
remote: Verifying deploy.... done.
To https://git.heroku.com/blooming-scrubland-64464.git
 * [new branch]      master -> master

```

Did we just deploy this application in two commands? Yes, yes we did! Heroku installed the dependencies in HipHub's `package.json` file automatically, and gave us a URL so that we can visit our newly-deployed app.

**Open the app in a browser**

```shell
$ heroku open
```

Now HipHub is running on Heroku, but it doesn't know anything about Slack, and Slack doesn't know anything about it. I expect they'll soon be fast friends, so let's make introductions.

## Publish Notifications to Slack

While publishing notifications to Slack is the simplest of custom integrations, it's still pretty-darn cool, especially with a sprinkling of [Heroku Add-ons](https://elements.heroku.com/addons). Let's show HipHub how to find [trending GitHub projects](https://github.com/trending) and publish them to a Slack channel every morning by using the [BotKit](http://howdy.ai/botkit/docs/) framework from the folks at [Howdy.ai](http://howdy.ai).

### :slack_icon: Set up an "Incoming WebHook" on Slack

Slack will provide us with the API endpoint, or webhook; later, we'll `POST` data to this endpoint. Select "Incoming WebHooks" and choose a channel.

![select inbound webhook](images/2-select-inbound-webhook.png)

_Again, the above selection can be found at {your-team}.slack.com/apps/build/custom-intergration_

![select a channel](images/3-select-channel.png)

Now you're the proud new owner of a Slack "Incoming WebHook"! The configuration page includes a lot of great information about formatting and delivering messages to your new webhook, but what we need first is the "Webhook URL". It should look something like this: 
`https://hooks.slack.com/services/T0..LN/B0..VV1/br..dd`

Found it? 👏 Now let's move right along.

### :code_icon: Fetch trending open-source projects from GitHub


```js
 // paste in web_hook.js
```

### :heroku_icon:

We've already deployed the project to Heroku, but we could extend the app with.. insert Heroku Addons bit.

`$ heroku addons:create heroku-cronjob`

Finally, create a cronjob to trigger our script once a day.

{{ INSERT SCREENSHOT 4 HERE -- configure cronjob }}

When your cronjob fires, you should be rewarded with hip repos.

![trending repos](images/5-trending-repos.gif)

## Receive and Respond to `/slash` Commands

[Slash commands](https://api.slack.com/slash-commands) are a personal favorite—enabling you to listen for a custom command,   across channels, and triggering a `POST` or `GET` request to a configurable endpoint. In this case, that endpoint will be the HipHub application we deployed earlier, and responding to `/slash` commands will let our bot do a lot more than post once a day!

### :slack_icon: Creating a `/hiphub` slash command

Return to the "Build a Custom Integration" page and select "Slash Commands".

![select slash commands](images/6-select-slash-intergration.png)

Next, pick a name, it must begin with `/`.

![choose a command](images/7-choose-a-command.png)

Now that we've created the command, we need to configure it. HipHub is expecting a `POST` request to arrive at `/commands/hiphub`.

![set command url](images/8-set-command-url.png)

Slack has also provided us with a token specific to this command, something like: `JzRR6hEuh3f749iXY3qEpVgN`. We're going to use this to verify the payload HipHub receives is coming from Slack.

It wouldn't hurt to choose an appropriate name, icon, a descriptive label and some autocomplete text either—you could make something up, or use the suggestions provided in [HipHub's readme](https://github.com/mattcreager/hiphub/blob/master/README.md).

### :heroku_icon: Configuring the `/hiphub` command on Heroku

We've already deployed HipHub to Heroku, so it's waiting patiently for `POST` requests from Slack, but at the moment Slack's requests are going to receive a `402` (Unauthorized) response. To fix that, we'll need to authenticate the bot with Slack, which is easy. We'll just use the Heroku Toolbelt to set a `HIPHUB_COMMAND_TOKEN` [config  var](https://devcenter.heroku.com/articles/config-vars).

```shell
$ heroku config:set HIPHUB_COMMAND_TOKEN=JzRR6hEuh3f749iXY3qEpVgN

  Setting config vars and restarting blooming-scrubland-64464... done
  HIPHUB_COMMAND_TOKEN: JzRR6hEuh3f749iXY3qEpVgN
```

Now Slack and the bot can talk! Take `/hiphub` or `/hiphub repos` for a spin in your Slack channel!

## Connecting a Bot to the Slack RTM API

And finally the star of the show, a developers best-friend, the real-time bot. Fortunately, no matter how tricky your bot is to build, configuring and deploying it to Heroku is simple.

### :slack_icon: Connecting a bot to the Slack RTM API

Ok, one last trip to the "Build a Custom Integration" page and this time we're going to select "Bots".

![select bots](images/9-select-bot-intergration.png)

We get to give our bot a name!

![set bot username](images/9-set-bot-username.png)

And again, we're presented with the opportunity to customize the bot we've just created by giving it a name, description, icon, etc. You'll notice that the bot isn't currently following any channels. Bots are like vampires: they must be invited to a channel before they can follow it (any takers for BuffyBot?).

Take note of the API token, which is going to look like this: `xoxb-253973540645-lAJG4hL34343f3pk52BE6JO`. Without it, we won't be able to authenticate.

### :heroku_icon: Configuring the bot on Heroku

The HipHub bot won't attempt to connect to Slack's RTM API without a token, so once more, let's use the Heroku Toolbelt to set a `SLACK_TOKEN` config var.

```shell
$ heroku config:set SLACK_TOKEN=xoxb-253973540645-lAJG4hL34343f3pk52BE6JO

  Setting config vars and restarting blooming-scrubland-64464... done
  SLACK_TOKEN: xoxb-253973540645-lAJG4hL34343f3pk52BE6JO
```

That's it! Head over to your Slack channel and use the `/invite `command to invite our `@hiphub` bot to the channel. Then say hello to him - or her!

## Share Your Bot with the Heroku Button

The [Slack Button](https://api.slack.com/docs/slack-button) makes it easy for other Slack users to add your bot to their team, but the Heroku Button makes it just as easy for other developers to deploy and manage your bot themselves.

Adding a button to your bot is as simple as creating an `app.json` file, and adding the button to our GitHub readme.

### Creating an `app.json`

```json
 // paste app.json
```

### Adding the Heroku Button to the repo

## Epilogue

Now that you’ve got the basics down, a whole new world of functionality is at your team’s fingertips. Not just your team’s either – with a little more work you can offer your bot as a service for others on Slack through the [App Directory.](https://slack.com/apps) Peruse the directory to see the many ways teams are extending Slack, whether it's with the outside world through Customer Support apps, or internally with HR or Office Management. To learn more about offering your app, check out their [getting started guide.](https://api.slack.com/slack-apps)