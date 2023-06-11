/*
  Linux App Store v0.0-prealpha
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

info("Starting LAS v0.0-prealpha...");
warn("============================= WARNING ================================");
warn("This is a development version of LAS.");
warn("Please report bugs on GitHub at https://github.com/User8395/las/issues.");
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
    win.loadFile("./src/html/nointernet.html"); // If no connection is detected, redirect to the "No Internet" prompt
    app.quit();
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
    let installed = JSON.parse(readFileSync(`${lasdir}/installed.json`)).installed
    info("Removing old sourcefiles...");
    rmdirSync(`${lasdir}/sourcefiles`, { recursive: true, force: true }); // Remove old sourcefiles
    mkdirSync(`${lasdir}/sourcefiles`); // Re-create sourcefiles folder
    info("Downloading sourcefiles...");
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].indexOf("github") > -1) {
        // If the source is a GitHub repository...
        download(`${sources[i]}/raw/master/info.json`); // ..download the raw info.json...
        download(`${sources[i]}/raw/master/apps.json`); // .. and the raw apps.json
      } else {
        // If the source is something else...
        download(`${sources[i]}/info.json`); // ...directly download info.json...
        download(`${sources[i]}/apps.json`); // ...and apps.json
      }
      info("Moving new sourcefiles...");
      mkdirSync(`${lasdir}/sourcefiles/${i}`); // Create a folder for the downloaded files
      renameSync(
        // Move info.json
        `${lasdir}/temp/info.json`,
        `${lasdir}/sourcefiles/${i}/info.json`
      );
      renameSync(
        // Move apps.json
        `${lasdir}/temp/apps.json`,
        `${lasdir}/sourcefiles/${i}/apps.json`
      );
      // Restart this process if there are more sources
    }
  
    // Check if there are newer versions of apps available
    // for (let i = 0; i < installed.length; i++) {
    //   for (let i2 = 0; i2 < sources.length; i2++) {
    //     let apps = readFileSync(`${lasdir}/sourcefiles/${i2}/apps.json`)

    //   }
    // }

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
      if ((applist[i].name = appName)) {
        // If the name of the app is in applist.json...
        app = applist[i]; // Set value variable `app` to the requested app's info
      }
    }
    win.webContents.send("appInfo", app); // Send app info to renderer
  });

  // Add an app to the queue
  ipcMain.on("queueApp", (_event, appId, type) => {
    info(`Adding ${appId} to queue for ${type}...`);
    if (existsSync(`${lasdir}/temp/queue.json`)) {
      // If the queue file exists...
      let queue = readFileSync(`${lasdir}/temp/queue.json`); // ...read the queue from ~/.las/temp/queue.json
      if (type == "install") {
        // If the app is supposed to be installed...
        queue.install.push(appName); // ...add the app for installation
      } else if (type == "remove") {
        // If the app is supposed to be removed...
        queue.remove.push(appName); // ...add the app for removal
      } else if (type == "update") {
        // If the app is supposed to be updated...
        queue.update.push(appName); // ...add the app for update
      }
    } else {
      // If the queue file doesn't exist...
      if (type == "install") {
        // If the app is supposed to be installed...
        writeFileSync(
          // ...create the queue file and add the app for installation
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
        // If the app is supposed to be removed...
        writeFileSync(
          // ...create the queue file and add the app for removal
          `${lasdir}/temp/queue.json`,
          JSON.stringify(
            {
              remove: [appId],
            },
            null,
            2
          )
        );
      } else if (type == "update") {
        // If the app is supposed to be updated...
        writeFileSync(
          `${lasdir}/temp/queue.json`,
          JSON.stringify(
            // ...create the queue file and add the app for updating
            {
              update: [appId],
            },
            null,
            2
          )
        );
      }
    }
  });

  // Retreive the current queue
  ipcMain.on("getQueue", (_event) => {
    info("Getting queue...");
    try {
      let queue = JSON.parse(readFileSync(`${lasdir}/temp/queue.json`)); // Read the queue from ~/.las/temp/queue.json
      win.webContents.send("queue", queue); // Send queue to renderer
    } catch (err) {
      // If there was an error
      info("Queue is empty. Skipping...");
      win.webContents.send("queue", "empty"); // Tell renderer that the queue is empty
    }
  });

  // Retreive list of installed apps
  ipcMain.on("getInstalled", (_event) => {
    info("Getting installed list...");
    let installed = JSON.parse(
      readFileSync(`${lasdir}/installed.json`) // Read installed apps file
    ).installed;
    win.webContents.send("installedApps", installed); // Send installed apps list to renderer
  });

  // Perform queued operations
  ipcMain.on("performOperations", (_event) => {
    info("Performing operations...");
    let queue = JSON.parse(readFileSync(`${lasdir}/temp/queue.json`)); // Read queue file
    let sources = JSON.parse(readFileSync(`${lasdir}/sources.json`)).sources; // Read sources file
    let installed = JSON.parse(
      readFileSync(`${lasdir}/installed.json`) // Read installed apps file
    ).installed;
    if (queue.remove) {
      // If there are removals queued...
      info(`Removing ${queue.remove.length} app(s)`);
      for (let i = 0; i < queue.remove.length; i++) {
        // ...loop through the removal queue
        let appName = queue.remove[i].split("/").pop(); // Read app name
        for (let i2 = 0; i2 < installed.length; i2++) {
          if (installed[i2] == queue.remove[i]) {
            // If app name is in the queue...
            info(`Removing ${appName}...`);
            rmdirSync(`${lasdir}/apps/${appName}`, {
              // Remove the app
              recursive: true,
              force: true,
            });
            installed.splice(installed.indexOf(queue.remove[i]), 1); // Remove the app from the installed list
          }
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
        // ...loop through the update queue
        let appName = queue.update[i].split("/").pop(); // Read app name
        for (let i2 = 0; i2 < sources.length; i2++) {
          let downloaded = [];
          let apps = JSON.parse(
            readFileSync(`${lasdir}/sourcefiles/${i2}/apps.json`)
            ).apps;
            for (let i3 = 0; i3 < apps.length; i3++) {
            if (apps[i3].id == queue.update[i]) {
              // If app name is in the queue...
              info(`Downloading ${appName} v${apps[i3].version}...`);
              if (sources[i2].indexOf("github") > -1) {
                // ...and if the source is a GitHub repository...
                download(`${sources[i2]}/raw/master/apps/${appName}-${apps[i3].version}.lapp`); // ...download the raw GitHub file
              } else {
                // ...otherwise...
                download(`${sources[i2]}/apps/${appName}-${apps[i3].version}.lapp`); // ...download the app regularly
              }
              downloaded.push(`${appName}-${apps[i3].version}`) // Add app to queue for later updating
            }
            for (let i = 0; i < downloaded.length; i++) { // Loop through the downloaded apps
              info(`Updating ${downloaded[i][1]} to ${downloaded[i][2]}`);
              execSync(
                `unzip ${lasdir}/temp/${downloaded[i]}.lapp -fd ${lasdir}/apps/${downloaded[i]}` // Extract updated app to ~/.las/apps/ without modifying user data
              );
            }
          }
        }
      }
    }
    if (queue.install) {
      // If there are installs queued...
      info(`Installing ${queue.install.length} app(s)...`);
      for (let i = 0; i < queue.install.length; i++) {
        // ...loop through the install queue
        let appName = queue.install[i].split("/").pop(); // Read app name
        for (let i2 = 0; i2 < sources.length; i2++) { // Loop through sources
          var downloaded = [];
          let apps = JSON.parse(
            readFileSync(`${lasdir}/sourcefiles/${i2}/apps.json`)
          ).apps;
          for (let i3 = 0; i3 < apps.length; i3++) {
            // Loop through the install queue to download apps
            if (apps[i3].id == queue.install[i]) {
              // If app name is in the queue...
              info(`Downloading ${appName} v${apps[i3].version}...`);
              if (sources[i2].indexOf("github") > -1) {
                // ...and if the source is a GitHub repository...
                download(`${sources[i2]}/raw/master/apps/${appName}-${apps[i3].version}.lapp`); // ...download the raw GitHub file
              } else {
                // ...otherwise...
                download(`${sources[i2]}/apps/${appName}-${apps[i3].version}.lapp`); // ...download the app regularly
              }
              downloaded.push([appName, apps[i3].version]); // Add app to queue for later installation
            }
          }
          for (let i3 = 0; i3 < downloaded.length; i3++) {
            // Loop through the downloaded apps list
            info(downloaded)
            info(`Installing ${downloaded[i][1]} v${downloaded[i][2]}`);
            execSync(
              `unzip ${lasdir}/temp/${downloaded[i]}.lapp -d ${lasdir}/apps/${downloaded[i]}` // Extract the app to ~/.las/apps/
            );
            installed.push(downloaded[i]); // Add to installed apps list
          }
          writeFileSync(
            `${lasdir}/installed.json`, // Save to installed apps file
            JSON.stringify({ installed }, null, 2)
          );
        }
      }
    }
    rmdirSync(`${lasdir}/temp/`, { recursive: true, force: true }); // Clear temp folder
    mkdirSync(`${lasdir}/temp/`); // Re-create temp folder
    info("Returning to menu...");
    win.loadFile("./src/html/index.html"); // Return to main menu
  });
}

app.whenReady().then(() => {
  // When LAS has loaded...
  info("Creating window...");
  createWindow(); // ...create the window
  info("Started LAS");
});

app.on("window-all-closed", () => {
  // When all the windows are closed...
  info("Quitting LAS...");
  rmdirSync(`${lasdir}/temp/`, { recursive: true, force: true }); // ...remove the temp folder...
  app.quit(); // ... and quit LAS
});
