Author: 		Rishie Kugathasan
Project: 		Movie DataBase Project
Student ID: 		101154994

Files: 			Home (HTML, CSS ,JS, PUG)
			Intro (HTML, CSS, JS, yourname.png)
			Login (HTML, CSS ,JS, PUG)
			MoviePage (HTML, CSS, JS, PUG)
			Person (HTML, CSS, JS, PUG)
			Sign-Up (HTML, CSS, JS, PUG)
			Social (HTML, CSS, JS, PUG)
			User (HTML, CSS, JS, PUG)
			WriteReview (HTML, CSS, JS, PUG)
			server.js
			package.JSON
			movie-data.JSON
			package-lock.JSON
			
			{Every file except server.js and README.txt and JSON files should be in the public folder}

Instructions: 		Within the instance there should be a folder called Final and within there should 
			contain all the relevant files. Everything should already be installed so running the server
			by typing node server.js should be all that's required to do from the Final directory. 
			-	Public IP: 134.117.134.188, Private IP: 192.168.56.105
			-	Instance Name: rishiekugathasan, Instance user: rishiekugathasan/student, 
				Instance password: Rishie2001
			-	Everything should already be installed, once logged in using the credentials from 
				above, there should be a directory called Final where the server project files can 
				be found. Calling node server.js is all that really needs to be done. 


Important Notes: 	- Implementations that haven't been met include: No basic review (only full review), links 
			  to movies based on genre aren't available, following people not implemented, and adding a 
			  person can't be done. Other than that, all implementation should be working well for this 
			  web application. 
			- One design choice I've decided to make is to convert the directors attribute for a movie
			  object into an integer, so that each movie page wouldn't be too jam packed with info. 
			- First 3 users are already initialized from the server code (it's the first few lines if 
			  you want to check it out). 
			- Certain pages don't have direct links and must be accessed through paramaterized routes,
			  these include: /addtodb/userID, /search/userID, /movieswatched/userID.
			- Similar movies on each movie's page are made based on the genre of that movie. 
			- Another design choice is that since a user has a list of review's that they've made on
			  on their user/profile page, I thought it would be repetitive to have those exact same
			  reviews accessible from the movie's page. 
			- The last important part, is that I've included above 50 movies I'm pretty sure for you to
			  be able to test. If that's not enough on line 595 - 597, you can enable the long JSON data
			  to be used instead, however it becomes VERY slow since everything's on RAM. 
			- Will be working on this throughout the winter break to improve it...

