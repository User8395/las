var appName = window.localStorage.getItem("appName");
var currqueue = window.localStorage.getItem("queue");

window.appInfo.get(appName);
window.appInfo.receive((_event, appInfo) => {
  $("#name").html(appInfo.name);
  $("#description").html(appInfo.description);
  $("#id").html(appInfo.id);
});

$("#get-button").html(
  `<button class="btn btn-primary float-end" onclick="queueApp('install')">Get</button>`
);

function queueApp(type) {
  window.queue.send(appName, type);
  window.localStorage.removeItem("queue");
  window.localStorage.setItem("queue", "true");
  $("#get-button").html(
    `<button class="btn btn-primary float-end" onclick="openQueue()">Queued</button>`
  );
  $("#queue-button").show();
}

function openQueue(params) {}
