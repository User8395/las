const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("restart", {
  send: () => ipcRenderer.send("restart")
})

contextBridge.exposeInMainWorld("log", {
  send: (data1, data2) => ipcRenderer.send("rendererLog", data1, data2)
})

contextBridge.exposeInMainWorld("windowControl", {
  send: (data) => ipcRenderer.send("windowControl", data),
  receive: (data) => ipcRenderer.on("isMaximized", data),
});

contextBridge.exposeInMainWorld("index", {
  get: () => ipcRenderer.send("downloadIndex"),
  receive: (data) => ipcRenderer.on("index", data)
})

contextBridge.exposeInMainWorld("appInfo", {
  get: (data) => ipcRenderer.send("getAppInfo", data),
  receive: (data) => ipcRenderer.on("appInfo", data)
})

contextBridge.exposeInMainWorld("getQueue", {
  get: () => ipcRenderer.send("getQueue"),
  receive: (data) => ipcRenderer.on("queue", data)
})

contextBridge.exposeInMainWorld("installed", {
  get: () => ipcRenderer.send("getInstalled"),
  receive: (data) => ipcRenderer.on("installedApps", data)
})

contextBridge.exposeInMainWorld("queue", {
  send: (data, extradata) => ipcRenderer.send("queueApp", data, extradata)
})


contextBridge.exposeInMainWorld("performOperations", {
  send: () => ipcRenderer.send("performOperations")
})