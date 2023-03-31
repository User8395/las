$("#minimize").click(function () {
  window.windowControl.send("minimize");
});

$("#maximize").click(function () {
  window.windowControl.send("maximize");
  window.windowControl.receive((_event, isMaximized) => {
    console.log(isMaximized);
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
  window.windowControl.send("close");
});
