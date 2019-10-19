
window.$ = window.jquery = require('jquery')

function cloud_saves() {
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

function local_saves() {
    data = require(saved_data_path)
}


function say(msg) {
    var msg = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(msg);
}

function downloadFile(book_id , targetPath){
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

function book_organizer () {
    
}

const path = require('path')
const base_path= path.join(require('os').homedir(), 'Library/Application Support/Lettore_Audiolibri')
const saved_data_path = path.join(base_path, "saved_data/saved_data.json")
const local_data_path = path.join(base_path, "saved_data/local_data.xml")
const currently_reading_path = path.join(base_path, "Currently_reading")

const user_id = 1

let internet_connection = true
let first_run_ = false
let local_data_internet_connection = "False"
var data


var internet_connection = navigator.onLine;

if (local_data_internet_connection == "True") {
    local_saves()
} else {
    if (internet_connection == true) {
        cloud_saves()
    } else {
        try {
            local_saves()
        } catch (error) {
            say("Per continuare è necessaria una connessione ad internet, impossibile procedere")
        }        
    }
}

say("Nessuna connessione ad internet, alcune funzioni sono state disabilitate, si prega di ripristinare la connessione al più presto")


if (data.error == "queue empty") {
    say("La coda di lettura è vuota, chiedi a qualcuno di aggiungere un libro")
} else {

    if (data.queued_book_id != null) { // Check if null is ok
        var received_bytes
        var total_bytes
        downloadFile(book_id, book_path);
    }

    if (data.deprecated == "None") {
        say("A quanto pare oggi cominceremo un nuovo libro. Attendi mentre viene elaborato. L'operazione potrebbe richiedere un po' di tempo.")
        console.log("New book")
        data.deprecated = "False"
        try {
            book_organizer()
        } catch (error) {
            downloadFile(() => 
            book_organizer() 
            )
        }
        

    }
    
}