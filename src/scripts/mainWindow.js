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



/* !!**** FUNCTIONS *****!! */


// first run
function firstRun() {
    // First run
};

// Say a sentence
function say(msg) {
    var msg = new SpeechSynthesisUtterance(msg);
    speechSynthesis.speak(msg);
}


// say and close app
function sayBye(testo) {
    var speech = new SpeechSynthesisUtterance(testo); 
    speech.onend = close
    speechSynthesis.speak(speech);
}


function sayCall(msg, callback) {
    var msg = new SpeechSynthesisUtterance(msg);
    speechSynthesis.speak(msg);
    callback()
}

function closeApp() {
    sayPromise("Mi spengo subito").then(
        () => ipcRenderer.send('quit-main')
    );    
};

function checkSpace(timeout) {
    var is_fired = false;        
    Mousetrap.bind('space', function() { 
        if (!is_fired) {
            // Bug di electron, se si preme spazio e si invia subito un ipc send impazzisce il cursore
            setTimeout(function (){
                window.speechSynthesis.cancel();
                read(userId)
            }, 1); 
            is_fired = true
        }                
    });   
    setTimeout(function() {
        sayBye("Mi spengo subito")
        ipcRenderer.send('quit-main')
        console.log("quitting")
    }, timeout)
}

function sayPromise (text) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
    return new Promise(resolve => {
        const id = setInterval(() => {
        if (speechSynthesis.speaking === false) {
            clearInterval(id);
            resolve();
        }
        }, 100);
    });
};
  

/* !!**** START *****!! */

const read = (userId) => {
    $.ajax({
        url: "https://webhook.lettoreaudiolibri.it/app.php",
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        async: false,
        data: JSON.stringify({
            "queryResult": {
                "intent": {
                    "displayName": "read",
                    "userId": userId
                }
            }
        }),
    
        success: function(response) {
            if (response) {
                textToSpeech = response.payload.google.richResponse.items[0].simpleResponse.textToSpeech;
                if (response.payload.google.richResponse.items[1]) {
                    media = response.payload.google.richResponse.items[1].mediaResponse.mediaObjects[0];
                    sayPromise(textToSpeech).then(
                        () => ipcRenderer.send('open-audio-player', {name: media.name, description: media.description}, media.contentUrl)
                    );                    
                } else {
                    // Says error and close the app
                    sayPromise(textToSpeech).then(
                            ()=> closeApp()
                    )
                }
            } else {
                sayPromise('Non posso connettermi ad internet, verifica la tua connessione.').then(
                    () => closeApp()
                )
            }    
            
            
        }
    });
}


read(userId)



ipcRenderer.on('reading-finished', function() {
    $.ajax({
        url: "https://webhook.lettoreaudiolibri.it/app.php",
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        async: false,
        data: JSON.stringify({
            "queryResult": {
                "intent": {
                    "displayName": "readingCompleted",
                    "userId": userId
                }
            }
        }),
    
        success: function(response) {
            console.log(response)
            if (response) {
                textToSpeech = response.payload.google.richResponse.items[0].simpleResponse.textToSpeech;

                if (textToSpeech.includes('hai terminato il libro')) {
                    sayPromise(textToSpeech)
                    closeApp();
                } else {
                    sayPromise(textToSpeech).then(
                        () => say("Se sì premi spazio, altrimenti mi spegnerò tra un minuto.")
                    )                    
                    checkSpace(60000);
                }
            } else {
                sayPromise('Non posso connettermi ad internet, verifica la tua connessione.').then(
                    () => closeApp()
                )
            }      
                
                
        }
    });
})
