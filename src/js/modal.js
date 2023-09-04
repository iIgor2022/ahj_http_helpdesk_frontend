export default class Modal {
  constructor(parent, method) {
    this.parentElement = parent;
    this.method = method;
  }

  init() {
    this.modal = document.createElement("div");
    this.modal.classList.add("modal");

    const addButton = document.querySelector(".header__button");

    addButton.addEventListener("click", () => {
      this.modal.classList.add("visible");
    });

    if (this.method === "delete") {
      this.modal.classList.add("delete-task");
    };

    let titleTicket;

    switch (this.method) {
      case "add":
        titleTicket = "Добавить";
        break;

      case "edit":
        titleTicket = "Изменить";
        break;

      case "delete":
        titleTicket = "Удалить";
        break;

      default:
        break;
    }

    this.modal.innerHTML = `
      <form class="modal-form visible" name="taskmanager-form">
        <div class="modal-form__header">
          <p>${titleTicket} тикет</p>
        </div>
        <label class="modal__descriprtion_short">Краткое описание
          <input class="edit-input" name="short-description" type="text">
        </label>
        <label class="modal__description_full">Подробное описание
          <input class="edit-input full" name="long-description" type="text">
        </label>
        <p class="modal__awarening">Вы уверены, что хотите удалить тикет? Это действие необратимо</p>
        <div class="modal-form__button-container">
          <button class="button cancel-button" type="button">Отмена</button>
          <button class="button submit-button" type="button">Ok</button>
        </div>
      </form>
    `;

    this.parentElement.appendChild(this.modal);
    this.addEvents();
    return this.modal;
  }

  addEvents() {
    this.modal.addEventListener("click", e => {
      e.preventDefault();

      if (e.target.classList.contains("modal") || e.target.closest(".cancel-button")) {
        this.removeModal();
      }
    })
  }

  removeModal() {
    this.modal.remove();
  }
}
