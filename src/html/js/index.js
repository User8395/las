window.localStorage.clear()

window.appList.get()
window.appList.receive((_event, appList) => {
  for (let i = 0; i < appList.length; i++) {
    $(".app-list").append(`<li><button data-app="${appList[i].name}" class="btn btn-link" onclick="appDetails(this.dataset.app)">${appList[i].name}</button></li>`)
  }
})

function appDetails(appName) {
  window.localStorage.setItem("appName", appName)
  window.location.assign('./info.html')
}