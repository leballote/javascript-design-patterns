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

export { formatNoteData, formatDate, getURLQuery, modelId, viewId };
