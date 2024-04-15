let users = [];
let ids = 1000;
let user1 = {id: 1000,username:"user1",password:"password1",c_user:false,followers:[],following:[],review:[0],recommended:[],movieswatched:[0,2]};
let user2 = {id: 1001,username:"user2",password:"password2",c_user:false,followers:[],following:[],review:[1],recommended:[],movieswatched:[0,1]};
let user3 = {id: 1002,username:"user3",password:"password3",c_user:false,followers:[],following:[],review:[2],recommended:[],movieswatched:[1]};
users.push(user1);
users.push(user2);
users.push(user3);
incrementID();
incrementID();
incrementID();

//IMPORTANT: Since my movie page has a section for ALL staff, I have to end up concatenating both actor and writer arrays 
function staff(movieTitle) {
    let totalstaff = [];

    let movObjs = Object.values(movies);
    if (movObjs.length == 0) {
        return null;
    }

    for (let i = 0; i < movObjs.length; ++i) {
        if (movObjs[i].title === movieTitle) {
            let actors = movObjs[i].actors;
            let writers = movObjs[i].writers;
            totalstaff = actors.concat(writers);
        }
    }

    return totalstaff;
}
//console.log(staff("Terminator"));

function authorize(req,res,next) {
    if (!req.session.loggedIn) {
        res.status(401).send("Unauthorized.");
        return;
    }
    next();
}

let express = require('express');
let app = express();
let pug = require('pug');
let session = require('express-session');
let body_parser = require('body-parser');
const { create } = require('domain');
const { response } = require('express');
const { ppid } = require('process');

//Session middleware
app.use(session({secret:"some secret"}));

app.set('views','./public');
app.set('view engine','pug');

app.use(express.static('public/intro'));
app.use(express.static('public/login'));
app.use(express.static('public/signup'));
app.use(express.static('public/home'));
app.use(express.static('public/moviepage'));
app.use(express.static('public/person'));
app.use(express.static('public/social'));
app.use(express.static('public/user'));
app.use(express.static('public/writereview'));
app.use(express.static('public/movieswatched'));
app.use(express.static('public/search'));
app.use(express.static('public/addtodb'));

//Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(body_parser.json());
app.use(body_parser.urlencoded({extended:true}));

app.get('/',function(req,res) {
    res.sendFile('./public/intro/intro.htm',{root:__dirname});
});

app.get('/login',function(req,res) {
    res.render('login/login.pug',{});
});

app.get('/signup',function(req,res) {
    res.render('signup/signup.pug',{});
});

app.get('/addtodb/:userID',authorize,function(req,res) {
    let user = getUserID(req.params.userID);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }
    let obj = {user:user};
    res.render('addtodb/addtodb.pug',{obj});
});

app.post('/insertMovie/:userID',authorize,function(req,res) {

    if (req.params.userID != req.session.userID) {
        console.log("Unauthorized.");
        res.status(401).send("Unauthorized. Must be a contributing user to add a new movie or person.");
        res.end();
        return;
    }

    let newMovie = req.body;
    newMovie.year = parseInt(newMovie.year);
    newMovie.rating = parseInt(newMovie.rating);
    newMovie.genres = newMovie.genres.split(",");
    newMovie.actors = newMovie.actors.split(",");
    newMovie.writers = newMovie.writers.split(",");
    newMovie.directors = parseInt(newMovie.directors);

    if (newMovie.title.length < 1 || newMovie.runtime.length != 7 || newMovie.year < 0 || newMovie.year > 5000) {
        console.log("Incorrect info");
        res.status(401).send("You have entered invalid information");
        res.end();
        return;
    }
    if (newMovie.rating < 0 || newMovie.rating > 100 || newMovie.description.length < 1 || newMovie.directors < 0 || newMovie.directors > 10) {
        console.log("Incorrect info");
        res.status(401).send("You have entered invalid information");
        res.end();
        return;
    }

    let m = {title:newMovie.title,runtime:newMovie.runtime,year:newMovie.year,rating:newMovie.rating,genres:newMovie.genres,actors:newMovie.actors,writers:newMovie.writers,description:newMovie.description,review:[],number_ratings:0};
    movies[movieIDs] = m;
    incrementMovieIDS();
    console.log("New Movie...")
    console.log(m);
    res.redirect('/addtodb/'+req.session.userID);
    res.end();
});

app.get('/search/:userid',authorize,function(req,res) {
    let user = getUserID(req.params.userid);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }
    let mov = {};
    let act = {};
    let writ = {};
    let obj = {user:user,movies:mov,actors:act,writers:writ};
    res.render('search/search.pug',{obj});
});

app.post('/search',authorize,function(req,res) {
    let string = String(req.body.search);

    let user = getUserID(req.session.userID);

    let mov = searchMovies(string);
    let act = searchActors(string);
    let writ = searchWriters(string);

    let obj = {user:user,movies:mov,actors:act,writers:writ};
    //console.log(obj.bugars); == undefined
    res.render('search/search.pug',{obj});
});

app.get('/moviepage/:userid/movie/:movieid/watched',authorize,function(req,res) {
    
    let user = getUserID(req.params.userid);
    let movie = getMovie(req.params.movieid);

    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }

    if (user.movieswatched.includes(parseInt(req.params.movieid))) {
        res.status(401).send("You have already watched this movie.");
        return;
    }

    user.movieswatched.push(parseInt(req.params.movieid));
    res.redirect('/movieswatched/'+user.id);

    console.log("User has now new movie added to watchlist");
    console.log(user);
});

app.get('/movieswatched/:id',authorize,function(req,res) {
    let user = getUserID(req.params.id);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }
    let moviesWatched = getMoviesWatched(user.id);
    let obj = {user:user,watched:moviesWatched};
    res.render('movieswatched/movieswatched.pug',{obj});
});

app.get('/home/:id',authorize,function(req,res) { 
    let user = getUserID(req.params.id);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }

    let recommended = retrieveMovie(req.params.id);
    let ids = [];
    if (recommended != null) {
        for (let i = 0; i < recommended.length; ++i) {
            ids.push(getMovieID(String(recommended[i].title)));
        }
    }

    if (user != null) {
        let obj = {user:user,moviearray:recommended,ids:ids};
        res.render('home/home.pug',{obj});
    }else {
        res.status(401).send("User doesn't exist.");
        return;
    }
});

app.get('/personpage/:id/person/:personID',authorize,function(req,res) {
    let user = getUserID(req.params.id);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }

    let p = getPersonID(parseInt(req.params.personID));
    let w = getWorks(p.name);
    let m = [];
    if (p != null && w != null) {
        for (let i = 0; i < w.length; ++i) {
            let movie = getMovie(w[i]);
            m.push(movie);
        }
    }

    //let moviesIn = getPersonWorks(parseInt(req.params.personID));
    let moviesIn = m;
    let ids = [];
    if (moviesIn != null) {
        for (let i = 0; i < moviesIn.length; ++i) {
            ids.push(getMovieID(String(moviesIn[i].title)));
        }
    }

    let collabs = getCollaborators(parseInt(req.params.personID));
    let personids = [];

    for (let i = 0; i < collabs.length; ++i) {
        let id = getPerson(collabs[i]);
        if (id != null) {
            personids.push(id);
        }
    }

    let linkedpeople = {};
    for (let i = 0; i < personids.length; ++i) {
        let person = getPersonID(personids[i]);
        if (person != null) {
            linkedpeople[personids[i]] = person;
        }
    }
    let values = Object.values(linkedpeople);
    let names = [];
    for(let i = 0; i < values.length; ++i) {
        names.push(values[i].name);
    }
    let newPeople = [];
    for (let i = 0; i < collabs.length; ++i) {
        if (!names.includes(collabs[i])) {
            newPeople.push(collabs[i]);
        }
    }

    let person = getPersonID(parseInt(req.params.personID));
    if (user != null && person != null) {
        let obj = {user:user,person:person,collabs:newPeople,movies:moviesIn,ids:ids,linked:linkedpeople};
        res.render('person/person.pug',{obj});
    }else {
        res.status(401).send("Person doesn't exist.");
        return;
    }
});

app.get('/user/:id',authorize,function(req,res) {
    let user = getUserID(req.params.id);
    let otherUser = false;
    let otherUserobj = null;
    let follow_unfollow = null;

    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            otherUser = true;
            user = getUserID(req.session.userID);
            otherUserobj = getUserID(req.params.id);
        }
    }

    if (otherUserobj != null) {
        if (user.following.includes(otherUserobj.id)) {
            follow_unfollow = "Unfollow";
        }else {
            follow_unfollow = "Follow";
        }
    }

    if (user != null) {
        let reviews = getReviewsByUser(parseInt(req.params.id));
        let obj = {user:user,reviews:reviews,otherUser:otherUser,followunfollow:follow_unfollow,otheru:otherUserobj};
        res.render('user/user.pug',{obj});
    }else {
        res.status(401).send("User doesn't exist.");
        return;
    }
});

app.post('/followrequest',function(req,res) {
    toFollowID = parseInt(req.body.toFollow);
    let currUser = getUserID(req.session.userID);
    let currUserID = currUser.id;

    if (req.body.followText == 'Follow') {
        follow(currUserID,toFollowID);   
    }else {
        unfollow(currUserID,toFollowID);
    }

    res.end();
});

app.get('/social/:id',authorize,function(req,res) {
    let user = getUserID(req.params.id);
    if (user != null) {
        let followersArray = getFollowers(req.params.id);
        let followingArray = getFollowing(req.params.id);
        let obj = {user:user,following:followingArray,followers:followersArray};
        res.render('social/social.pug',{obj});
    }else {
        res.status(401).send("User doesn't exist.");
        return;
    }
});

app.get('/moviepage/:id/movie/:movieID',authorize,function(req,res) {
    let user = getUserID(req.params.id);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }

    let movie = getMovie(req.params.movieID);
    let people = null;
    if (movie !== null) {
        people = staff(movie.title);
    }
    let ids = [];
    let peoplewithlinks = {};
    if (people != null) {
        for (let i = 0; i < people.length; ++i) {
            let id = getPerson(people[i]);
            if (id != null) {
                ids.push(id);
            }
        }
    }
    if (ids != null) {
        for (let i = 0; i < ids.length; ++i) {
            let person = getPersonID(ids[i]);
            if (person != null) {
                peoplewithlinks[ids[i]] = person;
            }
        }
    }
    let values = Object.values(peoplewithlinks);
    let names = [];
    for(let i = 0; i < values.length; ++i) {
        names.push(values[i].name);
    }
    let newPeople = [];
    for (let i = 0; i < people.length; ++i) {
        if (!names.includes(people[i])) {
            newPeople.push(people[i]);
        }
    }
    if (movie != null && user != null) {
        let similarMovies = getSimilarMovies(req.params.movieID);
        let obj = {mov:movie,user:user,people:newPeople,links:peoplewithlinks,similar:similarMovies,id:req.params.movieID};
        res.render('moviepage/Moviepage.pug',{obj});
    }else {
        res.status(401).send("User doesn't exist or movie doesn't exist.");
        return;
    }
});

app.get('/writereview/:id',authorize,function(req,res) {
    let user = getUserID(req.params.id);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }
    if (!user.c_user) {
        res.status(401).send("User is not a c_user.");
        return;
    }
    else if (user != null) {
        res.render('writereview/WriteReview.pug',{user});
    }else {
        res.status(401).send("User doesn't exist.");
        return;
    }
});

app.post('/writereview/:id',authorize,function(req,res) {
    console.log(req.body);
    console.log("User before entering review: ");

    let score = parseInt(req.body.score);
    let title = req.body.title;
    let movieTitle = req.body.movietitle;
    let description = req.body.description;
    let userID = req.body.userID;
    let user = getUserID(userID);
    let movID = getMovieID(String(movieTitle));

    if (movID == null) {
        res.status(401).send("That movie name you entered doesn't exist in the database, please try again.");
        return;
    }

    let reviewID = reviewIDS;
    incrementReviewIDS();

    //If they're not a c_user, this will return null and not work, otherwise it should work
    createReview(Number(userID),String(title),String(description),score,Number(reviewID),Number(movID));

    console.log("User after making their review: ");
    console.log(user);
    console.log("New Review: ");
    console.log(getReviewsByUser(userID));

    res.end();
});

app.post('/info',function(req,res) {
    req.body.id = ids;
    incrementID();
    //Add more code to ensure the username and password is proper HERE
    console.log("New user: ");
    console.log(req.body);
    users.push(req.body);
    res.end();
});

app.post('/loginfo',function(req,res) {
    if (req.session.loggedIn) {
        res.status(401).send("Already logged in.");
        return;
    }

    let username = req.body.username;
    let password = req.body.password;

    let user = logUser(username,password);
    if (user != null) {
        req.session.loggedIn = true;
        req.session.username = username;
        req.session.userID = user.id;
        console.log(req.session);
        res.redirect('/home/'+user.id);
    }
    else {
        res.status(401).send("Invalid username or password try again.");
        return;
    }
    res.end();
});

app.get('/logout',function(req,res) {
    if (req.session.loggedIn) {
        console.log(req.session.username + " is logging out...");
        req.session.destroy();
        res.sendFile('./public/intro/intro.htm',{root:__dirname});
    }else {
        res.status(200).send("You can't logout, because you're not logged in.");
    }
});

app.get('/c_user/:id',authorize,function(req,res) {
    //We already know that if the user requests this, that they want to be a c_user 
    //We're just gonna let them become one, without any restrictions (yet)

    let user = getUserID(req.params.id);
    if (user != null && req.session.userID != null) {
        if (user.id != req.session.userID) {
            res.status(401).send("Unauthorized.");
            return;
        }
    }
    if (!user.c_user) {
        c_user(user.id);
    }else {
        res.status(401).send("You're already a contributing user.");
        return;
    }
    console.log("User is now a c_user");
    console.log(user);
    res.redirect('/home/'+user.id);
    res.end();
});

//JSON
app.get('/movies',authorize,function(req,res) {
    let movieTitle = req.query.title;
    let movieGenre = req.query.genre;
    let movieYear = req.query.year;
    let movieMinRating = req.query.minrating;

    let overallMovies = [];
    if (movieTitle == undefined && movieGenre == undefined && movieYear == undefined && movieMinRating == undefined) {
        let values = Object.values(movies);
        res.json(values);
        res.end();
        return;
    }
    if (movieTitle != null || movieTitle != undefined) {
        movieTitle = movieTitle.split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ');
        let movie = getMovie(parseInt(getMovieID(String(movieTitle))));
        if (movie == null) {
            res.status(401).send("Unknown movie.");
            return;
        }
        res.json(movie);
        res.end();
        return;
    }
    if (movieGenre != null || movieGenre != undefined) {
        movieGenre = movieGenre.split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ');
        let moviearray = movieByGenre(String(movieGenre));
        if (moviearray == null) {
            res.status(401).send("Unknown genre.");
            return;
        }
        overallMovies.push(moviearray);
    }
    if (movieYear != null || movieYear != undefined) {
        let moviearray = movieByYear(parseInt(movieYear));
        if (moviearray == null) {
            res.status(401).send("Unknown year.");
            return;
        }
        overallMovies.push(moviearray);
    }
    if (movieMinRating != null || movieMinRating != undefined) {
        let moviearray = movieByMinRating(parseInt(movieMinRating));
        if (moviearray == null) {
            res.status(401).send("Unknown rating.");
            return;
        }
        overallMovies.push(moviearray);
    }
    
    res.json(overallMovies);
    res.end();
});

app.get('/movie/:id',authorize,function(req,res) {
    movieid = req.params.id;
    let movie = getMovie(movieid);
    if (movie == null) {
        res.status(401).send("Unknown movie.");
        return;
    }
    res.json(movie);
    res.end();
});

app.get('/people',authorize,function(req,res) {
    let personName = req.query.name;
    if (personName == undefined) {
        let values = Object.values(persons);
        res.json(values);
        res.end();
        return;
    }

    personName = personName.split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ');

    let person = getPersonID(parseInt(getPerson(String(personName))));
    if (person == null) {
        res.status(401).send("Unknown person.");
        return;
    }
    res.json(person);
    res.end();
});

app.get('/people/:id',authorize,function(req,res) {
    let person = getPersonID(parseInt(req.params.id));
    if (person == null) {
        res.status(401).send("Unknown person.");
        return;
    }
    res.json(person);
    res.end();
});

app.get('/users',authorize,function(req,res) {
    let u_name = req.query.name;
    if (u_name == undefined) {
        let values = Object.values(users);
        res.json(values);
        res.end();
        return;
    }
    let user = getUser(String(u_name));
    if (user == null) {
        res.status(401).send("Unknown user.");
        return;
    }
    res.json(user);
    res.end();
});

app.get('/users/:id',authorize,function(req,res) {
    let user = getUserID(parseInt(req.params.id));
    if (user == null) {
        res.status(401).send("Unknown user.");
        return;
    }
    res.json(user);
    res.end();
});

//Links from page to page, will not work if using localhost:3000
app.listen(3000);
console.log('Server lisetning at http://127.0.0.1:3000/');

/*
    ----------------------------------------------END OF SERVER CODE----------------------------------------------
*/


//Business logic

let reviews = {};
let movies = {};
let persons = {};

let movieIDs = 0;
let reviewIDS = 0;
let personIDS = 0;

