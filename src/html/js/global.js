window.getQueue.get();
window.getQueue.receive(function (_event, currqueue) {
  if (currqueue == "empty") {
    $("#queue-button").hide();
  } else {
    $("#queue-button").show();
    if (window.location.href.includes("info")) {
      if (currqueue.install) {
        for (let i = 0; i < currqueue.install.length; i++) {
          console.log(window.localStorage.getItem("appName"))
          if (currqueue.install[i] == window.localStorage.getItem("appName")) {
            setTimeout(() => {
              console.log("he");
              $("#get-button").html(
                `<button class="btn btn-primary float-end" data-bs-toggle="modal" data-bs-target="#queue-modal">Queued</button>`
              );
            }, 1);
          }
        }
      } else if (currqueue.remove) {
        for (let i = 0; i < currqueue.remove.length; i++) {
          if (currqueue.remove[i] == window.localStorage.getItem("appName")) {
            setTimeout(() => {
              $("#get-button").html(
                `<button class="btn btn-primary float-end" data-bs-toggle="modal" data-bs-target="#queue-modal">Queued</button>`
              );
            }, 1);
          }
        }
      } else if (currqueue.update) {
        if (currqueue.update[i] == window.localStorage.getItem("appName")) {
          setTimeout(() => {
            $("#get-button").html(
              `<button class="btn btn-primary float-end" data-bs-toggle="modal" data-bs-target="#queue-modal">Queued</button>`
            );
          }, 1);
        }
      }
    }
  }
  if (currqueue.install) {
    $("#queue").append("<h5>Install</h1>");
    $("#queue").append("<ul>");
    for (let i = 0; i < currqueue.install.length; i++) {
      $("#queue").append(`<li>${currqueue.install[i]}</li>`);
    }
    $("#queue").append("</ul>");
  } else if (currqueue.remove) {
    $("#queue").append("<h5>Remove</h1>");
    $("#queue").append("<ul>");
    for (let i = 0; i < currqueue.remove.length; i++) {
      $("#queue").append(`<li>${currqueue.remove[i]}</li>`);
    }
    $("#queue").append("</ul>");
  } else if (currqueue.update) {
    $("#queue").append("<h5>Update</h1>");
    $("#queue").append("<ul>");
    for (let i = 0; i < currqueue.update.length; i++) {
      $("#queue").append(`<li>${currqueue.update[i]}</li>`);
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
