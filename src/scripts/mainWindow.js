/* !!**** REQUIREMENTS *****!! */
const ipcRenderer = require( "electron" ).ipcRenderer;
const remote = require('electron').remote;
var userData = remote.getGlobal('userData');
const Mousetrap = require('mousetrap');
const userId= userData.get('userId');
window.$ = window.jquery = require('jquery')

// Required constants
const welcomeMessages = ['come va?', 'tutto bene?', 'oggi ti trovo bene', 'spero vada tutto bene', 'io sto bene e tu?', 'che bello poter trascorrere del tempo insieme']
const sentences = ['Ti ho già detto che mi piace molto leggere?', 'Non vedo lora dicontinuare a leggere!', 'Finalmente leggiamo qualcosa!', 'Questo libro mi sta appassionando', 'Che bel libro che stiamo leggendo!']

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

function closeApp() { // Close the app
    sayPromise("Mi spengo subito").then(
        () => ipcRenderer.send('quit-main')
    );    
};

function checkSpace(timeout) { // Check space press with timeout
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
        closeApp();
    }, timeout)
}

function sayPromise (text) { // Say text with promise
    say(text)
    return new Promise(resolve => {
        const id = setInterval(() => {
        if (speechSynthesis.speaking === false) {
            clearInterval(id);
            resolve();
        }
        }, 100);
    });
};

const randomItem = (list) => { // Pick random item from list
    return list[Math.floor(Math.random()*list.length)];
}

const welcomeUser = () => { // Produces a random welcome message
    //Get random element 
    var randomWelcome = randomItem(welcomeMessages);
    var randomSentence = randomItem(sentences);

    var d = new Date(); // Get date
    var h = d.getHours(); // Get hour

    switch (true) { // Choose what word to sat based on day hour
        case (h <13): 
            welcome = 'Buongiorno';    
            break;

        case (13<h<17):
            welcome = 'Buon pomeriggio'; 
            break;
        case (h>17):
            welcome = 'Buonasera'; 
            break;
    }
    return `${welcome} ${userName}. ${randomWelcome}. ${randomSentence}`; // Ruturn the sentence
}

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
                        () => say("Se si premi spazio, altrimenti mi spegnerò tra un minuto.")
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

/* !!**** START *****!! */
//Modify the page content
var userName = userData.get('name');
document.getElementById('hello').innerHTML = `Ciao ${userName},`
ipcRenderer.send('show-me'); // Una volta modificato il contenuto della pagina la mostra

// Welcome the user
sayPromise(welcomeUser()).then(
    () => read(userId) // Start reading
);
