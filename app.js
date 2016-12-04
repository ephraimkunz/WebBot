var restify = require('restify');
var builder = require('botbuilder');
var prettydate = require('pretty-date');
var twitterClient = require('twitter-node-client').Twitter;
var sentiment = require('sentiment');

var twitterAuth = {
	"consumerKey":"gLwyLjFl7nxKxfrlqqcZfm7b8",
	"consumerSecret": "637BefF7DMZZo3tXf1eqgVeJLMeLj9fV76589fKZv07VBqO7Yw",
	"accessToken": "3120259401-OWDAF2OXMW9lAia8Fg2Leozuup64GaEPE4RXJNZ",
	"accessTokenSecret": "lO165m4gW6jFkJiXSsvScetYn5O0W7aTQSOJhkEkEG1Ji"
}

//Setup Restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
	console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));

bot.dialog('/', [
	function (session) {
	session.send('There are there are a few ways I can assist you today.');
	session.beginDialog('/menu');
},
function(session, results){
	session.endConversation('Until next time ...');
}]);

bot.dialog('/menu', [
	function (session) {
		builder.Prompts.choice(session, "Select an option:", [
			"Remember your information",
			"Roll a dice",
			"Do basic math",
			"Remove spaces from a string",
			"Do sentiment analysis on tweets"]);

	},
	function (session, results) {
		switch(results.response.index){
			case 0:
				session.beginDialog('/profile');
				break;
			case 1:
				session.beginDialog('/dice');
				break;
			case 2:
				session.beginDialog('/math');
				break;
			case 3:
				session.beginDialog('/nospaces');
				break;
			case 4:
				session.beginDialog('/sentiment-analysis');
				break;
			default:
				session.endDialog();
				break;
		}
	},
	function(session){
		session.replaceDialog('/menu');
	}
	]).reloadAction('showMenu', null, {matches: /^(menu|back)/i});

bot.dialog('/profile', [
	function (session) {
		builder.Prompts.text(session, "Let\'s start with your first name. Go ahead and enter it below.");
	},
	function (session, results) {
		session.userData.firstName = results.response;
		builder.Prompts.text(session, "Now the last name.");
	},
	function (session, results) {
		session.userData.lastName = results.response;
		builder.Prompts.time(session, "What is your date of birth?");
	},
	function(session, results){
		session.userData.DOB = builder.EntityRecognizer.resolveTime([results.response]);
		session.endDialog(
			"Ok, this is the data I have on you:\nName: %s %s\nDOB: %s", 
			session.userData.firstName,
			session.userData.lastName,
			prettydate.format(session.userData.DOB));
	}]);

bot.dialog('/dice', [
	function (session) {
		var roll = Math.floor(Math.random() * 6) + 1;
		session.endDialog("I rolled %s", roll.toString());
	}]);

bot.dialog('/math', [
	function (session){
		builder.Prompts.text(session, "Enter the mathematical expression: ");
	},
	function (session, results) {
		session.send("We will use the evil eval here.");
		var result = eval(results.response);
		session.endDialog("The result is %s", result.toString());
	}]);

bot.dialog('/nospaces', [
	function (session) {
		builder.Prompts.text(session, "Paste or type in the string to remove whitespace from: ");
	},
	function (session, results) {
		var whitesRemoved = results.response.replace(/\W/g, '');
		session.endDialog(whitesRemoved);
	}]);

// Text layout of results
function buildAnalysisResult(analysis){
	var result = '';
	result += '\tTotal score = ' + analysis.score + '\t';
	result += '\tComparative score = ' + analysis.comparative;
	// result += '\tSome positive words = ' + analysis.positive.slice(0, 5) + '\n';
	// result += '\tSome negative words = ' + analysis.negative.slice(0, 5) + '\n';
	return result;
}

bot.dialog('/sentiment-analysis', [
	function(session){
		builder.Prompts.text(session, "Enter tweet search (prepend hashtag searches with #)");
	},
	function(session, results){
		session.send("Crunching the data...");
		session.sendTyping();
	 	var error = function (err, response, body) {
        	session.endDialog(err.toString() + response.toString());
    	};

	    var success = function (data) {
	        data = JSON.parse(data);
	        var tweetText = '';
	        data.statuses.forEach(function(tweet){
	        	tweetText += (' ' + tweet.text); //Space so we don't clobber words on the fault line
	        });
	        console.log(tweetText);

	        var analysis = sentiment(tweetText);

	        var card = new builder.HeroCard(session)
            .title("Analysis results")
            .subtitle(data.statuses.length + ' tweets analyzed')
            .text(buildAnalysisResult(analysis));
            if(analysis.score > 0){
            	card.images([
                 	builder.CardImage.create(session, "https://s-media-cache-ak0.pinimg.com/originals/97/72/6f/97726fe8f02ba122e9436eb80a28fb2a.png")
            	]);	
            }
            else if(analysis.score < 0){
            	card.images([
                 	builder.CardImage.create(session, "https://s-media-cache-ak0.pinimg.com/736x/f5/8b/ec/f58bece565008387c95ee25036b84ad3.jpg")
            	]);	
            }
            else{
	            card.images([
	                 builder.CardImage.create(session, "http://cosmouk.cdnds.net/15/35/1440495683-wpid-wp-1436657947930.jpeg")
	            ]);
        	}
	        var msg = new builder.Message(session).attachments([card]);
	        session.endDialog(msg);
		};
	    var twitter = new twitterClient(twitterAuth);
	    twitter.getSearch({'q':results.response,'count': 100, 'lang': 'en'}, error, success);
	}]);