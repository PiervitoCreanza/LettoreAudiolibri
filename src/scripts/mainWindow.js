/* !!**** REQUIREMENTS *****!! */
const ipcRenderer = require( "electron" ).ipcRenderer;
const electron = require('electron');
const extract = require('extract-zip');
const remote = require('electron').remote;
var store = remote.getGlobal('store')
var userData = remote.getGlobal('userData');
const Mousetrap = require('mousetrap');
var fs = require('fs');
const userId= userData.get('userId');
const request = require('request')
window.$ = window.jquery = require('jquery')
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const downloading = new MyEmitter();


/* !!**** DEBUG CODE *****!! */
document.addEventListener("keydown", function (e) {
    if (e.which === 116) {
        require('remote').getCurrentWindow().toggleDevTools();
    } else if (e.which === 117) {
        location.reload();
    }
});

// Una volta modificato il contenuto della pagina la mostra
ipcRenderer.send('show-me');

/* !!**** PAGE CONTENT *****!! */
var userName = userData.get('name');
document.getElementById('hello').innerHTML = `Ciao ${userName},`


/* !!**** PATHS INITIALIZATION *****!! */
const path = require('path')
const base_path = (electron.app || electron.remote.app).getPath('userData');
const currentlyReadingPath = path.join(base_path, "currentlyReading");
const downloadedBookPath = path.join(base_path, "downloadedBooks");
const savedDataPath = path.join(base_path, "saved_data");
const documentsPath = (electron.app || electron.remote.app).getPath('documents');
const completedBooksPath = path.join(documentsPath, "Libri-Letti");
initializePath(currentlyReadingPath);
initializePath(downloadedBookPath);
initializePath(completedBooksPath);
if (initializePath(savedDataPath)) {
    firstRun()
};

function completedBook() {
    var files = fs.readdirSync(currentlyReadingPath)
        for (let file of files) {
            var oldPath = path.join(currentlyReadingPath, file)
            var newPath = path.join(completedBooksPath, file)
            fs.rename(oldPath, newPath)
        } 
        $.ajax({
            url: "https://api.lettoreaudiolibri.it",
            method: "POST",
            dataType: 'json',
            contentType: 'application/json',
            async: false,
            data: JSON.stringify({
                "action": "book-finished",
                "user_id": userId
            }),
        
            success: function(response) {
                data = response;
            }
        });
}


/* !!**** FUNCTIONS *****!! */

// check if path exists
function initializePath(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    } else {
        return true
    }
};

// first run
function firstRun() {
    // First run
};

// List files of specified type of a directory
function fromDir(startPath,filter){

    //console.log('Starting from dir '+startPath+'/');
    let fileList = []
    if (!fs.existsSync(startPath)){
        return;
    }

    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            fromDir(filename,filter); //recurse
        }
        else if (filename.indexOf(filter)>=0) {
            fileList.push(filename);
        };
    };
    return fileList;
};

// Get saves from the cloud
function cloud_saves() {
    if (navigator.onLine) {
        if ($.ajax({
            url: "https://api.lettoreaudiolibri.it",
            method: "POST",
            dataType: 'json',
            contentType: 'application/json',
            async: false,
            data: JSON.stringify({
                "action": "read-data",
                "user_id": userId
            }),
        
            success: function(response) {
                if (response) {
                    console.log("1")
                    data = response;
                    console.log(response)
                    console.log("c")
                    return true;
                } else {
                    console.log("2")
                    return false;
                }                
            },            
            error: _ => {
                console.log("3")
                return false;
            }
        })) {
            return true
        }
    } else {
        return false;
    }
};

// Get local saves
function local_saves() {
    if (fs.existsSync(path)) {
        data = require(savedDataPath);
        return true
    } else {
        return false;
    }
    
}
// Say a sentence
function say(msg) {
    var msg = new SpeechSynthesisUtterance(msg);
    speechSynthesis.speak(msg);
}

// Download books
var bookDownloading = false
function downloadFile(book_id , targetPath){
    // Save variable to know progress
    total_bytes = 0;
    received_bytes = 0;
    bookDownloading = true
    let downloadedBookPath = path.join(targetPath, book_id.toString())
    targetPath = downloadedBookPath + ".zip"

    var file_url = "https://api.lettoreaudiolibri.it/download.php?id=" + book_id
    var req = request({
        method: 'GET',
        uri: file_url
    });

    var out = fs.createWriteStream(targetPath);
    req.pipe(out);    

    downloading.on('status', function() {

    });

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
        extract(targetPath, { dir: downloadedBookPath }, function (err) {
            fs.unlink(targetPath);
         });
        $.ajax({
        url: "https://api.lettoreaudiolibri.it",
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        async: false,
        data: JSON.stringify({
            "action": "book-downloaded",
            "user_id": userId,
            "book_id": data.queued_book_id
        }),
    
        success: function(response) {
            console.log(response);
        }    
        });
        bookDownloading = false
        document.dispatchEvent(new CustomEvent("download-completed"));
    });
}

