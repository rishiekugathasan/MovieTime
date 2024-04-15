const { response } = require("express");

let users = [{username:"Example_user",password:"Example_pass",c_user:false,followers:[],following:[]}]

function check() {
    let userName = document.getElementById("username").value;
    let passWord = document.getElementById("password").value;
    
    let object = {};
    object[userName] = passWord;
    sendInfo(object);
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

function sendInfo(userpassobject) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
        }
    }
    xhttp.open("POST","/loginfo",true);
    xhttp.setRequestHeader('Content-Type','application/json');
    xhttp.send(JSON.stringify(userpassobject));
}