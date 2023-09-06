import sendToServer from "./utils";
import { v4 as uuidv4 } from "uuid";
import Modal from "./modal";

export default class Helpdesk {
  constructor(parent, addButton) {
    this.parentElement = document.querySelector(parent);
    this.addButtonElement = document.querySelector(addButton);

    this.tickets = [];
  }

  async init() {
    try {
      this.tickets = await sendToServer("get", null);
    } catch (error) {
      console.log(error);
    }

    if (this.tickets.length !== 0) {
      this.renderTaskList();
    }

    this.addEvents();
  }

  renderTaskList() {
    if (!this.taskList) {
      this.taskList = document.createElement("ul");
      this.taskList.classList.add("tickets-list");
      this.parentElement.appendChild(this.taskList);
    }

    this.taskList.innerHTML = "";
    this.modal = null;
    this.tickets.forEach((ticket) =>
      this.taskList.appendChild(this.createTaskItem(ticket)),
    );
  }

  createTaskItem({ id, status, title, created }) {
    const taskItem = document.createElement("li");
    taskItem.classList.add("tickets-list__item");
    taskItem.dataset.id = `${id}`;

    taskItem.innerHTML = `
      <div class="item-visible">
        <div class="item-visible left">
          <label class="ticket-button ticket-status">
            <input type="checkbox"/>
          </label>
          <p class="ticket-content">${title}</p>
        </div>
        <div class="item-visible right">
          <p class="ticket-date">${created}</p>
          <div class="ticket-actions">
            <button class="ticket-button edit-button"></button>
            <button class="ticket-button delete-button"></button>
          </div>
        </div>
      </div>
      <div class="item__description">
        <p class="item__description-content">Описание</p>
      </div>
    `;

    if (status) {
      taskItem.querySelector(".ticket-status").classList.add("active");
      taskItem.querySelector("input[type='checkbox']").checked = true;
    }

    const taskItemCheck = taskItem.querySelector(".ticket-status input");
    taskItemCheck.addEventListener("click", (event) => {
      status = event.target.checked;
    });

    this.addEventForTaskItem(taskItem);

    return taskItem;
  }

  collectFullData({ textData, id, status = false }, eventElement = false) {
    const data = {};

    data.id = id || uuidv4();

    if (textData) {
      data.title = textData.title;
      data.description = textData.description;
    }

    const getNewDate = () => {
      const date = new Date();
      const yearShort = date.getFullYear().toString().slice(2, 4);
      const day = date.getDay() < 10 ? `0${date.getDay()}` : date.getDay();
      const month =
        date.getMonth() < 10 ? `0${date.getMonth()}` : date.getMonth();
      const fullDate = `${day}.${month}.${yearShort}`;
      const hours =
        date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
      const minute =
        date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
      const fullTime = `${hours}:${minute}`;
      const createdDate = `${fullDate} ${fullTime}`;

      return createdDate;
    };

    if (this.method === "add") {
      data.created = getNewDate();
    }

    data.status = status;

    this.chooseMethod(data, eventElement);
  }

  async chooseMethod(data, eventElement) {
    if (this.method === "add") {
      try {
        const result = await sendToServer(
          "add",
          data,
          this.modal.querySelector(".modal-form"),
        );

        this.tickets.push(data);
      } catch (error) {
        console.log(error);
      } finally {
        this.modal.remove();
        this.renderTaskList();
      }

      return;
    }

    if (this.method == "delete") {
      try {
        const deletedIndex = await sendToServer(
          "delete",
          data,
          this.modal.querySelector(".modal-form"),
        );
        this.tickets.splice(deletedIndex, 1);
      } catch (error) {
        console.log(error);
      } finally {
        this.modal.remove();
        this.renderTaskList();
      }

      return;
    }

    if (this.method === "edit") {
      try {
        const editedIndex = await sendToServer(
          "edit",
          data,
          this.modal.querySelector("modal-form"),
        );

        this.tickets[editedIndex].title = data.title;
        this.tickets[editedIndex].description = data.description;
      } catch (error) {
        console.log(error);
      } finally {
        this.modal.remove();
        this.renderTaskList();
      }

      return;
    }

    if (this.method === "check") {
      try {
        const checkedIndex = await sendToServer(
          "check",
          data,
          eventElement.closest(".tickets-list__item"),
        );
        eventElement.classList.toggle("active");
      } catch (error) {
        console.log(error);
      }

      return;
    }

    if (this.method === "getDescription") {
      let getDescription;
      try {
        if (
          (eventElement && !eventElement.classList.contains("visible")) ||
          this.modal
        ) {
          getDescription = await sendToServer("getId", data);
        }

        if (!this.modal) {
          eventElement.querySelector(".item__description-content").textContent =
            getDescription;
          return;
        }

        this.modal.querySelector(".modal__description_full input").value =
          getDescription;
      } catch (error) {
        console.log(error);
      } finally {
        if (!this.modal) {
          eventElement.classList.toggle("visible");
        }
      }
    }
  }

  collectTextData() {
    [...this.modal.querySelectorAll("input")].forEach((el) => {
      if (el.value === "") return false;
    });
    const title = this.modal.querySelector(
      ".modal__description_short input",
    ).value;
    const description = this.modal.querySelector(
      ".modal__description_full input",
    ).value;

    return { title, description };
  }

  addEventForTaskItem(item) {
    item.addEventListener("click", async (e) => {
      if (this.modal) {
        this.modal = null;
      }

      if (e.target.closest(".edit-button")) {
        if (!this.modal) {
          this.modal = new Modal("body", "edit").init();

          const ticketTitle = item.querySelector(".ticket-content").textContent;

          this.modal.querySelector(".modal__description_short input").value =
            ticketTitle;
          this.method = "getId";
          this.collectFullData({ id: item.dataset.id });
          this.method = "edit";
          this.createModal(item.dataset.id);
        }
      } else if (e.target.closest(".delete-button")) {
        if (!this.modal) {
          this.modal = new Modal("body", "delete").init();

          this.method = "delete";
          this.createModal(item.dataset.id);
        }
      } else if (e.target.closest(".ticket-status")) {
        this.method = "getId";

        this.collectFullData({ id: item.dataset.id });
      } else {
        this.method = "getDescription";

        this.collectFullData(
          { id: item.dataset.id },
          item.querySelector(".item__description"),
        );
      }
    });

    item
      .querySelector(".ticket-status input")
      .addEventListener("change", (e) => {
        this.method = "check";

        this.collectFullData(
          {
            id: item.dataset.id,
            status: e.target.checked,
          },
          e.target.closest(".ticket-status"),
        );
      });
  }

  createModal(id = undefined) {
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target.closest(".submit-button")) {
          const textData = this.collectTextData();

          if (!textData && this.method !== "delete") return;

          this.collectFullData({ textData, id });
        }
      });
    }
  }

  addEvents() {
    document.querySelector(".header__button").addEventListener("click", (e) => {
      e.preventDefault();
      this.modal = new Modal("body", "add").init();
      this.method = "add";
      this.createModal();
    });
  }
}
