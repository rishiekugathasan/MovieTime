let movies = [];

/*
    Movie object will have 
    - genre (array)
    - similar_movs (array)
    - staff (array)
    - year (int)
    - rating (int)
    - runtime(int)
*/

function homeButton() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/home';
        }
    }
    xhttp.open("GET","/home",true);
    xhttp.send();
}

function profileButton() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/user';
        }
    }
    xhttp.open("GET","/user",true);
    xhttp.send();
}

function reviewButton() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/review';
        }
    }
    xhttp.open("GET","/review",true);
    xhttp.send();
}

function personPage() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/person';
        }
    }
    xhttp.open("GET","/person",true);
    xhttp.send();
}