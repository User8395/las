/*
  I see you want to take a look at the LAS source code.
  However, there are no code explanations yet.
  Your only option is to try and figure out the code manually.
  Sorry...
*/

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
  appendFileSync,
} = require("fs");
const { execSync } = require("child_process");
const lasdir = require("os").homedir() + "/.las";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

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
  writeFileSync(
    `${lasdir}/settings.json`,
    JSON.stringify(
      {
        maximized: false,
      },
      null,
      2
    )
  );
  writeFileSync(`${lasdir}/installed.json`, JSON.stringify({}, null, 2));
  writeFileSync(`${lasdir}/applist.json`, JSON.stringify({}, null, 2));
}

function info(val) {
  console.log(`INFO ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `INFO ${val}\n`);
}
function warn(val) {
  console.warn(`WARN ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `WARN ${val}\n`);
}
function error(val) {
  console.error(`ERROR ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `ERROR ${val}\n`);
}

mkdirSync(`${lasdir}/temp`);

info("Starting LAS v0.0.1...");
warn("This is a development version of LAS.");
warn("Please report bugs on GitHub at https://github.com/User8395/las/issues");

function download(url) {
  try {
    execSync(`wget ${url} -P ${lasdir}/temp`, { stdio: "pipe" });
  } catch (err) {
    error("Download failed");
    error(err);
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

  var settingsMaximized = JSON.parse(
    readFileSync(`${lasdir}/settings.json`)
  ).maximized;
  if (settingsMaximized == true) {
    win.maximize();
  }

  win.loadFile("./src/html/loading.html");

  ipcMain.on("windowControl", (_event, data) => {
    switch (data) {
      case "minimize":
        win.minimize();
        break;
      case "maximize":
        var settings = JSON.parse(readFileSync(`${lasdir}/settings.json`));
        if (!win.isMaximized()) {
          settings.maximized = true;
          writeFileSync(
            `${lasdir}/settings.json`,
            JSON.stringify(settings, null, 2)
          );
          win.maximize();
          win.webContents.send("isMaximized", true);
        } else {
          settings.maximized = false;
          writeFileSync(
            `${lasdir}/settings.json`,
            JSON.stringify(settings, null, 2)
          );
          win.unmaximize();
          win.webContents.send("isMaximized", false);
        }
        break;
      case "isMaximizedBoolOnly":
        var settings = JSON.parse(readFileSync(`${lasdir}/settings.json`));
        win.webContents.send("isMaximized", settings.maximized);
        break;
      case "close":
        win.close();
        break;
    }
  });

  ipcMain.on("getSources", (_event) => {
    info("Loading sources...");
    let sourcesFile = JSON.parse(readFileSync(`${lasdir}/sources.json`));
    let sources = sourcesFile.sources;
    info("Removing old sourcefiles...");
    rmdirSync(`${lasdir}/sourcefiles`, { recursive: true, force: true });
    mkdirSync(`${lasdir}/sourcefiles`);
    info("Downloading sourcefiles...");
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].indexOf("github") > -1) {
        download(`${sources[i]}/raw/master/info.json`);
        download(`${sources[i]}/raw/master/apps.json`);
      } else {
        download(`${sources[i]}/info.json`);
        download(`${sources[i]}/apps.json`);
      }
      info("Moving new sourcefiles...");
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
      mkdirSync(`${lasdir}/temp/`);
    }
    win.webContents.send("apps");
  });

  ipcMain.on("getAppList", function () {
    info("Loading app list...");
    let arraylength = JSON.parse(readFileSync(`${lasdir}/sources.json`)).sources
      .length;
    let allapps = [];
    for (let i = 0; i < arraylength; i++) {
      let apps = JSON.parse(
        readFileSync(`${lasdir}/sourcefiles/${i}/apps.json`)
      ).apps;
      apps.forEach(function (item) {
        allapps.push(item);
      });
    }
    info("Writing app list to allapps.json...");
    writeFileSync(`${lasdir}/allapps.json`, JSON.stringify(allapps, null, 2));
    win.webContents.send("appList", allapps);
  });

  ipcMain.on("getAppInfo", (_event, appName) => {
    info(`Getting info of app ${appName}...`);
    let sourceslength = JSON.parse(
      readFileSync(`${lasdir}/sources.json`)
    ).length;
    let allapps = JSON.parse(readFileSync(`${lasdir}/allapps.json`));
    let app;
    for (let i = 0; i < allapps.length; i++) {
      if ((allapps[i].name = appName)) {
        app = allapps[i];
      }
    }
    win.webContents.send("appInfo", app);
  });

  ipcMain.on("queueApp", (_event, appName, type) => {
    info(`Adding ${appName} to queue for ${type}...`);
    if (existsSync(`${lasdir}/temp/queue.json`)) {
      let queue = readFileSync(`${lasdir}/temp/queue.json`);
      if (type == "install") {
        queue.install.push(appName);
      } else if (type == "remove") {
        queue.remove.push(appName);
      } else if (type == "upgrade") {
        queue.upgrade.push(appName);
      }
    } else {
      if (type == "install") {
        writeFileSync(
          `${lasdir}/temp/queue.json`,
          JSON.stringify(
            {
              install: [appName],
            },
            null,
            2
          )
        );
      } else if (type == "remove") {
        writeFileSync(
          `${lasdir}/temp/queue.json`,
          JSON.stringify(
            {
              remove: [appName],
            },
            null,
            2
          )
        );
      } else if (type == "upgrade") {
        writeFileSync(
          `${lasdir}/temp/queue.json`,
          JSON.stringify(
            {
              upgrade: [appName],
            },
            null,
            2
          )
        );
      }
    }
  });

  ipcMain.on("getQueue", (_event) => {
    info("Getting queue...");
    try {
      let queue = JSON.parse(readFileSync(`${lasdir}/temp/queue.json`));
      win.webContents.send("queue", queue);
    } catch (err) {
      info("Queue doesn't exist. Skipping...");
      win.webContents.send("queue", "empty");
    }
  });
}

app.whenReady().then(() => {
  info("Creating window...");
  createWindow();
  info("Started LAS");

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  info("Quitting LAS...");
  rmdirSync(`${lasdir}/temp/`, { recursive: true, force: true });
  info("Clearing queue...");
  try {
    unlinkSync(`${lasdir}/temp/queue.json`);
  } catch (err) {
    info("Queue doesn't exist, skipping...");
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
