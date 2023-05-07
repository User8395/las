var appName = window.localStorage.getItem("appName");

window.appInfo.get(appName);
window.appInfo.receive((_event, appInfo) => {
  $("#name").html(appInfo.name);
  $("#description").html(appInfo.description);
  $("#id").html(appInfo.id);
  window.localStorage.setItem("appId", appInfo.id)
});
$("#get-button").html(
  `<button class="btn btn-primary float-end" onclick="queueApp('install')">Get</button>`
);


function queueApp(type) {
  var appId = window.localStorage.getItem("appId")
  window.queue.send(appId, type);
  window.localStorage.removeItem("queue");
  window.localStorage.setItem("queue", "true");
  window.location.reload()
}
