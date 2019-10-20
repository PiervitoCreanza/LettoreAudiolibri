const electron = require('electron');
const {app, BrowserWindow, Menu, dialog} = electron;
const url = require('url');
const path = require('path');
const Store = require('./src/functions/store');
const ipc = require('electron').ipcMain

let mainWindow;
let audioPlayer;

// First instantiate the class
global.store = new Store({
    // We'll call our data file 'user-preferences'
    configName: 'saved-data',
    defaults: {
      userId: undefined
    }
  });

global.userData = new Store({
// We'll call our data file 'local-data'
configName: 'local-data',
defaults: {
    errors: {
        internetConnection: false
    },
    userData: {
        userId: undefined,
        name: 'Piervito', // Should be undefined
        surname: undefined,
        birthday: undefined,
    },
    stats: {
        runs: 1,
        completedBooks: undefined
    }    
}
});



// Listen for app to be ready
app.on('ready', function() {
    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);

    const userId = userData.get('userId');
    if (!userId) {
        open_login_window()
    } else {
        open_mainWindow()
    }
});

function open_mainWindow() {
    mainWindow = new BrowserWindow({
        backgroundColor: '#172234',
        width: 800,
        height: 630,
        titleBarStyle: 'hidden',
        });
        //mainWindow.webContents.openDevTools();
        // mainWindow.setFullScreen(true)
        // Load html into window
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'src/pages/mainWindow.html'),
            protocol: 'file:',
            slashes: true     
            
        }));

        ipc.on('show-me', _ => {
            mainWindow.show();
        });

        /* Wait for page to be fully loaded before displaying it
        mainWindow.webContents.on('did-finish-load', function() {
            mainWindow.show();
        }); 
        
    
         inviare informazioni alla finestra

    var userName = store.get('userName');
    mainWindow.webContents.on('dom-ready', () => {
        mainWindow.webContents.send('userName', userName)
        mainWindow.webContents.send('user-data', store)
    }) */
}


// handle creare addwindow
function openAudioPlayer(){
    audioPlayer = new BrowserWindow({
        backgroundColor: '#172234',
        titleBarStyle: 'hidden',
        width: 480,
        height: 200,
    });
    audioPlayer.setAlwaysOnTop(true);
    audioPlayer.setResizable(false);
    //audioPlayer.webContents.openDevTools();
    // Load html into window
    audioPlayer.loadURL(url.format({
        pathname: path.join(__dirname, 'src/pages/audio-player.html'),
        protocol: 'file:',
        slashes: true
    }));
 /*
    audioPlayer.on('close', (e) => {
        audioPlayer.webContents.send('closing-you');       
      });*/
}

function open_login_window(){
    loginWindow = new BrowserWindow({
        backgroundColor: '#172234',
        titleBarStyle: 'hidden',
        width: 500,
        height: 730,
    });
    loginWindow.setResizable(false);
    //loginWindow.webContents.openDevTools();
    // Load html into window
    loginWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'src/pages/userLogin.html'),
        protocol: 'file:',
        slashes: true
    }));

}
// Create menu template
const mainMenuTemplate = [
    {
        label: 'Lettore Audiolibri',
        submenu: [
            {label: 'Info su LettoreAudiolibri ...'},
            {
                label: 'Esci da LettoreAudiolibri',
                accelerator: process.platform == 'darwin' ? 'Command+Q' :
                'Ctrl+Q',
                click(){
                    app.quit();
                }
        }]
    },
    { 
        label: "File",
        submenu: [
            {
                label: "login",
                click() {
                    open_login_window();
                }
            },
            {
            label: "Chiudi finestra",
            accelerator: process.platform == 'darwin' ? 'Command+W' :
            'Ctrl+W',
            click() {
                try {
                    audioPlayer.close()
                } catch (error) {
                    console.log("already closed")
                }
            }
        }

        ]
    },
    {
        label: 'Controlli',
        submenu: [
            {
                label: 'Avvio',
                accelerator: '+',
                click(){
                    openAudioPlayer();
                }
            }
        ]
    }
];

ipc.on('open-audio-player', function(event, data, bookPath) {
    openAudioPlayer();
    audioPlayer.webContents.on('dom-ready', () => {
        audioPlayer.webContents.send('read-this', data, bookPath)
    })
});

ipc.on('reading-finished', function() {
    audioPlayer.close();
    mainWindow.webContents.send('reading-finished')
});

ipc.on('login-user-id', (event, userId) => {
    userData.set('userId', userId);
    const options = {
        type: 'question',
        buttons: ['No, grazie', 'Si, certo'],
        defaultId: 1,
        title: 'Question',
        message: 'Vuoi che inizi subito la lettura?',
        detail: 'Se accetti mi mettterò immediatamente al lavoro.',
      };
    
      dialog.showMessageBox(null, options, (response, checkboxChecked) => {
        if (response == 1) {
            open_mainWindow();
        } else if (response == 0) {
            app.quit();
        }
      });
    loginWindow.close()
});

ipc.on('quit-main', function(){
    app.quit()
});

ipc.on('quit', function() {
    const options = {
        type: 'question',
        buttons: ['Si, certo', 'No, annulla'],
        defaultId: 0,
        title: 'Question',
        message: 'Sei sicuro di voler uscire?',
        detail: 'Tutti i progressi non salvati andranno persi.',
      };
    
      dialog.showMessageBox(null, options, (response, checkboxChecked) => {
        if (response == 0) {
            app.quit()
        }
      });    
});