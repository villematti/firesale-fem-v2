const path = require('path');

const { remote, ipcRenderer, shell } = require('electron');

const mainProcess = remote.require('./main');
const currentWindow = remote.getCurrentWindow();

let filePath = null;
let originalContent = '';

const marked = require('marked');

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

const renderMarkdownToHtml = markdown => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = (isEdited) => {
  isEdited = isEdited ? true : false;

  let title = 'Fire Sale';

  const edited =  isEdited ? "*" : "";
  saveMarkdownButton.disabled =  !isEdited;
  revertButton.disabled = !isEdited;

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;

    currentWindow.setRepresentedFilename(filePath);
  }

  showFileButton.disabled = !filePath;
  openInDefaultButton.disabled = !filePath;

  currentWindow.setDocumentEdited(isEdited);

  title = `${edited}${title}`;

  currentWindow.setTitle(title);
};

newFileButton.addEventListener('click', () => {
  filePath = null;
  originalContent = "";
  markdownView.value = "";
  renderMarkdownToHtml("");
});

const saveHtml = () => {
  const content = htmlView.innerHTML;

  mainProcess.saveHtmlFile(content);
};

saveHtmlButton.addEventListener('click', saveHtml);

markdownView.addEventListener('keyup', event => {
  const currentContent = event.target.value;

  renderMarkdownToHtml(currentContent);
  
  updateUserInterface(currentContent !== originalContent);
});

ipcRenderer.on('save-html', saveHtml);

openFileButton.addEventListener('click', () => {
  mainProcess.getFileFromUser();
});

const saveMarkdown = () => {
  mainProcess.saveMarkdown(filePath, markdownView.value);
};

saveMarkdownButton.addEventListener('click', saveMarkdown);

ipcRenderer.on('save-file', saveMarkdown);

ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file;
  originalContent = content;
  
  markdownView.value = content;
  renderMarkdownToHtml(content);

  updateUserInterface();
});

showFileButton.addEventListener('click', () => {
  if (!filePath) {
    return alert("No file selected!");
  }

  shell.showItemInFolder(filePath);
});

openInDefaultButton.addEventListener('click' , () => {
  if (!filePath) {
    return alert("No file selected!");
  }

  shell.openItem(filePath);
});

ipcRenderer.on('html-saved', (event, file) => {
  alert(`HTML saved to ${file}`);
});

document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragleave', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());

const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const fileTypeisSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};

markdownView.addEventListener('dragover', (event) => {
  const file = getDraggedFile(event);

  if(fileTypeisSupported(file)) {
    markdownView.classList.add('drag-over');
  } else {
    markdownView.classList.add('drag-error');
  }
});

markdownView.addEventListener('dragleave', (event) => {
  removeDragClasses();
});

markdownView.addEventListener('drop', (event) => {

  const file = getDroppedFile(event);

  if (fileTypeisSupported(file)) {
    mainProcess.openFile(file.path);
  } else {
    alert('That file type is not supported!');
  }

  removeDragClasses();
});

const removeDragClasses = () => {
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
};