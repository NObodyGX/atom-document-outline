// 'use babel';
const {CompositeDisposable} = require('atom');
const {MDLanguage} = require('./languages/markdown');
const {AdocLanguage} = require('./languages/asciidoc');
const {OutlineView} = require('./outline-view');

const MODEL_CLASS_FOR_SCOPES = {
  'source.gfm': MDLanguage,
  'text.html.markdown.source.gfm.apib': MDLanguage,
  'text.md': MDLanguage,
  'source.pweave.md': MDLanguage,
  'source.weave.md': MDLanguage,
  'source.asciidoc': AdocLanguage,
};

const SUPPORTED_SCOPES = Object.keys(MODEL_CLASS_FOR_SCOPES);

module.exports = {
  activate() {
    this.update.bind(this);

    atom.contextMenu.add({'div.document-outline': [{
      label: 'Toggle outline',
      command: 'document-outline:toggle'
    }]});

    // View and document model for the active pane
    this.docModel = null;
    this.view = new OutlineView();
    this.subscriptions = new CompositeDisposable();
    // subscriptions for the currently active editor, cleared on tab switch
    this.editorSubscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-document-outline:toggle': () => {
        atom.workspace.toggle(this.view);
      }
    }));

    this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem(pane => {
      this.updateCurrentEditor(pane);
    }));
  },

  updateCurrentEditor(editor) {
    if (!editor) {
      return;
    }

    // Only text panes have scope descriptors
    // Note that we don't clear if the current pane is not a text editor,
    // because the docks count as panes, so focusing a dock would clear
    // the outline
    if (atom.workspace.isTextEditor(editor)) {
      let scopeDescriptor = editor.getRootScopeDescriptor();
      if (this.scopeIncludesOne(scopeDescriptor.scopes, SUPPORTED_SCOPES)) {
        this.editor = editor;
        this.docModel = this.getDocumentModel(editor);
        this.editorSubscriptions.dispose();

        this.editorSubscriptions.add(editor.onDidStopChanging(() => {
          this.update(editor);
        }));
        this.update(editor);
      } else {
        // this is an editor, but not a supported language
        this.docModel = null;
        if (this.view) {
          this.view.clear();
          this.editorSubscriptions.dispose();
          // if (!atom.config.get("document-outline.showByDefault")) {
          //   atom.workspace.hide(this.view);
          // }
        }
      }
    }
  },

  update(editor) {
    if (this.view) {
      if (this.docModel) {
        let outline = this.docModel.getOutline();
        if (outline) {
          this.view.update({outline, editor});
        }
      } else {
        this.view.clear();
      }
    }
  },

  deactivate() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
      this.docModel = null;
    }
    this.editorSubscriptions.dispose();
    this.subscriptions.dispose();
  },

  scopeIncludesOne(scopeDescriptor, scopeList) {
    for (let scope of scopeList) {
      if (scopeDescriptor.includes(scope)) {
        return scope;
      }
    }
    return false;
  },

  getDocumentModel(editor) {
    let docModel = null;

    let scope = this.scopeIncludesOne(editor.getRootScopeDescriptor().scopes, SUPPORTED_SCOPES);
    let ModelClass = MODEL_CLASS_FOR_SCOPES[scope];
    if (ModelClass) {
      docModel = new ModelClass(editor);
    }

    return docModel;
  }
};
