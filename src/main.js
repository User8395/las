/*
  Linux App Store v0.2.0
*/

// Function Imports
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
  appendFileSync,
} = require("fs");
const { execSync } = require("child_process");
const homedir = require("os").homedir()
const lasdir = homedir + "/.las";

// If ~/.las/ doesn't exist, create it.
if (!existsSync(`${lasdir}`)) {
  mkdirSync(`${lasdir}`); // Main folder
  mkdirSync(`${lasdir}/apps/`); // Apps folder
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
}

// Functions for logging to ~/.las/log.txt
function info(val) {
  // Information
  console.log(`[Server/INFO] ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `[Server/INFO] ${val}\n`);
}
function warn(val) {
  // Warning
  console.warn(`[Server/WARN] ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `[Server/WARN] ${val}\n`);
}
function error(val) {
  // Error
  console.error(`[Server/ERROR] ${val}`);
  appendFileSync(`${lasdir}/log.txt`, `[Server/ERROR] ${val}\n`);
}

info("Starting LAS v0.2.0...");

// If the temp folder exists (usually after LAS is killed), delete it
if (existsSync(`${lasdir}/temp`)) {
  rmSync(`${lasdir}/temp`, { recursive: true, force: true })
}

mkdirSync(`${lasdir}/temp`); // Create temp folder

