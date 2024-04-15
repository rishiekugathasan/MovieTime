function logButton() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/login';
        }
    }
    xhttp.open("GET","/login",true);
    xhttp.send();
}

function signUpButton() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/signup';
        }
    }
    xhttp.open("GET","/signup",true);
    xhttp.send();
}