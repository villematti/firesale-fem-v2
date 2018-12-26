const fs = require('fs');

const { 
    app,
    BrowserWindow,
    dialog,
    Menu
} = require('electron');

let mainWindow = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false
    });

    Menu.setApplicationMenu(applicationMenu);

    mainWindow.loadFile(`${__dirname}/index.html`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
});

const getFileFromUser = exports.getFileFromUser = () => {
    const files = dialog.showOpenDialog({
        properties: ['openFile'],
        buttonLabel: 'Unveil',
        title: 'Open Firesale Document',
        filters: [
            {
                name: 'Markdown Files', 
                extensions: ['md', 'mdown', 'markdown', 'marcdown']
            },
            {
                name: 'Text Files', 
                extensions: ['txt', 'text']
            }
        ]
    });

    if (!files) return;

    const file = files[0];

    openFile(file);
};

exports.saveMarkdown = (filePath, content) => {
    if (!filePath) {
        filePath = dialog.showSaveDialog(mainWindow, {
            title: 'Save Markdown',
            defaultPath: app.getPath('desktop'),
            filters: [
                {
                    name: 'Markdown File',
                    extensions: ['md', 'markdown', 'mdown', 'marcdown']
                }
            ]
        });
    }

    if(!filePath) return;

    fs.writeFileSync(filePath, content);

    app.addRecentDocument(filePath);

    mainWindow.webContents.send('file-opened', filePath, content);
};

exports.saveHtmlFile = (content) => {
    filePath = dialog.showSaveDialog(mainWindow, {
        title: 'Export HTML',
        defaultPath: app.getPath('desktop'),
        buttonLabel: 'Export',
        filters: [
            {
                name: 'HTML File',
                extensions: ['htm', 'html']
            }
        ]
    });

    if(!filePath) return;

    fs.writeFileSync(filePath, content);

    mainWindow.webContents.send('html-saved', filePath);
};

const openFile = exports.openFile = (filePath) => {
    if(!filePath) return;

    const content = fs.readFileSync(filePath).toString();
    
    app.addRecentDocument(filePath);
    
    mainWindow.webContents.send('file-opened', filePath, content);
};

const template = [
    {
        label: 'File',
        submenu: [
            {
            label: 'Open File',
            accelerator: 'CommandOrControl+O',
            click() {
                    getFileFromUser();
                }
            },
            {
                label: 'Save Markdown',
                accelerator: 'CommandOrControl+S',
                click() {
                    mainWindow.webContents.send('save-file');
                }
            },
            {
                label: 'Export HTML',
                accelerator: 'Alt+E',
                click() {
                    mainWindow.webContents.send('save-html');
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                role: 'undo'
            },
            {
                label: 'Redo',
                role: 'redo'
            },
            {
                label: 'Copy',
                role: 'copy'
            },
            {
                label: 'Cut',
                role: 'cut'
            },
            {
                label: 'Paste',
                role: 'paste'
            },
            {
                label: "Select all",
                role: 'selectAll'
            }
        ]
    }
];

if (process.platform === 'darwin') {

    const applicationName = 'Fire Sale';
    template.unshift({
        label: applicationName,
        submenu: [
            {
                label: `About ${applicationName}`,
                role: 'about'
            },
            {
                label: `Quit ${applicationName}`,
                role: 'quit'
            }
        ]
    });
}

const applicationMenu = Menu.buildFromTemplate(template);
