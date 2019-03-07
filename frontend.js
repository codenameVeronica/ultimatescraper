const electron = require("electron");
const {app} = electron;

const {BrowserWindow} = electron;
const {dialog} = electron;
const {ipcMain} = electron;

let win;


function createWindow()
{
    win = new BrowserWindow({width: 1024, height: 768, fullscreen: false, frame: false, show: false});
    win.once("ready-to-show", function(){win.show(); /*win.webContents.openDevTools();*/})

    var url = 'file://' + __dirname + '/frontend.html';
    //dialog.showMessageBox({message: url, buttons: []});
    win.loadURL(url);
    //win.webContents.openDevTools();
}


app.on("ready", createWindow);