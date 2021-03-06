//twilio api calls
var twilio = require('twilio');
var client = require('twilio')(
	// process.env.TWILIO_ACCOUNT_SID,
	// process.env.TWILIO_AUTH_TOKEN
	//	'ACa87e8aa01e3aca3e1c104b065a03e951', '530048a4490e8de5edb43db6d8d47d22');
	//var fromNum = '+19176151444'
	'ACc694cec59a35c6b5830571760dc626a6', 'af0ddb5adb3d8d38d04babd5b03b24db');
var fromNum = '+19149966800';

var host = 'sql9.freesqldatabase.com';
var user = 'sql9209858';
var database = 'sql9209858';
var password = 'rKnRnmNLuh';

var mysqlSync = require('sync-mysql');
var conSync = new mysqlSync({
	host: host,
	user: user,
	database: database,
	password: password
});
//doesn't need a connection method call
//conSync.connect((err)=>{
//	if(err){
//		console.log(err);
//		return;
//	}
//})

var mysql = require('mysql');
var con = mysql.createConnection({
	host: host,
	user: user,
	database: database,
	password: password
});
con.connect((err) => {
	if (err) {
		console.log(err);
		return;
	}
});

// ================================================================
// Setup HTTP Server and App parser 
// ================================================================
var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
var app = require('express')();
//app is using body parser to parse the request body
app.use(bodyParser.urlencoded({
	extended: false
}));
//app.use(express.static('assets'));
app.use('/static', express.static('assets'))
http.createServer(app).listen(process.env.PORT || 3000, function () {
	console.log("Express server listening on port 3000");
});

// ================================================================
// Catches a text message from a user and do action
// ================================================================
app.post('/sms', function (request, response) {
	var msgBody = request.body.Body;
	var userPhone = request.body.From;
	var questionHash = getQuestion();

	question = questionHash.question;
	answer = questionHash.answer;
	option1 = questionHash.option1;
	option2 = questionHash.option2;

	// NEED TO ADD && hasTakenQuiz(userPhone) to each else if
	if (msgBody.toLowerCase().trim() == 'join') {
		if (!checkNumberExists(userPhone)) {
			addUserToSql(userPhone);
		} else {
			sendSmsMessage(userPhone, "You are already registered! Please text 'start quiz'");
		}
	} else if (msgBody.toLowerCase().trim() == 'start quiz') {
		if (checkRegistration(userPhone)) {
			sendQuestion(userPhone, question, answer, option1, option2);
			setHasQuizStarted(true, userPhone);
		}
	} else if (msgBody.toLowerCase().trim() == answer.toLowerCase().trim()) {
		if (canAcceptAnswer(userPhone)) {
			console.log('Answer is correct');
			sendCorrectResponse(userPhone, answer);
			setHasTakenQuiz(true, userPhone);
			updateSQL(userPhone, answer, true)
		}
	} else if (msgBody.toLowerCase().trim() == option1.toLowerCase().trim()) {
		if (canAcceptAnswer(userPhone)) {
			console.log('Answer is wrong');
			sendIncorrectResponse(userPhone, option1, answer);
			setHasTakenQuiz(true, userPhone);
			updateSQL(userPhone, option1, false)
		}
	} else if (msgBody.toLowerCase().trim() == option2.toLowerCase().trim()) {
		if (canAcceptAnswer(userPhone)) {
			console.log('Answer is wrong');
			sendIncorrectResponse(userPhone, option2, answer);
			setHasTakenQuiz(true, userPhone);
			updateSQL(userPhone, option2, false)
		}
	} else {
		if (checkNumberExists(userPhone)) {
			sendSmsMessage(userPhone, "Please check your message! It is not valid input");
			console.log("User " + userPhone + " made a typo!");
		}
	}
});


// ================================================================
// Templating for Table
// ================================================================
///
/// Use pug as templating engine. Pug is renamed jade.

app.set('view engine', 'pug');

app.get('/grades', function (req, res) {
	var personList = [];
	//mysql w/o syncg
	// Connect to MySQL database.
	//	connection.connect();
	var gradesMysql = require('mysql');

	var con = gradesMysql.createConnection({
		host: host,
		user: user,
		database: database,
		password: password
	});
	// Do the query to get data.
	con.connect();
	con.query('SELECT * FROM class WHERE id > 0', function (err, rows, fields) {
		var person;

		if (err) {
			res.status(500).json({
				"status_code": 500,
				"status_message": "internal server error"
			});
			console.log(err);
		} else {
			// Check if the result is found or not
			for (var i = 0; i < rows.length; i++) {
				console.log(rows[i])
				//	  		if(rows.length==1) {
				// Create the object to save the data.
				var student = {
					'phonenumber': rows[i].phonenumber,
					'hasTakenQuiz': (rows[i].hasTakenQuiz == 1),
					'answeredCorrectly': (rows[i].answeredCorrectly == 1)
				}
				// Add object into array
				personList.push(student);
				//	  	}

			}

			// Render index.pug page using array 
			res.render('index', {
				"personList": personList
			});
		}
		console.log(personList);
	});

	// Close the MySQL connection
	con.end();
});

