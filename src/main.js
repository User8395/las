const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "/html/js/preload.js")
    }
  })

  win.loadFile("./html/index.html")

  // function controlWindow() {
    ipcMain.on("windowControl", (_event, data) => {
      switch (data) {
        case "minimize":
          win.minimize()
          break;
        case "maximize":
          if (!win.isMaximized()) {
            win.maximize()
            win.webContents.send("isMaximized", true)
          } else {
            win.unmaximize()
            win.webContents.send("isMaximized", false)
          }
          break;
        case "close":
          win.close()
          break;
      }
    })
// }
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
