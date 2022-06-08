import notesModel from "./models/notesModel.js";
import notesView from "./views/notesView.js";
import notesPresenter from "./presenters/notesPresenter.js";

window.notesPresenter = notesPresenter;
window.notesView = notesView;
window.notesModel = notesModel;

if (notesModel.size === 0) {
  let notesList = [
    {
      title: "First Note!",
      body: "This is my very first note, and it is really important.",
      creationDate: "2020-01-01",
      lastEditDate: "2020-01-01",
      position: 0,
    },
    {
      title: "Remember",
      body: "don't forget to feed the cat this Thursday.",
      creationDate: "2021-06-01",
      lastEditDate: "2021-12-03",
      position: 1,
    },
    {
      title: "Really, remember",
      body: "Seriously, don't forget it.",
      creationDate: "2022-11-16",
      lastEditDate: "2022-12-03",
      position: 2,
    },
  ];

  for (const noteData of notesList) {
    notesModel.insert(noteData);
  }
}

// notesView.createAndInsertNotes(notesModel.getList().filter( note => note.title.toLowerCase().includes("remember".toLowerCase()) ));