//Example movies
let movie1 = {title:"Your Name",runtime:"2:00:00",year:2017,rating:10,number_ratings:85,genres:["Romance","Drama"],plot:"...",actors:["Mizuhara","Taki","Samuel L. Jackson"],directors:5,writers:["Writer 1","Writer 2", "Writer 3"],review:[0,2],description:"Your Name tells the story of a high school boy in Tokyo and a high school girl in a rural town, who suddenly and inexplicably begin to swap bodies."};
let movie2 = {title:"Terminator",runtime:"2:00:00",year:2015,rating:7,number_ratings:50,genres:["Action"],plot:"...",actors:["Actor1","Actor2","Samuel L. Jackson"],directors:2,writers:["Writer1","Writer2", "Writer3"],review:[1],description:"The Terminator is a formidable robotic assassin and soldier, designed by the military supercomputer Skynet for infiltration and combat duty, towards the ultimate goal of exterminating the Human Resistance."};
let movie3 = {title:"A Silent Voice",runtime:"2:00:00",year:2016,rating:10,number_ratings:90,genres:["Romance","Drama"],plot:"...",actors:["Shoko"],directors:5,writers:["Writer 1","Writer 2", "Writer 3"],review:[],description:"A high school boy who bullied Shoko Nishimiya, a deaf girl, in elementary school. He becomes the victim of bullying when the principal finds out. Now a social outcast, he strives to make amends with Shoko."};
movies[0] = movie1;
movies[1] = movie2;
movies[2] = movie3;
incrementMovieIDS();
incrementMovieIDS();
incrementMovieIDS();



//Example reviews
let review1 = {user:"user1",movieID:0,title:"Your Name Review",description:"it was SO GOOD",score:90};
let review2 = {user:"user2",movieID:1,title:"Terminator Review",description:"it was alright",score:80};
let review3 = {user:"user3",movieID:0,title:"Your Name Review",description:"it was bad",score:70};
reviews[0] = review1;
reviews[1] = review2;
reviews[2] = review3;
incrementReviewIDS();
incrementReviewIDS();
incrementReviewIDS();

//Example persons
let person1 = {name:"Samuel L. Jackson", role:{actor:true,writer:false,director:true},works:[0,1]};
let person2 = {name:"Taki", role:{actor:true,writer:false,director:false},works:[0]};
let person3 = {name:"Chris Hemsworth", role:{actor:true,writer:false,director:false},works:[]};
let person4 = {name:"Mizuhara",role:{actor:true,writer:false,director:false},works:[0]};

let person5 = {name:"Writer 1",role:{actor:false,writer:true,director:false},works:[0,1,2]};
let person6 = {name:"Writer 2",role:{actor:false,writer:true,director:false},works:[0,1,2]};
let person7 = {name:"Writer 3",role:{actor:false,writer:true,director:false},works:[0,1,2]};

persons[0] = person1;
persons[1] = person2;
persons[2] = person3;
persons[3] = person4;
persons[4] = person5;
persons[5] = person6;
persons[6] = person7;
incrementPersonIDS();
incrementPersonIDS();
incrementPersonIDS();
incrementPersonIDS();
incrementPersonIDS();
incrementPersonIDS();
incrementPersonIDS();

