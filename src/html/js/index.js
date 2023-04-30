window.appList.get()
window.appList.receive((_event, appList) => {
  for (let i = 0; i < appList.length; i++) {
    $(".app-list").append(`<li><a>${appList[i].name}</a></li>`)
  }
})