let users = [{username:"Example_user",password:"Example_pass",c_user:false,followers:[],following:[]}];

/*
    Change the list of friends to inputs (checkbox), so user can remove them from their social page instead 
    of going onto their individual page to unfollow.
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