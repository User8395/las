const { app, BrowserWindow, ipcMain } = require("electron");
const https = require("https");
const fs = require("fs");
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

function log(val) {
  console.log(`INFO ${val}`);
}
function warn(val) {
  console.warn(`WARN ${val}`);
}
function error(val) {
  console.error(`ERROR ${val}`);
}

log("Starting LAS v0.0.1...");
warn("This is a development version of LAS.");
warn("Please report bugs on GitHub at https://github.com/User8395/las/issues");

function download(url) {
  execSync(`wget ${url} -P ${lasdir}/temp`, { stdio: "pipe"});
}

function getSources() {
  log("Refreshing sources...");
  let sourcesFile = JSON.parse(readFileSync(`${lasdir}/sources.json`));
  let sources = sourcesFile.sources;
  log("Removing old sourcefiles...");
  rmdirSync(`${lasdir}/sourcefiles`, { recursive: true, force: true });
  mkdirSync(`${lasdir}/sourcefiles`);
  log("Downloading sourcefiles...");
  for (let i = 0; i < sources.length; i++) {
    if (sources[i].indexOf("github") > -1) {
      download(`${sources[i]}/raw/master/info.json`);
      download(`${sources[i]}/raw/master/apps.json`);
    } else {
      download(`${sources[i]}/info.json`);
      download(`${sources[i]}/apps.json`);
    }
    log("Moving new sourcefiles...");
    mkdirSync(`${lasdir}/sourcefiles/${i}`);
    renameSync(
      `${lasdir}/temp/info.json`,
      `${lasdir}/sourcefiles/${i}/info.json`
    );
    renameSync(
      `${lasdir}/temp/apps.json`,
      `${lasdir}/sourcefiles/${i}/apps.json`
    );
    log("Cleaning up...");
    rmdirSync(`${lasdir}/temp/`, { recursive: true, force: true });
    log("Done");
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

  ipcMain.on("getAppList", function () {
    let arraylength = JSON.parse(readFileSync(`${lasdir}/sources.json`)).sources.length;
    let allapps = [];
    for (let i = 0; i < arraylength; i++) {
      let apps = JSON.parse(readFileSync(`${lasdir}/sourcefiles/${i}/apps.json`)).apps
      log(apps)
      apps.forEach(function (item) {
        allapps.push(item);
      });
    }
    win.webContents.send("appList", allapps)
  });

  ipcMain.on("getSources", (_event) => {
    win.webContents.send("apps", getSources());
  });
}

app.whenReady().then(() => {
  log("Creating window...");
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  log("Quitting LAS...");
  if (process.platform !== "darwin") {
    app.quit();
  }
});
