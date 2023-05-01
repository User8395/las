let appName = window.localStorage.getItem("appName")
console.log(appName);
window.appInfo.get(appName)
window.appInfo.receive((_event, appInfo) => {
    $("#name").html(appInfo.name)
    $("#description").html(appInfo.description)
})