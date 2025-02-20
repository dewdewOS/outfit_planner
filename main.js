const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let cameraWindow;

app.whenReady().then(() => {
  // Create the main application window
  mainWindow = new BrowserWindow({
    width: 400,
    height: 790,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Ensure IPC communication works
    }
  });

  // Load the main index.html
  mainWindow.loadFile('signup.html');

  // Create a camera window when requested
  ipcMain.on('open-camera', () => {
    if (!cameraWindow) {
      cameraWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        }
      });

      // Load the camera.html file
      cameraWindow.loadFile('camera.html');

      // Handle window close event
      cameraWindow.on('closed', () => {
        cameraWindow = null;
      });
    }
  });

  // Save the captured image when the event is received
  ipcMain.on('save-image', (event, photoDataUrl) => {
    // Convert Base64 to binary data
    const base64Data = photoDataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Define the save path (you can change it if needed)
    const savePath = path.join(app.getPath('pictures'), 'captured_photo.jpg');

    // Save the image to disk
    fs.writeFile(savePath, imageBuffer, (err) => {
      if (err) {
        console.error('Error saving image:', err);
      } else {
        console.log('Image saved successfully to:', savePath);
      }
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


