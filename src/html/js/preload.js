const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowControl", {
  send: (data) => ipcRenderer.send("windowControl", data),
  receive: (data) => ipcRenderer.on("isMaximized", data),
});
