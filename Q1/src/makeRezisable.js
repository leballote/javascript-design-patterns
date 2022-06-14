const resizeObserverTextarea = new ResizeObserver((entries) => {
  entries.forEach((el) => {
    resizeTextarea(el.target);
  });
});

function resizeTextarea(text) {
  text.style.height = "";
  text.style.setProperty("height", text.scrollHeight + "px");
}

const resizeTexteareaThrouhParent = (evt) => {
  let text = evt.target.closest("textarea");
  if (text) {
    resizeTextarea(text);
  }
};

export default function makeRezisable(textarea, delegate = true) {
  const parent = textarea.parentElement;
  const listener = delegate ? parent : textarea;
  const resizeFunc = delegate ? resizeTexteareaThrouhParent : resizeTextarea;
  resizeObserverTextarea.observe(textarea);
  listener.addEventListener("input", resizeFunc);
}