// Function to download files using `wget`
function download(url) {
  try {
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

  // Check if window was maximized on previous run
  var settingsMaximized = JSON.parse(
    readFileSync(`${lasdir}/settings.json`)
  ).maximized;
  if (settingsMaximized == true) {
    win.maximize(); // Maximize if it was
  }

  // Check if there is an Internet connection
  require("dns").resolve("www.google.com", function (err) {
    if (err) {
      // If there isn't, show an error
      error("No internet connnection")
      win.loadFile("./src/html/nointernet.html");
    }
  });

  // Show the "Loading app index..." screen
  win.loadFile("./src/html/loading.html");

  // Renderer logs
  ipcMain.on("rendererLog", (_event, level, log) => {
    switch (level) {
      case info:
        info(log)
        break;
      case warn:
        warn(log)
        break;
      case error:
        error(log)
        break;
    }
  });

  // Relaunching
  ipcMain.on("restart", (_event) => {
    console.log("Restarting LAS...");
    app.relaunch();
    app.exit(0);
  });

  // Window control
  ipcMain.on("windowControl", (_event, data) => {
    switch (data) {
      case "minimize":
        win.minimize(); // Minimize
        break;
      case "maximize":
        var settings = JSON.parse(readFileSync(`${lasdir}/settings.json`)); // Read settings
        if (!win.isMaximized()) {
          // If window is not maximized...
          settings.maximized = true; // ...first change setting...
          writeFileSync(
            `${lasdir}/settings.json`,
            JSON.stringify(settings, null, 2)
          );
          win.maximize(); // ...then maximize
          win.webContents.send("isMaximized", true); // Tell the renderer that the window was maximized
        } else {
          // But if it is maximized...
          settings.maximized = false; // ...change setting...
          writeFileSync(
            `${lasdir}/settings.json`,
            JSON.stringify(settings, null, 2)
          );
          win.unmaximize(); // ...then unmaximize...
          win.webContents.send("isMaximized", false); // ... and tell the renderer too
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

  // Download the app index
  ipcMain.on("downloadIndex", () => {
    info("Downloading app index...");
    let installed = JSON.parse(
      readFileSync(`${lasdir}/installed.json`)
    ).installed;
    download(`https://github.com/User8395/lai/raw/master/index.json`); // Download the app index file
    info("Removing old app index")
    try {
      rmSync(`${lasdir}/index.json`)
    } catch (err) { }
    info("Moving index file...");
    renameSync(
      `${lasdir}/temp/index.json`,
      `${lasdir}/index.json`
    );

    // Check if there are newer versions of apps available
    // for (let i = 0; i < installed.length; i++) {
    //   for (let i2 = 0; i2 < index.length; i2++) {
    //     let apps = readFileSync(`${lasdir}/sourcefiles/${i2}/apps.json`)

    //   }
    // }

    var index = JSON.parse(readFileSync(`${lasdir}/index.json`)).apps
    rmSync(`${lasdir}/temp/`, { recursive: true, force: true }); // Remove temp folder
    mkdirSync(`${lasdir}/temp/`); // Re-create temp folder
    writeFileSync(`${lasdir}/temp/queue.json`, JSON.stringify({ remove: [], install: [], update: [] }, null, 2)); // Create queue file
    win.webContents.send("index", index); // Tell renderer that index loading is done
  });

  // Get the info of an app
  ipcMain.on("getAppInfo", (_event, appName) => {
    let index = JSON.parse(readFileSync(`${lasdir}/index.json`)).apps; // Read app index
    let app; // Empty declaration
    for (let i = 0; i < index.length; i++) {
      // If the name of the app is in the app index...
      if (appName === index[i].name) {
        app = index[i]; // Set value variable `app` to the requested app's info
        break
      }
    }
    win.webContents.send("appInfo", app); // Send app info to renderer
  });

  // Add an app to the queue
  ipcMain.on("queueApp", (_event, appId, type) => {
    info(`Adding ${appId} to queue for ${type}...`);
    // If the queue file exists...
    let queue = JSON.parse(readFileSync(`${lasdir}/temp/queue.json`)); // ...read the queue from ~/.las/temp/queue.json
    if (type == "install") {
      // If the app is supposed to be installed...
      queue.install.push(appId); // ...add the app for installation
    } else if (type == "remove") {
      // If the app is supposed to be removed...
      queue.remove.push(appId); // ...add the app for removal
    } else if (type == "update") {
      // If the app is supposed to be updated...
      queue.update.push(appId); // ...add the app for update
    }
    writeFileSync(`${lasdir}/temp/queue.json`, JSON.stringify(queue))
  });

  // Retreive the current queue
  ipcMain.on("getQueue", (_event) => {
    let queue = JSON.parse(readFileSync(`${lasdir}/temp/queue.json`)); // Read the queue from ~/.las/temp/queue.json
    if (queue.remove.length == 0 && queue.install.length == 0 && queue.update.length == 0) { // If the queue is empty..
      win.webContents.send("queue", "empty"); // Tell renderer that the queue is empty
    } else { // Otherwise...
      win.webContents.send("queue", queue); // Send queue to renderer...
    }
  });

  // Retreive list of installed apps
  ipcMain.on("getInstalled", (_event) => {
    let installed = JSON.parse(
      readFileSync(`${lasdir}/installed.json`) // Read installed apps file
    ).installed;
    win.webContents.send("installedApps", installed); // Send installed apps list to renderer
  });

  // Perform queued operations
  ipcMain.on("performOperations", (_event) => {
    info("Performing operations...");
    let queue = JSON.parse(readFileSync(`${lasdir}/temp/queue.json`)); // Read queue file
    let installed = JSON.parse(
      readFileSync(`${lasdir}/installed.json`) // Read installed apps file
    ).installed;
    if (queue.remove) {
      // If there are removals queued...
      info(`Removing ${queue.remove.length} app(s)`);
      for (let i = 0; i < queue.remove.length; i++) {
        // ...loop through the removal queue
        info(`Removing app ${i + 1}/${queue.remove.length}`)
        var app = JSON.parse(readFileSync(`${lasdir}/apps/${queue.remove[i]}/app.json`))
        if (app.install == "user") {
          rmSync(`${lasdir}/apps/${queue.remove[i]}`, { recursive: true, force: true })
          rmSync(`${homedir}/.local/share/applications/${queue.remove[i]}.desktop`)
          installed.splice(installed.indexOf(queue.remove[i]), 1); // Remove the app from the installed list
        }
        writeFileSync(
          // Save to installed apps file
          `${lasdir}/installed.json`,
          JSON.stringify(
            {
              installed: installed,
            },
            null,
            2
          )
        );
      }
    }
    if (queue.update) {
      // If there are updates queued
      info(`Updating ${queue.update.length} app(s)...`);
      for (let i = 0; i < queue.update.length; i++) {
        error("Updates currently cannot be done")
      }
    }
    if (queue.install) {
      // If there are installs queued...
      for (let i = 0; i < queue.install.length; i++) { // ...loop through the install queue
        mkdirSync(`${lasdir}/temp/${queue.install[i]}/`)
        info(`Downloading app ${i + 1}/${queue.install.length}`)
        download(`https://github.com/User8395/lai/raw/master/${queue.install[i]}/app.json`)
        renameSync(`${lasdir}/temp/app.json`, `${lasdir}/temp/${queue.install[i]}/app.json`)
        var app = JSON.parse(readFileSync(`${lasdir}/temp/${queue.install[i]}/app.json`))
        download(`https://github.com/User8395/lai/raw/master/${queue.install[i]}/latest/${queue.install[i]}.lapp.zip`)
      }
      info(`Downloads complete`)
      info(`Installing apps...`)
      for (let i = 0; i < queue.install.length; i++) {
        var app = JSON.parse(readFileSync(`${lasdir}/temp/${queue.install[i]}/app.json`))
        if (app.install = "user") {
          info(`[${i + 1}/${queue.install.length}] ${queue.install[i]} (${app.latestVersion})`)
          mkdirSync(`${lasdir}/apps/${queue.install[i]}`)
          renameSync(`${lasdir}/temp/${queue.install[i]}/app.json`, `${lasdir}/apps/${queue.install[i]}/app.json`)
          execSync(`unzip ${lasdir}/temp/${queue.install[i]}.lapp.zip -d ${lasdir}/apps/${queue.install[i]}`)
          execSync(`ln -fs ${lasdir}/apps/${queue.install[i]}/${app.desktopFile} ${homedir}/.local/share/applications/${app.desktopFile}`)
          for (let i2 = 0; i2 < app.executables.length; i2++) {
            console.debug(`[Server/DEBUG] ${app.executables}`)
            try {
              execSync(`chmod +x ${lasdir}/apps/${queue.install[i]}/${app.executables[i]}`)
            } catch (err) {
              error(err)
            }
          }
        }
        installed.push(queue.install[i])
      }
      info("Apps installed")
      writeFileSync(
        `${lasdir}/installed.json`, // Save to installed apps file
        JSON.stringify({ installed }, null, 2)
      );
    }
    info("All operations complete");
    rmSync(`${lasdir}/temp/`, { recursive: true, force: true }); // Clear temp folder
    mkdirSync(`${lasdir}/temp/`); // Re-create temp folder
    writeFileSync(`${lasdir}/temp/queue.json`, JSON.stringify({ remove: [], install: [], update: [] }, null, 2)); // Create queue file
    win.loadFile("./src/html/main.html"); // Return to main menu
  });
};

app.whenReady().then(() => {
  // When LAS has loaded...
  createWindow(); // ...create the window
  info("Started LAS");
});

app.on("window-all-closed", () => {
  // When all the windows are closed...
  info("Quitting LAS...");
  rmSync(`${lasdir}/temp/`, { recursive: true, force: true }); // ...remove the temp folder...
  app.quit(); // ...and quit LAS
});
