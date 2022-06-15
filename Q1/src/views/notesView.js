import makeRezisable from "../makeRezisable.js";
import PubSub from "../PubSub.js";

//using a noteTemplate is not as modular as I would like
const noteTemplate = document.getElementById("note-template");
const notesElement = document.getElementById("notes");
const blackBack = document.getElementById("black-back");
const newNoteBtn = document.getElementById("new-note-btn");
const searchBox = document.getElementById("search-box");
const undoBtn = document.getElementById("undo-btn");

//the only state in the app
let currentSelected = null;

const notesView = new PubSub();

newNoteBtn.addEventListener("click", () => {
  notesView.publish("newNote", {});
});

blackBack.addEventListener("click", () => {
  notesView.publish("saveNote", {
    id: currentSelected.id,
    lastEditDate: new Date().toISOString(),
    noteData: getNoteData(currentSelected),
  });
  notesView.publish("unselectNote", {});
});

notesElement.addEventListener("click", (evt) => {
  const noteEl = evt.target.closest(".note");
  const saveButton = evt.target.closest(".save-note");
  const deleteButton = evt.target.closest(".delete-note");
  const closeButton = evt.target.closest(".close-btn");

  if (noteEl) {
    if (saveButton) {
      notesView.publish("saveNote", {
        id: noteEl.id,
        lastEditDate: new Date().toISOString(),
        noteData: getNoteData(noteEl),
      });
    } else if (deleteButton) {
      notesView.publish("deleteNote", {
        id: noteEl.id,
      });
    } else if (closeButton) {
      blackBack.click();
    } else {
      notesView.publish("selectNote", {
        id: noteEl.id,
      });
    }
  }
});

searchBox.addEventListener("input", (evt) => {
  notesView.publish("searchNotes", {
    text: evt.target.value,
  });
});

notesElement.addEventListener("dragstart", (ev) => {
  const note = ev.target.closest(".note");
  if (note) {
    ev.dataTransfer.dropEffect = "move";
    ev.dataTransfer.setData("text/plain", note.id);
  }
});

notesElement.addEventListener("dragover", (ev) => {
  const note = ev.target.closest(".note");
  if (note) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }
});

notesElement.addEventListener("drop", (ev) => {
  const note = ev.target.closest(".note");
  if (note) {
    ev.preventDefault();

    const note1Id = ev.dataTransfer.getData("text/plain");
    const context = {
      note1Id: note1Id,
      note2Id: note.id,
    };
    notesView.publish("exchangeNotes", context);
  }
});

undoBtn.addEventListener("click", (ev) => {
  notesView.publish("undo", null);
});

document.addEventListener("keydown", (ev) => {
  if (ev.ctrlKey && ev.key === "z") {
    if (!currentSelected) {
      ev.preventDefault();
      notesView.publish("undo", null);
    }
  }
});

//functions

function getSearchValue() {
  return searchBox.value;
}

function createNote(noteData) {
  const note = noteTemplate.content.cloneNode(true).querySelector(".note");
  fillNote(note, noteData);
  return note;
}

function createNotes(noteDataList) {
  return noteDataList.map((noteData) => createNote(noteData));
}

function insertNote(noteEl, position) {
  if (typeof noteEl === "string") noteEl = getNote();
  position = position ?? notesElement.children.length;
  if (position >= notesElement.children.length) {
    notesElement.appendChild(noteEl);
  } else {
    const nextNote = notesElement.children[position];
    notesElement.insertBefore(noteEl, nextNote);
  }
}

function insertNotes(notesList, positions) {
  positions = positions ?? [...Array(notesList.length).keys()];
  if (positions.length !== positions.length) {
    throw new Error("NotesList and positions must have the same length");
  }
  for (let i = 0; i < notesList.length; i++) {
    const noteEl = notesList[i];
    const position = positions[i];
    insertNote(noteEl, notesElement, position);
  }
}

function removeNote(noteEl) {
  if (typeof noteEl === "string") noteEl = getNote(noteEl);
  noteEl.remove();
  if (currentSelected === noteEl) unselectNote();
}

function updateEditTime(noteEl, lastEditDate) {
  if (typeof noteEl === "string") noteEl = getNote(noteEl);
  noteEl.querySelector(".note-last-edit-date").textContent = lastEditDate;
}

function replaceNotes(notesList) {
  notesElement.replaceChildren(...notesList);
}

function createAndInsertNote(noteData, position) {
  const noteEl = createNote(noteData);
  insertNote(noteEl, notesElement, position);
}

function createAndInsertNotes(noteDataList, positions) {
  const notesList = createNotes(noteDataList);
  insertNotes(notesList, notesElement, positions);
}

function createAndReplaceNotes(noteDataList, positions) {
  const notesList = createNotes(noteDataList);
  replaceNotes(notesList, positions);
}

function fillNote(noteEl, noteData) {
  const noteTitle = noteEl.querySelector(".note-title");
  const noteBody = noteEl.querySelector(".note-body");

  noteTitle.value = noteData.title;
  noteBody.value = noteData.body;
  noteEl.querySelector(".note-creation-date").textContent =
    noteData.creationDate;
  noteEl.querySelector(".note-last-edit-date").textContent =
    noteData.lastEditDate;

  noteEl.id = `note-${noteData.id}`;

  makeRezisable(noteTitle);
  makeRezisable(noteBody);
}

function selectNote(noteEl) {
  if (noteEl == null) unselectNote();
  if (typeof noteEl === "string") {
    noteEl = document.querySelector(`.note#${noteEl}`);
  }
  if (noteEl && noteEl != currentSelected) {
    noteEl.classList.add("selected");
    noteEl.querySelector(".note-title").readOnly = false;
    noteEl.querySelector(".note-body").readOnly = false;
    unselectNote();
    currentSelected = noteEl;
    noteEl.draggable = false;
    blackBack.style.setProperty("display", "block");
  }
}

function unselectNote() {
  if (currentSelected) {
    currentSelected.classList.remove("selected");
    currentSelected.querySelector(".note-title").readOnly = true;
    currentSelected.querySelector(".note-body").readOnly = true;
    currentSelected.draggable = true;
    blackBack.style.display = "";
    currentSelected = null;
  }
}

function getNote(noteId) {
  return document.querySelector(`.note#${noteId}`);
}

function getNoteData(noteEl) {
  if (noteEl === "string") noteEl = getNote(noteEl);
  const noteData = {
    id: noteEl.id,
    title: noteEl.querySelector(".note-title").value,
    body: noteEl.querySelector(".note-body").value,
  };
  return noteData;
}

function exchangeNotes(note1, note2) {
  if (typeof note1 == "string") note1 = getNote(note1);
  if (typeof note2 == "string") note2 = getNote(note2);
  const parent1 = note1.parentNode;
  const parent2 = note2.parentNode;

  let ph = document.createElement("div");

  parent2.insertBefore(ph, note2);

  parent1.replaceChild(note2, note1);
  parent2.replaceChild(note1, ph);
}

const toExport = {
  //getters
  getSearchValue,

  //create notes
  createAndInsertNote,
  createAndInsertNotes,
  createAndReplaceNotes,

  // notesRelated edit related
  fillNote,
  updateEditTime,

  //notes delete
  removeNote,

  // notes state
  selectNote,
  unselectNote,

  //others
  exchangeNotes,
};

Object.assign(notesView, toExport);

export default notesView;
