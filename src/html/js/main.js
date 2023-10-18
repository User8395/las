window.localStorage.removeItem("appName")

var apps = JSON.parse(window.localStorage.getItem("apps"))
for (let i = 0; i < apps.length; i++) {
  $(".app-list").append(`<li><button data-app="${apps[i].name}" class="btn btn-link" onclick="appDetails(this.dataset.app)">${apps[i].name} - ${apps[i].summary}</button></li>`)
}

function appDetails(appName) {
  window.localStorage.setItem("appName", appName)
  window.location.assign('./info.html')
}