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

function moviePage() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/movie';
        }
    }
    xhttp.open("GET","/movie",true);
    xhttp.send();
}

function c_userRequest() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = window.location.href;
        }
    }
    xhttp.open("GET","/c_user",true);
    xhttp.send();
    alert("Upgrade request sent")
}