// ================================================================
// App Logic
// ================================================================
function startLesson() {
	// Set who wants quiz to false
	console.log("Lesson starting")
	var phoneNumbers = getPhoneNumbers();
	sendInformationText(phoneNumbers);
	// Info message should end with do you want to take a quiz?    
}

function sendInformationText(phoneNumbers) {
	var text = "Your instructor has posted a new question please text 'start quiz' to answer it";
	for (var i = 0; i < phoneNumbers.length; i++) {
		phonenumber = phoneNumbers[i];
		sendSmsMessage(phonenumber, text);
	}
}

function checkRegistration(phonenumber) {
	// Check if user exists in DB
	numExists = checkNumberExists(phonenumber)
	//    console.log(numExists + " numexists");

	if (numExists) {
		quizStarted = hasQuizStarted(phonenumber)
		if (!quizStarted) {
			console.log("phoneNumber: " + phonenumber + " has passed registration checks");
			return true;
		} else {
			if (!hasTakenQuiz(phonenumber)) {
				sendSmsMessage(phonenumber, "Your quiz is in progress! Please answer the question.");
				console.log("user " + phonenumber + " is taking the quiz already");
				return true;
			} else {
				sendSmsMessage(phonenumber, "You have already taken the quiz. Please wait for your teacher to send a new quiz.");
				console.log("User " + phonenumber + " is trying to take the quiz again");
				return false;
			}
		}
	} else {
		sendSmsMessage(phonenumber, "Please text 'join' to join!");
		console.log('User ' + phonenumber + 'has to register');
		return false;
	}
}

function canAcceptAnswer(phonenumber) {

	var bool;
	if (checkNumberExists(phonenumber)) {
		if (hasQuizStarted(phonenumber)) {
			if (!hasTakenQuiz(phonenumber)) {
				sendSmsMessage(phonenumber, "Your answer was accepted")
				console.log("Answer was accepted")
				// logic to handle updating sql to change hasTakenQuiz
				bool = true;

			} else {
				sendSmsMessage(phonenumber, "Cannot accept your answer, because you have already taken this quiz")
				console.log("Answer was not accepted because user: " + phonenumber + " has already taken the quiz")
				bool = false;
			}
		} else {
			sendSmsMessage(phonenumber, "You have not started a quiz yet, please text 'start quiz'")
			console.log("Answer was not accepted because user: " + phonenumber + "has not started the quiz yet")
			bool = false;
		}

	} else {
		sendSmsMessage(phonenumber, "You are not registered for this class, please text 'join' to be added")
		console.log("Answer was not accepted because user: " + phonenumber + " is not registered for the class")
		bool = false;
	}
	console.log("can accept answer returned " + bool);
	return bool;
}

function sendQuestion(phonenumber, question, answer, option1, option2) {
	// Need to reformat the body to look more like a question with answer options
	// and randomize answer option order so that the first one isnt right every time
	console.log('Sending user: ' + phonenumber + ' quiz questions and answers')
	client.messages.create({
		from: fromNum,
		to: phonenumber,
		body: question + ":\n" + answer + "\n" + option1 + "\n" + option2
	}, function (err, message) {
		if (err) console.error(err.message);
	});
}
// ================================================================
// Admin Console
// ================================================================
app.get('/admin', function (req, res) {
	displayForm(res);
});

app.post('/admin', function (req, res) {
	setTimeout(function(){
		formSubmission(req, res);
		console.log('Admin Submitted Data');
		startLesson();		
	},1100);
})
// ================================================================
// root redirects to /admin 
//  ================================================================
app.get('/', function (req, res) {
	res.redirect('/admin');
});
// ================================================================
// jQuery Form
// ================================================================
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');
var port = process.env.PORT || 3000;

function displayForm(res) {
	fs.readFile('index.html', function (err, data) {
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Content-Length': data.length
		});
		res.write(data);
		res.end();
	});
};

function formSubmission(req, res) {
	// Setting up Form
	var values = [];
	var fields = [];
	var form = new formidable.IncomingForm();
	form.on('field', function (field, value) {
		fields[field] = value;
		values.push(value);
	});
	form.on('end', function () {
		res.redirect('/grades');
		res.end(util.inspect({
			fields: fields
		}));
		addQuestionsToSql(values);
	});
	form.parse(req);
}

function getClassGrades(res) {
	fs.readFile('grades_table.html', function (err, data) {
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Content-Length': data.length
		});
		res.write(data);
		res.end();
	});
}
// ================================================================
// Twillio Messages
// ================================================================
function sendSmsMessage(phonenumber, text) {
	client.messages.create({
		from: fromNum,
		to: phonenumber,
		body: text
	}, function (err, message) {
		if (err) console.error(err.message);
	});
}

