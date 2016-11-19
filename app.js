var restify = require('restify');
var builder = require('botbuilder');
var prettydate = require('pretty-date');

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