let obj = [{"Title":"Toy Story","Year":"1995","Rated":"G","Released":"22 Nov 1995","Runtime":"81 min","Genre":"Animation, Adventure, Comedy, Family, Fantasy","Director":"John Lasseter","Writer":"John Lasseter (original story by), Pete Docter (original story by), Andrew Stanton (original story by), Joe Ranft (original story by), Joss Whedon (screenplay by), Andrew Stanton (screenplay by), Joel Cohen (screenplay by), Alec Sokolow (screenplay by)","Actors":"Tom Hanks, Tim Allen, Don Rickles, Jim Varney","Plot":"A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room.","Language":"English","Country":"USA","Awards":"Nominated for 3 Oscars. Another 27 wins & 20 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMDU2ZWJlMjktMTRhMy00ZTA5LWEzNDgtYmNmZTEwZTViZWJkXkEyXkFqcGdeQXVyNDQ2OTk4MzI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.3/10"},{"Source":"Rotten Tomatoes","Value":"100%"},{"Source":"Metacritic","Value":"95/100"}],"Metascore":"95","imdbRating":"8.3","imdbVotes":"864,385","imdbID":"tt0114709","Type":"movie","DVD":"20 Mar 2001","BoxOffice":"N/A","Production":"Buena Vista","Website":"N/A","Response":"True"},{"Title":"Jumanji","Year":"1995","Rated":"PG","Released":"15 Dec 1995","Runtime":"104 min","Genre":"Adventure, Comedy, Family, Fantasy","Director":"Joe Johnston","Writer":"Jonathan Hensleigh (screenplay by), Greg Taylor (screenplay by), Jim Strain (screenplay by), Greg Taylor (screen story by), Jim Strain (screen story by), Chris Van Allsburg (screen story by), Chris Van Allsburg (based on the book by)","Actors":"Robin Williams, Jonathan Hyde, Kirsten Dunst, Bradley Pierce","Plot":"When two kids find and play a magical board game, they release a man trapped in it for decades - and a host of dangers that can only be stopped by finishing the game.","Language":"English, French","Country":"USA","Awards":"4 wins & 11 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZTk2ZmUwYmEtNTcwZS00YmMyLWFkYjMtNTRmZDA3YWExMjc2XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.0/10"},{"Source":"Rotten Tomatoes","Value":"54%"},{"Source":"Metacritic","Value":"39/100"}],"Metascore":"39","imdbRating":"7.0","imdbVotes":"297,463","imdbID":"tt0113497","Type":"movie","DVD":"25 Jan 2000","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Grumpier Old Men","Year":"1995","Rated":"PG-13","Released":"22 Dec 1995","Runtime":"101 min","Genre":"Comedy, Romance","Director":"Howard Deutch","Writer":"Mark Steven Johnson (characters), Mark Steven Johnson","Actors":"Walter Matthau, Jack Lemmon, Sophia Loren, Ann-Margret","Plot":"John and Max resolve to save their beloved bait shop from turning into an Italian restaurant, just as its new female owner catches Max's attention.","Language":"English, Italian, German","Country":"USA","Awards":"2 wins & 2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMjQxM2YyNjMtZjUxYy00OGYyLTg0MmQtNGE2YzNjYmUyZTY1XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.7/10"},{"Source":"Rotten Tomatoes","Value":"17%"},{"Source":"Metacritic","Value":"46/100"}],"Metascore":"46","imdbRating":"6.7","imdbVotes":"23,736","imdbID":"tt0113228","Type":"movie","DVD":"18 Nov 1997","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Waiting to Exhale","Year":"1995","Rated":"R","Released":"22 Dec 1995","Runtime":"124 min","Genre":"Comedy, Drama, Romance","Director":"Forest Whitaker","Writer":"Terry McMillan (novel), Terry McMillan (screenplay), Ronald Bass (screenplay)","Actors":"Whitney Houston, Angela Bassett, Loretta Devine, Lela Rochon","Plot":"Based on Terry McMillan's novel, this film follows four very different African-American women and their relationships with the male gender.","Language":"English","Country":"USA","Awards":"9 wins & 10 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYzcyMDY2YWQtYWJhYy00OGQ2LTk4NzktYWJkNDYwZWJmY2RjXkEyXkFqcGdeQXVyMTA0MjU0Ng@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.9/10"},{"Source":"Rotten Tomatoes","Value":"56%"}],"Metascore":"N/A","imdbRating":"5.9","imdbVotes":"9,272","imdbID":"tt0114885","Type":"movie","DVD":"06 Mar 2001","BoxOffice":"N/A","Production":"Twentieth Century Fox Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Father of the Bride Part II","Year":"1995","Rated":"PG","Released":"08 Dec 1995","Runtime":"106 min","Genre":"Comedy, Family, Romance","Director":"Charles Shyer","Writer":"Albert Hackett (screenplay \"Father's Little Dividend\"), Frances Goodrich (screenplay \"Father's Little Dividend\"), Nancy Meyers (screenplay), Charles Shyer (screenplay)","Actors":"Steve Martin, Diane Keaton, Martin Short, Kimberly Williams-Paisley","Plot":"George Banks must deal not only with the pregnancy of his daughter, but also with the unexpected pregnancy of his wife.","Language":"English","Country":"USA","Awards":"Nominated for 1 Golden Globe. Another 1 win & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BOTEyNzg5NjYtNDU4OS00MWYxLWJhMTItYWU4NTkyNDBmM2Y0XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.0/10"},{"Source":"Rotten Tomatoes","Value":"48%"},{"Source":"Metacritic","Value":"49/100"}],"Metascore":"49","imdbRating":"6.0","imdbVotes":"33,337","imdbID":"tt0113041","Type":"movie","DVD":"09 May 2000","BoxOffice":"N/A","Production":"Disney","Website":"N/A","Response":"True"},{"Title":"Heat","Year":"1995","Rated":"R","Released":"15 Dec 1995","Runtime":"170 min","Genre":"Crime, Drama, Thriller","Director":"Michael Mann","Writer":"Michael Mann","Actors":"Al Pacino, Robert De Niro, Val Kilmer, Jon Voight","Plot":"A group of professional bank robbers start to feel the heat from police when they unknowingly leave a clue at their latest heist.","Language":"English, Spanish","Country":"USA","Awards":"14 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMDJjNWE5MTEtMDk2Mi00ZjczLWIwYjAtNzM2ZTdhNzcwOGZjXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.2/10"},{"Source":"Rotten Tomatoes","Value":"87%"},{"Source":"Metacritic","Value":"76/100"}],"Metascore":"76","imdbRating":"8.2","imdbVotes":"560,172","imdbID":"tt0113277","Type":"movie","DVD":"27 Jul 1999","BoxOffice":"N/A","Production":"Warner Bros.","Website":"N/A","Response":"True"},{"Title":"Sabrina","Year":"1995","Rated":"PG","Released":"15 Dec 1995","Runtime":"127 min","Genre":"Comedy, Drama, Romance","Director":"Sydney Pollack","Writer":"Samuel A. Taylor (play), Billy Wilder (earlier screenplay), Samuel A. Taylor (earlier screenplay), Ernest Lehman (earlier screenplay), Barbara Benedek (screenplay), David Rayfiel (screenplay)","Actors":"Harrison Ford, Julia Ormond, Greg Kinnear, Nancy Marchand","Plot":"An ugly duckling having undergone a remarkable change, still harbors feelings for her crush: a carefree playboy, but not before his business-focused brother has something to say about it.","Language":"English, French","Country":"Germany, USA","Awards":"Nominated for 2 Oscars. Another 2 wins & 4 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYjQ5ZjQ0YzQtOGY3My00MWVhLTgzNWItOTYwMTE5N2ZiMDUyXkEyXkFqcGdeQXVyNjUwMzI2NzU@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.3/10"},{"Source":"Rotten Tomatoes","Value":"65%"},{"Source":"Metacritic","Value":"56/100"}],"Metascore":"56","imdbRating":"6.3","imdbVotes":"35,527","imdbID":"tt0114319","Type":"movie","DVD":"15 Jan 2002","BoxOffice":"N/A","Production":"Paramount","Website":"N/A","Response":"True"},{"Title":"Tom and Huck","Year":"1995","Rated":"PG","Released":"22 Dec 1995","Runtime":"97 min","Genre":"Adventure, Comedy, Drama, Family, Romance, Western","Director":"Peter Hewitt","Writer":"Mark Twain (novel), Stephen Sommers (screenplay), David Loughery (screenplay)","Actors":"Jonathan Taylor Thomas, Brad Renfro, Eric Schweig, Charles Rocket","Plot":"Two best friends witness a murder and embark on a series of adventures in order to prove the innocence of the man wrongly accused of the crime.","Language":"English","Country":"USA","Awards":"1 win & 5 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BN2ZkZTMxOTAtMzg1Mi00M2U0LWE2NWItZDg4YmQyZjVkMDdhXkEyXkFqcGdeQXVyNTM5NzI0NDY@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.5/10"},{"Source":"Rotten Tomatoes","Value":"25%"}],"Metascore":"N/A","imdbRating":"5.5","imdbVotes":"9,621","imdbID":"tt0112302","Type":"movie","DVD":"06 May 2003","BoxOffice":"N/A","Production":"Buena Vista","Website":"N/A","Response":"True"},{"Title":"Sudden Death","Year":"1995","Rated":"R","Released":"22 Dec 1995","Runtime":"111 min","Genre":"Action, Crime, Thriller","Director":"Peter Hyams","Writer":"Karen Elise Baldwin (story), Gene Quintano (screenplay)","Actors":"Jean-Claude Van Damme, Powers Boothe, Raymond J. Barry, Whittni Wright","Plot":"A former fireman takes on a group of terrorists holding the Vice President and others hostage during the seventh game of the NHL Stanley Cup finals.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BN2NjYWE5NjMtODlmZC00MjJhLWFkZTktYTJlZTI4YjVkMGNmXkEyXkFqcGdeQXVyNDc2NjEyMw@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.8/10"},{"Source":"Rotten Tomatoes","Value":"51%"}],"Metascore":"N/A","imdbRating":"5.8","imdbVotes":"31,424","imdbID":"tt0114576","Type":"movie","DVD":"01 Nov 1998","BoxOffice":"N/A","Production":"MCA Universal Home Video","Website":"N/A","Response":"True"},{"Title":"GoldenEye","Year":"1995","Rated":"PG-13","Released":"17 Nov 1995","Runtime":"130 min","Genre":"Action, Adventure, Thriller","Director":"Martin Campbell","Writer":"Ian Fleming (characters), Michael France (story), Jeffrey Caine (screenplay), Bruce Feirstein (screenplay)","Actors":"Pierce Brosnan, Sean Bean, Izabella Scorupco, Famke Janssen","Plot":"Years after a friend and fellow 00 agent is killed on a joint mission, a secret space based weapons program known as \"GoldenEye\" is stolen. James Bond sets out to stop a Russian crime syndicate from using the weapon.","Language":"English, Russian, Spanish","Country":"UK, USA","Awards":"Nominated for 2 BAFTA Film Awards. Another 2 wins & 6 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMzk2OTg4MTk1NF5BMl5BanBnXkFtZTcwNjExNTgzNA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.2/10"},{"Source":"Rotten Tomatoes","Value":"78%"},{"Source":"Metacritic","Value":"65/100"}],"Metascore":"65","imdbRating":"7.2","imdbVotes":"233,822","imdbID":"tt0113189","Type":"movie","DVD":"19 Oct 1999","BoxOffice":"N/A","Production":"MGM/UA","Website":"N/A","Response":"True"},{"Title":"The American President","Year":"1995","Rated":"PG-13","Released":"17 Nov 1995","Runtime":"114 min","Genre":"Comedy, Drama, Romance","Director":"Rob Reiner","Writer":"Aaron Sorkin","Actors":"Michael Douglas, Annette Bening, Martin Sheen, Michael J. Fox","Plot":"A widowed U.S. President running for reelection and an environmental lobbyist fall in love. It's all above-board, but \"politics is perception,\" and sparks fly anyway.","Language":"English, French, Spanish","Country":"USA","Awards":"Nominated for 1 Oscar. Another 1 win & 9 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNjhkMmU0M2YtZDUwYi00OWE0LWI5NTktODBjNDc1M2ZlMjI4XkEyXkFqcGdeQXVyNDAxNjkxNjQ@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"91%"},{"Source":"Metacritic","Value":"67/100"}],"Metascore":"67","imdbRating":"6.8","imdbVotes":"50,775","imdbID":"tt0112346","Type":"movie","DVD":"31 Aug 1999","BoxOffice":"N/A","Production":"Columbia Pictures","Website":"N/A","Response":"True"},{"Title":"Dracula: Dead and Loving It","Year":"1995","Rated":"PG-13","Released":"22 Dec 1995","Runtime":"88 min","Genre":"Comedy, Fantasy, Horror","Director":"Mel Brooks","Writer":"Mel Brooks (screenplay), Rudy De Luca (screenplay), Steve Haberman (screenplay), Rudy De Luca (story), Steve Haberman (story), Bram Stoker (characters)","Actors":"Leslie Nielsen, Peter MacNicol, Steven Weber, Amy Yasbeck","Plot":"Mel Brooks ' parody of the classic vampire story and its famous film adaptations.","Language":"English, German","Country":"France, USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BZWQ0ZDFmYzMtZGMyMi00NmYxLWE0MGYtYzM2ZGNhMTE1NTczL2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyMjM5ODMxODc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.9/10"},{"Source":"Rotten Tomatoes","Value":"11%"}],"Metascore":"N/A","imdbRating":"5.9","imdbVotes":"38,129","imdbID":"tt0112896","Type":"movie","DVD":"29 Jun 2004","BoxOffice":"N/A","Production":"WARNER BROTHERS PICTURES","Website":"N/A","Response":"True"},{"Title":"Balto","Year":"1995","Rated":"G","Released":"22 Dec 1995","Runtime":"78 min","Genre":"Animation, Adventure, Drama, Family, History","Director":"Simon Wells","Writer":"Cliff Ruby (screenplay), Elana Lesser (screenplay), David Steven Cohen (screenplay), Roger S.H. Schulman (screenplay)","Actors":"Kevin Bacon, Bob Hoskins, Bridget Fonda, Jim Cummings","Plot":"An outcast Husky risks his life with other sled dogs to prevent a deadly epidemic from ravaging Nome, Alaska.","Language":"English","Country":"USA","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BMjBhNmFlZjMtMzhlYy00NDBlLWFiMjctMmE0ZjgwOGM2MTNmXkEyXkFqcGdeQXVyNjExODE1MDc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.1/10"},{"Source":"Rotten Tomatoes","Value":"54%"}],"Metascore":"N/A","imdbRating":"7.1","imdbVotes":"38,665","imdbID":"tt0112453","Type":"movie","DVD":"19 Feb 2002","BoxOffice":"N/A","Production":"MCA Universal Home Video","Website":"N/A","Response":"True"},{"Title":"Nixon","Year":"1995","Rated":"R","Released":"05 Jan 1996","Runtime":"192 min","Genre":"Biography, Drama, History","Director":"Oliver Stone","Writer":"Stephen J. Rivele, Christopher Wilkinson, Oliver Stone","Actors":"Anthony Hopkins, Joan Allen, Powers Boothe, Ed Harris","Plot":"A biographical story of former U.S. President Richard Nixon, from his days as a young boy, to his eventual Presidency, which ended in shame.","Language":"English, Mandarin, Russian","Country":"USA","Awards":"Nominated for 4 Oscars. Another 11 wins & 14 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNzBlOWY0ZmEtZjdkYS00ZGU0LWEwN2YtYzBkNDM5ZDBjMmI1XkEyXkFqcGdeQXVyMTAwMzUyOTc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.1/10"},{"Source":"Rotten Tomatoes","Value":"74%"},{"Source":"Metacritic","Value":"66/100"}],"Metascore":"66","imdbRating":"7.1","imdbVotes":"28,272","imdbID":"tt0113987","Type":"movie","DVD":"15 Jun 1999","BoxOffice":"N/A","Production":"Buena Vista Pictures","Website":"N/A","Response":"True"},{"Title":"Cutthroat Island","Year":"1995","Rated":"PG-13","Released":"22 Dec 1995","Runtime":"124 min","Genre":"Action, Adventure, Comedy","Director":"Renny Harlin","Writer":"Michael Frost Beckner (story), James Gorman (story), Bruce A. Evans (story), Raynold Gideon (story), Robert King (screenplay), Marc Norman (screenplay)","Actors":"Geena Davis, Matthew Modine, Frank Langella, Maury Chaykin","Plot":"A female pirate and her companion race against their rivals to find a hidden island that contains a fabulous treasure.","Language":"English","Country":"France, Italy, Germany, USA","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BMDg2YTI0YmQtYzgwMi00Zjk4LWJkZjgtYjg0ZDE2ODUzY2RlL2ltYWdlXkEyXkFqcGdeQXVyNjQzNDI3NzY@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.7/10"},{"Source":"Rotten Tomatoes","Value":"38%"},{"Source":"Metacritic","Value":"37/100"}],"Metascore":"37","imdbRating":"5.7","imdbVotes":"25,438","imdbID":"tt0112760","Type":"movie","DVD":"25 Jul 2000","BoxOffice":"N/A","Production":"Live Home Video","Website":"N/A","Response":"True"},{"Title":"Casino","Year":"1995","Rated":"R","Released":"22 Nov 1995","Runtime":"178 min","Genre":"Crime, Drama","Director":"Martin Scorsese","Writer":"Nicholas Pileggi (book), Nicholas Pileggi (screenplay), Martin Scorsese (screenplay)","Actors":"Robert De Niro, Sharon Stone, Joe Pesci, James Woods","Plot":"A tale of greed, deception, money, power, and murder occur between two best friends: a mafia enforcer and a casino executive, compete against each other over a gambling empire, and over a fast living and fast loving socialite.","Language":"English","Country":"France, USA","Awards":"Nominated for 1 Oscar. Another 4 wins & 10 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BOThkYjU3OWQtN2Y3OC00ZDk1LWI1MDQtZTkxZjZiZGU5N2Q0XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.2/10"},{"Source":"Rotten Tomatoes","Value":"80%"},{"Source":"Metacritic","Value":"73/100"}],"Metascore":"73","imdbRating":"8.2","imdbVotes":"450,651","imdbID":"tt0112641","Type":"movie","DVD":"24 Feb 1998","BoxOffice":"N/A","Production":"Universal Pictures","Website":"N/A","Response":"True"},{"Title":"Sense and Sensibility","Year":"1995","Rated":"PG","Released":"26 Jan 1996","Runtime":"136 min","Genre":"Drama, Romance","Director":"Ang Lee","Writer":"Jane Austen (novel), Emma Thompson (screenplay)","Actors":"James Fleet, Tom Wilkinson, Harriet Walter, Kate Winslet","Plot":"Rich Mr. Dashwood dies, leaving his second wife and her three daughters poor by the rules of inheritance. The two eldest daughters are the title opposites.","Language":"English, French","Country":"USA, UK","Awards":"Won 1 Oscar. Another 32 wins & 49 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNzk1MjU3MDQyMl5BMl5BanBnXkFtZTcwNjc1OTM2MQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.6/10"},{"Source":"Rotten Tomatoes","Value":"98%"},{"Source":"Metacritic","Value":"84/100"}],"Metascore":"84","imdbRating":"7.6","imdbVotes":"99,207","imdbID":"tt0114388","Type":"movie","DVD":"01 Jan 1998","BoxOffice":"N/A","Production":"Columbia Pictures","Website":"N/A","Response":"True"},{"Title":"Four Rooms","Year":"1995","Rated":"R","Released":"25 Dec 1995","Runtime":"98 min","Genre":"Comedy","Director":"Allison Anders, Alexandre Rockwell, Robert Rodriguez, Quentin Tarantino, Chuck Jones","Writer":"Allison Anders, Alexandre Rockwell, Robert Rodriguez, Quentin Tarantino","Actors":"Sammi Davis, Amanda De Cadenet, Valeria Golino, Madonna","Plot":"Four interlocking tales that take place in a fading hotel on New Year's Eve.","Language":"English","Country":"USA","Awards":"1 win & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BNDc3Y2YwMjUtYzlkMi00MTljLTg1ZGMtYzUwODljZTI1OTZjXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"13%"}],"Metascore":"N/A","imdbRating":"6.8","imdbVotes":"96,547","imdbID":"tt0113101","Type":"movie","DVD":"20 Apr 1999","BoxOffice":"N/A","Production":"Miramax Films","Website":"N/A","Response":"True"},{"Title":"Ace Ventura: When Nature Calls","Year":"1995","Rated":"PG-13","Released":"10 Nov 1995","Runtime":"90 min","Genre":"Adventure, Comedy, Crime","Director":"Steve Oedekerk","Writer":"Jack Bernstein (characters), Steve Oedekerk","Actors":"Jim Carrey, Ian McNeice, Simon Callow, Maynard Eziashi","Plot":"Ace Ventura, Pet Detective, returns from a spiritual quest to investigate the disappearance of a rare white bat, the sacred animal of a tribe in Africa.","Language":"English","Country":"USA","Awards":"7 wins & 6 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNGFiYTgxZDctNGI4OS00MWU1LWIwOGUtZmMyNGQxYjVkZjQ3XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.4/10"},{"Source":"Rotten Tomatoes","Value":"31%"},{"Source":"Metacritic","Value":"45/100"}],"Metascore":"45","imdbRating":"6.4","imdbVotes":"198,511","imdbID":"tt0112281","Type":"movie","DVD":"30 Oct 1997","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Money Train","Year":"1995","Rated":"R","Released":"22 Nov 1995","Runtime":"110 min","Genre":"Action, Comedy, Crime, Drama, Thriller","Director":"Joseph Ruben","Writer":"Doug Richardson (story), Doug Richardson (screenplay), David Loughery (screenplay)","Actors":"Wesley Snipes, Woody Harrelson, Jennifer Lopez, Robert Blake","Plot":"A vengeful New York City transit cop decides to steal a trainload of subway fares. His foster brother, a fellow cop, tries to protect him.","Language":"English","Country":"USA","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BYWZlMzIwYzYtOWZiMi00ZGEzLWFhYmQtNmEzYzJlNDg1NjhjXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.7/10"},{"Source":"Rotten Tomatoes","Value":"22%"}],"Metascore":"N/A","imdbRating":"5.7","imdbVotes":"38,215","imdbID":"tt0113845","Type":"movie","DVD":"22 May 2001","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Get Shorty","Year":"1995","Rated":"R","Released":"20 Oct 1995","Runtime":"105 min","Genre":"Comedy, Crime, Thriller","Director":"Barry Sonnenfeld","Writer":"Elmore Leonard (novel), Scott Frank (screenplay)","Actors":"John Travolta, Gene Hackman, Rene Russo, Danny DeVito","Plot":"A mobster travels to Hollywood to collect a debt, and discovers that the movie business is much the same as his current job.","Language":"English","Country":"USA","Awards":"Won 1 Golden Globe. Another 5 wins & 16 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMjAwODYzNDY4Ml5BMl5BanBnXkFtZTcwODkwNTgzNA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.9/10"},{"Source":"Rotten Tomatoes","Value":"87%"},{"Source":"Metacritic","Value":"82/100"}],"Metascore":"82","imdbRating":"6.9","imdbVotes":"74,125","imdbID":"tt0113161","Type":"movie","DVD":"27 Aug 1997","BoxOffice":"N/A","Production":"MGM","Website":"N/A","Response":"True"},{"Title":"Copycat","Year":"1995","Rated":"R","Released":"27 Oct 1995","Runtime":"123 min","Genre":"Drama, Mystery, Thriller","Director":"Jon Amiel","Writer":"Ann Biderman, David Madsen","Actors":"Sigourney Weaver, Holly Hunter, Dermot Mulroney, William McNamara","Plot":"An agoraphobic psychologist and a female detective must work together to take down a serial killer who copies serial killers from the past.","Language":"English","Country":"USA","Awards":"2 wins & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BYWUwNDk2ZDYtNmFkMi00NjE5LWE1M2ItYTRkNTFjZDU3ZDU4L2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyMTYxNjkxOQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"78%"},{"Source":"Metacritic","Value":"54/100"}],"Metascore":"54","imdbRating":"6.6","imdbVotes":"52,730","imdbID":"tt0112722","Type":"movie","DVD":"28 Apr 1998","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Assassins","Year":"1995","Rated":"R","Released":"06 Oct 1995","Runtime":"132 min","Genre":"Action, Crime, Thriller","Director":"Richard Donner","Writer":"Lilly Wachowski (story), Lana Wachowski (story), Lilly Wachowski (screenplay), Lana Wachowski (screenplay), Brian Helgeland (screenplay)","Actors":"Sylvester Stallone, Antonio Banderas, Julianne Moore, Anatoli Davydov","Plot":"Professional hit-man Robert Rath wants to fulfill a few more contracts before retiring but unscrupulous ambitious newcomer hit-man Miguel Bain keeps killing Rath's targets.","Language":"English, Dutch, Spanish","Country":"France, USA","Awards":"1 win & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BZGI1NDA4ZDItNTRjMi00YTU3LTkwZDEtYjdlNTI1ZjQxZDM1XkEyXkFqcGdeQXVyNDc2NjEyMw@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.3/10"},{"Source":"Rotten Tomatoes","Value":"14%"}],"Metascore":"N/A","imdbRating":"6.3","imdbVotes":"76,268","imdbID":"tt0112401","Type":"movie","DVD":"30 Sep 1997","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Powder","Year":"1995","Rated":"PG-13","Released":"27 Oct 1995","Runtime":"111 min","Genre":"Drama, Fantasy, Mystery, Sci-Fi, Thriller","Director":"Victor Salva","Writer":"Victor Salva","Actors":"Mary Steenburgen, Sean Patrick Flanery, Lance Henriksen, Jeff Goldblum","Plot":"An off the charts genius who is home schooled and shunned after his last relative dies shows the unconscious residents of his town about connection awareness and the generosity of the spirit.","Language":"English","Country":"USA","Awards":"1 win & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BOGUzYzNiZTItYmZlNi00ODI1LThjNTMtNjI1MTNlZDQ0OGY2XkEyXkFqcGdeQXVyNjExODE1MDc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"50%"}],"Metascore":"N/A","imdbRating":"6.6","imdbVotes":"28,081","imdbID":"tt0114168","Type":"movie","DVD":"10 Aug 1999","BoxOffice":"N/A","Production":"Hollywood Pictures","Website":"N/A","Response":"True"},{"Title":"Leaving Las Vegas","Year":"1995","Rated":"R","Released":"09 Feb 1996","Runtime":"111 min","Genre":"Drama, Romance","Director":"Mike Figgis","Writer":"John O'Brien (based upon the novel by), Mike Figgis (screenplay by)","Actors":"Nicolas Cage, Elisabeth Shue, Julian Sands, Richard Lewis","Plot":"Ben Sanderson, a Hollywood screenwriter who lost everything because of his alcoholism, arrives in Las Vegas to drink himself to death. There, he meets and forms an uneasy friendship and non-interference pact with prostitute Sera.","Language":"English, Russian","Country":"France, UK, USA","Awards":"Won 1 Oscar. Another 31 wins & 28 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNDg3MDM5NTI0MF5BMl5BanBnXkFtZTcwNDY0NDk0NA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.5/10"},{"Source":"Rotten Tomatoes","Value":"91%"},{"Source":"Metacritic","Value":"82/100"}],"Metascore":"82","imdbRating":"7.5","imdbVotes":"112,534","imdbID":"tt0113627","Type":"movie","DVD":"24 Feb 1998","BoxOffice":"N/A","Production":"United Artists","Website":"N/A","Response":"True"},{"Title":"Othello","Year":"1995","Rated":"R","Released":"19 Jan 1996","Runtime":"123 min","Genre":"Drama, Romance","Director":"Oliver Parker","Writer":"Oliver Parker (adaptation), William Shakespeare (play)","Actors":"Laurence Fishburne, Irène Jacob, Kenneth Branagh, Nathaniel Parker","Plot":"The Moorish General Othello is manipulated into thinking that his new wife Desdemona has been carrying on an affair with his Lieutenant Michael Cassio, when in reality, it is all part of the scheme of a bitter Ensign named Iago.","Language":"English","Country":"USA, UK","Awards":"3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNzVlMjhjYzctNjQ4My00OGMwLThmZTktODE4MWI3NzNkOWYyXkEyXkFqcGdeQXVyNjMwMjk0MTQ@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.9/10"},{"Source":"Rotten Tomatoes","Value":"67%"}],"Metascore":"N/A","imdbRating":"6.9","imdbVotes":"8,897","imdbID":"tt0114057","Type":"movie","DVD":"18 Jan 2000","BoxOffice":"N/A","Production":"Columbia Pictures","Website":"N/A","Response":"True"},{"Title":"Now and Then","Year":"1995","Rated":"PG-13","Released":"20 Oct 1995","Runtime":"100 min","Genre":"Comedy, Drama, Romance","Director":"Lesli Linka Glatter","Writer":"I. Marlene King","Actors":"Christina Ricci, Rosie O'Donnell, Thora Birch, Melanie Griffith","Plot":"Four 12-year-old girls grow up together during an eventful small-town summer in 1970.","Language":"English","Country":"USA","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BMTM2MDQ1YjUtMGM0NC00NmFlLTljMDktZjJiNWRhMWYxOWYyXkEyXkFqcGdeQXVyNjgzMjI4ODE@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"32%"},{"Source":"Metacritic","Value":"50/100"}],"Metascore":"50","imdbRating":"6.8","imdbVotes":"26,564","imdbID":"tt0114011","Type":"movie","DVD":"21 Dec 1999","BoxOffice":"N/A","Production":"New Line Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Persuasion","Year":"1995","Rated":"PG","Released":"27 Sep 1995","Runtime":"107 min","Genre":"Drama, Romance","Director":"Roger Michell","Writer":"Jane Austen (novel), Nick Dear (screenplay)","Actors":"Amanda Root, Ciarán Hinds, Susan Fleetwood, Corin Redgrave","Plot":"Eight years earlier, Anne Elliot, the daughter of a financially troubled aristocratic family, was persuaded to break off her engagement to Frederick Wentworth, a young seaman, who, though ...","Language":"English","Country":"UK, USA, France","Awards":"7 wins & 2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMTc5NzAwNDAyN15BMl5BanBnXkFtZTYwMjYzMDc5._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.7/10"},{"Source":"Rotten Tomatoes","Value":"86%"}],"Metascore":"N/A","imdbRating":"7.7","imdbVotes":"8,758","imdbID":"tt0114117","Type":"movie","DVD":"24 Aug 2004","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"The City of Lost Children","Year":"1995","Rated":"R","Released":"15 Dec 1995","Runtime":"112 min","Genre":"Fantasy, Sci-Fi","Director":"Marc Caro, Jean-Pierre Jeunet","Writer":"Gilles Adrien, Jean-Pierre Jeunet, Marc Caro, Gilles Adrien (dialogue), Guillaume Laurant (additional dialogue), Jean-Pierre Jeunet (additional dialogue)","Actors":"Ron Perlman, Daniel Emilfork, Judith Vittet, Dominique Pinon","Plot":"A scientist in a surrealist society kidnaps children to steal their dreams, hoping that they slow his aging process.","Language":"French, Cantonese","Country":"France, Germany, Spain, Belgium, USA","Awards":"5 wins & 14 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZGQxZDMwYzYtYmFjNi00NWYyLThjZjAtMDJhODZhYTkyZDNhXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.5/10"},{"Source":"Rotten Tomatoes","Value":"79%"},{"Source":"Metacritic","Value":"73/100"}],"Metascore":"73","imdbRating":"7.5","imdbVotes":"63,919","imdbID":"tt0112682","Type":"movie","DVD":"19 Oct 1999","BoxOffice":"N/A","Production":"Sony Pictures Classics","Website":"N/A","Response":"True"},{"Title":"Shanghai Triad","Year":"1995","Rated":"R","Released":"22 Dec 1995","Runtime":"108 min","Genre":"Crime, Drama, History, Romance, Thriller","Director":"Yimou Zhang","Writer":"Feiyu Bi, Li Xiao (novel)","Actors":"Li Gong, Baotian Li, Xiaoxiao Wang, Xuejian Li","Plot":"A provincial boy related to a Shanghai crime family is recruited by his uncle into cosmopolitan Shanghai in the 1930s to be a servant to a ganglord's mistress.","Language":"Mandarin","Country":"France, China","Awards":"Nominated for 1 Oscar. Another 5 wins & 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BODgzNGQyNjEtYTU0My00ZGY2LTg4Y2MtMWNiY2QyZGE1MGRiXkEyXkFqcGdeQXVyNjMwMjk0MTQ@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.1/10"},{"Source":"Rotten Tomatoes","Value":"90%"},{"Source":"Metacritic","Value":"77/100"}],"Metascore":"77","imdbRating":"7.1","imdbVotes":"5,030","imdbID":"tt0115012","Type":"movie","DVD":"12 Dec 2000","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Dangerous Minds","Year":"1995","Rated":"R","Released":"11 Aug 1995","Runtime":"99 min","Genre":"Biography, Drama","Director":"John N. Smith","Writer":"LouAnne Johnson (book), Ronald Bass (screenplay)","Actors":"Michelle Pfeiffer, George Dzundza, Courtney B. Vance, Robin Bartlett","Plot":"An ex-Marine turned teacher struggles to connect with her students in an inner city school.","Language":"English","Country":"USA","Awards":"6 wins & 8 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZjk2YjNkYTYtOTZkNy00ZmRkLWI5ODEtYzA4MTM3MzMyZjhlXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.5/10"},{"Source":"Rotten Tomatoes","Value":"28%"},{"Source":"Metacritic","Value":"47/100"}],"Metascore":"47","imdbRating":"6.5","imdbVotes":"47,133","imdbID":"tt0112792","Type":"movie","DVD":"13 Jul 1999","BoxOffice":"N/A","Production":"Disney","Website":"N/A","Response":"True"},{"Title":"12 Monkeys","Year":"1995","Rated":"R","Released":"05 Jan 1996","Runtime":"129 min","Genre":"Mystery, Sci-Fi, Thriller","Director":"Terry Gilliam","Writer":"Chris Marker (film La Jetée), David Webb Peoples (screenplay), Janet Peoples (screenplay)","Actors":"Joseph Melito, Bruce Willis, Jon Seda, Michael Chance","Plot":"In a future world devastated by disease, a convict is sent back in time to gather information about the man-made virus that wiped out most of the human population on the planet.","Language":"English, French","Country":"USA","Awards":"Nominated for 2 Oscars. Another 10 wins & 22 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BN2Y2OWU4MWMtNmIyMy00YzMyLWI0Y2ItMTcyZDc3MTdmZDU4XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.0/10"},{"Source":"Rotten Tomatoes","Value":"90%"},{"Source":"Metacritic","Value":"74/100"}],"Metascore":"74","imdbRating":"8.0","imdbVotes":"567,248","imdbID":"tt0114746","Type":"movie","DVD":"31 Mar 1998","BoxOffice":"N/A","Production":"Universal Pictures","Website":"N/A","Response":"True"},{"Title":"Babe","Year":"1995","Rated":"G","Released":"04 Aug 1995","Runtime":"91 min","Genre":"Comedy, Drama, Family","Director":"Chris Noonan","Writer":"Dick King-Smith (novel), George Miller (screenplay), Chris Noonan (screenplay)","Actors":"Christine Cavanaugh, Miriam Margolyes, Danny Mann, Hugo Weaving","Plot":"Babe, a pig raised by sheepdogs, learns to herd sheep with a little help from Farmer Hoggett.","Language":"English","Country":"Australia, USA","Awards":"Won 1 Oscar. Another 19 wins & 26 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYjg4ZjUzMzMtYzlmYi00YTcwLTlkOWUtYWFmY2RhNjliODQzXkEyXkFqcGdeQXVyNTUyMzE4Mzg@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"97%"},{"Source":"Metacritic","Value":"83/100"}],"Metascore":"83","imdbRating":"6.8","imdbVotes":"115,072","imdbID":"tt0112431","Type":"movie","DVD":"23 Sep 2003","BoxOffice":"N/A","Production":"Universal Pictures","Website":"N/A","Response":"True"},{"Title":"Carrington","Year":"1995","Rated":"R","Released":"10 Nov 1995","Runtime":"121 min","Genre":"Biography, Drama, Romance","Director":"Christopher Hampton","Writer":"Christopher Hampton, Michael Holroyd (book)","Actors":"Emma Thompson, Jonathan Pryce, Steven Waddington, Samuel West","Plot":"The platonic relationship between artist Dora Carrington (Dame Emma Thompson) and writer Lytton Strachey (Jonathan Pryce) in the early twentieth century.","Language":"English","Country":"UK, France","Awards":"Nominated for 1 BAFTA Film Award. Another 7 wins & 7 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZjQ3MTBkNDEtMGRlZS00OTY0LTkzYjktOWU2MzI3ZDRiMjY5XkEyXkFqcGdeQXVyMTA0MjU0Ng@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"54%"}],"Metascore":"N/A","imdbRating":"6.8","imdbVotes":"4,913","imdbID":"tt0112637","Type":"movie","DVD":"26 Dec 2001","BoxOffice":"N/A","Production":"MGM Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Dead Man Walking","Year":"1995","Rated":"R","Released":"02 Feb 1996","Runtime":"122 min","Genre":"Crime, Drama","Director":"Tim Robbins","Writer":"Helen Prejean (book), Tim Robbins","Actors":"Susan Sarandon, Sean Penn, Robert Prosky, Raymond J. Barry","Plot":"A nun, while comforting a convicted killer on death row, empathizes with both the killer and his victim's families.","Language":"English","Country":"UK, USA","Awards":"Won 1 Oscar. Another 22 wins & 22 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMTM3NzA1MjM2N15BMl5BanBnXkFtZTcwMzY3MTMzNA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.5/10"},{"Source":"Rotten Tomatoes","Value":"95%"},{"Source":"Metacritic","Value":"80/100"}],"Metascore":"80","imdbRating":"7.5","imdbVotes":"86,777","imdbID":"tt0112818","Type":"movie","DVD":"30 Sep 1998","BoxOffice":"N/A","Production":"Gramercy Pictures","Website":"N/A","Response":"True"},{"Title":"Across the Sea of Time","Year":"1995","Rated":"G","Released":"20 Oct 1995","Runtime":"51 min","Genre":"Adventure, Drama, Family, History","Director":"Stephen Low","Writer":"Andrew Gellis","Actors":"Peter Reznick, John McDonough, Avi Hoffman, Victor Steinbach","Plot":"A young Russian boy, Thomas Minton, travels to New York as a passenger on a Russian freighter. Close to Ellis Island he gets off and thus starts his journey to America the same way as all ...","Language":"English, Russian","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BOTIwMzk1MDc1MF5BMl5BanBnXkFtZTcwMTEzNDkyMQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.4/10"}],"Metascore":"N/A","imdbRating":"6.4","imdbVotes":"224","imdbID":"tt0112286","Type":"movie","DVD":"30 Jun 1998","BoxOffice":"N/A","Production":"Sony Pictures Classics","Website":"N/A","Response":"True"},{"Title":"It Takes Two","Year":"1995","Rated":"PG","Released":"17 Nov 1995","Runtime":"101 min","Genre":"Comedy, Family, Romance","Director":"Andy Tennant","Writer":"Deborah Dean Davis","Actors":"Kirstie Alley, Steve Guttenberg, Mary-Kate Olsen, Ashley Olsen","Plot":"Alyssa and Amanda are two little girls who are identical, but complete strangers, that accidentally meet one day.","Language":"English","Country":"USA","Awards":"1 win & 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMzdhMGU0MzEtZjg1Ny00YzE5LWE0MGQtMTNiN2UwN2I5ZDBjXkEyXkFqcGdeQXVyNTgzMzU5MDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.9/10"},{"Source":"Rotten Tomatoes","Value":"8%"},{"Source":"Metacritic","Value":"45/100"}],"Metascore":"45","imdbRating":"5.9","imdbVotes":"20,207","imdbID":"tt0113442","Type":"movie","DVD":"11 Jun 2002","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Clueless","Year":"1995","Rated":"PG-13","Released":"19 Jul 1995","Runtime":"97 min","Genre":"Comedy, Romance","Director":"Amy Heckerling","Writer":"Amy Heckerling","Actors":"Alicia Silverstone, Stacey Dash, Brittany Murphy, Paul Rudd","Plot":"Shallow, rich and socially successful Cher is at the top of her Beverly Hills high school's pecking scale. Seeing herself as a matchmaker, Cher first coaxes two teachers into dating each other.","Language":"English, Spanish","Country":"USA","Awards":"6 wins & 11 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMzBmOGQ0NWItOTZjZC00ZDAxLTgyOTEtODJiYWQ2YWNiYWVjXkEyXkFqcGdeQXVyNTE1NjY5Mg@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Metacritic","Value":"68/100"}],"Metascore":"68","imdbRating":"6.8","imdbVotes":"177,559","imdbID":"tt0112697","Type":"movie","DVD":"28 Nov 2006","BoxOffice":"N/A","Production":"N/A","Website":"N/A","Response":"True"},{"Title":"Cry, the Beloved Country","Year":"1995","Rated":"PG-13","Released":"15 Dec 1995","Runtime":"106 min","Genre":"Drama, Thriller","Director":"Darrell Roodt","Writer":"Ronald Harwood (screenplay), Alan Paton (novel)","Actors":"James Earl Jones, Richard Harris, Vusi Kunene, Charles S. Dutton","Plot":"A South African preacher goes to search for his wayward son, who has committed a crime in the big city.","Language":"English","Country":"South Africa, USA","Awards":"1 win & 4 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMTcwMDU1OTEwOF5BMl5BanBnXkFtZTcwMTg5NjEyMQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"85%"},{"Source":"Metacritic","Value":"71/100"}],"Metascore":"71","imdbRating":"6.8","imdbVotes":"1,660","imdbID":"tt0112749","Type":"movie","DVD":"01 Jul 2003","BoxOffice":"N/A","Production":"Miramax","Website":"N/A","Response":"True"},{"Title":"Richard III","Year":"1995","Rated":"R","Released":"29 Dec 1995","Runtime":"110 min","Genre":"Drama, Sci-Fi, War","Director":"Richard Loncraine","Writer":"Ian McKellen (screenplay), Richard Loncraine (screenplay), Richard Eyre, William Shakespeare (play)","Actors":"Christopher Bowen, Edward Jewesbury, Ian McKellen, Bill Paterson","Plot":"The classic Shakespearean play about the murderously scheming 15th-century king is reimagined in an alternative setting of 1930s England as clouds of fascism gather.","Language":"English","Country":"UK, USA","Awards":"Nominated for 2 Oscars. Another 7 wins & 10 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BOWI3NjhhZDItNWQ2NS00Zjg0LWIzMjctNzY0MjRmNzkyYzVmXkEyXkFqcGdeQXVyMTA0MjU0Ng@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.4/10"},{"Source":"Rotten Tomatoes","Value":"94%"}],"Metascore":"N/A","imdbRating":"7.4","imdbVotes":"13,346","imdbID":"tt0114279","Type":"movie","DVD":"15 Aug 2001","BoxOffice":"N/A","Production":"United Artists","Website":"N/A","Response":"True"},{"Title":"Dead Presidents","Year":"1995","Rated":"R","Released":"06 Oct 1995","Runtime":"119 min","Genre":"Action, Crime, Drama, Thriller, War","Director":"Albert Hughes, Allen Hughes","Writer":"Allen Hughes (story), Albert Hughes (story), Michael Henry Brown (story), Michael Henry Brown (screenplay), Wallace Terry (story \"Specialist No.4 Haywood T. 'The Kid' Kirkland\")","Actors":"Larenz Tate, Keith David, Chris Tucker, Freddy Rodríguez","Plot":"A Vietnam vet adjusts to life after the war while trying to support his family, but the chance of a better life may involve crime and bloodshed.","Language":"English","Country":"USA","Awards":"2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNjdhZWEzMzEtMjNhZS00OThhLWFiZWUtM2EwMWU5MWE0MDA4XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.9/10"},{"Source":"Rotten Tomatoes","Value":"44%"}],"Metascore":"N/A","imdbRating":"6.9","imdbVotes":"19,237","imdbID":"tt0112819","Type":"movie","DVD":"19 May 1998","BoxOffice":"N/A","Production":"Hollywood Pictures","Website":"N/A","Response":"True"},{"Title":"Restoration","Year":"1995","Rated":"R","Released":"02 Feb 1996","Runtime":"117 min","Genre":"Biography, Drama, History, Romance","Director":"Michael Hoffman","Writer":"Rose Tremain (novel), Rupert Walters (screenplay)","Actors":"Robert Downey Jr., Sam Neill, David Thewlis, Polly Walker","Plot":"The exiled royal physician to King Charles II devotes himself to helping Londoners suffering from the plague, and in the process falls in love with an equally poor woman.","Language":"English, Latin","Country":"USA, UK","Awards":"Won 2 Oscars. Another 2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZmQwODk5ZGItMDk5OS00MjU4LTgyYmUtYTBiMTFhYWM5MDY4XkEyXkFqcGdeQXVyMTMxMTY0OTQ@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"70%"},{"Source":"Metacritic","Value":"66/100"}],"Metascore":"66","imdbRating":"6.6","imdbVotes":"8,768","imdbID":"tt0114272","Type":"movie","DVD":"03 Aug 1999","BoxOffice":"N/A","Production":"Miramax","Website":"N/A","Response":"True"},{"Title":"Mortal Kombat","Year":"1995","Rated":"PG-13","Released":"18 Aug 1995","Runtime":"101 min","Genre":"Action, Adventure, Fantasy, Sci-Fi, Thriller","Director":"Paul W.S. Anderson","Writer":"Ed Boon (video games), John Tobias (video games), Kevin Droney","Actors":"Christopher Lambert, Robin Shou, Linden Ashby, Cary-Hiroyuki Tagawa","Plot":"Three unknowing martial artists are summoned to a mysterious island to compete in a tournament whose outcome will decide the fate of the world.","Language":"English","Country":"USA","Awards":"1 win & 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNjY5NTEzZGItMGY3My00NzE4LThkYTUtYjJkNzk3MDBiMWE3XkEyXkFqcGdeQXVyNzg5MDE1MDk@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.8/10"},{"Source":"Rotten Tomatoes","Value":"47%"},{"Source":"Metacritic","Value":"58/100"}],"Metascore":"58","imdbRating":"5.8","imdbVotes":"99,811","imdbID":"tt0113855","Type":"movie","DVD":"26 Aug 1997","BoxOffice":"N/A","Production":"New Line Home Entertainment","Website":"N/A","Response":"True"},{"Title":"To Die For","Year":"1995","Rated":"R","Released":"06 Oct 1995","Runtime":"106 min","Genre":"Comedy, Crime, Drama, Thriller","Director":"Gus Van Sant","Writer":"Joyce Maynard (book), Buck Henry (screenplay)","Actors":"Nicole Kidman, Matt Dillon, Joaquin Phoenix, Casey Affleck","Plot":"A beautiful but naïve aspiring television personality films a documentary on teenagers with a darker ulterior motive.","Language":"English","Country":"USA, UK, Canada","Awards":"Won 1 Golden Globe. Another 6 wins & 14 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNGZhYzgwNzItNDljNC00MDM4LThiYjEtNDRhNmE5NDk2MTQ0XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"88%"},{"Source":"Metacritic","Value":"86/100"}],"Metascore":"86","imdbRating":"6.8","imdbVotes":"42,450","imdbID":"tt0114681","Type":"movie","DVD":"07 Aug 2001","BoxOffice":"N/A","Production":"Columbia Pictures","Website":"N/A","Response":"True"},{"Title":"How to Make an American Quilt","Year":"1995","Rated":"PG-13","Released":"06 Oct 1995","Runtime":"117 min","Genre":"Comedy, Drama, Romance","Director":"Jocelyn Moorhouse","Writer":"Whitney Otto (novel), Jane Anderson (screenplay)","Actors":"Kaelynn Craddick, Sara Craddick, Kate Capshaw, Adam Baldwin","Plot":"Bride-to-be Finn Dodd hears tales of romance and sorrow from her elders as they construct a quilt.","Language":"English","Country":"USA","Awards":"4 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNGYwZmZkYWItNjdmMi00MjI2LThmOGYtMmI1NTQ0OWQ1YWIxXkEyXkFqcGdeQXVyNzA5NjUyNjM@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.3/10"},{"Source":"Rotten Tomatoes","Value":"61%"}],"Metascore":"N/A","imdbRating":"6.3","imdbVotes":"10,522","imdbID":"tt0113347","Type":"movie","DVD":"23 Feb 1999","BoxOffice":"N/A","Production":"MCA Universal Home Video","Website":"N/A","Response":"True"},{"Title":"Se7en","Year":"1995","Rated":"R","Released":"22 Sep 1995","Runtime":"127 min","Genre":"Crime, Drama, Mystery, Thriller","Director":"David Fincher","Writer":"Andrew Kevin Walker","Actors":"Morgan Freeman, Andrew Kevin Walker, Daniel Zacapa, Brad Pitt","Plot":"Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.","Language":"English","Country":"USA","Awards":"Nominated for 1 Oscar. Another 29 wins & 40 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BOTUwODM5MTctZjczMi00OTk4LTg3NWUtNmVhMTAzNTNjYjcyXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.6/10"},{"Source":"Rotten Tomatoes","Value":"81%"},{"Source":"Metacritic","Value":"65/100"}],"Metascore":"65","imdbRating":"8.6","imdbVotes":"1,401,863","imdbID":"tt0114369","Type":"movie","DVD":"14 Apr 1997","BoxOffice":"N/A","Production":"New Line Cinema","Website":"N/A","Response":"True"},{"Title":"Pocahontas","Year":"1995","Rated":"G","Released":"23 Jun 1995","Runtime":"81 min","Genre":"Animation, Adventure, Drama, Family, Musical, Romance","Director":"Mike Gabriel, Eric Goldberg","Writer":"Carl Binder, Susannah Grant, Philip LaZebnik, Glen Keane (story), Joe Grant (story), Ralph Zondag (story), Burny Mattinson (story), Ed Gombert (story), Kaan Kalyon (story), Francis Glebas (story), Rob Gibbs (story), Bruce Morris (story), Todd Kurosawa (story), Duncan Marjoribanks (story), Chris Buck (story), Andrew Chapman (additional story development), Randy Cartwright (additional story development), Will Finn (additional story development), Broose Johnson (additional story development), T. Daniel Hofstedt (additional story development), David Pruiksma (additional story development), Nik Ranieri (additional story development), Vincent DeFrances (additional story development), Tom Mazzocco (additional story development), Don Dougherty (additional story development), Jorgen Klubien (additional story development), Mike Gabriel (based on an idea by)","Actors":"Joe Baker, Christian Bale, Irene Bedard, Billy Connolly","Plot":"An English soldier and the daughter of an Algonquin chief share a romance when English colonists invade seventeenth century Virginia.","Language":"English, Algonquin","Country":"USA","Awards":"Won 2 Oscars. Another 13 wins & 7 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMzc4YzhiN2ItY2Y4NC00YTA0LWEyMjEtNzllNTcxZDdjODhiXkEyXkFqcGdeQXVyNTUyMzE4Mzg@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.7/10"},{"Source":"Rotten Tomatoes","Value":"55%"},{"Source":"Metacritic","Value":"58/100"}],"Metascore":"58","imdbRating":"6.7","imdbVotes":"165,132","imdbID":"tt0114148","Type":"movie","DVD":"06 Jun 2000","BoxOffice":"N/A","Production":"Buena Vista Distribution Compa","Website":"N/A","Response":"True"},{"Title":"When Night Is Falling","Year":"1995","Rated":"R","Released":"17 Nov 1995","Runtime":"94 min","Genre":"Drama, Romance","Director":"Patricia Rozema","Writer":"Patricia Rozema","Actors":"Pascale Bussières, Rachael Crawford, Henry Czerny, David Fox","Plot":"An uptight and conservative woman, working on tenure as a literacy professor at a large urban university, finds herself strangely attracted to a free-spirited, liberal woman who works at a local carnival that comes to town.","Language":"English","Country":"Canada","Awards":"5 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNGUxMDM1ODEtZjhjZi00NjVjLWEwNmUtNmZmOTQ1MzQxNmQ3XkEyXkFqcGdeQXVyMTMxMTY0OTQ@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.5/10"},{"Source":"Rotten Tomatoes","Value":"50%"}],"Metascore":"N/A","imdbRating":"6.5","imdbVotes":"6,462","imdbID":"tt0114916","Type":"movie","DVD":"05 Feb 2008","BoxOffice":"N/A","Production":"Evergreen","Website":"N/A","Response":"True"},{"Title":"The Usual Suspects","Year":"1995","Rated":"R","Released":"16 Aug 1995","Runtime":"106 min","Genre":"Crime, Mystery, Thriller","Director":"Bryan Singer","Writer":"Christopher McQuarrie","Actors":"Stephen Baldwin, Gabriel Byrne, Benicio Del Toro, Kevin Pollak","Plot":"A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat, which began when five criminals met at a seemingly random police lineup.","Language":"English, Hungarian, Spanish, French","Country":"USA, Germany","Awards":"Won 2 Oscars. Another 35 wins & 16 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYTViNjMyNmUtNDFkNC00ZDRlLThmMDUtZDU2YWE4NGI2ZjVmXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.5/10"},{"Source":"Rotten Tomatoes","Value":"89%"},{"Source":"Metacritic","Value":"77/100"}],"Metascore":"77","imdbRating":"8.5","imdbVotes":"966,560","imdbID":"tt0114814","Type":"movie","DVD":"09 Dec 1999","BoxOffice":"N/A","Production":"Gramercy Pictures","Website":"N/A","Response":"True"},{"Title":"Mighty Aphrodite","Year":"1995","Rated":"R","Released":"10 Nov 1995","Runtime":"95 min","Genre":"Comedy, Fantasy, Romance","Director":"Woody Allen","Writer":"Woody Allen","Actors":"Pamela Blair, Rene Ceballos, Elie Chaib, George De La Pena","Plot":"When he discovers his adopted son is a genius, a New York sportswriter seeks out the boy's birth mother: a ditzy porn star and prostitute.","Language":"English, Latin","Country":"USA","Awards":"Won 1 Oscar. Another 11 wins & 13 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMGM1NzM2ZjktNDM5ZS00YmExLTk5ZmYtNDdkNjdkNTdhZWZkXkEyXkFqcGdeQXVyNjE5MjUyOTM@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.0/10"},{"Source":"Rotten Tomatoes","Value":"77%"},{"Source":"Metacritic","Value":"59/100"}],"Metascore":"59","imdbRating":"7.0","imdbVotes":"37,339","imdbID":"tt0113819","Type":"movie","DVD":"16 Mar 1999","BoxOffice":"N/A","Production":"Miramax Films","Website":"N/A","Response":"True"},{"Title":"Lamerica","Year":"1994","Rated":"N/A","Released":"04 Oct 1995","Runtime":"116 min","Genre":"Drama","Director":"Gianni Amelio","Writer":"Gianni Amelio, Andrea Porporati, Alessandro Sermoneta","Actors":"Enrico Lo Verso, Michele Placido, Piro Milkani, Carmelo Di Mazzarelli","Plot":"Two Italian racketeers come to Albania just after the fall of the communists to set up a fictive firm and pocket the grants. They need a stooge. They choose an old one in a jail : Spiro. ...","Language":"Albanian, Italian","Country":"Italy, France, Switzerland, Austria","Awards":"21 wins & 18 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNjlmZmQ0ZGUtNTBjYy00ZTg3LWE1NmMtNDAyNDI2Zjc4ZDViXkEyXkFqcGdeQXVyMzIwNDY4NDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.5/10"},{"Source":"Rotten Tomatoes","Value":"91%"}],"Metascore":"N/A","imdbRating":"7.5","imdbVotes":"1,992","imdbID":"tt0110299","Type":"movie","DVD":"25 May 2004","BoxOffice":"N/A","Production":"Arena Films","Website":"N/A","Response":"True"},{"Title":"The Big Green","Year":"1995","Rated":"PG","Released":"29 Sep 1995","Runtime":"100 min","Genre":"Comedy, Family, Sport","Director":"Holly Goldberg Sloan","Writer":"Holly Goldberg Sloan","Actors":"Steve Guttenberg, Olivia d'Abo, Jay O. Sanders, John Terry","Plot":"A teacher on exchange from England is placed in an underachieving Texan school, where she coaches the children in soccer, improving their self esteem and leading to unexpected success.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BNmY4NWVkM2UtY2FkZC00NWJiLTg5N2EtYzk4NjJkMGE0YzA3XkEyXkFqcGdeQXVyNTM5NzI0NDY@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.6/10"},{"Source":"Rotten Tomatoes","Value":"0%"}],"Metascore":"N/A","imdbRating":"5.6","imdbVotes":"9,049","imdbID":"tt0112499","Type":"movie","DVD":"04 May 2004","BoxOffice":"N/A","Production":"Walt Disney Pictures","Website":"N/A","Response":"True"},{"Title":"Georgia","Year":"1995","Rated":"R","Released":"08 Dec 1995","Runtime":"115 min","Genre":"Drama, Music","Director":"Ulu Grosbard","Writer":"Barbara Turner","Actors":"Jennifer Jason Leigh, Mare Winningham, Ted Levine, Max Perlich","Plot":"Sadie is desperately looking up to her older sister Georgia who is a famous C&W artist. Her desperate need to be accepted by her sister is constantly complicated by her drug and alcohol problems.","Language":"English, Hebrew","Country":"France, USA","Awards":"Nominated for 1 Oscar. Another 4 wins & 6 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZWJiNjMwYzMtZWU5Yi00NGI0LTg5NGYtZDY4MWRiYjEwYTYzXkEyXkFqcGdeQXVyMTAwMzUyOTc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"80%"},{"Source":"Metacritic","Value":"81/100"}],"Metascore":"81","imdbRating":"6.6","imdbVotes":"2,734","imdbID":"tt0113158","Type":"movie","DVD":"15 Feb 2000","BoxOffice":"N/A","Production":"LionsGate Entertainment","Website":"N/A","Response":"True"},{"Title":"Home for the Holidays","Year":"1995","Rated":"PG-13","Released":"03 Nov 1995","Runtime":"103 min","Genre":"Comedy, Drama, Romance","Director":"Jodie Foster","Writer":"Chris Radant (short story), W.D. Richter (screenplay)","Actors":"Holly Hunter, Robert Downey Jr., Anne Bancroft, Charles Durning","Plot":"After losing her job, making out with her soon-to-be former boss, and finding out that her daughter plans to spend Thanksgiving with her boyfriend, Claudia Larson faces spending the holiday with her family.","Language":"English","Country":"USA","Awards":"2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMjVlYTQ4NjgtZWQxMS00ZmQ0LTg4M2QtOGE0ZmJiNDhkMzI4XkEyXkFqcGdeQXVyNTIzOTk5ODM@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"63%"},{"Source":"Metacritic","Value":"56/100"}],"Metascore":"56","imdbRating":"6.6","imdbVotes":"11,518","imdbID":"tt0113321","Type":"movie","DVD":"09 Nov 2004","BoxOffice":"N/A","Production":"Passport","Website":"N/A","Response":"True"},{"Title":"Il Postino","Year":"1994","Rated":"PG","Released":"22 Mar 1996","Runtime":"108 min","Genre":"Biography, Comedy, Drama, Romance","Director":"Michael Radford, Massimo Troisi","Writer":"Antonio Skármeta (novel), Furio Scarpelli (story), Giacomo Scarpelli (story), Anna Pavignano (screenplay), Michael Radford (screenplay), Furio Scarpelli (screenplay), Giacomo Scarpelli (screenplay), Massimo Troisi (screenplay)","Actors":"Philippe Noiret, Massimo Troisi, Maria Grazia Cucinotta, Renato Scarpa","Plot":"A simple Italian postman learns to love poetry while delivering mail to a famous poet, and then uses this to woo local beauty Beatrice.","Language":"Italian, Spanish","Country":"Italy, France, Belgium","Awards":"Won 1 Oscar. Another 31 wins & 19 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZmVhNWIzOTMtYmVlZC00ZDVmLWIyODEtODEzOTAxYjAwMzVlXkEyXkFqcGdeQXVyMzIwNDY4NDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.7/10"},{"Source":"Rotten Tomatoes","Value":"93%"},{"Source":"Metacritic","Value":"81/100"}],"Metascore":"81","imdbRating":"7.7","imdbVotes":"32,613","imdbID":"tt0110877","Type":"movie","DVD":"14 Mar 2000","BoxOffice":"N/A","Production":"Penta Film","Website":"N/A","Response":"True"},{"Title":"The Confessional","Year":"1995","Rated":"Not Rated","Released":"16 Aug 1996","Runtime":"100 min","Genre":"Drama, Mystery, Thriller","Director":"Robert Lepage","Writer":"Robert Lepage","Actors":"Lothaire Bluteau, Patrick Goyette, Jean-Louis Millette, Kristin Scott Thomas","Plot":"The year is 1952, in Quebec City. Rachel, 16, unmarried, and pregnant, works in the church. Filled with shame, she unburdens her guilt to a young priest, under the confidentiality of the ...","Language":"French, English","Country":"Canada, UK, France","Awards":"8 wins & 8 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYzViYmE5OWQtOTlmZi00ZDM2LTg5NTEtYjVkODBhZmI3MGQzXkEyXkFqcGdeQXVyNzM0MDQ1Mw@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.5/10"}],"Metascore":"N/A","imdbRating":"7.5","imdbVotes":"1,471","imdbID":"tt0112714","Type":"movie","DVD":"N/A","BoxOffice":"N/A","Production":"Enigma Productions","Website":"N/A","Response":"True"},{"Title":"The Indian in the Cupboard","Year":"1995","Rated":"PG","Released":"14 Jul 1995","Runtime":"96 min","Genre":"Drama, Family, Fantasy","Director":"Frank Oz","Writer":"Lynne Reid Banks (novel), Melissa Mathison (screenplay)","Actors":"Hal Scardino, Litefoot, Lindsay Crouse, Richard Jenkins","Plot":"Omri, a young boy growing up in Brooklyn, receives an odd variety of presents for his birthday: a wooden cabinet from his older brother, a set of antique keys from his mother and a tiny plastic model of an Indian from his best friend Patrick.","Language":"English","Country":"USA","Awards":"1 win & 6 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZWZlYmZiZGMtN2YyZC00MTdjLTllNjUtYWNhZDMwNDhhOTM1XkEyXkFqcGdeQXVyNTI4MjkwNjA@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.0/10"},{"Source":"Rotten Tomatoes","Value":"73%"},{"Source":"Metacritic","Value":"58/100"}],"Metascore":"58","imdbRating":"6.0","imdbVotes":"25,319","imdbID":"tt0113419","Type":"movie","DVD":"03 Jul 2001","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Eye for an Eye","Year":"1996","Rated":"R","Released":"12 Jan 1996","Runtime":"101 min","Genre":"Crime, Drama, Thriller","Director":"John Schlesinger","Writer":"Erika Holzer (novel), Amanda Silver (screenplay), Rick Jaffa (screenplay)","Actors":"Sally Field, Ed Harris, Olivia Burnette, Alexandra Kyle","Plot":"When the courts fail to keep behind bars the man who raped and murdered her daughter, a woman seeks her own form of justice.","Language":"English, French, Spanish, Korean","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BMDM4Mzc5ZjAtM2JjMi00NzU1LWEzM2MtNDQzNWI5MmRkM2I1XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.2/10"}],"Metascore":"N/A","imdbRating":"6.2","imdbVotes":"13,047","imdbID":"tt0116260","Type":"movie","DVD":"20 May 2008","BoxOffice":"N/A","Production":"Leo Films","Website":"N/A","Response":"True"},{"Title":"Mr. Holland's Opus","Year":"1995","Rated":"PG","Released":"19 Jan 1996","Runtime":"143 min","Genre":"Drama, Music","Director":"Stephen Herek","Writer":"Patrick Sheane Duncan","Actors":"Richard Dreyfuss, Glenne Headly, Jay Thomas, Olympia Dukakis","Plot":"A frustrated composer finds fulfillment as a high school music teacher.","Language":"English, American Sign Language","Country":"USA","Awards":"Nominated for 1 Oscar. Another 5 wins & 4 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZDZhNDRlZjAtYzdhNy00ZjU1LWFlMDYtNjA5NjliM2Y5ZmVjL2ltYWdlXkEyXkFqcGdeQXVyNjE5MjUyOTM@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.3/10"},{"Source":"Rotten Tomatoes","Value":"75%"},{"Source":"Metacritic","Value":"59/100"}],"Metascore":"59","imdbRating":"7.3","imdbVotes":"34,844","imdbID":"tt0113862","Type":"movie","DVD":"24 Aug 1999","BoxOffice":"N/A","Production":"N/A","Website":"N/A","Response":"True"},{"Title":"Don't Be a Menace to South Central While Drinking Your Juice in the Hood","Year":"1996","Rated":"R","Released":"12 Jan 1996","Runtime":"89 min","Genre":"Comedy, Crime","Director":"Paris Barclay","Writer":"Shawn Wayans, Marlon Wayans, Phil Beauman","Actors":"Shawn Wayans, Marlon Wayans, Tracey Cherelle Jones, Chris Spencer","Plot":"A parody of several U.S. films about being in the 'Hood', for instance Boyz n the Hood (1991), South Central (1992), Menace II Society (1993), Higher Learning (1995) and Juice (1992).","Language":"English, Spanish","Country":"USA","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BY2NmM2M2MWItNjdlMC00ZWI3LTkwODUtZDNkYWZjYjgzZjY3XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"31%"}],"Metascore":"N/A","imdbRating":"6.6","imdbVotes":"46,916","imdbID":"tt0116126","Type":"movie","DVD":"15 Jan 2002","BoxOffice":"N/A","Production":"Miramax","Website":"N/A","Response":"True"},{"Title":"Two If by Sea","Year":"1996","Rated":"R","Released":"12 Jan 1996","Runtime":"96 min","Genre":"Comedy, Crime, Romance","Director":"Bill Bennett","Writer":"Denis Leary (story), Mike Armstrong (story), Ann Lembeck (story), Denis Leary (screenplay), Mike Armstrong (screenplay)","Actors":"Denis Leary, Sandra Bullock, Stephen Dillane, Yaphet Kotto","Plot":"A couple steals a Matisse painting on contract. They manage to escape the police. The sale takes place 4 days later on an island. Things don't go as planned.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BY2YwZjVkMjItYjY4Yy00M2QyLTg0Y2MtYmFiNTgzMjNmMmQzXkEyXkFqcGdeQXVyNzc5MjA3OA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.3/10"},{"Source":"Rotten Tomatoes","Value":"11%"}],"Metascore":"N/A","imdbRating":"5.3","imdbVotes":"5,327","imdbID":"tt0118002","Type":"movie","DVD":"01 May 2001","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Bio-Dome","Year":"1996","Rated":"PG-13","Released":"12 Jan 1996","Runtime":"88 min","Genre":"Comedy","Director":"Jason Bloom","Writer":"Adam Leff (story), Mitchell Peck (story), Jason Blumenthal (story), Kip Koenig (screenplay), Scott Marcano (screenplay)","Actors":"William Atherton, Denise Dowse, Dara Tomanovich, Kevin West","Plot":"Moronic best friends get themselves locked inside the Bio-Dome, a science experiment, along with a group of environmental scientists for one year.","Language":"English","Country":"USA","Awards":"3 wins & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BYzY0ZjI0NTUtNDE4Yi00OGU2LWExZDMtNTY1MTM3ZWE3MzEyXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"4.5/10"},{"Source":"Rotten Tomatoes","Value":"4%"},{"Source":"Metacritic","Value":"1/100"}],"Metascore":"1","imdbRating":"4.5","imdbVotes":"25,638","imdbID":"tt0115683","Type":"movie","DVD":"16 Apr 2002","BoxOffice":"N/A","Production":"MGM/United Artists","Website":"N/A","Response":"True"},{"Title":"Lawnmower Man 2: Beyond Cyberspace","Year":"1996","Rated":"PG-13","Released":"12 Jan 1996","Runtime":"93 min","Genre":"Action, Sci-Fi, Thriller","Director":"Farhad Mann","Writer":"Farhad Mann (story), Michael Miner (story), Farhad Mann (screenplay)","Actors":"Patrick Bergin, Matt Frewer, Austin O'Brien, Ely Pouget","Plot":"Jobe is resuscitated by Jonathan Walker. He wants Jobe to create a special computer chip that would connect all the computers in the world into one network, which Walker would control and ...","Language":"English","Country":"USA","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BZGI0ZDZhOGUtZDZiOS00NWE2LThjNzQtYzI3ZGFjODUwZjlkXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"2.5/10"},{"Source":"Rotten Tomatoes","Value":"11%"},{"Source":"Metacritic","Value":"29/100"}],"Metascore":"29","imdbRating":"2.5","imdbVotes":"8,836","imdbID":"tt0116839","Type":"movie","DVD":"07 Oct 2003","BoxOffice":"N/A","Production":"New Line Home Entertainment","Website":"N/A","Response":"True"},{"Title":"French Twist","Year":"1995","Rated":"R","Released":"19 Jan 1996","Runtime":"104 min","Genre":"Comedy","Director":"Josiane Balasko","Writer":"Patrick Aubrée, Josiane Balasko, Telsche Boorman (story)","Actors":"Victoria Abril, Josiane Balasko, Alain Chabat, Ticky Holgado","Plot":"After learning of her husband's infidelities, a housewife invites an itinerant lesbian to move in with them. None of their lives will ever be the same again.","Language":"French, Spanish, English","Country":"France","Awards":"Nominated for 1 Golden Globe. Another 3 wins & 5 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMWEwNWY1ZjQtYWMxYS00ZDY2LTg2Y2YtZDc5MTM4MzE0NTM4XkEyXkFqcGdeQXVyNDE5MTU2MDE@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.4/10"},{"Source":"Rotten Tomatoes","Value":"55%"}],"Metascore":"N/A","imdbRating":"6.4","imdbVotes":"4,410","imdbID":"tt0113149","Type":"movie","DVD":"05 Aug 2003","BoxOffice":"N/A","Production":"Canal +","Website":"N/A","Response":"True"},{"Title":"Friday","Year":"1995","Rated":"R","Released":"26 Apr 1995","Runtime":"91 min","Genre":"Comedy, Drama","Director":"F. Gary Gray","Writer":"Ice Cube, DJ Pooh","Actors":"Ice Cube, Chris Tucker, Nia Long, Tommy 'Tiny' Lister","Plot":"Two homies, Smokey and Craig Jones, smoke a dope dealer's weed and try to figure a way to get the two hundred dollars they owe to the dealer by 10 p.m. that same night.","Language":"English","Country":"USA","Awards":"1 win & 5 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYmEwNjNlZTUtNzkwMS00ZTlhLTkyY2MtMjM2MzlmODQyZGVhXkEyXkFqcGdeQXVyNTI4MjkwNjA@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.3/10"},{"Source":"Metacritic","Value":"54/100"}],"Metascore":"54","imdbRating":"7.3","imdbVotes":"96,868","imdbID":"tt0113118","Type":"movie","DVD":"10 Sep 2002","BoxOffice":"N/A","Production":"Zebra","Website":"N/A","Response":"True"},{"Title":"From Dusk Till Dawn","Year":"1996","Rated":"R","Released":"19 Jan 1996","Runtime":"108 min","Genre":"Action, Crime, Horror","Director":"Robert Rodriguez","Writer":"Robert Kurtzman (story), Quentin Tarantino (screenplay)","Actors":"George Clooney, Quentin Tarantino, Harvey Keitel, Juliette Lewis","Plot":"Two criminals and their hostages unknowingly seek temporary refuge in a truck stop populated by vampires, with chaotic results.","Language":"English, Spanish","Country":"USA, Mexico","Awards":"7 wins & 13 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZjk3YmZhMDAtOWUzMS00YjE5LTkxNzAtY2I1NGZjMDA2ZTk0XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.2/10"},{"Source":"Rotten Tomatoes","Value":"63%"},{"Source":"Metacritic","Value":"48/100"}],"Metascore":"48","imdbRating":"7.2","imdbVotes":"280,096","imdbID":"tt0116367","Type":"movie","DVD":"15 Jun 1998","BoxOffice":"N/A","Production":"Dimension Films","Website":"N/A","Response":"True"},{"Title":"Fair Game","Year":"1995","Rated":"R","Released":"03 Nov 1995","Runtime":"91 min","Genre":"Action, Romance, Thriller","Director":"Andrew Sipes","Writer":"Paula Gosling (novel), Charlie Fletcher (screenplay)","Actors":"William Baldwin, Cindy Crawford, Steven Berkoff, Christopher McDonald","Plot":"Max Kirkpatrick is a cop who protects Kate McQuean, a civil law attorney, from a renegade KGB team out to terminate her.","Language":"English, Russian","Country":"USA","Awards":"4 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMTE4M2Q2ZjctMGViNS00NzhiLWFkMjMtMjY2NWMzOWUzM2Y3XkEyXkFqcGdeQXVyNjU0NTI0Nw@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"4.3/10"},{"Source":"Rotten Tomatoes","Value":"12%"},{"Source":"Metacritic","Value":"13/100"}],"Metascore":"13","imdbRating":"4.3","imdbVotes":"11,915","imdbID":"tt0113010","Type":"movie","DVD":"30 Mar 1999","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Kicking and Screaming","Year":"1995","Rated":"R","Released":"06 Oct 1995","Runtime":"96 min","Genre":"Comedy, Drama, Romance","Director":"Noah Baumbach","Writer":"Noah Baumbach (story), Bo Berkman (story), Noah Baumbach","Actors":"Josh Hamilton, Samuel Gould, Catherine Kellner, Jonathan Baumbach","Plot":"A bunch of guys hang around their college for months after graduation, continuing a life much like the one before graduation.","Language":"English","Country":"USA","Awards":"2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNWU2YjdlN2ItNTk2OS00MzMwLTlhYjctNDI0MDI0NTQ3OWY0XkEyXkFqcGdeQXVyNzI1NzMxNzM@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"57%"},{"Source":"Metacritic","Value":"75/100"}],"Metascore":"75","imdbRating":"6.8","imdbVotes":"10,949","imdbID":"tt0113537","Type":"movie","DVD":"22 Aug 2006","BoxOffice":"N/A","Production":"Trimark","Website":"N/A","Response":"True"},{"Title":"Les Misérables","Year":"1995","Rated":"R","Released":"03 Nov 1995","Runtime":"175 min","Genre":"Drama, History","Director":"Claude Lelouch","Writer":"Victor Hugo (novel), Claude Lelouch","Actors":"Jean-Paul Belmondo, Michel Boujenah, Alessandra Martines, Salomé Lelouch","Plot":"A variation on Victor Hugo's classic novel by means of the story of a man whose life is affected by and somewhat duplicated by the Hugo story of the beleaguered Jean Valjean.","Language":"French, German, English","Country":"France","Awards":"Won 1 Golden Globe. Another 5 wins & 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMTg1NzgyNTk0N15BMl5BanBnXkFtZTYwNjk4MDU5._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.4/10"},{"Source":"Rotten Tomatoes","Value":"80%"}],"Metascore":"N/A","imdbRating":"7.4","imdbVotes":"3,494","imdbID":"tt0113828","Type":"movie","DVD":"21 May 1996","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Bed of Roses","Year":"1996","Rated":"PG","Released":"26 Jan 1996","Runtime":"87 min","Genre":"Drama, Romance","Director":"Michael Goldenberg","Writer":"Michael Goldenberg","Actors":"Christian Slater, Mary Stuart Masterson, Pamela Adlon, Josh Brolin","Plot":"Romantic drama about a young career girl who is swept off her feet by a shy florist, who fell in love with her after one glimpse through a shadowy window.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BNTUwOWM4YmUtMzdkMi00YjEwLWE0MmEtZTBmMGNhYWU4OGI3XkEyXkFqcGdeQXVyNzc5MjA3OA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.1/10"},{"Source":"Rotten Tomatoes","Value":"19%"}],"Metascore":"N/A","imdbRating":"6.1","imdbVotes":"7,747","imdbID":"tt0115644","Type":"movie","DVD":"27 Jul 1999","BoxOffice":"N/A","Production":"New Line Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Screamers","Year":"1995","Rated":"R","Released":"26 Jan 1996","Runtime":"108 min","Genre":"Horror, Sci-Fi, Thriller","Director":"Christian Duguay","Writer":"Philip K. Dick (short story \"Second Variety\"), Dan O'Bannon (screenplay), Miguel Tejada-Flores (screenplay)","Actors":"Peter Weller, Roy Dupuis, Jennifer Rubin, Andrew Lauer","Plot":"A military commander stationed off planet during an interplanetary war travels through the devastated landscape to negotiate a peace treaty, but discovers that the primitive robots they built to kill enemy combatants have gained sentience.","Language":"English","Country":"Canada, USA, UK, Japan","Awards":"3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BM2M2ZGM0NDUtODRhNS00MjcxLTg3ZWYtYjkyZDJkYmVjOWYwXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.4/10"},{"Source":"Rotten Tomatoes","Value":"29%"}],"Metascore":"N/A","imdbRating":"6.4","imdbVotes":"24,586","imdbID":"tt0114367","Type":"movie","DVD":"06 Sep 2000","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Nico Icon","Year":"1995","Rated":"N/A","Released":"16 Nov 1995","Runtime":"67 min","Genre":"Documentary, Biography, Music","Director":"Susanne Ofteringer","Writer":"Susanne Ofteringer (screenplay)","Actors":"Nico, Tina Aumont, Christian Päffgen, Edith Boulogne","Plot":"A look into the many lives of Christa Päffgen, otherwise known as Nico; from cutie German mädchen to the first of the supermodels, to glamorous diva of the Velvet Underground, to cult item,...","Language":"English, German","Country":"Germany, USA","Awards":"4 wins.","Poster":"https://m.media-amazon.com/images/M/MV5BNTY2MDM2NzcyM15BMl5BanBnXkFtZTcwMjk3MzcyMQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.2/10"},{"Source":"Rotten Tomatoes","Value":"88%"}],"Metascore":"N/A","imdbRating":"7.2","imdbVotes":"637","imdbID":"tt0113973","Type":"movie","DVD":"N/A","BoxOffice":"N/A","Production":"N/A","Website":"N/A","Response":"True"},{"Title":"The Crossing Guard","Year":"1995","Rated":"R","Released":"16 Nov 1995","Runtime":"111 min","Genre":"Drama, Thriller","Director":"Sean Penn","Writer":"Sean Penn","Actors":"Jack Nicholson, David Morse, Anjelica Huston, Robin Wright","Plot":"Freddy Gale is a seedy jeweller who has sworn to kill the drunk driver who killed his little girl.","Language":"English","Country":"USA","Awards":"Nominated for 1 Golden Globe. Another 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMjkwNWMyZjQtNmU5MS00ZWE1LWE3NzMtNGZjNTlhYzcwNjIzXkEyXkFqcGdeQXVyMTAwMzUyOTc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.3/10"},{"Source":"Rotten Tomatoes","Value":"75%"},{"Source":"Metacritic","Value":"46/100"}],"Metascore":"46","imdbRating":"6.3","imdbVotes":"12,549","imdbID":"tt0112744","Type":"movie","DVD":"16 Nov 1999","BoxOffice":"N/A","Production":"Miramax","Website":"N/A","Response":"True"},{"Title":"The Juror","Year":"1996","Rated":"R","Released":"02 Feb 1996","Runtime":"118 min","Genre":"Crime, Drama, Thriller","Director":"Brian Gibson","Writer":"George Dawes Green (novel), Ted Tally (screenplay)","Actors":"Demi Moore, Alec Baldwin, Joseph Gordon-Levitt, James Gandolfini","Plot":"A juror in a Mafia trial is forced to convince the other jurors to vote not guilty by an obsessive mob enforcer.","Language":"English, Spanish","Country":"USA","Awards":"1 win & 2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYTMzNjAyZTktNzRjMS00ZThmLTk5ODEtZWI5ZmYyZGNiNzMxXkEyXkFqcGdeQXVyNjU0NTI0Nw@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.7/10"},{"Source":"Rotten Tomatoes","Value":"18%"}],"Metascore":"N/A","imdbRating":"5.7","imdbVotes":"16,346","imdbID":"tt0116731","Type":"movie","DVD":"30 Oct 2001","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"The White Balloon","Year":"1995","Rated":"Unrated","Released":"27 Nov 1995","Runtime":"85 min","Genre":"Drama, Family","Director":"Jafar Panahi","Writer":"Abbas Kiarostami, Jafar Panahi (original idea), Parviz Shahbazi (original idea)","Actors":"Aida Mohammadkhani, Mohsen Kafili, Fereshteh Sadre Orafaiy, Anna Borkowska","Plot":"Several people try to help a little girl to find the money her mom gave her to buy a goldfish with.","Language":"Persian","Country":"Iran","Awards":"5 wins & 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BN2QzOTY0MjAtMDQ4MC00MTQ3LWIxM2UtZjc5MzkxYjRhZjdjXkEyXkFqcGdeQXVyNjkxOTM4ODY@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.7/10"},{"Source":"Rotten Tomatoes","Value":"81%"}],"Metascore":"N/A","imdbRating":"7.7","imdbVotes":"6,183","imdbID":"tt0112445","Type":"movie","DVD":"14 Jan 1997","BoxOffice":"N/A","Production":"October Films","Website":"N/A","Response":"True"},{"Title":"Things to Do in Denver When You're Dead","Year":"1995","Rated":"R","Released":"01 Dec 1995","Runtime":"115 min","Genre":"Crime, Drama, Thriller","Director":"Gary Fleder","Writer":"Scott Rosenberg","Actors":"Andy Garcia, Christopher Lloyd, William Forsythe, Bill Nunn","Plot":"Five different criminals face imminent death after botching a job quite badly.","Language":"English","Country":"USA","Awards":"2 wins.","Poster":"https://m.media-amazon.com/images/M/MV5BMzI0OWEzZmItOGUyOC00M2Y2LWIzNDEtY2EzYzAwNWI0ZDkyXkEyXkFqcGdeQXVyNTc1NTQxODI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"33%"},{"Source":"Metacritic","Value":"46/100"}],"Metascore":"46","imdbRating":"6.8","imdbVotes":"25,664","imdbID":"tt0114660","Type":"movie","DVD":"29 Jun 1999","BoxOffice":"N/A","Production":"Miramax","Website":"N/A","Response":"True"},{"Title":"Antonia's Line","Year":"1995","Rated":"R","Released":"02 Feb 1996","Runtime":"102 min","Genre":"Comedy, Drama","Director":"Marleen Gorris","Writer":"Marleen Gorris","Actors":"Willeke van Ammelrooy, Els Dottermans, Dora van der Groen, Veerle van Overloop","Plot":"A Dutch matron establishes and, for several generations, oversees a close-knit, matriarchal community where feminism and liberalism thrive.","Language":"Dutch","Country":"Netherlands, Belgium, UK, France","Awards":"Won 1 Oscar. Another 7 wins & 9 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNDVmNjdhMzEtNDMzMy00NzI0LWI1ZmUtNjJiNGEzMDExZDY5XkEyXkFqcGdeQXVyMjM5NDQzNTk@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.4/10"},{"Source":"Rotten Tomatoes","Value":"67%"}],"Metascore":"N/A","imdbRating":"7.4","imdbVotes":"8,059","imdbID":"tt0112379","Type":"movie","DVD":"12 Oct 1999","BoxOffice":"N/A","Production":"BMG","Website":"N/A","Response":"True"},{"Title":"Once Upon a Time... When We Were Colored","Year":"1995","Rated":"PG","Released":"26 Jan 1996","Runtime":"115 min","Genre":"Drama, Romance","Director":"Tim Reid","Writer":"Clifton L. Taulbert (book), Paul W. Cooper (screenplay)","Actors":"Al Freeman Jr., Phylicia Rashad, Leon, Paula Kelly","Plot":"A narrator tells the story of his childhood years in a tightly knit Afro-American community in the deep south under racial segregation.","Language":"English","Country":"USA","Awards":"3 wins & 2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMTI4NDk2MDcyNV5BMl5BanBnXkFtZTcwMTQxNTMyMQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.0/10"},{"Source":"Rotten Tomatoes","Value":"71%"}],"Metascore":"N/A","imdbRating":"7.0","imdbVotes":"462","imdbID":"tt0114039","Type":"movie","DVD":"18 Dec 2001","BoxOffice":"N/A","Production":"Republic Pictures Home Video","Website":"N/A","Response":"True"},{"Title":"Last Summer in the Hamptons","Year":"1995","Rated":"R","Released":"15 Sep 1996","Runtime":"108 min","Genre":"Comedy, Drama","Director":"Henry Jaglom","Writer":"Henry Jaglom, Victoria Foyt","Actors":"Victoria Foyt, Viveca Lindfors, Jon Robin Baitz, Savannah Smith Boucher","Plot":"Filmed entirely on location in East Hampton, Long Island, \"Last Summer in the Hamptons\" concerns a large theatrical family spending the last weekend of their summer together at the ...","Language":"English","Country":"USA","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BMTY2OTM4MDI2OV5BMl5BanBnXkFtZTcwNTQxMTYxMQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.0/10"},{"Source":"Rotten Tomatoes","Value":"64%"}],"Metascore":"N/A","imdbRating":"6.0","imdbVotes":"341","imdbID":"tt0113612","Type":"movie","DVD":"12 Aug 2008","BoxOffice":"N/A","Production":"Live Home Video","Website":"N/A","Response":"True"},{"Title":"Angels and Insects","Year":"1995","Rated":"R","Released":"26 Jan 1996","Runtime":"116 min","Genre":"Drama, Romance","Director":"Philip Haas","Writer":"A.S. Byatt (novel), Belinda Haas (screenplay), Philip Haas (screenplay)","Actors":"Mark Rylance, Kristin Scott Thomas, Patsy Kensit, Jeremy Kemp","Plot":"In the 1800s a naturalist marries into a family of British country gentry.","Language":"English","Country":"UK, USA","Awards":"Nominated for 1 Oscar. Another 2 wins & 2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZTc1MzY1ODAtMDhlMS00NjgyLTlkNTEtZTUwYTM4MzFkNWNmXkEyXkFqcGdeQXVyNDE5MTU2MDE@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.8/10"},{"Source":"Rotten Tomatoes","Value":"71%"}],"Metascore":"N/A","imdbRating":"6.8","imdbVotes":"4,268","imdbID":"tt0112365","Type":"movie","DVD":"19 Mar 2002","BoxOffice":"N/A","Production":"MGM Home Entertainment","Website":"N/A","Response":"True"},{"Title":"White Squall","Year":"1996","Rated":"PG-13","Released":"02 Feb 1996","Runtime":"129 min","Genre":"Adventure, Drama","Director":"Ridley Scott","Writer":"Charles Gieg Jr. (book), Felix Sutton (book), Todd Robinson","Actors":"Jeff Bridges, Caroline Goodall, John Savage, Scott Wolf","Plot":"Teenage boys discover discipline and camaraderie on an ill-fated sailing voyage.","Language":"English, Danish, Spanish","Country":"USA, UK","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BNzdlZTBmYjgtZWRlZC00MDI0LTkxNzUtODdhYWYwYmJiMjY3XkEyXkFqcGdeQXVyMTY4MjE1MDA@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"58%"},{"Source":"Metacritic","Value":"53/100"}],"Metascore":"53","imdbRating":"6.6","imdbVotes":"20,747","imdbID":"tt0118158","Type":"movie","DVD":"22 Jun 1999","BoxOffice":"N/A","Production":"Hollywood Pictures","Website":"N/A","Response":"True"},{"Title":"Dunston Checks In","Year":"1996","Rated":"PG","Released":"12 Jan 1996","Runtime":"88 min","Genre":"Comedy, Adventure, Family","Director":"Ken Kwapis","Writer":"John Hopkins (story), John Hopkins (screenplay), Bruce Graham (screenplay)","Actors":"Jason Alexander, Faye Dunaway, Eric Lloyd, Rupert Everett","Plot":"A young boy befriends a larcenous orangutan in a luxury hotel.","Language":"English, French","Country":"USA","Awards":"4 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BN2RhOTA4YzAtNTg3NC00NmYxLWI1YjQtYzM4NTJlYzVhZGYwXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.4/10"},{"Source":"Rotten Tomatoes","Value":"12%"},{"Source":"Metacritic","Value":"54/100"}],"Metascore":"54","imdbRating":"5.4","imdbVotes":"11,677","imdbID":"tt0116151","Type":"movie","DVD":"28 May 2002","BoxOffice":"N/A","Production":"Twentieth Century Fox Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Black Sheep","Year":"1996","Rated":"PG-13","Released":"02 Feb 1996","Runtime":"87 min","Genre":"Comedy","Director":"Penelope Spheeris","Writer":"Fred Wolf","Actors":"Chris Farley, David Spade, Tim Matheson, Christine Ebersole","Plot":"A gubernatorial candidate hires a wormy special assistant whose only job is to make sure the candidate's well-meaning but incompetent brother doesn't ruin the election.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BYjc2NzU0YjUtYzkyNS00NjcwLWJiM2QtM2Y3YjFhMTQ0M2I3XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.3/10"},{"Source":"Rotten Tomatoes","Value":"28%"}],"Metascore":"N/A","imdbRating":"6.3","imdbVotes":"35,843","imdbID":"tt0115697","Type":"movie","DVD":"16 Jul 2002","BoxOffice":"N/A","Production":"Paramount Home Video","Website":"N/A","Response":"True"},{"Title":"Nick of Time","Year":"1995","Rated":"R","Released":"22 Nov 1995","Runtime":"90 min","Genre":"Action, Crime, Drama, Thriller","Director":"John Badham","Writer":"Patrick Sheane Duncan","Actors":"Johnny Depp, Courtney Chase, Charles S. Dutton, Christopher Walken","Plot":"An unimpressive, everyday man is forced into a situation where he is told to kill a politician to save his kidnapped daughter.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BODg1ODNjMzItYjRkMS00NmExLTkxNWUtMWYwNWM2NDU1YzU1XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.3/10"},{"Source":"Rotten Tomatoes","Value":"32%"}],"Metascore":"N/A","imdbRating":"6.3","imdbVotes":"37,916","imdbID":"tt0113972","Type":"movie","DVD":"22 Jun 1999","BoxOffice":"N/A","Production":"Paramount Home Video","Website":"N/A","Response":"True"},{"Title":"Mary Reilly","Year":"1996","Rated":"R","Released":"23 Feb 1996","Runtime":"108 min","Genre":"Drama, Horror, Romance, Thriller","Director":"Stephen Frears","Writer":"Valerie Martin (novel), Christopher Hampton (screenplay)","Actors":"Julia Roberts, John Malkovich, George Cole, Michael Gambon","Plot":"A housemaid falls in love with Dr. Henry Jekyll (John Malkovich) and his darkly mysterious counterpart, Mr. Edward Hyde.","Language":"English","Country":"USA, UK","Awards":"6 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZWI5MzBiMjgtNDE2ZC00MTA1LWFmNWItZDQyMDA2NGE0MjQ5XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.8/10"},{"Source":"Rotten Tomatoes","Value":"26%"},{"Source":"Metacritic","Value":"44/100"}],"Metascore":"44","imdbRating":"5.8","imdbVotes":"13,619","imdbID":"tt0117002","Type":"movie","DVD":"12 Sep 2000","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Vampire in Brooklyn","Year":"1995","Rated":"R","Released":"27 Oct 1995","Runtime":"100 min","Genre":"Comedy, Fantasy, Horror, Romance","Director":"Wes Craven","Writer":"Eddie Murphy (story), Vernon Lynch (story), Charlie Murphy (story), Charlie Murphy (screenplay), Michael Lucker (screenplay), Chris Parker (screenplay)","Actors":"Eddie Murphy, Angela Bassett, Allen Payne, Kadeem Hardison","Plot":"A ship sails into Brooklyn with all its crew dead. But something gets off and the killing continues on land. The vampire is looking for a specific woman - half-human, half-vampire. Rita's the cop detective investigating the many killings.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BNWFlYjJiYzUtNWE1YS00YzM5LTkxYzMtN2FlMjI4NTNlNzExXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"4.6/10"},{"Source":"Rotten Tomatoes","Value":"10%"},{"Source":"Metacritic","Value":"27/100"}],"Metascore":"27","imdbRating":"4.6","imdbVotes":"21,074","imdbID":"tt0114825","Type":"movie","DVD":"29 Jan 2002","BoxOffice":"N/A","Production":"Paramount","Website":"N/A","Response":"True"},{"Title":"Beautiful Girls","Year":"1996","Rated":"R","Released":"09 Feb 1996","Runtime":"112 min","Genre":"Comedy, Drama, Romance","Director":"Ted Demme","Writer":"Scott Rosenberg","Actors":"Matt Dillon, Noah Emmerich, Annabeth Gish, Lauren Holly","Plot":"A piano player at a crossroads in his life returns home to his friends and their own problems with life and love.","Language":"English","Country":"USA","Awards":"1 win & 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BOTQ4OTU0ODktY2E5YS00MGFhLTgwZTEtZWFkOGMxMmFmOTg0XkEyXkFqcGdeQXVyNzc5MjA3OA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.1/10"},{"Source":"Rotten Tomatoes","Value":"79%"},{"Source":"Metacritic","Value":"64/100"}],"Metascore":"64","imdbRating":"7.1","imdbVotes":"30,894","imdbID":"tt0115639","Type":"movie","DVD":"03 Apr 2001","BoxOffice":"N/A","Production":"Miramax Films","Website":"N/A","Response":"True"},{"Title":"Broken Arrow","Year":"1996","Rated":"R","Released":"09 Feb 1996","Runtime":"108 min","Genre":"Action, Adventure, Thriller","Director":"John Woo","Writer":"Graham Yost","Actors":"John Travolta, Christian Slater, Samantha Mathis, Delroy Lindo","Plot":"Terrorists steal nuclear warheads from the U.S. military but don't count on a pilot and park ranger spoiling their plans.","Language":"English","Country":"USA","Awards":"1 win & 3 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYzU2NDg3ZTItNzRmNy00NTQzLTljMDUtNjczOTMwZjEzNWVkXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.1/10"},{"Source":"Rotten Tomatoes","Value":"53%"},{"Source":"Metacritic","Value":"61/100"}],"Metascore":"61","imdbRating":"6.1","imdbVotes":"89,351","imdbID":"tt0115759","Type":"movie","DVD":"09 Mar 1999","BoxOffice":"N/A","Production":"Twentieth Century Fox Home Entertainment","Website":"N/A","Response":"True"},{"Title":"A Midwinter's Tale","Year":"1995","Rated":"R","Released":"16 Feb 1996","Runtime":"99 min","Genre":"Comedy","Director":"Kenneth Branagh","Writer":"Kenneth Branagh","Actors":"Richard Briers, Hetta Charnley, Joan Collins, Nicholas Farrell","Plot":"A group of theater actors plays \"Hamlet\" in a provincial village, faced with their own temptations, disappointments, and joys.","Language":"English","Country":"UK","Awards":"1 win & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BMTIyMDEwMDAyMl5BMl5BanBnXkFtZTYwOTUwNTk4._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.2/10"},{"Source":"Rotten Tomatoes","Value":"81%"}],"Metascore":"N/A","imdbRating":"7.2","imdbVotes":"2,274","imdbID":"tt0113403","Type":"movie","DVD":"22 Oct 1996","BoxOffice":"N/A","Production":"N/A","Website":"N/A","Response":"True"},{"Title":"La Haine","Year":"1995","Rated":"Not Rated","Released":"23 Feb 1996","Runtime":"98 min","Genre":"Crime, Drama","Director":"Mathieu Kassovitz","Writer":"Mathieu Kassovitz","Actors":"Vincent Cassel, Hubert Koundé, Saïd Taghmaoui, Abdel Ahmed Ghili","Plot":"24 hours in the lives of three young men in the French suburbs the day after a violent riot.","Language":"French","Country":"France","Awards":"8 wins & 14 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BNDNiOTA5YjktY2Q0Ni00ODgzLWE5MWItNGExOWRlYjY2MjBlXkEyXkFqcGdeQXVyNjQ2MjQ5NzM@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.1/10"},{"Source":"Rotten Tomatoes","Value":"100%"}],"Metascore":"N/A","imdbRating":"8.1","imdbVotes":"143,600","imdbID":"tt0113247","Type":"movie","DVD":"17 Apr 2007","BoxOffice":"N/A","Production":"Criterion Collection","Website":"N/A","Response":"True"},{"Title":"Shopping","Year":"1994","Rated":"R","Released":"09 Feb 1996","Runtime":"87 min","Genre":"Action, Crime, Drama, Thriller","Director":"Paul W.S. Anderson","Writer":"Paul W.S. Anderson","Actors":"Sadie Frost, Jude Law, Sean Pertwee, Fraser James","Plot":"You've run out of options, no school, no job. Steal a car, smash a shop with a heavy car and reap the proceeds! This movie is about underground England. The causes, the benefits, and the result of a life of 'crash and carry.'","Language":"English","Country":"UK, Japan","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BMTA5NzE3MjQ4MzFeQTJeQWpwZ15BbWU3MDQ1MDU2MjE@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.4/10"}],"Metascore":"N/A","imdbRating":"5.4","imdbVotes":"2,454","imdbID":"tt0111173","Type":"movie","DVD":"N/A","BoxOffice":"N/A","Production":"N/A","Website":"N/A","Response":"True"},{"Title":"Heidi Fleiss: Hollywood Madam","Year":"1995","Rated":"Not Rated","Released":"09 Feb 1996","Runtime":"106 min","Genre":"Documentary, Biography","Director":"Nick Broomfield","Writer":"N/A","Actors":"Nick Broomfield, Nina Xining Zuo, Madam Alex, Corinne Bohrer","Plot":"A documentary crew from the BBC arrives in L.A. intent on interviewing Heidi Fleiss, a year after her arrest for running a brothel but before her trial. Several months elapse before the ...","Language":"English","Country":"UK, Germany, USA, Canada","Awards":"1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BMTc4NDc5NzQzNF5BMl5BanBnXkFtZTcwMDUyODkxMQ@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.6/10"},{"Source":"Rotten Tomatoes","Value":"75%"}],"Metascore":"N/A","imdbRating":"6.6","imdbVotes":"623","imdbID":"tt0113283","Type":"movie","DVD":"18 Jan 2000","BoxOffice":"N/A","Production":"BMG","Website":"N/A","Response":"True"}]
//console.log(obj);
//obj = require('/Users/getcr/Desktop/Fall_2020/Fundamentals_Web_Applications/Final_Project/Final/movie-data.json');

//let movie3 = {title:"A Silent Voice",runtime:"2:00:00",year:2016,rating:10,number_ratings:90,genres:["Romance","Drama"],plot:"...",actors:["Shoko"],directors:5,writers:["Writer 1","Writer 2", "Writer 3"],review:[],description:"A high school boy who bullied Shoko Nishimiya, a deaf girl, in elementary school. He becomes the victim of bullying when the principal finds out. Now a social outcast, he strives to make amends with Shoko."};
//let person1 = {name:"Samuel L. Jackson", role:{actor:true,writer:false,director:true},works:[0,1]};
//persons[0] = person1;
//incrementPersonIDS();

obj.forEach(newObject);

function newObject(movie) {
    let newObj = {};
    newObj["title"] = movie.Title;
    newObj["runtime"] = movie.Runtime;
    newObj["year"] = parseInt(movie.Year);
    newObj["rating"] = parseInt(movie.imdbRating);
    newObj["genres"] = movie.Genre.split(/\s*,\s*/);
    newObj["description"] = movie.Plot;
    newObj["actors"] = movie.Actors.split(/\s*,\s*/);
    newObj["writers"] = movie.Writer.split(/\s*,\s*/);
    newObj["review"] = [];
    newObj["number_ratings"] = 0;

    let directors = movie.Director.split(/\s*,\s*/);
    newObj["director"] = directors.length;

    movies[movieIDs] = newObj;
    incrementMovieIDS();

    for (let i = 0; i < newObj.actors.length; ++i) {
        let personID = personIDS;
        incrementPersonIDS();
        let person = {name:newObj.actors[i],role:{actor:true,writer:false,director:false,works:[]}};
        persons[personID] = person;
        person.role.works = getWorks(newObj.actors[i]);
    }
    for (let i = 0; i < newObj.writers.length; ++i) {
        let personID = personIDS;
        incrementPersonIDS();
        let person = {name:newObj.writers[i],role:{actor:false,writer:true,director:false,works:[]}};
        persons[personID] = person;
        person.role.works = getWorks(newObj.writers[i]);
    }
}

function incrementMovieIDS(){
    movieIDs++;
}
function incrementPersonIDS() {
    personIDS++;
}
function incrementReviewIDS() {
    reviewIDS++;
}

function searchWriters(text) {
    if (typeof text != 'string' || text.length < 1) {
        return null;
    }

    let results = {};
    let movkeys = Object.keys(movies);

    for (elem in movkeys) {
        let writers = movies[elem].writers;
        for (let i = 0; i < writers.length; ++i) {
            if (writers[i].includes(text)) {
                let id = getPerson(writers[i]);
                let writerObj = getPersonID(getPerson(writers[i]));
                if (id !== null || writerObj !== null) {
                    results[id] = writerObj;
                }
            }
        }
    }
    return results;
}
//console.log(searchWriters("Writer"));

function searchActors(text) {
    if (typeof text != 'string' || text.length < 1) {
        return null;
    }

    let results = {};
    let movkeys = Object.keys(movies);

    for (elem in movkeys) {
        let actors = movies[elem].actors;
        for (let i = 0; i < actors.length; i++) {
            if (actors[i].includes(text)) {
                let id = getPerson(actors[i]);
                results[id] = getPersonID(getPerson(actors[i]));
            }
        }
    }

    return results;
}
//console.log(searchActors("Tak"));

function searchMovies(text) {
    if (typeof text != 'string' || text.length < 1) {
        return null;
    }

    let results = {};

    //Check if text is contained within name of movies
    let movkeys = Object.keys(movies);
    for (elem in movkeys) {
        if (movies[elem].title.includes(text)) {
            results[elem] = movies[elem];
        }
    }

    return results;
}
//console.log(searchMovies("A"));

function getMoviesWatched(userID) {
    let user = getUserID(userID);
    let watchedIDs = user.movieswatched;

    if (watchedIDs.length == 0 || user == null) {
        return;
    }

    let movobjs = {};
    for (let i = 0; i < watchedIDs.length; ++i) {
        let movie = getMovie(watchedIDs[i]);
        movobjs[watchedIDs[i]] = movie;
    }

    return movobjs;
}
//console.log(getMoviesWatched(1000));

function getSimilarMovies(movieID) {
    let movie = getMovie(movieID);
    if (movie == null) {
        return;
    }
    let genres = movie.genres;
    let movie_list = Object.values(movies);
    let similarMovies2 = {};

    let movie_list2 = Object.keys(movies);
    for (let j = 0; j < movie_list2.length; ++j) {
        for (let i = 0; i < genres.length; ++i) {
            if (movies[movie_list2[j]].genres.includes(genres[i]) && movies[movie_list2[j]] != movie && !similarMovies2.hasOwnProperty(movies[movie_list2[j]])) {
                similarMovies2[j] = movies[movie_list2[j]];
            }
        }
    }    

    return similarMovies2;
}
//console.log(getSimilarMovies(0));

function getPerson(personName) {
    let keys = Object.keys(persons);

    for (let i = 0; i < keys.length; ++i) {
        if (persons[i].name == personName) {
            return i;
        }
    }
    return null;
}

function getPersonID(id) {
    let keys = Object.keys(persons);
    for (let i = 0; i < keys.length; ++i) {
        if (parseInt(keys[i]) === id) {
            return persons[i];
        }
    }
    return null
}

function getCollaborators(personID) {
    let movie_list = Object.values(movies);
    let person = getPersonID(personID);
    let total = [];
    if (person == null) {
        return null;
    }

    for (let i = 0; i < movie_list.length; ++i) {
        if (movie_list[i].actors.includes(person.name)) {
            for (let j = 0; j < movie_list[i].actors.length; ++j) {
                if (movie_list[i].actors[j] != person.name) {
                    total.push(movie_list[i].actors[j]);
                }
            }
        }
    }
    return total;
}

function incrementID() {
    ids++;
}
function getUserID(userID) {
    for (let i = 0; i < users.length; ++i) {
        if (users[i].id == userID) {
            return users[i];
        }
    }
    return null;
}
function logUser(username,password) {
    for(let i = 0; i < users.length; ++i) {
        if (users[i].username == username && users[i].password == password) {
            return users[i];
        }
    }
    return null;
}
function getUser(username) {
    for (let i = 0; i < users.length; ++i) {
        if (users[i].username === username) {
            return users[i];
        }
    }
    return null;
}
function getReviewID(username,id) {
    for (let i = 0; i < users.length; ++i) {
        if (users[i].username === username) {
            for (let j = 0; j < users[i].review.length; j++) {
                if (users[i].review[j] === id) {
                    return 1;
                }
            }
        }
    }

    return 0;
}
//console.log(getReviewID("user1",1));
//console.log(getReviewID("user1",0));

//This function returns the number of reviews that the movie has
//Helpful for the MoviePage which has to display the rating of each movie
function updateRating(movieTitle) {
    let movObjs = Object.values(movies);
    let reviewNumber = 0;

    for (let i = 0; i < movObjs.length; ++i) {
        if (movObjs[i].title === movieTitle) {
            reviewNumber = movObjs[i].review.length;
        }
    }

    return reviewNumber;
}
//console.log(updateRating("Your Name"));

//When a user presses the c_user button, their c_user value must be updated
//c representing contributing --> contributing_user
function c_user(userID) {
    let current_user = getUserID(userID);
    if (current_user !== null) {
        current_user.c_user = true;
    }
}
c_user(1000);
c_user(1001);
c_user(1002);
/*
c_user(1003);
console.log(users);
*/

function getMovie(id) {
    let keys = Object.keys(movies);
    for (elem in keys) {
        if (elem == id) {
            return movies[elem];
        }
    }
    return null;
}
//console.log(getMovie(2));

//IMPORTANT: The next 3 functions are used together in order to retrieve an array of recommended movie objects for the user
//The process is quite long, but it should work (except if the database is large, it could return a really large amount of movies)
function retrieveMovie(userID) {
    let user = getUserID(userID);
    if (user === null) {
        return null;
    }

    if (user.movieswatched.length === 0) {
        return null;
    }

    let ids = [];
    for (let i = 0; i < user.movieswatched.length; ++i) {
        ids.push(user.movieswatched[i]);
    }

    let recommended = [];
    for (let i = 0; i < ids.length; ++i) {
        if (ids[i] in movies) {
            recommended.push(movies[ids[i]]);
        }
    }

    let mostCommonGenre = searchGenre(recommended);
    let recommendedMovies = findRecommended(mostCommonGenre);

    return recommendedMovies;
}

//Concatenate all the genres and see if there's a common one, if not return a random one (for now) (NOT COMPLETED: MUST FIND MOST COMMON OCCURENCE)
//Helper function to the function above
function searchGenre(movies) {
    //Romance, Drama
    let totalgenres = [];
    for (let i = 0; i < movies.length; ++i) {
        for (let j = 0; j < movies[i].genres.length; ++j) {
            totalgenres.push(movies[i].genres[j]);
        }
    }

    //Literally just converting the totalgenres array into an object where the genre is the key and the value is the occurence
    let genreObj = {};

    for (let i = 0; i < totalgenres.length; ++i) {
        let keys = Object.keys(genreObj);

        if (keys.includes(totalgenres[i])) {
            genreObj[totalgenres[i]] += 1;
            continue;
        }
        genreObj[totalgenres[i]] = 0;
    }
    //Now to find the max within this object
    let keys = Object.keys(genreObj);
    let max = keys[0];

    for (let i = 1; i < keys.length; ++i) {
        if (genreObj[keys[i]] > genreObj[max]) {
            max = keys[i];
        }
    }

    return max;
}

//Search movies array with genres keyword as input to return an array of movies that are of that genre
//Helper function to the function, two functions above
function findRecommended(genre) {
    let recommended = [];

    let keys = Object.values(movies);
    for (elem in keys) {
        let curr_movObj = movies[elem];
        if (curr_movObj.genres.includes(genre)) {
            recommended.push(curr_movObj);
        }
    }
    
    return recommended;
}

/*
let something = retrieveMovie(1002);
console.log(something);
let something2 = retrieveMovie(1000);
console.log(something2);
*/

//Function to create a FULL review (means that they must be a c_user : contributing user)
//Assuming id for the review is predetermined and that is what will be assigned along with the new review object
//The ID - reviewID will be the same ID that's given to the users, movies, and reviews array and functions interprets reviewID as already valid
function createReview(userID, title, description, score, reviewID, movieID) {
    let user = getUserID(userID);
    let movie = getMovie(movieID);

    if (typeof(userID) !== "number" || typeof(reviewID) !== "number" || typeof(movieID) !== "number" || user === null || !(user.c_user)) {
        return null;
    }

    if (title.length <= 1 || description.length <= 5 || score < 0 || score > 100) {
        return null;
    }

    let newReview = {user:user.username,movieID:movieID,title:title,description:description,score:score};
    //Adding to the reviews array
    let keys = Object.keys(reviews);
    if (!(keys.includes(reviewID))) {
        reviews[reviewID] = newReview;
    }

    //Adding to the users reviews array
    if (!(user.review.includes(reviewID))) {
        user.review.push(reviewID);
    }

    //Adding to the movies review array
    movie.review.push(reviewID);

    return newReview;
}
//c_user(1000); --> won't do anything if the user creating the review isn't a c_user
//createReview(1000,"Your Name","idk much",10,3,0);
//console.log(users);
//console.log(reviews);
//console.log(movies);

//Helper function to get the movieID of a movie from the title
//Can be ignored if anything
function getMovieID(moviename) {
    let values = Object.values(movies);
    let movie = null;

    for (let i = 0; i < values.length; ++i) {
        if (values[i].title === moviename) {
            movie = values[i];
        }
    }

    let keys = Object.keys(movies);
    for (elem in keys) {
        if (movies[elem] === movie) {
            return elem;
        }
    }
    return null;

}
//console.log(getMovieID("A Silent Voic"));
//console.log(getMovieID("A Silent Voice"));

//Basic reviews won't be given any distinct functionality except for increasing the movie's # of ratings and increase or decrease the movie's rating
//depending on the value that's given as the score
//Gonna change this later of how the score alters the movie rating value, but for now it should be fine
function basicReview(score, movID) {
    let movie = getMovie(movID);
    movie.number_ratings += 1;

    if (score > 50 && movie.rating < 10) {
        movie.rating += 0.1;
    }
    if (score < 50 && movie.rating > 0) {
        movie.rating -= 0.1;
    }
}

//Function to access all reviews of movie when given a movieID;
function getReviews(movieID) {
    let movie = getMovie(movieID);
    let review_id_array = [];
    review_id_array = movie.review;

    let new_array = [];

    let keys = Object.keys(reviews);
    for (let i = 0; i < review_id_array.length; ++i) {
        for (let j = 0; j < keys.length; ++j) {
            if (review_id_array[i] == keys[j]) {
                new_array.push(reviews[keys[j]]);
            }
        }
    }
    return new_array;
}
//console.log(getReviews(0));

function getReviewsByUser(userID) {
    let user = getUserID(userID);
    let review_id_array = [];
    review_id_array = user.review;

    let new_array = [];

    let keys = Object.keys(reviews);
    for (let i = 0; i < review_id_array.length; ++i) {
        for (let j = 0; j < keys.length; ++j) {
            if (review_id_array[i] == keys[j]) {
                new_array.push(reviews[keys[j]]);
            }
        }
    }
    return new_array;
}

//Returns an array of all the movies that the person has been apart of and their ID is given in as a parameter
function getPersonWorks(personID) {
    let person = getPersonID(personID);
    if (person == null) {
        return null;
    }
    let movies_w_person = person.works;

    let array = [];

    let keys = Object.keys(movies);
    for (elem in keys) {
        for (movie_id in movies_w_person) {
            if (parseInt(elem) === parseInt(movie_id)) {
                array.push(movies[elem]);
            }
        }
    }
    return array;
}
//console.log(getPersonWorks(0));
//console.log(getPersonWorks(1));

//userID1 represents the one who followed userID2
function follow(userID1, userID2) {
    let user1 = getUserID(userID1);
    let user2 = getUserID(userID2);

    if (user1.following.includes(userID2)) {
        return;
    }
    if (user2.followers.includes(userID1)) {
        return;
    }

    user1.following.push(userID2);
    user2.followers.push(userID1);
}

follow(1000,1001);
follow(1001,1000);
//console.log(user1);
//console.log(user2);


//User 1 is representing the one who is unfollowing user2
function unfollow(userID1,userID2) {
    let user1 = getUserID(userID1);
    let user2 = getUserID(userID2);

    if (!(user1.following.includes(userID2)) || !(user2.followers.includes(userID1))) {
        return;
    }

    //No remove method, so gotta use slice :(
    for (let i = 0; i < user1.following.length; ++i) {
        if (user1.following[i] == userID2) {
            user1.following = user1.following.slice(i+1);
        }
    }

    for (let i = 0; i < user2.followers.length; ++i) {
        if (user2.followers[i] == userID1) {
            user2.followers = user2.followers.slice(i+1);
        }
    }
}
/*
unfollow(1000,1001);
console.log(user1);
console.log(user2);
*/

//Function to get all the followers of a user, when their ID is given as input
function getFollowers(userID) {
    let array = [];
    let user = getUserID(userID);
    let followers = user.followers;

    //In this case users is an array of objects and not an object itself
    for (let i = 0; i < users.length; ++i) {
        for (let j = 0; j < followers.length; j++) {
            if (users[i].id === followers[j]) {
                array.push(users[i]);
            }
        }
    }
    

    return array;
}
//console.log(getFollowers(1000));

function getFollowing(userID) {
    let array = [];
    let user = getUserID(userID);
    let following = user.following;

    //In this case users is an array of objects and not an object itself
    for (let i = 0; i < users.length; ++i) {
        for (let j = 0; j < following.length; j++) {
            if (users[i].id === following[j]) {
                array.push(users[i]);
            }
        }
    }
    

    return array;
}
//console.log(getFollowing(1000));

//For c_user, only they have the ability to update their score (basic users won't have that functionality)
function updateScore(userID, movieID, score) {
    let user = getUserID(userID);

    if (user === null) {
        return;
    }

    if (!(user.review.includes(movieID))) {
        return;
    }

    let keys = Object.keys(reviews);
    for (key in keys) {
        if (parseInt(key) === movieID) {
            reviews[key].score = score;
        }
    }
}
//updateScore(1000,0,20);
//console.log(reviews);

//Function that returns all of the USER'S reviews
function getUserReviews(userID) {
    let user = getUserID(userID);
    let user_reviews = user.review;

    let array = [];

    let keys = Object.keys(reviews);
    for (key in keys) {
        for (review in user_reviews) {
            if (key === review) {
                array.push(reviews[key]);
            }
        }
    }
    return array;
}
//console.log(getUserReviews(1000));

function getWorks(personName) {
    if (typeof personName != 'string' || personName.length == 0) {
        return null;
    }
    let array = [];
    let keys = Object.keys(movies);
    for (let i = 0; i < keys.length; ++i) {
        if (movies[keys[i]].actors.includes(personName) || movies[keys[i]].writers.includes(personName)) {
            array.push(keys[i]);
        }
    }
    return array;
}
//console.log(getWorks("Walter Matthau"));
//console.log(getMovie(5));

//console.log(getPerson("Walter Matthau"));
//console.log(getPersonID(getPerson("Walter Matthau")));

function movieByGenre(genre) {

    if (genre.length < 1) {
        return null;
    }

    let keys = Object.keys(movies);
    let movs = [];
    for (let i = 0; i < keys.length; ++i) {
        if (movies[keys[i]].genres.includes(genre)) {
            movs.push(movies[keys[i]]);
        }
    }

    return movs;
}
//console.log(movieByGenre("Action"));

function movieByYear(year) {
    if (year < 0 || year > 100000) {
        return null;
    }
    let keys = Object.keys(movies);
    let movs = [];
    for (let i = 0; i < keys.length; ++i) {
        if (movies[keys[i]].year == year) {
            movs.push(movies[keys[i]]);
        }
    }
    return movs;
}
//console.log(movieByYear(1994));

function movieByMinRating(rating) {
    if (rating < 0 || rating > 100) {
        return null;
    }
    let keys = Object.keys(movies);
    let movs = [];
    for (let i = 0; i < keys.length; ++i) {
        if (movies[keys[i]].rating >= rating) {
            movs.push(movies[keys[i]]);
        }
    }
    return movs;
}
//console.log(movieByMinRating(7));