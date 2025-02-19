const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 560,
    height: 710,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile('index.html');
});

