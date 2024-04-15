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