// List directories inside directory
function getDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
      return fs.statSync(path+'/'+file).isDirectory();
    });
  }

// Organize book
function bookOrganizer() {       
    dirList = getDirectories(downloadedBookPath);
    function main() {
        
        let dir = path.join(downloadedBookPath, dirList[0])
        var files = []
        var files = fs.readdirSync(dir)
    
        console.log(files)
        for (let file of files) {
            var oldPath = path.join(dir, file)
            var newPath = path.join(currentlyReadingPath, file)
            fs.rename(oldPath, newPath)
        } 
        fs.rmdirSync(dir);

        $.ajax({
            url: "https://api.lettoreaudiolibri.it",
            method: "POST",
            dataType: 'json',
            contentType: 'application/json',
            async: false,
            data: JSON.stringify({
                "action": "update-book",
                "user_id": userId,
                "book_id": dir,
                "chapter": "1",
                "deprecated": "False"
            }),
        
            success: function(response) {
            }    
        });
    }    
    if (dirList.length > 0) {
        main()        
    } else {
        if (bookDownloading == true) {
            while (bookDownloading == false) {}
            main()
        } else {
            say("Non c'è nessun libro in coda, chiedi a qualcuno di aggiungerlo")        
        }
        
    }
}

// say and close app
function sayBye(testo) {
    var speech = new SpeechSynthesisUtterance(testo); 
    speech.onend = close
    speechSynthesis.speak(speech);
}

/* !!**** START *****!! */
var data 


var pvInternet = userData.get('internetConnection')
console.log(pvInternet)
if (pvInternet) {
    if (!local_saves()) {
        say("Si è verificato un problema, alcuni progressi potrebbero essere andati persi");
        if (!cloud_saves()) {
            sayBye("Impossibile continuare, verifica la tua connessione ad internet e riprova");    
        }
    }
} else {
    if (!cloud_saves()) {
        say("Nessuna connessione ad internet, alcune funzioni sono state disabilitate, si prega di ripristinare la connessione al più presto"); 
        if (!local_saves()) {
            sayBye("Impossibile continuare, verifica la tua connessione ad internet e riprova");
        }
    }
}


if (data.error == "queue empty") {
    sayBye("La coda di lettura è vuota, chiedi a qualcuno di aggiungere un libro");
} else {
    if (data.queued_book_id) {
        var received_bytes
        var total_bytes
        downloadFile(data.queued_book_id, downloadedBookPath);
            /*downloading.emit("status") */
    }
    if (data.deprecated == "None") {
        say("A quanto pare oggi cominceremo un nuovo libro. Attendi mentre viene elaborato. L'operazione potrebbe richiedere un po' di tempo.")
        console.log("New book")
        data.deprecated = "False"
        bookOrganizer()
        

    }

    if (data.deprecated == "True") {
        completedBook()
        bookOrganizer()
    }

    
    
    var chapterList = fromDir(currentlyReadingPath,'.mp3');
    var bookPath = chapterList[data.chapter]
    console.log(bookPath)
    console.log(chapterList)
    console.log("ciao")
    ipcRenderer.send('open-audio-player', data, bookPath);

    
}



// **** Listeners ****
function quit() {
    ipcRenderer.send('quit');    
};

// downlaod finished
document.addEventListener("download-completed", function() {
  });

ipcRenderer.on('reading-finished', function() {
    say("Hai completato il capitolo numero " + data.chapter);
    data.chapter += 1;
    userData.set('chapter', data.chapter)
    $.ajax({
        url: "https://api.lettoreaudiolibri.it",
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        async: false,
        data: JSON.stringify({
            "action": "update-book",
            "user_id": userId,
            "book_id": data.book_id,
            "chapter": data.chapter,
            "deprecated": data.deprecated
        }),
    
        success: function(response) {
            data = response;
        }
    });
    
    if (data.chapter == data.total_chapters) {
        console.log("libro terminato")
        $.ajax({
            url: "https://api.lettoreaudiolibri.it",
            method: "POST",
            dataType: 'json',
            contentType: 'application/json',
            async: false,
            data: JSON.stringify({
                "action": "book-finished",
                "user_id": userId
            }),
        
            success: function(response) {
                data = response;
            }
        });
        say("Complimenti, hai terminato il libro! Ti è piaciuto?")
    } else {
        say("Ti rimangono " + (data.total_chapters - data.chapter) + " capitoli")
        say("se vuoi continuare la lettura premi la barra spaziatrice, altrimenti mi spegnerò tra un minuto")
    
        var is_fired = false;        
        Mousetrap.bind('space', function() { 
            if (!is_fired) {
                // Bug di electron, se si preme spazio e si invia subito un ipc send impazzisce il cursore
                setTimeout(function (){
                    window.speechSynthesis.cancel();
                    var bookPath = chapterList[data.chapter]
                    ipcRenderer.send('open-audio-player', data, bookPath);
                  }, 1); 
                is_fired = true
            }
            
        });

        

    }
});
