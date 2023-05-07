/*
  Linux App Store v0.0.1 pre-alpha
  Formatted by Prettier for Visual Studio Code
*/


// Function Imports
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
  renameSync,
  appendFileSync,
} = require("fs");
const { execSync } = require("child_process");
const lasdir = require("os").homedir() + "/.las";

// There is an annoying warning in the JavaScript console telling
// me that the HTML is insecure somehow. This line disables said warning.
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// If ~/.las/ doesn't exist, create it.
if (!existsSync(`${lasdir}`)) {
  mkdirSync(`${lasdir}`) // Main folder
  mkdirSync(`${lasdir}/apps/`); // Apps folder
  mkdirSync(`${lasdir}/sourcefiles/`); // Sourcefiles folder
  writeFileSync(
    `${lasdir}/sources.json`, // Sources JSON file
    JSON.stringify(
      {
        sources: ["https://github.com/User8395/example-las-source"],
      },
      null,
      2
    )
  );
  writeFileSync(
    `${lasdir}/settings.json`, // Settings JSON file, currently containing window maximization settings
    JSON.stringify(
      {
        maximized: false,
      },
      null,
      2
    )
  );
  writeFileSync(
    `${lasdir}/installed.json`, // Installed apps JSON file
    JSON.stringify(
      {
        installed: [],
      },
      null,
      2
    )
  );
  writeFileSync(`${lasdir}/applist.json`, JSON.stringify({}, null, 2)); // Available apps JSON file
}

// Functions for logging to ~/las/log.txt

function info(val) { // Information
  console.log(`INFO ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `INFO ${val}\n`);
}
function warn(val) { // Warning
  console.warn(`WARN ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `WARN ${val}\n`);
}
function error(val) { // Error.
  new Error(`ERROR ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `ERROR ${val}\n`);
}

mkdirSync(`${lasdir}/temp`); // Temp folder

info("Starting LAS v0.0.1...");
warn("This is a development version of LAS.");
warn("Please report bugs on GitHub at https://github.com/User8395/las/issues");

// Function to download files using `wget`
function download(url) {
  try {
    info(`Downloading ${url}...`);
    execSync(`wget ${url} -P ${lasdir}/temp`, { stdio: "pipe" });
  } catch (err) {
    error(err);
  }
}

// Creates the main window
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

  ipcMain.on("queueApp", (_event, appId, type) => {
    info(`Adding ${appId} to queue for ${type}...`);
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
              install: [appId],
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

  ipcMain.on("performOperations", (_event) => {
    info("Performing operations...");
    let queue = JSON.parse(readFileSync(`${lasdir}/temp/queue.json`));
    let sources = JSON.parse(readFileSync(`${lasdir}/sources.json`)).sources;
    let installed = JSON.parse(
      readFileSync(`${lasdir}/installed.json`)
    ).installed;
    if (queue.remove) {
      info("Removing apps...");
      for (let i = 0; i < queue.remove.length; i++) {
        let appName = queue.removing[i].split("/").shift();
        for (let i2 = 0; i2 < sources.length; i2++) {
          let apps = JSON.parse(
            readFileSync(`${lasdir}/sourcefiles/${i2}/apps.json`)
          ).apps;
          for (let i3 = 0; i3 < apps.length; i3++) {
            if (apps[i3] == queue.remove[i]) {
            }
          }
        }
      }
    }
    if (queue.upgrade) {
      //TODO
    }
    if (queue.install) {
      info("Installing apps...");
      for (let i = 0; i < queue.install.length; i++) {
        let appName = queue.install[i].split("/").pop();
        for (let i2 = 0; i2 < sources.length; i2++) {
          let apps = JSON.parse(
            readFileSync(`${lasdir}/sourcefiles/${i2}/apps.json`)
          ).apps;
          for (let i3 = 0; i3 < apps.length; i3++) {
            if (apps[i3].id == queue.install[i]) {
              info(`Downloading ${appName}`)
              if (sources[i2].indexOf("github") > -1) {
                download(`${sources[i2]}/raw/master/apps/${appName}.lapp`);
              } else {
                download(`${sources[i2]}/apps/${appName}.lapp`);
              }
              info(`Installing ${appName}`)
              execSync(`unzip ${lasdir}/temp/${appName}.lapp -d ${lasdir}/apps/${appName}`)
              installed.push(appName);
              writeFileSync(`${lasdir}/apps.json`, JSON.stringify(installed));

            }
          }
        }
      }
    }
    info("Returning to menu...")
    win.loadFile("./src/html/index.html")
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
  if (process.platform !== "darwin") {
    app.quit();
  }
});