function sendCorrectResponse(phonenumber, answer) {
	console.log('User inserted correct answer: ' + answer)
	client.messages.create({
		from: fromNum,
		to: phonenumber,
		body: "Congratulations you answered this correctly!"
	}, function (err, message) {
		if (err) console.error(err.message);
	});
}

function sendIncorrectResponse(phonenumber, answer, correctAnswer) {
	console.log('User inserted incorrect answer: ' + answer)
	client.messages.create({
		from: fromNum,
		to: phonenumber,
		body: "Sorry you got this one wrong, the correct answer was: " + correctAnswer
	}, function (err, message) {
		if (err) console.error(err.message);
	});
}

//================================================================
//database is set up here 
// ================================================================
var numbers = [];

function addUserToSql(phonenumber) {
	// put logic to check if phone number is already in SQL 
	// and send different message to user if they are already in

	// Twilio Message Functions
	function successfullyAddedText(phonenumber) {
		console.log("Success Message to user: " + phonenumber + " being sent")
		client.messages.create({
			from: fromNum,
			to: phonenumber,
			body: "Congrats you've been successfully added"
		}, function (err, message) {
			if (err) console.error(err.message);
		});
	}
	// Connection to SQL
	console.log('Adding phonenumber: ' + phonenumber + ' to DB')

	// Insert Statement
	con.query('insert into class (`phonenumber`) value (?)', [phonenumber], function (error, rows, fields) {
		if (error) throw error;
	});

	// END SQL
	successfullyAddedText(phonenumber);
}

function addQuestionsToSql(data) {	
	//1. reset student info
	con.query('update class set hasQuizStarted=0,answer=NULL,answeredCorrectly=0,hasTakenQuiz=0 ')	
	//2. adjust questions table
	con.query("delete from questions where question like '%%' ")
	con.query('insert into questions (question, answer, option1, option2) value (?)', [data], function (error, rows, fields) {
		if (error) throw error;
	});
//	con.query('commit');
	console.log('Successfully Added data into SQL: ' + data)
}

function updateSQL(phonenumber, answer, bool) {
	// Connection to SQL
	console.log('Updating User DB, answer: ' + answer + ' ,correct: ' + bool)
	con.query("UPDATE class SET answer = (?), answeredCorrectly = (?) where phonenumber = (?)", [answer, bool, phonenumber], function (error, rows, fields) {
		if (error) throw error;
	});
	// END SQL
}

function setHasQuizStarted(bool, phonenumber) {
	con.query("UPDATE class SET hasQuizStarted = (?) where phonenumber = (?)", [bool, phonenumber], function (error, rows, fields) {
		if (error) throw error;
	});
}

function setHasTakenQuiz(bool, phonenumber) {
	con.query("UPDATE class SET hasTakenQuiz = (?) where phonenumber = (?)", [bool, phonenumber], function (error, rows, fields) {
		if (error) throw error;
	});
}

// Get From DB functions
// ================================================================

function getPhoneNumbers() {
	var result = conSync.query('SELECT * from class');
	var phoneNumbers = [];
	for (var i = 0; i < result.length; i++) {
		phoneNumbers.push(result[i]['phonenumber'])
	}
	//	connection.end();
	console.log(phoneNumbers)
	return phoneNumbers;
}

function getQuestion() {
//	conSync.connect();
	var result = conSync.query('SELECT * from questions');
	//	connection.end();
	return result[0];
}

function checkNumberExists(phonenumber) {
	console.log('Checking if number: ' + phonenumber + ' is in DB')
	var bool = false;
	var result = conSync.query('select * from class where phonenumber = (?)', [phonenumber], function (error, rows, fields) {
		if (error) {
			throw error;
			console.log('Phone Number: ' + phonenumber + ' does not exist in DB')

		}
	});

	if (result[0] != undefined) {
		console.log("user " + phonenumber + " is in the DB")
		bool = true;
	}

	//	connection.end();
	return bool;
}

function hasQuizStarted(phonenumber) {
	console.log('Checking if number: ' + phonenumber + ' has already started this quiz')
	var bool;
	var result = conSync.query('SELECT hasQuizStarted from class where phonenumber = (?)', [phonenumber], function (error, rows, fields) {
		if (error) throw error;
	});
	// console.log("Here: "+result[0]['hasQuizStarted'])
	if (result[0]['hasQuizStarted'] == 1)
		bool = true;
	else if (result[0]['hasQuizStarted'] != undefined) {
		bool = false;
	}
	//	connection.end();
	return bool;
}

function hasTakenQuiz(phonenumber) {
	console.log('Checking if number: ' + phonenumber + ' has answered this quiz already')
	var bool;
	var result = conSync.query('SELECT hasTakenQuiz from class where phonenumber = (?)', [phonenumber], function (error, rows, fields) {
		if (error) throw error;
	});
	// console.log("Here: "+result[0]['hasQuizStarted'])
	if (result[0]['hasTakenQuiz'] == 1)
		bool = true;
	else if (result[0]['hasTakenQuiz']) {
		bool = false;
	}
	//	connection.end();
	return bool;
}
