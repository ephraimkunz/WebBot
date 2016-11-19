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

bot.dialog('/', [
	function (session) {
	session.send('Hello! I\'m the KunzBot and these are there are a few ways I can assist you today.');
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
			"Remove spaces from a string"]);

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
		
	}]);