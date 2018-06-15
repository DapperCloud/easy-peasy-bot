var JiraClient = require('jira-connector');
var jsyaml = require('js-yaml');
var fs = require('fs');

var config = jsyaml.load(fs.readFileSync('./config.yml', 'utf8'));
var jira = new JiraClient( {
    host: 'alchemytec.atlassian.net',
    basic_auth: {
        username: config.jira.username,
        password: config.jira.password
    }
});


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var mongoConfig = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    mongoConfig = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    mongoConfig = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Run the bot
 */
var customIntegration = require('./lib/custom_integrations');
var controller = customIntegration.configure(config.token, mongoConfig, onInstallation);

controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

function handleError(bot, message, error) {
    console.log("An error happened: "+error);
    bot.reply(message, "Error: "+error);
}

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

controller.hears('status .*', 'direct_message', function (bot, message) {
    var ticketNumber = message.text.split(" ")[1];
    jira.issue.getIssue({
        issueKey: ticketNumber
    }, function(error, issue) {
        if(error) {
            handleError(bot, message, error);
            return;
        }
        bot.reply(message, "Summary: `"+issue.fields.summary+"`"
            +"\nStatus: *`"+issue.fields.status.name+"`*"
            +"\nLabels: `"+issue.fields.labels+"`"
            +"\nPriority: `"+issue.fields.priority.name+"`"
            +"\nAssignee: `"+issue.fields.assignee.name+"` ("+issue.fields.assignee.emailAddress+")");
    });
});

controller.hears('label .*', 'direct_message', function (bot, message) {
    var label = message.text.split(" ")[1];

    var options = {
        uri: jira.buildURL('/search'),
        method: 'POST',
        json: true,
        followAllRedirects: true,
        body: {
            jql: "labels IN ("+label+") AND status in (\"in progress\")",
            maxResults: 50
        }
    };
    jira.makeRequest(options, function(error, issues) {
        if(error) {
            handleError(bot, message, error);
            return;
        }
        var titlesLinks = issues.issues.map(function(e) {
            return {
                title: e.fields.summary,
                link: "https://alchemytec.atlassian.net/browse/"+e.key
            };
        });

        var reply = "";
        for (i = 0; i < titlesLinks.length; i++) {
            reply += titlesLinks[i].title+": "+titlesLinks[i].link+"\n";
        }
        bot.reply(message, reply);
    });
});

controller.hears('.*blockchain.*', 'direct_message', function(bot, message) {
    console.log("toto");
    bot.reply(message, "A blockchain issue has been created and been assigned to `philippe.araujo`."
        +"\nFor all your questions about blockchain, please ask philippe.araujo@engagetech.com");
});
