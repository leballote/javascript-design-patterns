import notesView from "../views/notesView.js";
import notesModel from "../models/notesModel.js";
import { CommandManager } from "../Command.js";
import {
  formatNoteData,
  formatDate,
  getURLQuery,
  modelId,
  viewId,
} from "./utils.js";

//initialization
const commandManager = new CommandManager();

initialize();

//view subscriptions
notesView.subscribe(notesView.eventTypes.newNote, (context) => {
  commandManager.exec(new NewNoteCommand());
});
notesView.subscribe(notesView.eventTypes.deleteNote, (context) =>
  commandManager.exec(new DeleteNoteCommand(context))
);
notesView.subscribe(notesView.eventTypes.saveNote, (context) =>
  commandManager.exec(new SaveNoteCommand(context))
);
notesView.subscribe(notesView.eventTypes.selectNote, selectNote);
notesView.subscribe(notesView.eventTypes.unselectNote, unselectNote);
notesView.subscribe(notesView.eventTypes.searchNotes, renderSearched);
notesView.subscribe(notesView.eventTypes.exchangeNotes, (context) => {
  commandManager.exec(new ExchangeNotesCommand(context));
});
notesView.subscribe(notesView.eventTypes.undo, undo);

notesView.subscribe(notesView.eventTypes.loadPage, loadPage);

function initialize() {
  const { noteId } = getURLQuery();
  renderSearched({ text: "" });
  selectNote({ id: noteId }, false);
}

//I am guessing that only the event listener in the window is required in the view
function loadPage(context) {
  const { noteId } = getURLQuery();
  selectNote({ id: noteId }, false);
}

// The idea  of having renderAllNotes and renderSearched separated was to be flexible in the implementation of renderAllNotes, because It could have being done without matching the empty string, and if I wanted to refactor it, then I only had to change the implementation of that function instead of look for every function call of renderSearched with the specific argument {text: ""} and change it for renderAllNotes
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
  notesView.unselectNote();
  if (push) {
    history.pushState(null, null, "./");
  }
}

function selectNote(context, push = true) {
  const { id } = context;
  notesView.selectNote(id);
  const newQuery = `./?noteId=${id}`;
  const { currentId } = getURLQuery();
  if (id !== currentId && push) {
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

const notesPresenter = {
  renderSearched,
  selectNote,
  unselectNote,
};

export default notesPresenter;
