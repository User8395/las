window.apps.get();
window.apps.receive((_event, na) => {
    console.log(na);
    if (na) {
      if (na == 1) {
        alert("There is 1 repository that is currently unavailable.");
      } else {
        alert("There are " + na + " sources that are currently unavailable.");
      }
    }
    window.location.assign("./index.html");
})
