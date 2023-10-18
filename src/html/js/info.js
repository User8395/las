var appName = window.localStorage.getItem("appName");

window.appInfo.get(appName);
window.appInfo.receive((_event, appInfo) => {
  setTimeout(1000);
  $("#name").html(appInfo.name);
  $("#summary").html(appInfo.summary);
  $("#description").html(appInfo.description);
  window.localStorage.setItem("appName", appInfo.name);
});

window.installed.get();
window.installed.receive((_event, installed) => {
  var appName = window.localStorage.getItem("appName");
  if (installed.length == 0) {
    console.log(installed);
    $("#get-button").html(
      `<button class="btn btn-primary float-end" onclick="queueApp('install')">Install</button>`
    );
  } else {
    console.log(installed.length);
    for (let i = 0; i < installed.length; i++) {
      if (installed[i].indexOf(appName) > -1) {
        $("#get-button").html(
          `<button class="btn btn-primary float-end" onclick="queueApp('remove')">Remove</button>`
        );
      } else {
        $("#get-button").html(
          `<button class="btn btn-primary float-end" onclick="queueApp('install')">Install</button>`
        );
      }
    }
  }
});

$("#get-button").html(
  `<button class="btn btn-primary float-end" onclick="queueApp('install')">Install</button>`
);

function queueApp(type) {
  var appName = window.localStorage.getItem("appName");
  window.queue.send(appName, type);
  window.localStorage.removeItem("queue");
  window.localStorage.setItem("queue", "true");
  window.location.reload();
}
