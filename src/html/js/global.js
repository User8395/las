window.getQueue.get();
window.getQueue.receive(function (_event, currqueue) {
  if (currqueue == "empty") {
    $("#queue-button").hide();
  } else {
    $("#queue-button").show();
    if (window.location.href.includes("info")) {
      for (let i = 0; i < currqueue.install.length; i++) {
        if (currqueue.install[i] == window.localStorage.getItem("appName")) {
          $("#get-button").html(
            `<button class="btn btn-primary float-end" onclick="openQueue()">Queued</button>`
          );
        } else if (currqueue.remove[i] == window.localStorage.getItem("appName")) {
          $("#get-button").html(
            `<button class="btn btn-primary float-end" onclick="openQueue()">Queued</button>`
          );
        } else if (currqueue.upgrade[i] == window.localStorage.getItem("appName")) {
          $("#get-button").html(
            `<button class="btn btn-primary float-end" onclick="openQueue()">Queued</button>`
          );
        }
      }
    }
  }
  if (currqueue.install) {
    $("#queue").append("<h3>Install</h1>");
    $("#queue").append("<ul>");
    for (let i = 0; i < currqueue.install.length; i++) {
      $("#queue").append(`<li>${currqueue.install[i]}</li>`);
    }
    $("#queue").append("</ul>");
  }
});

window.windowControl.send("isMaximizedBoolOnly");
window.windowControl.receive((_event, isMaximized) => {
  if (!isMaximized) {
    $("#maximize-icon").removeClass("fa-square");
    $("#maximize-icon").removeClass("fa-regular");
    $("#maximize-icon").addClass("fa-solid");
    $("#maximize-icon").addClass("fa-plus");
  } else {
    $("#maximize-icon").removeClass("fa-solid");
    $("#maximize-icon").removeClass("fa-plus");
    $("#maximize-icon").addClass("fa-regular");
    $("#maximize-icon").addClass("fa-square");
  }
});

$("#minimize").click(function () {
  window.windowControl.send("minimize");
});

$("#maximize").click(function () {
  window.windowControl.send("maximize");
  window.windowControl.receive((_event, isMaximized) => {
    if (!isMaximized) {
      $("#maximize-icon").removeClass("fa-square");
      $("#maximize-icon").removeClass("fa-regular");
      $("#maximize-icon").addClass("fa-solid");
      $("#maximize-icon").addClass("fa-plus");
    } else {
      $("#maximize-icon").removeClass("fa-solid");
      $("#maximize-icon").removeClass("fa-plus");
      $("#maximize-icon").addClass("fa-regular");
      $("#maximize-icon").addClass("fa-square");
    }
  });
});

$("#close").click(function () {
  window.localStorage.removeItem("queue");
  window.windowControl.send("close");
});
