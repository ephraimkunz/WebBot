var restify = require('restify');
var builder = require('botbuilder');

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

var intents = new builder.IntentDialog();

bot.dialog('/', intents);
intents.matches(/^change name/i, [
	function(session){
		session.beginDialog('/profile');
	},
	function (session, results) {
		session.send('OK, changed your name to %s', session.userData.name);
	}]);

intents.onDefault([
	function (session, args, next) {
		if(!session.userData.name){
			session.beginDialog('/profile');
		}else {
			next();
		}
	},
	function (session, results) {
		session.send('Hello %s', session.userData.name);
	}]);

bot.dialog('/profile', [
	function (session){
		builder.Prompts.text(session, 'Hi!, What\'s your name?');
	},
	function (session, results) {
		session.userData.name = results.response;
		session.endDialog();
	}])