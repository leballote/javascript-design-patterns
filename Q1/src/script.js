let temp;

let notesList = [
  {
    id: "note-1",
    title: "First Note!",
    body: "This is my very first note, and it is really important.",
    creationDate: "2020-01-01",
    lastEditDate: "2020-01-01",
  },
  {
    id: "note-2",
    title: "Remember",
    body: "don't forget to feed the cat this Thursday.",
    creationDate: "2021-06-01",
    lastEditDate: "2021-12-03",
  },
  {
    id: "note-3",
    title: "Really, remember",
    body: "Seriously, don't forget it.",
    creationDate: "2022-11-16",
    lastEditDate: "2022-12-03",
  },
];
let lastId = 6;

if (localStorage.notes == null) {
  localStorage.notes = JSON.stringify(notesList);
  localStorage.lastId = lastId;
}
notesList = JSON.parse(localStorage.notes);
notesListLocal = JSON.parse(localStorage.notes);
lastId = parseInt(localStorage.lastId);

const notes = document.getElementById("notes");
const noteTemplate = document.getElementById("note-template");
const blackBack = document.getElementById("black-back");
const newNoteBtn = document.getElementById("new-note-btn");

const resizeObserverTextarea = new ResizeObserver((entries) => {
  entries.forEach((el) => {
    resizeTextarea(el.target);
  });
});

let urlQuery = getURLQuery();

let currentSelected = null;

renderNotes();

selectNote(urlQuery.noteId);

window.addEventListener("popstate", () => {
  const noteId = getURLQuery().noteId;
  selectNote(noteId);
});

notes.addEventListener("click", (evt) => {
  const note = evt.target.closest(".note");
  const saveButton = evt.target.closest(".save-note");
  const deleteButton = evt.target.closest(".delete-note");
  if (saveButton) {
    updateNote(note);
  } else if (deleteButton) {
    deleteNote(note);
  } else if (note) {
    selectNote(note);
  }
});

notes.addEventListener("input", (evt) => {
  let text = evt.target.closest("textarea");
  if (text) {
    resizeTextarea(text);
  }
});

notes.addEventListener("keydown", function (evt) {
  let text = evt.target.closest("textarea");
  if (text) {
    if (evt.key === "Tab") {
      evt.preventDefault();
      const start = text.selectionStart;
      const end = text.selectionEnd;
      text.setRangeText("\t", start, end, "end");
    }
  }
});

blackBack.addEventListener("click", (evt) => {
  unSelectNote();
});

newNoteBtn.addEventListener("click", (evt) => {
  newNote();
});

function renderNotes() {
  const notesElements = [];
  for (let noteData of notesList) {
    const note = noteTemplate.content.cloneNode(true).querySelector(".note");
    notesElements.push(note);
    fillNote(note, noteData);
  }

  //I know I could have use a note fragment but not sure if here is the best thing to do, because then it will render all the notes together, which may be more performant, but be seen more slow to the user if he doesn't see anythin render in a while.
  for (let note of notesElements) {
    notes.appendChild(note);
  }
}

function selectNote(note) {
  if (typeof note === "string") {
    note = document.querySelector(`.note#${note}`);
  }
  if (note == null) {
    unSelectNote();
    return;
  }
  if (note != currentSelected) {
    note.classList.add("selected");
    note.querySelector(".note-title").readOnly = false;
    note.querySelector(".note-body").readOnly = false;
    unSelectNote();
    currentSelected = note;
    blackBack.style.setProperty("display", "block");
    history.pushState(null, null, `?noteId=${note.id}`);
  }
}

function unSelectNote(save = true) {
  if (currentSelected) {
    currentSelected.classList.remove("selected");
    currentSelected.querySelector(".note-title").readOnly = true;
    currentSelected.querySelector(".note-body").readOnly = true;
    blackBack.style.display = "";
    if (save) updateNote(currentSelected);
    currentSelected = null;
    history.pushState(null, null, `index.html`);
  }
}

function newNote() {
  notesList = JSON.parse(localStorage.notes);
  const note = noteTemplate.content.cloneNode(true).querySelector(".note");
  const now = new Date();
  console.log(lastId);
  const noteData = {
    id: `note-${lastId++}`,
    title: "",
    body: "",
    creationDate: now.toISOString(),
    lastEditDate: now.toISOString(),
  };
  localStorage.lastId = parseInt(lastId);
  fillNote(note, noteData);
  notesList.push(noteData);
  notes.appendChild(note);
  selectNote(note);
  saveNotesState();
}

function updateNote(note, idx = null) {
  notesList = JSON.parse(localStorage.notes);
  if (idx == null) {
    idx = notesList.findIndex((el) => el.id == note.id);
  }
  const now = new Date();
  const titleChanged = updateNoteTitle(note, (idx = idx));
  const bodyChanged = updateNoteBody(note, (idx = idx));
  if (titleChanged || bodyChanged) {
    noteData = notesList[idx];
    noteData.lastEditDate = now.toISOString();
    note.querySelector(".note-last-edit-date").textContent = formatDate(now);
    saveNotesState();
  }
}

function updateNoteTitle(note, idx = null) {
  const noteTitle = note.querySelector(".note-title");
  if (idx == null) {
    idx = notesList.findIndex((el) => el.id == note.id);
  }
  console.log(idx);
  const noteData = notesList[idx];
  const changed = noteData.title !== noteTitle.value;
  if (changed) {
    noteData.title = noteTitle.value;
  }
  return changed;
}

function updateNoteBody(note, idx = null) {
  const noteBody = note.querySelector(".note-body");
  if (idx == null) {
    idx = notesList.findIndex((el) => el.id == note.id);
  }
  const noteData = notesList[idx];
  const changed = noteData.body !== noteBody.value;
  if (changed) {
    noteData.body = noteBody.value;
  }
  return changed;
}

function deleteNote(note, idx = null) {
  notesList = JSON.parse(localStorage.notes);
  if (currentSelected === note) {
    unSelectNote((save = false));
  }
  note.remove();
  if (idx == null) {
    idx = notesList.findIndex((el) => el.id == note.id);
  }
  notesList.splice(idx, 1);
  saveNotesState();
}

function resizeTextarea(text) {
  text.style.height = "";
  text.style.setProperty("height", text.scrollHeight + "px");
}

function formatDate(date) {
  return date.toLocaleString();
}

function getURLQuery() {
  return new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
}
