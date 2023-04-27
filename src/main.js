// Function Imports (DO NOT MODIFY)
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  mkdirSync,
  rmdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  renameSync,
} = require("fs");
const { execSync } = require("child_process");
const lasdir = require("os").homedir() + "/.las";

if (!existsSync(`${lasdir}`)) {
  mkdirSync(`${lasdir}`);
  mkdirSync(`${lasdir}/apps/`);
  mkdirSync(`${lasdir}/sourcefiles/`);
  mkdirSync(`${lasdir}/temp/`);
  writeFileSync(
    `${lasdir}/sources.json`,
    JSON.stringify(
      {
        sources: ["https://github.com/User8395/example-las-source"],
      },
      null,
      2
    )
  );
  writeFileSync(`${lasdir}/installed.json`, JSON.stringify({}, null, 2));
  writeFileSync(`${lasdir}/applist.json`, JSON.stringify({}, null, 2));
}

function getApps() {
  let sourcesFile = JSON.parse(readFileSync(`${lasdir}/sources.json`));
  let sources = sourcesFile.sources;
  rmdirSync(`${lasdir}/sourcefiles`, { recursive: true, force: true });
  mkdirSync(`${lasdir}/sourcefiles`);
  for (let i = 1; i <= sources.length; i++) {
    execSync(`git clone ${sources[i - 1]} ${lasdir}/temp/`);
    unlinkSync(`${lasdir}/temp/LICENSE`);
    unlinkSync(`${lasdir}/temp/README.md`);
    mkdirSync(`${lasdir}/sourcefiles/${i}`);
    renameSync(
      `${lasdir}/temp/info.json`,
      `${lasdir}/sourcefiles/${i}/info.json`
    );
    renameSync(
      `${lasdir}/temp/apps.json`,
      `${lasdir}/sourcefiles/${i}/apps.json`
    );
    rmdirSync(`${lasdir}/temp/`, { recursive: true, force: true });
  }
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
    win.webContents.send("apps", getApps());
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
