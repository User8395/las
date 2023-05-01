const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowControl", {
  send: (data) => ipcRenderer.send("windowControl", data),
  receive: (data) => ipcRenderer.on("isMaximized", data),
});

contextBridge.exposeInMainWorld("sources", {
  get: () => ipcRenderer.send("getSources"),
  receive: (data) => ipcRenderer.on("apps", data)
})

contextBridge.exposeInMainWorld("appList", {
  get: () => ipcRenderer.send("getAppList"),
  receive: (data) => ipcRenderer.on("appList", data)
})

contextBridge.exposeInMainWorld("appInfo", {
  get: (data) => ipcRenderer.send("getAppInfo", data),
  receive: (data) => ipcRenderer.on("appInfo", data)
})