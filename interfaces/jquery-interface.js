// TODO: based on
// https://raw.githubusercontent.com/solnetdigital/flow-interfaces-jquery/master/interfaces/jquery.js
// but got a bunch of errors on that, so commented some stuff.

/* jshint ignore: start */
declare class _jQueryCallbacks_ {
  attributeCallback(index: number, attr: string): string | number;
}

// type OBJECT_OR_ARRAY = Array | Object;

declare class _jQuery_ {
  constructor(element: Element | string): _jQuery_;

  // attr(attributeName: string): string;
  // attr(attributeName: string, attributeCallback: _jQueryCallbacks_.attributeCallback): _jQuery_;
  // attr(attributeName: string, value: string | number): _jQuery_;
  // attr(attributes: Object): _jQuery_;
  // scrollTop(): number;
  // width(): number;

  // static extend(target: OBJECT_OR_ARRAY, ...w: OBJECT_OR_ARRAY): OBJECT_OR_ARRAY;
  // static extend(deep: boolean, target: OBJECT_OR_ARRAY, ...w: OBJECT_OR_ARRAY): OBJECT_OR_ARRAY;
}

declare module "jQuery" {
  declare function $(element: Element | string): _jQuery_;
}

var $ = require('$').$;

