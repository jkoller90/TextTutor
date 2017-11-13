//twilio api calls
var twilio = require('twilio');
var client = require('twilio')(
    // process.env.TWILIO_ACCOUNT_SID,
    // process.env.TWILIO_AUTH_TOKEN
    'ACc694cec59a35c6b5830571760dc626a6', 'af0ddb5adb3d8d38d04babd5b03b24db');
var fromNum = '+19149966800';
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
    console.log("Question and Answers: " + questionHash);
    question = questionHash.question;
    answer = questionHash.answer;
    option1 = questionHash.option1;
    option2 = questionHash.option2;

    // NEED TO ADD && hasTakenQuiz(userPhone) to each else if
    if (msgBody.toLowerCase().trim() == 'join') {
        addUserToSql(userPhone);
    } else if (msgBody.toLowerCase().trim() == 'start quiz' && checkRegistration(userPhone) && !getHasQuizStarted(userPhone)) {
        console.log('Sending Quiz Question');
        sendQuestion(userPhone, question, answer, option1, option2);
        setHasQuizStarted(true, userPhone);
    } else if (msgBody.toLowerCase().trim() == answer && getHasQuizStarted(userPhone)) {

        console.log('Answer is correct');
        sendCorrectResponse(userPhone, answer);
        updateSQL(userPhone, answer, true)
    } else if (msgBody.toLowerCase().trim() == option1 && getHasQuizStarted(userPhone)) {
        console.log('Answer is wrong');
        sendIncorrectResponse(userPhone, option1, answer);
        updateSQL(userPhone, option1, false)
    } else if (msgBody.toLowerCase().trim() == option2 && getHasQuizStarted(userPhone)) {
        console.log('Answer is wrong');
        sendIncorrectResponse(userPhone, option2, answer);
        updateSQL(userPhone, option2, false)
    } else {
        InvalidUserInputText(userPhone, msgBody)
    }
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
    // checkNumberExists(phonenumber)
    return true;
}

function sendQuestion(phonenumber, question, answer, option1, option2) {
    // Need to reformat the body to look more like a question with answer options
    // and randomize answer option order so that the first one isnt right every time
    console.log('User : ' + phonenumber + ' is starting a quiz')
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

app.get('/grades', function (req, res) {
    getClassGrades(res);
});

app.post('/admin', function (req, res) {
    formSubmission(req, res);
    console.log('Admin Submitted Data');
    startLesson();
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

function InvalidUserInputText(phonenumber, text) {
    // put logic to check if user is in the class already, if not send join message, else send start quiz message
    console.log('User inserted incorrect text: ' + text)
    client.messages.create({
        from: fromNum,
        to: phonenumber,
        body: "Please check your spelling, if you have not joined the class text 'join' to start learning!"
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
//promises needed to emulate synchronous scripting with SQL calls
// var Promise = require('promise');
// var promise = new Promise(function (resolve, reject) {
// 		resolve(2 + 2);
// 	})
//================================================================
//database is set up here 
// ================================================================
var numbers = [];

// function readSql() {
//     var mysql = require('sync-mysql');
//     var con = mysql.createConnection({
//         host: "localhost",
//         user: "root",
//         password: "123456",
//         database: 'db'
//     });
//     con.connect((err) => {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         console.log('Connection established');
//     });
//     con.query('select * from class', function (error, rows, fields) {
//         if (error) throw error;
//         console.log(rows[0]['phonenumber']);
//     });
//     con.end();
// }

function addUserToSql(phonenumber) {
    // put logic to check if phone number is already in SQL 
    // and send different message to user if they are already in

    // Twilio Message Functions
    function successfullyAddedText(phonenumber) {
        console.log("Success Message being sent")
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
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123456",
        database: 'db'
    });
    con.connect((err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Connection established');
    });
    // Insert Statement
    con.query('insert into class (`phonenumber`) value (?)', [phonenumber], function (error, rows, fields) {
        if (error) throw error;
    });
    // Close connection
    con.end();
    // END SQL
    successfullyAddedText(phonenumber);
}

function checkNumberExists(phonenumber) {
    console.log('Checking if number: ' + phonenumber + ' is in DB')
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123456",
        database: 'db'
    });
    con.connect((err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Connection established');
    });
    con.query('select * from class where (?)', [phonenumber], function (error, rows, fields) {
        if (error) {
            console.log('Phone Number: ' + phonenumber + ' does not exist in DB')
            throw error;
        }
        if (rows[0]['phonenumber']) {
            exists = true;
            console.log("HERE")
        }
    });
    con.end();
}

function addQuestionsToSql(data) {
    // Connection to SQL
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123456",
        database: 'db'
    });
    con.connect((err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Connection established');
    });
    // Insert Statement
    con.query("delete from questions where question like '%%' ")
    con.query('insert into questions (question, answer, option1, option2) value (?)', [data], function (error, rows, fields) {
        if (error) throw error;
    });
    // Close connection
    con.end();
    // END SQL
    console.log('Successfully Added data into SQL: ' + data)
}

function updateSQL(phonenumber, answer, bool) {
    // Connection to SQL
    console.log('Updating User DB, answer: ' + answer + ' ,correct: ' + bool)
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123456",
        database: 'db'
    });
    con.connect((err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Connection established');
    });
    // Insert Statement
    con.query("UPDATE class SET answer = (?), answeredCorrectly = (?) where phonenumber = (?)", [answer, bool, phonenumber], function (error, rows, fields) {
        if (error) throw error;
    });
    // Close connection
    con.end();
    // END SQL
}

//Getters and setters for DB
// ================================================================
function setHasQuizStarted(bool, phonenumber) {
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123456",
        database: 'db'
    });
    con.connect((err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Connection established');
    });
    con.query("UPDATE class SET hasQuizStarted = (?) where phonenumber = (?)", [bool, phonenumber], function (error, rows, fields) {
        if (error) throw error;
    });
    con.end();
}

function getHasQuizStarted(phonenumber) {

    var MySql = require('sync-mysql');
    var connection = new MySql({
        host: 'localhost',
        user: 'root',
        database: 'db',
        password: '123456'
    });

    var result = connection.query('SELECT hasQuizStarted from class where phonenumber = (?)', [phonenumber], function (error, rows, fields) {
        if (error) throw error;
    });

    connection.end;
    if (result[0]['hasQuizStarted'] == 1) 
        return true;
    else if (result[0]['hasQuizStarted']) {
        return false;
    }
}



// unfinished DB functions
// ================================================================

function hasTakenQuiz(phonenumber) {
    return true;
}

function getPhoneNumbers() {
    // TODO Add SQL query
    // numbers = ['+19143301533', '+19174160409']
    // return numbers
    var MySql = require('sync-mysql');
    var connection = new MySql({
        host: 'localhost',
        user: 'root',
        database: 'db',
        password: '123456'
    });

    var result = connection.query('SELECT * from class');
    var phoneNumbers = [];
    for (var i = 0; i < result.length; i++) {
        phoneNumbers.push(result[i]['phonenumber'])
    }
    connection.end;
    //    console.log(phoneNumbers)
    return phoneNumbers;
}
//Need to fix
function getQuestion() {
    var MySql = require('sync-mysql');
    var connection = new MySql({
        host: 'localhost',
        user: 'root',
        database: 'db',
        password: '123456'
    });

    var result = connection.query('SELECT * from questions');
    // var phoneNumbers = [];
    //  	for (var i = 0; i < result.length; i++) {
    //      phoneNumbers.push(result[i]['phonenumber'])
    //    }
    connection.end;
    return result[0];

}
