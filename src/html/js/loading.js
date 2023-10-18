window.index.get();
window.index.receive((_event, apps) => {
    window.localStorage.setItem("apps", JSON.stringify(apps))
    window.location.assign("./main.html");
})