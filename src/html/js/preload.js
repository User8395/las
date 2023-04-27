const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowControl", {
  send: (data) => ipcRenderer.send("windowControl", data),
  receive: (data) => ipcRenderer.on("isMaximized", data),
});

contextBridge.exposeInMainWorld("apps", {
  get: () => ipcRenderer.send("getApps"),
  receive: (data) => ipcRenderer.on("apps", data)
})