/*
  Linux App Store v0.0.1 pre-alpha
  NOTE: Comments are only available in English
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
const checkInternetConnected = require("check-internet-connected");
const lasdir = require("os").homedir() + "/.las";


// There is an annoying warning in the JavaScript console telling
// me that the HTML is insecure somehow. This line disables said warning.
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// If ~/.las/ doesn't exist, create it.
if (!existsSync(`${lasdir}`)) {
  mkdirSync(`${lasdir}`); // Main folder
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

// Functions for logging to ~/.las/log.txt

function info(val) {
  // Information
  console.log(`INFO ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `INFO ${val}\n`);
}
function warn(val) {
  // Warning
  console.warn(`WARN ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `WARN ${val}\n`);
}
function error(val) {
  // Error.
  new Error(`ERROR ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `ERROR ${val}\n`);
}

mkdirSync(`${lasdir}/temp`); // Temp folder

info("Starting LAS v0.0.1...");
warn("============================= WARNING ================================");
warn("This is a development version of LAS.");
warn("Please report bugs on GitHub at https://github.com/User8395/las/issues");
warn("======================================================================");

// Function to download files using `wget`
function download(url) {
  try {
    info(`Downloading ${url}...`);
    execSync(`wget ${url} -P ${lasdir}/temp`, { stdio: "pipe", stderr: "out" });
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

  // Check if there is an Internet connection (**BROKEN kinda**)
  checkInternetConnected().catch(function () {
    win.loadFile("./src/html/nointernet.html") // If no connection is detected, redirect to the "No Internet" prompt
    app.quit()
  });
  
  // Check if window was maximized on previous run
  var settingsMaximized = JSON.parse(
    readFileSync(`${lasdir}/settings.json`)
    ).maximized;
  if (settingsMaximized == true) {
    win.maximize(); // Maximize if it was
  }

  // Load the "Loading sources..." screen
  win.loadFile("./src/html/loading.html");

  // Window control
  ipcMain.on("windowControl", (_event, data) => {
    switch (data) {
      case "minimize":
        win.minimize(); // Minimzie
        break;
      case "maximize":
        var settings = JSON.parse(readFileSync(`${lasdir}/settings.json`)); // Read settings
        if (!win.isMaximized()) { // If window is not maximized...
          settings.maximized = true; // ...first change setting...
          writeFileSync(
            `${lasdir}/settings.json`,
            JSON.stringify(settings, null, 2)
          );
          win.maximize(); // ...then maximize
          win.webContents.send("isMaximized", true); // Tell the renderer that the window was maximized
        } else { // But if it is maximized...
          settings.maximized = false; // ...change setting...
          writeFileSync(
            `${lasdir}/settings.json`,
            JSON.stringify(settings, null, 2)
          );
          win.unmaximize(); // ...then unmaximize
          win.webContents.send("isMaximized", false); // And tell the renderer too
        }
        break;
      case "isMaximizedBoolOnly": // Is the window maximized?
        var settings = JSON.parse(readFileSync(`${lasdir}/settings.json`)); // Read settings
        win.webContents.send("isMaximized", settings.maximized); // Yes/No
        break;
      case "close":
        win.close(); // Close the window
        break;
    }
  });

  // Get source data
  ipcMain.on("getSources", (_event) => {
    info("Loading sources...");
    let sources = JSON.parse(readFileSync(`${lasdir}/sources.json`)).sources; // Read ~/.las/sources.json
    info("Removing old sourcefiles...");
    rmdirSync(`${lasdir}/sourcefiles`, { recursive: true, force: true }); // Remove old sourcefiles
    mkdirSync(`${lasdir}/sourcefiles`); // Re-create sourcefiles folder
    info("Downloading sourcefiles...");
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].indexOf("github") > -1) { // If the source is a GitHub repository...
        download(`${sources[i]}/raw/master/info.json`); // ..download the raw info.json...
        download(`${sources[i]}/raw/master/apps.json`); // .. and the raw apps.json
      } else { // If the source is something else...
        download(`${sources[i]}/info.json`); // ...directly download info.json...
        download(`${sources[i]}/apps.json`); // ...and apps.json
      }
      info("Moving new sourcefiles...");
      mkdirSync(`${lasdir}/sourcefiles/${i}`); // Create a folder for the downloaded files
      renameSync( // Move info.json
        `${lasdir}/temp/info.json`,
        `${lasdir}/sourcefiles/${i}/info.json`
      );
      renameSync( // Move apps.json
        `${lasdir}/temp/apps.json`,
        `${lasdir}/sourcefiles/${i}/apps.json`
      );
      // Restart this process if there are more sources
    }
    rmdirSync(`${lasdir}/temp/`, { recursive: true, force: true }); // Remove temp folder
    mkdirSync(`${lasdir}/temp/`); // Re-create temp folder
    win.webContents.send("apps"); // Tell renderer that source loading is done
  });

  // Get the list of apps
  ipcMain.on("getAppList", function () {
    info("Loading app list...");
    let arraylength = JSON.parse(readFileSync(`${lasdir}/sources.json`)).sources
      .length; // Length of sources.json
    let applist = []; // Declare applist variable
    for (let i = 0; i < arraylength; i++) {
      let apps = JSON.parse(
        readFileSync(`${lasdir}/sourcefiles/${i}/apps.json`) // Read source's apps.json
      ).apps;
      apps.forEach(function (item) {
        applist.push(item); // Add app to applist
      });
    }
    info("Writing app list to applist.json...");
    writeFileSync(`${lasdir}/applist.json`, JSON.stringify(applist, null, 2)); // Write app list to ~/.las/applist.jsom
    win.webContents.send("appList", applist); // Send app list to renderer
  });

  // Get the info of an app
  ipcMain.on("getAppInfo", (_event, appName) => {
    info(`Getting info of app ${appName}...`);
    let sourceslength = JSON.parse(
      readFileSync(`${lasdir}/sources.json`) // Length of sources.json
    ).length;
    let applist = JSON.parse(readFileSync(`${lasdir}/applist.json`)); // applist.json
    let app; // Empty declaration
    for (let i = 0; i < applist.length; i++) {
      if ((applist[i].name = appName)) { // If the name of the app is in applist.json...
        app = applist[i]; // Set value variable `app` to the requested app's info
      }
    }
    win.webContents.send("appInfo", app); // Send app info to renderer
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
              remove: [appId],
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
              upgrade: [appId],
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
      info("Queue is empty. Skipping...");
      win.webContents.send("queue", "empty");
    }
  });

  ipcMain.on("getInstalled", (_event) => {
    info("Getting installed list...");
    let installed = JSON.parse(
      readFileSync(`${lasdir}/installed.json`)
    ).installed;
    win.webContents.send("installedApps", installed);
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
        let appName = queue.remove[i].split("/").pop();
        for (let i2 = 0; i2 < installed.length; i2++) {
          if (installed[i2] == queue.remove[i]) {
            info(`Removing ${appName}...`);
            rmdirSync(`${lasdir}/apps/${appName}`, { recursive: true, force: true });
            installed.splice(installed.indexOf(queue.remove[i]), 1)
            writeFileSync(`${lasdir}/installed.json`, JSON.stringify({
              installed: installed
            }, null, 2))
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
              info(`Downloading ${appName}...`);
              if (sources[i2].indexOf("github") > -1) {
                download(`${sources[i2]}/raw/master/apps/${appName}.lapp`);
              } else {
                download(`${sources[i2]}/apps/${appName}.lapp`);
              }
              info(`Installing ${appName}`);
              execSync(
                `unzip ${lasdir}/temp/${appName}.lapp -d ${lasdir}/apps/${appName}`
              );
              installed.push(queue.install[i]);
              writeFileSync(
                `${lasdir}/installed.json`,
                JSON.stringify({ installed }, null, 2)
              );
            }
          }
        }
      }
    }
    rmdirSync(`${lasdir}/temp/`, { recursive: true, force: true });
    mkdirSync(`${lasdir}/temp/`);
    info("Returning to menu...");
    win.loadFile("./src/html/index.html");
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
  app.quit();
});