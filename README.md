# Text Tutor
	# Instructions for local installation:
	
	Inside TextTutor directory:

	1.
    npm install to rebuild any missing module (may not be neccessary)
    npm start
  
	2. 
		In a separate console, run "ngrok http 3000" to get webook for ngrok. This will be added to number 3 under Setup Heroku-Twilio webhook at the bottom. 
		example: https://949a1787.ngrok.io/sms
	
	3. 
		Make sure MySQL is installed and running
		Run guideQuery.sql
		
# Instructions for installation on Heroku
	 
	 1. Pull from git
	 2. Log in to Heroku using Command Prompt on Windows, Terminal on Unix/Linux
	 3. Git add . 
	 4. Git commit -m " -- " 
	 5. heroku create <<name it if you'd like>> ||or||
	 		a. git remote -v to check your remotes for other Heroku remotes
			b. heroku git:remote -a <<name of existing Heroku App>>
	 6. Git push heroku master 
	 
	 
# Setup Heroku-Twilio webhook 
		
		1. Log in to Twilio.com console and go to Phone Numbers
		2. Click on the number you'd like to use (red text is actually a hyperlink)
		3. Under Messaging, in the A Message Comes In form, enter your Heroku url with /sms at the end: https://exampleapp.herokuapp.com/sms 
		

# Setup Remote Database
	
		We used freesqldatabase.com, which provides an online database that is accessed on http://phpmyadmin.co/