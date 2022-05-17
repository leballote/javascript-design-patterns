let temp;

let notesList = [
    {
        "id": "note-1",
        "title": "First Note!",
        "body": "This is my very first note, and it is really important.",
        "creationDate": "this is the creation date",
        "lastEditDate": "yesterday hehe",
    },
    {
        "id": "note-2",
        "title": "Remember",
        "body": "don't forget to feed the cat this Thursday.",
        "creationDate": "this is the creation date",
        "lastEditDate": "yesterday hehe",
    }, 
    {
        "id" : "note-3",
        "title": "Really, remember", 
        "body": "Seriously, don't forget it.",
        "creationDate": "this is the creation date",
        "lastEditDate": "yesterday hehe",
    },
    {
        "id" : "note-4",
        "title": "Another", 
        "body": "Seriously, don't forget it.",
        "creationDate": "now",
        "lastEditDate": "then",
    },
    {
        "id" : "note-5",
        "title": "Yet, another note, this one is huge", 
        "body": 

`Hola

Hi
This
Note
Is
Huge
And
I
Think
You
Should
Know
It
you 
really
really
really
really
really
really
really
have
to
scroll`,
        "creationDate": "now",
         "lastEditDate": "then",       
    }
]
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

const resizeObserverTextarea = new ResizeObserver(entries => {
    entries.forEach(el => {
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


notes.addEventListener("click", evt =>  {
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

notes.addEventListener("input", evt => {
    let text = evt.target.closest("textarea");
    if (text) {
        resizeTextarea(text);
    }
});

blackBack.addEventListener("click", evt => {
    unSelectNote(); 
});

newNoteBtn.addEventListener("click", evt => {
    newNote();
});

setInterval(() => {
    synchronize();
}, 4000);



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
        // note = note.cloneNode(true);
        note.classList.add("selected");
        note.querySelector(".note-title").readOnly = false;
        note.querySelector(".note-body").readOnly = false;
        unSelectNote();
        currentSelected = note;
        blackBack.style.setProperty("display", "block");
        history.pushState(null, null, `?noteId=${note.id}`);
    }
}

function unSelectNote(save=true) {
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
    const note = noteTemplate.content.cloneNode(true).querySelector(".note");
    const now = new Date(); 
    const noteData = {
        id: `note-${lastId}`,
        title: "",
        body: "",
        creationDate: now.toISOString(),
        lastEditDate: now.toISOString(),
    };
    fillNote(note, noteData);
    notesList.push(noteData);
    notesListLocal.push(noteData);
    lastId++; 
    notes.appendChild(note);
    selectNote(note);
}

function fillNote(note, noteData) {
    if (typeof note === "string" || typeof note === "number") note = document.getElementById(note);
    const noteTitle = note.querySelector(".note-title"); 
    const noteBody = note.querySelector(".note-body");

    noteTitle.value = noteData.title;
    noteBody.value = noteData.body;
    const creationDate = new Date(noteData.creationDate);
    const lastEditDate = new Date(noteData.lastEditDate);
    note.querySelector(".note-creation-date").textContent = formatDate(creationDate);
    note.querySelector(".note-last-edit-date").textContent = formatDate(lastEditDate);
    note.id = noteData.id;
    resizeObserverTextarea.observe(noteTitle);
    resizeObserverTextarea.observe(noteBody);
}


//from = notesList or notesListLocal
function updateNote(note, idx=null, from="both", save=true) {
    if (from === "notesList") {
        notesList = JSON.parse(localStorage.notes);
        from = notesList;
    } else if (from === "notesListLocal") {
        from = notesListLocal;
    } else if (from === "both") {
        const changed = updateNote(note, null, "notesList");
        updateNote(note, null, "notesListLocal", false);
        return changed; 
    }
    if (idx == null) {
        idx = from.findIndex(el => el.id == note.id);
    }
    const now = new Date();
    const titleChanged = updateNoteTitle(note, idx=idx, from);
    const bodyChanged = updateNoteBody(note, idx=idx, from);
    if (titleChanged || bodyChanged) {
        noteData = from[idx];
        noteData.lastEditDate = now.toISOString();
        note.querySelector(".note-last-edit-date").textContent = formatDate(now);
        if (save) saveNotesState();
    }
}

function updateNoteTitle(note , idx=null, from="both") {
    if (from === "notesList") {
        notesList = JSON.parse(localStorage.notes);
        from = notesList;
    } else if (from === "notesListLocal") {
        from = notesListLocal;
    } else if (from === "both") {
        const changed = updateNoteTitle(note, null, "notesList");
        updateNoteTitle(note, null, "notesListLocal");
        return changed; 
    }
    const noteTitle = note.querySelector(".note-title");
    if (idx == null) {
        idx = from.findIndex(el => el.id == note.id);
    }
    const noteData = from[idx]; 
    temp = idx;
    const changed = (noteData.title !== noteTitle.value);
    if (changed) {
        noteData.title = noteTitle.value;
    }
    return changed;
}

function updateNoteBody(note, idx=null, from="both") {
    if (from === "notesList") {
        notesList = JSON.parse(localStorage.notes);
        from = notesList;
    } else if (from === "notesListLocal") {
        from = notesListLocal;
    } else if (from === "both") {
        updateNoteBody(note, null, "notesList");
        updateNoteBody(note, null, "notesListLocal");
        return; 
    }
    const noteBody = note.querySelector(".note-body");
    if (idx == null) {
        idx = from.findIndex(el => el.id == note.id);
    }
    const noteData = from[idx]; 
    const changed = noteData.body !== noteBody.value;
    if (changed) {
        noteData.body = noteBody.value;
    }
    return changed;
}


function deleteNote(note, idx=null, idxLocal) {
    notesList = JSON.parse(localStorage.notes);    
    if (currentSelected === note) {
        unSelectNote(save=false);
    }
    note.remove();

    if (idx == null) 
        idx = notesList.findIndex(el => el.id == note.id);
    
    if (idxLocal == null)
        idx = notesListLocal.findIndex(el => el.id == note.id);

    notesList.splice(idx, 1);
    notesListLocal.splice(idxLocal, 1);
    saveNotesState();
}

function synchronize() {
    console.log("synchronizing");
    let i = 0, j = 0;
    while (i < notesList.length && j < notesListLocal.length) {
        noteReal = notesList[i];
        noteLocal = notesListLocal[j];
        if (noteReal.id === noteLocal.id) {
            let equal = true;
            for (const key in noteReal) {
                if (noteReal[key] != noteLocal) {
                    equal = false;
                } 
            }
            if (!equal) {
                fillNote(noteReal.id, noteReal);
            }
            i++;
            j++;
        }
        if (noteReal.id < noteLocal.id) {
            const noteAfter = document.getElementById(`note-${noteLocal.id}`);
            const noteBefore = noteAfter.cloneNode(true);
            fillNote(noteBefore, noteReal);
            i++;
        }
        if (noteReal.id > noteLocal.id) {
            const noteBefore = document.getElementById(`note-${noteLocal.id}`);
            noteBefore.remove();
            j++;
        }
        i++;
        j++;
    }
}

function saveNotesState() {
    localStorage.notes = JSON.stringify(notesList);
    console.log("saving state in local storage");
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
