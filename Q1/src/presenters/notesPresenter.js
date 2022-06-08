import notesView from "../views/notesView.js";
import notesModel from "../models/notesModel.js";
import { Command, CommandManager } from "../Command.js";

renderNotes();

const commandManager = new CommandManager();

notesView.pubSub.subscribe("newNote", newNote);
notesView.pubSub.subscribe("deleteNote", deleteNote);
notesView.pubSub.subscribe("saveNote", saveNote);
notesView.pubSub.subscribe("selectNote", selectNote);
notesView.pubSub.subscribe("unselectNote", unselectNote);
notesView.pubSub.subscribe("searchNotes", renderSearched);
notesView.pubSub.subscribe("exchangeNotes", exchangeNotes);

function renderSearched(context) {
  const { text } = context;
  let notes = notesModel
    .getList()
    .filter(
      (el) =>
        el.title.toLowerCase().includes(text.toLowerCase()) ||
        el.body.toLowerCase().includes(text.toLowerCase())
    )
    .sort((note1, note2) => note1.position - note2.position);
  console.log(notes);
  notesView.createAndReplaceNotes(notes);
}

function renderNotes() {
  const notes = notesModel
    .getList()
    .sort((note1, note2) => note1.position - note2.position);
  console.log(notes);
  notesView.createAndReplaceNotes(notes);
}

function newNote() {
  const now = new Date();
  const position =
    Math.max(...notesModel.getList().map((note) => note.position)) + 1;
  console.log(position);
  let noteData = {
    title: "",
    body: "",
    creationDate: now.toISOString(),
    lastEditDate: now.toISOString(),
    //TODO: we could increase the performance if we tracked the max position in the model
    position: position,
  };
  console.log(noteData);
  noteData = notesModel.insert(noteData);
  notesView.createAndInsertNote(formatNoteData(noteData));
  notesView.selectNote(viewId(noteData.id));
}

function deleteNote(context) {
  //TODO: even though is not important for functionality, it would be great if the positions get normalized on deletion so we only have positions from 0 to notes.length - 1
  const { id } = context;
  notesView.removeNote(id);
  notesModel.delete(modelId(id));
}

function saveNote(context) {
  const { id, lastEditDate, noteData: viewData } = context;

  const modelData = notesModel.get(modelId(id));

  let modified =
    modelData.title !== viewData.title || modelData.body !== viewData.body;
  if (!modified) return;

  const newModelData = {
    title: viewData.title,
    body: viewData.body,
    creationDate: modelData.creationDate,
    lastEditDate: lastEditDate,
    position: modelData.position,
  };
  notesModel.update(modelId(id), newModelData);

  notesView.updateEditTime(id, formatDate(lastEditDate));
}

function unselectNote() {
  notesView.unselectNote();
}

function selectNote(context) {
  const { id } = context;
  notesView.selectNote(id);
}

function updateNotesView(noteDataList, selectedNote) {
  extendedList =
    selectedNote != null ? [...noteDataList, selectedNote] : noteDataList;
  positions = noteDataList.map((el) => el.position);
  notesView.createAndReplaceNotes(extendedList, positions);

  if (selectedNote == null) {
    notesView.unselectNote();
  } else {
    notesView.selectNote(selectedNote);
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
}

//commands
function NewNoteCommand() {
  new Command(
    (noteData) => {},
    () => {}
  );
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

function modelId(noteId) {
  return noteId.match(/\d+$/)[0];
}

function viewId(noteId) {
  return `note-${noteId}`;
}

// // const notesPresenter = { formatNoteData, updateNotesView};

export default {};
