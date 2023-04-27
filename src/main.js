// Function Imports (DO NOT MODIFY)
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { mkdirSync, rmdirSync, readFileSync, writeFileSync, existsSync } = require("fs")
const homedir = require("os").homedir()
const { execSync } = require("child_process")

if (!existsSync(homedir + "/.las/")) {
  mkdirSync(homedir + ".las/")
  mkdirSync(homedir + ".las/apps/")
  writeFileSync(homedir + ".las/sources.json", {
    "hello-world": "na"
  })
  writeFileSync(homedir + ".las/installed.json", {})
}

function getPackages() {
  
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "/html/js/preload.js"),
    },
  });

  win.loadFile("./src/html/loading.html");

  ipcMain.on("windowControl", (_event, data) => {
    console.log(data);
    switch (data) {
      case "minimize":
        win.minimize();
        break;
      case "maximize":
        if (!win.isMaximized()) {
          win.maximize();
          win.webContents.send("isMaximized", true);
        } else {
          win.unmaximize();
          win.webContents.send("isMaximized", false);
        }
        break;
      case "close":
        win.close();
        break;
    }
  });

  ipcMain.on("getApps", (_event) => {
    win.webContents.send("packages", getPackages());
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
