const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 400,
    height: 780,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile('index.html');
});

