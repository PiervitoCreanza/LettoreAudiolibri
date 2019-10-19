/* !!**** REQUIREMENTS *****!! */
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

/* !!**** START *****!! */

$.ajax({
    url: "https://webhook.lettoreaudiolibri.it",
    method: "POST",
    dataType: 'json',
    contentType: 'application/json',
    async: false,
    data: JSON.stringify({
        "queryResult": {
            "intent": {
                "displayName": "read"
            }
        }
    }),

    success: function(response) {
        console.log(response)
    }
});