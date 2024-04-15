//Potential attribute to user (reviews array) - not decided yet though
let submitButton = document.getElementById("submit");
submitButton.addEventListener("click",addReview);

function addReview() {
    let review_title = document.getElementById("title").value;
    let review_description = document.getElementById("desc").value;
    let review_score = document.getElementById("score").value;
    let movName = document.getElementById("movietitle").value;

    if (review_title.length > 1 && review_description.length > 1 && review_score >= 0 && review_score <= 100 && movName.length > 1) {
        let userID = window.location.href.substring(34);
        let newReview = {title:review_title,description:review_description,score:review_score,userID:userID,movietitle:movName};
        sendReview(newReview);
        alert('Review sent');
    }else {
        alert("Not enough information or wrong information!");
    }
}
function sendReview(review) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
        }
    }
    xhttp.open("POST","/writereview/:id",true);
    xhttp.setRequestHeader('Content-Type','application/json');
    xhttp.send(JSON.stringify(review));
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

function socialButton() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            window.location.href = '/social';
        }
    }
    xhttp.open("GET","/social",true);
    xhttp.send();
}