let submit = document.getElementById("submit");
submit.addEventListener("click", clarify);

function clarify() {
    let name = document.getElementById("new_user").value; 
    let pass = document.getElementById("new_pass").value;
    let confirmed_pass = document.getElementById("confirm").value; 
    let terms_of_service = document.getElementById("ToS").checked;
    
    if (pass != confirmed_pass) {
        alert("You must confirm your password properly!");
    }
    else if (!terms_of_service) {
        alert("You must accept terms of service!");
    }
    else if (name.length <= 1 || pass.length <= 1) {
        alert("You entries need to be longer!");
    }
    else {
        let newUser = {id:1003,username:name,password:pass,c_user:false,followers:[],following:[],review:[],recommended:[],movieswatched:[]}
        sendInfo(newUser);
        alert("Proile made!");
    }
}

function checkUser() {
    let name = document.getElementById("new_user").value;
    for (let i = 0; i < users.length; i++) {
        if (users[i].username == name) {
            alert("You can't use this name, someone already has it.");
        }
    }
}

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

function sendInfo(newUser) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            logButton();
        }
    }
    xhttp.open("POST","/info",true);
    xhttp.setRequestHeader('Content-Type','application/json');
    xhttp.send(JSON.stringify(newUser));
}