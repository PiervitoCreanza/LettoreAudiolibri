module.exports = function cloud_saves() {
    $.ajax({
        url: "https://api.lettoreaudiolibri.it",
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            "action": "read-data",
            "user_id": user_id
        }),
    
        success: function(response) {
            data = response
        }    
    });
}

export function local_saves() {
    data = require(saved_data_path)
}


export function say(msg) {
    var msg = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(msg);
}

export function downloadFile(book_id , targetPath){
    // Save variable to know progress
    total_bytes = 0;
    received_bytes = 0;

    var file_url = "https://api.lettoreaudiolibri.it/download.php?id=" + book_id
    var req = request({
        method: 'GET',
        uri: file_url
    });

    var out = fs.createWriteStream(targetPath);
    req.pipe(out);

    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
    });

    req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;
    });

    req.on('end', function() {
        console.log("Download completed")
    });
}

export function book_organizer () {
    
}