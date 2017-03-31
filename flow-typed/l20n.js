// -*- mode: javascript -*-

declare class DocumentLocalization {
  static constructor(requestBundles?: any, createContext?: any): DocumentLocalization;
  requestLanguages(Array<string>): Promise<Array<Array<string>>>;
}

declare module 'l20n' {
  declare var exports: Class<DocumentLocalization>;
}

var DocumentLocalization = require('l20n');

// TODO:
// document.l10n = new DocumentLocalization();

