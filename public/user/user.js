function sendFollowRequest() {
    let id = window.location.href.substring(27);

    let followText = document.getElementById("follow").innerHTML;

    let obj = {toFollow:id,followText:followText};

    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            if (followText == 'Follow') {
                document.getElementById("follow").innerHTML = 'Unfollow';
            }else {
                document.getElementById("follow").innerHTML = 'Follow';
            }
        }
    }
    xhttp.open("POST","/followrequest",true);
    xhttp.setRequestHeader('Content-Type','application/json')
    xhttp.send(JSON.stringify(obj));
    alert("Request sent.");
}