var appName = window.localStorage.getItem("appName");

window.appInfo.get(appName);
window.appInfo.receive((_event, appInfo) => {
  $("#name").html(appInfo.name);
  $("#description").html(appInfo.description);
  $("#id").html(appInfo.id);
  window.localStorage.setItem("appId", appInfo.id);
});

window.installed.get();
window.installed.receive((_event, installed) => {
  var appId = window.localStorage.getItem("appId")
  if (installed.length == 0) {
    console.log(installed);
    $("#get-button").html(
      `<button class="btn btn-primary float-end" onclick="queueApp('install')">Install</button>`
    );
  } else {
    let appShortId = appId.split("/").pop()
    console.log(installed.length);
    for (let i = 0; i < installed.length; i++) {
      if (installed[i].indexOf(appShortId) > -1) {
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
  var appId = window.localStorage.getItem("appId");
  window.queue.send(appId, type);
  window.localStorage.removeItem("queue");
  window.localStorage.setItem("queue", "true");
  window.location.reload();
}
