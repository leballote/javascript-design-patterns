import notesView from "../views/notesView.js";
import notesModel from "../models/notesModel.js";
import { CommandManager } from "../Command.js";

//initialization
const commandManager = new CommandManager();

start();

//view subscriptions
notesView.subscribe("newNote", (context) => {
  commandManager.exec(new NewNoteCommand());
});
notesView.subscribe("deleteNote", (context) =>
  commandManager.exec(new DeleteNoteCommand(context))
);
notesView.subscribe("saveNote", (context) =>
  commandManager.exec(new SaveNoteCommand(context))
);
notesView.subscribe("selectNote", selectNote);
notesView.subscribe("unselectNote", unselectNote);
notesView.subscribe("searchNotes", renderSearched);
notesView.subscribe("exchangeNotes", (context) => {
  commandManager.exec(new ExchangeNotesCommand(context));
});
notesView.subscribe("undo", undo);

function start() {
  // I didn't know where to put this. I guess I could have done a routers folder or a file for it, but not sure if that follows the mvp pattern
  const { noteId } = getURLQuery();
  renderAllNotes();
  selectNote({ id: noteId }, false);

  window.addEventListener("popstate", () => {
    const { noteId } = getURLQuery();
    selectNote({ id: noteId }, false);
  });
}

//main functions

function renderAllNotes() {
  renderSearched({ text: "" });
}

//TODO: I don't like that having two functions that perform the same operations basically, but I like that the first render doesn't need to be aware of the search term
function renderSearched(context) {
  const { text } = context;
  let notes = notesModel
    .getList()
    .filter(
      (el) =>
        el.title.toLowerCase().includes(text.toLowerCase()) ||
        el.body.toLowerCase().includes(text.toLowerCase())
    )
    .sort((note1, note2) => note1.position - note2.position)
    .map(formatNoteData);
  notesView.createAndReplaceNotes(notes);
}

//crud functions
function newNote() {
  const now = new Date();

  const position = notesModel.length
    ? Math.max(...notesModel.getList().map((note) => note.position)) + 1
    : 0;
  let noteData = {
    title: "",
    body: "",
    creationDate: now.toISOString(),
    lastEditDate: now.toISOString(),
    //TODO: we could increase the performance if we tracked the max position in the model, but I want to keep the model simple
    position: position,
  };
  noteData = notesModel.insert(noteData);
  notesView.createAndInsertNote(formatNoteData(noteData));
  notesView.selectNote(viewId(noteData.id));
  // return as model data
  return noteData;
}

function deleteNote(context) {
  const { id } = context;
  notesView.removeNote(id);
  return notesModel.delete(modelId(id));
}

function saveNote(context) {
  const { id, lastEditDate, noteData: viewData } = context;

  const modelData = notesModel.get(modelId(id));

  let modified =
    modelData.title !== viewData.title || modelData.body !== viewData.body;
  if (!modified) return { previousData: modelData, currentData: modelData };

  const newModelData = {
    title: viewData.title,
    body: viewData.body,
    creationDate: modelData.creationDate,
    lastEditDate: lastEditDate,
    position: modelData.position,
  };
  notesModel.update(modelId(id), newModelData);

  notesView.updateEditTime(id, formatDate(lastEditDate));
  return { previousData: modelData, currentData: newModelData };
}

//other functions
function unselectNote(context, push = true) {
  console.log("unselect note pushing state");
  notesView.unselectNote();
  if (push) {
    history.pushState(null, null, "/src/index.html");
  }
}

function selectNote(context, push = true) {
  const { id } = context;
  console.log("selecting note", id);
  notesView.selectNote(id);
  const newQuery = `/src/index.html?noteId=${id}`;
  const { currentId } = getURLQuery();
  if (id !== currentId && push) {
    console.log("select note pushing state");
    history.pushState(null, null, newQuery);
  }
}

function exchangeNotes(context) {
  const { note1Id, note2Id } = context;
  notesView.exchangeNotes(note1Id, note2Id);
  let note1Data = notesModel.get(modelId(note1Id));
  let note2Data = notesModel.get(modelId(note2Id));

  //exchanging position data
  let temp = note1Data.position;
  note1Data.position = note2Data.position;
  note2Data.position = temp;

  notesModel.update(modelId(note1Id), note1Data);
  notesModel.update(modelId(note2Id), note2Data);
  return context;
}

//This simplifies tha api
function undo() {
  commandManager.undo();
}

//commands
class NewNoteCommand {
  exec() {
    const undoContext = newNote();
    this.undoContext = undoContext;
  }

  undo() {
    const { id } = this.undoContext;
    deleteNote({ id: viewId(id) });
  }
}

class DeleteNoteCommand {
  constructor(context) {
    this.context = context;
  }
  exec() {
    this.undoContext = deleteNote(this.context);
  }

  undo() {
    notesModel.insert(this.undoContext);
    renderSearched({ text: notesView.getSearchValue() });
  }
}

class ExchangeNotesCommand {
  constructor(context) {
    this.context = context;
  }

  exec() {
    exchangeNotes(this.context);
  }

  undo() {
    this.exec();
  }
}

class SaveNoteCommand {
  constructor(context) {
    this.context = context;
  }

  exec() {
    this.undoContext = saveNote(this.context);
  }

  undo() {
    const { previousData, currentData } = this.undoContext;
    notesModel.update(currentData.id, previousData);
    if (
      previousData.title === "" &&
      previousData.body === "" &&
      commandManager.history[commandManager.history.length - 1] instanceof
        NewNoteCommand
    ) {
      commandManager.undo();
    } else {
      renderSearched({ text: notesView.getSearchValue() });
    }
  }
}

//utility functions
function formatNoteData(noteData) {
  const newNoteData = Object.assign({}, noteData);

  const creationDate = new Date(noteData.creationDate);
  const lastEditDate = new Date(noteData.lastEditDate);
  newNoteData.creationDate = formatDate(creationDate);
  newNoteData.lastEditDate = formatDate(lastEditDate);

  return newNoteData;
}

function formatDate(date) {
  if (typeof date === "string") date = new Date(date);
  return date.toLocaleString();
}

function getURLQuery() {
  return new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
}

//translate functions
function modelId(noteId) {
  return noteId.match(/\d+$/)[0];
}

function viewId(noteId) {
  return `note-${noteId}`;
}

// I don't what should be exported from here
const notesPresenter = {
  renderAllNotes,
  renderSearched,
  selectNote,
  unselectNote,
};

export default notesPresenter;
