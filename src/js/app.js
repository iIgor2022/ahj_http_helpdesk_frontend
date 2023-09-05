import Helpdesk from "./helpdesk";

document.addEventListener("DOMContentLoaded", () => {
  const mainTaskManager = new Helpdesk(".helpdesk", "tickets__container");

  mainTaskManager.init();
});
