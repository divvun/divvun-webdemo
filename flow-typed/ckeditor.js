// -*- mode: javascript -*-

// Very minimal and loose type checking of CKEditor API

type CKOptions = { extraPlugins: string };
type CKScriptLoader = {
  // TODO: how do I say that these are the two alternatives? (where if string, the callback just gets a single bool?)
  // load: (scriptUrl: string, callback?: (loaded: bool) => void, scope?: any, showBusy?: bool) => void;
  load: (scriptUrl: Array<string>, callback?: (loaded: Array<bool>, failed: Array<bool>) => void, scope?: any, showBusy?: bool) => void;
};
type CKElement = any;
type CKSelection = {
  getStartElement: () => CKElement
};
type CKEditorInstance = {
  addContentsCss: (cssPath: string) => void,
  getSelection: (forceRealSelection?: bool) => null|CKSelection,
  insertElement: (element: CKElement) => void,
  document: any,
  editable: any,
  ui: any,
  on: any,
  addMenuItem: any,
  addMenuGroup: any,
  contextMenu: any,
  addCommand: any
};
type CKPluginOptions = {
  requires?: string, icons: string, init: (editor: CKEditorInstance) => void
};
type CKPlugins = {
  addExternal: (name: string, dir: string, file: string) => void,
  add: (name: string, options: CKPluginOptions) => void,
  get: (name: string) => Object,
  registered: Object
};
type CKDialogInstance = Object;
type CKDialog = {
  add: (name: string, dialog: (string|(editor: CKEditorInstance) => CKDialogInstance)) => void,
  validate: Object
};

declare class CKDialogCommand {
  static constructor(): CKDialogCommand;
}

declare class CKEDITOR {
  static getUrl(resource: string): string;
  static replace(id: string, options: CKOptions): void;
  static plugins: CKPlugins;
  static scriptLoader: CKScriptLoader;
  static instances: Object;
  static dialog: CKDialog;
  static TRISTATE_OFF: number;
  static dialogCommand(name: string): CKDialogCommand;
  static on(event: string, f: (ev: any) => any): void;
  static document: any;
  static addCss(css: string): void;
}

declare module 'ckeditor' {
  declare var exports: Class<CKEDITOR>;
}
