// @flow -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8; compile-command: "cd .. && make -j" -*-
/* global $, Quill, history, console, repl, external */

"use strict";

/* :: type reps = Array<string> */
/* :: type errlist = Array<[string, number, number, string, string, Array<string>]> */
/* :: type result = { text: string, errs: errlist } */
/* :: type cb = (text: string, X:result, off: number) => void */
/* :: type authcb = (text: string) => void */
/* :: type userpass = {u: string, p: string}|null */
/* :: type mode = { src: string, trglang: string, trgsuff: string } */

var debug = window.location.protocol === "file:";
var log = debug ? console.log.bind(window.console) : function() {};

var DEFAULT_LANG = "sme";
var DEFAULT_VARIANT= "smegram";

var l10n = function() {
  if(document.l10n === undefined) {
    console.error("l20n.js failed?");
  }
  // $FlowFixMe
  return document.l10n;
};

// Define our error underlines as a kind of inline formatting in Quill:
let Inline = Quill.import('blots/inline');
class ErrorBlot extends Inline {
  static create(err) {
    let node = super.create();
    if(typeof(err) != "object") {
      console.log("Error creating ErrorBlot, expected object, not "+typeof(err));
      return super.create();
    }
    $(node).data("error", err);
    // TODO: Set css properties directly here instead of having one class per colour?
    var colour = "blue";
    // if(errtypes() == undefined || errtypes().length < err.typ+1 || err.typ == undefined) {
    //   console.log("Couldn't find err.typ "+err.typ+" in errtypes()!");
    // }
    // else if(errtypes()[err.typ].length >= 3) {
    //   colour = errtypes()[err.typ][2];
    // };
    $(node).addClass("class", "error-"+colour);
    return node;
  }
  static formats(node) {
    return $(node).data("error");
  }

  /**
   * Changes DOM
   */
  showrep(beg/*:number*/,
          len/*:number*/
         )/*:void*/
  {
    var spanoff = $(this.domNode).offset(),
        newoff = { top:  spanoff.top+20,
                   left: spanoff.left },
        repmenu = $('#repmenu'),
        at_same_err = repmenu.offset().top == newoff.top && repmenu.offset().left == newoff.left;
    if(repmenu.is(":visible") && at_same_err) {
      hiderep();
    }
    else {
      repmenu.show();
      repmenu.offset(newoff);
      if(!at_same_err) {
        this.makerepmenu(beg, len);
      }
    }
  };

  /**
   * Changes DOM
   * Populates menu.
   * TODO: ignore-button
   */
  makerepmenu(beg/*:number*/,
              len/*:number*/
             ) {
    var span = this.domNode,
        err = $(span).data("error");
    // We're looking at a new error, populate the table anew:
    $("#repmenu_tbl").empty();
    var tbody = $(document.createElement('tbody'));
    tbody.attr("role", "listbox");

    // typ is internal note?
    // var tr_typ =  $(document.createElement('tr')),
    // td_typ =  $(document.createElement('td')),
    // a_typ =  $(document.createElement('span'));
    // a_typ.text(err.typ);
    // a_typ.attr("aria-disabled", "true");
    // td_typ.append(a_typ);
    // td_typ.addClass("repmenu_typ");
    // tr_typ.append(td_typ);
    // tbody.append(tr_typ);

    if(err.msg == "") {
      err.msg = "Ukjend feiltype";
    }
    var tr_msg =  $(document.createElement('tr')),
    td_msg =  $(document.createElement('td')),
    a_msg =  $(document.createElement('span'));
    a_msg.html(err.msg);
    a_msg.attr("aria-disabled", "true");
    td_msg.append(a_msg);
    td_msg.addClass("repmenu_msg");
    tr_msg.append(td_msg);
    tbody.append(tr_msg);

    err.rep.map(function(r){
      var tr_rep =  $(document.createElement('tr')),
          td_rep =  $(document.createElement('td')),
          a_rep =  $(document.createElement('a'));
      if(r == "") {
        a_rep.text("(fjern)");
      }
      else {
        a_rep.text(r.replace(/ /g, " ")); // ensure they're not trimmed away, e.g. at ends
      }
      if(r.lastIndexOf(" ", 0)==0 || r.indexOf(" ",r.length-1)==r.length-1) {
        // start/end is a space, ensure it's visible:
        a_rep.addClass("hl-space");
      }
      a_rep.attr("role", "option");
      td_rep.append(a_rep);
      td_rep.addClass("repmenu_rep");
      td_rep.addClass("repmenu_nonfirst");
      // has to be on td since <a> doesn't fill the whole td
      td_rep.click({ beg: beg,
                     len: len,
                     r: r
                   },
                   replaceErr);
      tr_rep.append(td_rep);
      tbody.append(tr_rep);
    });

    // TODO: ignores?
    var tr_ign =  $(document.createElement('tr')),
    td_ign =  $(document.createElement('td')),
    a_ign =  $(document.createElement('a'));
    l10n().formatValue('hide_errtype').then(function(t){ a_ign.text(t); });
    a_ign.attr("role", "option");
    td_ign.append(a_ign);
    td_ign.addClass("repmenu_ign");
    td_ign.addClass("repmenu_nonfirst");
    tr_ign.append(td_ign);
    tbody.append(tr_ign);
    a_ign.click({ err: err },
                function(e) {
                  var err = e.data.err;
                  var igntyps = safeGetItem("igntyps", new Set());
                  igntyps.add(err.typ);
                  safeSetItem("igntyps", igntyps);
                  updateIgnored();
                  check();
                });

    $("#repmenu_tbl").append(tbody);
  };

}
ErrorBlot.blotName = 'error';
ErrorBlot.tagName = 'span';
ErrorBlot.className = 'error';
Quill.register(ErrorBlot);

var replaceErr = function(e) {
  hiderep();
  var delta = { ops:[
    { retain: e.data.beg },
    { delete: e.data.len },
    { insert: e.data.r }
  ]};
  // source=user since user clicked "replace":
  quill.updateContents(delta, "user");
  atMostOneSpace(e.data.beg);
  checkOnIdle(2000);
  quill.focus();
};

/**
 * Changes DOM
 */
var hiderep = function()/*:void*/
{
  //log("hiderep");
  var repmenu = $('#repmenu');
  repmenu.offset({top:0, left:0}); // avoid some potential bugs with misplacement
  repmenu.hide();
};


var onSelectionChange = function(range, _oldRange, source) {
  if(range != null && range.length === 0 && source === 'user') {
    var erroroffset = quill.scroll.descendant(ErrorBlot, range.index),
        error = erroroffset[0],
        offset = erroroffset[1];
    if(error != null) {
      if($(error.domNode).data("error")) {
        var beg = range.index - offset,
            len = error.length();
        error.showrep(beg, len);
      }
      else {
        console.log("descendant ErrorBlot at", range.index, "had no data, clearing markup");
        quill.formatText(range.index - offset, error.length(), "error", false);
      }
    }
  }
};

var atMostOneSpace = function(i) {
  var t = getFText();
  while(t[i-1] == " ") {
    i--;
  }
  var len = 0;
  while(t[i+len] == " ") {
    len++;
  }
  // If there were more than two spaces, leave just one:
  if(len > 1) {
    quill.deleteText(i, len-1, "user");
  }
};


var clearErrs = function () {
  quill.formatText(0, quill.getLength(), "error", false);
};

var removeIgnored = function (e) {
  console.log("remove", e.data.typ);
  var igntyps = safeGetItem("igntyps", new Set());
  igntyps.delete(e.data.typ);
  safeSetItem("igntyps", igntyps);
  updateIgnored();
  check();
};

var updateIgnored = function()/*:void*/
{
  var igntyps = safeGetItem("igntyps", new Set());
  var ign = $('#igntyps');
  ign.empty();
  if(igntyps.size > 0) {
    igntyps.forEach(function(typ){
      let a =
          $('<a class="glyphicon glyphicon-remove pull-right">')
          .click({ typ: typ }, removeIgnored);
      let elt =
          $('<li class="ma2">')
          .text(typ)
          .append(a);
      ign.append(elt);
    });
  }
  else {
    var elt = $(document.createElement('li'));
    l10n().formatValue('hide_errtype_explanation').then(function(t){ elt.text(t); });
    ign.append(elt);
  }
  $('#igntyps-wrapper button').addClass('glyphicon glyphicon-refresh glyphicon-refresh-animate  ');
  $('#igntyps-wrapper button').removeClass('glyphicon glyphicon-refresh glyphicon-refresh-animate  ');
};

var mergeErrs = function(errs/*:errlist*/)/*:errlist*/ {
  let byIndices = groupBy(errs, (x) => {
    return x[1].toString() + "→" + x[2].toString(); // beg→end
  });
  return Array.from(byIndices.values()).map((val) => {
    if(val.length > 1) {
      return val.reduce((x1, x2) => {
        // TODO: What's the best way of representing overlapping errors here?
        return [x1[0],
                x1[1],
                x1[2],
                x1[3] + "/" + x2[3],
                x1[4] + "\n / \n" + x2[4],
                x1[5].concat(x2[5])
               ];
      });
    }
    else {
      return val[0];
    }
  });
};

var applyErrs = function(text, res/*:result*/, off/*:number*/) {
  var igntyps = safeGetItem("igntyps", new Set());
  let mergedErrs = mergeErrs(res.errs);
  mergedErrs.forEach((x) => {
    var length = x[2] - x[1];
    // log(x);
    var err = {
      str: x[0], 
      beg: x[1] + off,
      end: x[2] + off,
      len: length,
      typ: x[3],
      rep: x[5],
      msg: x[4]
    };
    if(igntyps.has(err.typ)) {
      return;
    }
    if(err.str !== text.substr(err.beg, err.len)) {
      // TODO: should we fail/skip if form differs?
      console.warn("Unexpected difference between error string '" + err.str + "' and text at error indices '" + text.substr(err.beg, err.len) + "'");
    }
    quill.formatText(err.beg,
                     err.len,
                     "error",
                     err);
  });
  log(res);
  $("#serverfault").hide();
};


var toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  ['link'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['clean'],                    // ie. remove formatting
  ['check'],
];

var quill = new Quill('#editor', {
  modules: {
    toolbar: {
      container: toolbarOptions,
      handlers: {
        check: function(_val) { check(); }
      }
    }
  },
  theme: 'snow',
  placeholder: 'Čális dása, dahje válljes ovdmearkka dás vuolábealde'
});

// quill.formatText treats videos/images as having a length of one,
// while quill.getText treats them as having a length of zero – the
// following allows round-tripping without mixing up indices:
var getFText = function() {
  return quill
    .getContents()
    .ops
    .map(function(op) {
      return typeof op.insert === 'string' ? op.insert : ' ';
    })
    .join('');
};

var searchToObject = function ()
{
  // like http://stackoverflow.com/a/7090123/69663 but check for '='
  var pairs = window.location.search.substring(1).split("&"),
      obj = {};
  for (var i in pairs) {
    if (pairs[i].indexOf('=') > -1) {
      var pair = pairs[i].split("=");
      var key = pair[0],
          val = pair[1].replace(/\+/g, '%20');
      obj[decodeURIComponent(key)] = decodeURIComponent(val);
    }
  }
  return obj;
};

var hostname/*:string*/ = window.location.hostname === "" ? "localhost" : window.location.hostname;
var port/*:string*/ = hostname === "localhost" ? "2737" : window.location.port;
var protocol/*:string*/ = hostname === "localhost" ? "http:" : window.location.protocol;
var subdir/*:string*/ = hostname === "localhost" ? "" : "/apy";

if(hostname === "localhost") {
  hostname = "gtweb.uit.no";
  port = "80";
  protocol = "http:";
  subdir = "/apy";
}

// TODO: apy should have an endpoint for grammar checkers, and expect its modes files in a separate dir!
// (endpoint both for listing and "translate")
var modesUrl/*:string*/ = protocol+"//"+hostname+":"+(port.toString())+subdir+"/listPairs";
var checkUrl/*:string*/ = protocol+"//"+hostname+":"+(port.toString())+subdir+"/translateRaw";
log(checkUrl);
var hunUrl/*:string*/ = protocol+"//"+hostname+":"+(port.toString())+subdir+"/hunspell";

$(document).ready(function() {
  if(window.location.host.match("^localhost:") || window.location.protocol === "file:") {
    console.log("Connecting to skewer …");
    var s = document.createElement('script');
    s.src = 'https://localhost:38443/skewer';
    if(document.body) {
      document.body.appendChild(s);
    }
  }
});

var hideLogin = function () {
  $("#serverfault").hide();
  $("#loginform").hide();
  $("#content").removeClass("blur");
  $("#login-wrapper").removeClass("block-view");
  $("#logout").show();
};

var showLogin = function () {
  // caller decides whether to show #serverfault
  $("#loginform").show();
  $("#content").addClass("blur");
  $("#login-wrapper").addClass("block-view");
  $("#logout").hide();
};

function utoa(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1/*:number*/) {
      return String.fromCharCode(parseInt('0x' + p1));
    }));
}

var basicAuthHeader = function (userpass) {
  // If we stored a previously successful auth *and* password is
  // unset, first try that:
  if(userpass != null) {
    return "Basic " + utoa(userpass.u + ":" + userpass.p);
  }
  else {
    $("#serverfault").html("Čállet go beassansáni boastut?");
    $("#serverfault").show();
    showLogin();
    return "Basic TODO";
  }
};

var langToMode = function(lang/*:string*/, variant/*:string*/)/*:string*/ {
  return lang + "|" + lang + "_" + variant;
};



var checkXHR/*:Array<JQueryXHR>*/ = [];
var servercheck = function(userpass/*:userpass*/,
                           text/*:string*/,
                           off/*:number*/,
                           cb/*:cb*/,
                           mode/*:string*/
                          )/*:JQueryXHR*/
{
  log("servercheck:");
  // TODO: Should this be synchronous? We can't really change the text
  // after the user has typed unless the text still matches what we
  // sent.
  let url = checkUrl;
  let data = {
      langpair: mode,
      q: text
  };
  if(getVariant(searchToObject()) === "hunspell") {
    url = hunUrl;
    data = {
      lang: getLang(searchToObject()),
      q: text
    };
  }
  return $.ajax(url, {
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Authorization", basicAuthHeader(userpass));
    },
    type: "POST",
    data: data,
    success: function(res) {
      cb(text, res, off);
    },
    error: function(jqXHR, textStatus/*:string*/, errXHR/*:string*/)/*:void*/ {
      console.log("error: "+textStatus+"\n"+errXHR);
      console.log(jqXHR);
      console.log(jqXHR.status);
      if(textStatus === "abort" && jqXHR.status === 0) {
        // So the user clicked before the server managed to respond, no problem.
        return;
      }
      else if(textStatus === "parsererror" && jqXHR.status === 200) {
        l10n().formatValue('parserfail',
                           { errorCode: jqXHR.status + " " + errXHR,
                             textStatus: textStatus })
          .then(function(t){
            $("#serverfault").html(t).show();
          });
      }
      else if(textStatus === "error" && jqXHR.status === 0) {
        l10n().formatValue('serverdown')
          .then(function(t){
            $("#serverfault").html(t).show();
          });
      }
      else {
        l10n().formatValue('loginfail',
                           { errorCode: jqXHR.status + " " + errXHR,
                             textStatus: textStatus })
          .then(function(t){
            $("#serverfault").html(t).show();
          });
        $("#serverfault").show();
        showLogin();
      }
    },
    dataType: "json"
  });
};

var groupBy = function/*::<T:any, K:any>*/(list/*:Array<T>*/, keyGetter/*:(T => K)*/)/*:Map<K, Array<T>>*/ {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
};

var modes/*:{ [string]: Array<mode>}*/ = {};

var getModes = function()/*: void*/ {
  let _xhr = $.ajax(modesUrl, {
    type: "GET",
    data: {},
    success: function(res){
      let modelist/*:Array<mode>*/ = res.responseData.map(function(m) {
        let src = m.sourceLanguage;
        let trg = m.targetLanguage;
        let trgsuff = trg.replace(/^[^_]*_/, "");
        let trglang = trg.replace(/_.*/, "");
        return { src: src, trglang: trglang, trgsuff: trgsuff };
      }).filter(function(mm) {
        return mm.src == mm.trglang && mm.trgsuff.match(/(gram|spell)/);
      });
      // skewer.log(modes);
      Array.from(groupBy(modelist, (m) => { return m["src"]; }).entries()).map(function([k, elts]){
        modes[k] = elts;
        elts.forEach(modeToDropdown);
      });
    },
    dataType: "json"
  });
  modeToDropdown({ src: "se_NO", trglang: "se_NO", trgsuff: "hunspell" });
};

var modeToDropdown = function(m/*:mode*/)/*:void*/ {
  let lang = m.src,
      variant = m.trgsuff;
  let a =
      $('<a>')
      .text(lang + " " + variant)
      .on('click', function(_ev) {
        window.location.search = '?lang=' + lang + "&variant=" + variant;
        updateVariantDropdown(lang, variant);
      });
  let li =
      $('<li class="mode ma2">')
      .append(a)
      .data("lang", lang)
      .data("variant", variant);
  $('#modes').append(li);
};

var getLang = function(search) {
  if(search.lang !== undefined) {
    return search.lang;
  }
  else {
    return DEFAULT_LANG;
  }
};

var getVariant = function(search) {
  if(search.variant !== undefined) {
    return search.variant;
  }
  else {
    return DEFAULT_VARIANT;
  }
};

/**
 * Return max index i of str such that str.substr(0, i) is smaller
 * than max_B bytes when encoded in UTF-8
 */
var u8maxlen = function(str/*:string*/, max_B/*:number*/)/*:number*/ {
  let len = str.length;
  let blen = 0;
  var best = 0;
  for (let i = 0; i < len; i++) {
    let code = str.charCodeAt(i);
    if (code > 0x7F && code <= 0x7FF) {
      blen += 2;                // e.g. å
    }
    else if (code >= 0xD800 && code <= 0xDBFF) {
      i++;       // first part of surrogate pair, e.g. 𝌆, so skip other half
      blen += 4; // the whole thing is 4 UTF-8 bytes
    }
    else if (code > 0x7FF && code <= 0xFFFF) {
      blen += 3;                // e.g. ☃
    }
    else {
      blen += 1;                // e.g. a
    }
    if(blen <= max_B) {
      best = i+1;
    }
    else {
      break;
    }
  }
  return best;
};

var test_u8maxlen = function() {
  assert(0 === u8maxlen(""    , 0), "0");
  assert(0 === u8maxlen("a"   , 0), "a0");
  assert(0 === u8maxlen("æ"   , 0), "æ0");
  assert(0 === u8maxlen("æøå" , 0), "æøå0");
  assert(0 === u8maxlen("aæøå", 0), "aæøå0");
  assert(0 === u8maxlen(""    , 1), "1");
  assert(1 === u8maxlen("a"   , 1), "a1");
  assert(0 === u8maxlen("æ"   , 1), "æ1");
  assert(0 === u8maxlen("æøå" , 1), "æøå1");
  assert(1 === u8maxlen("aæøå", 1), "aæøå1");
  assert(0 === u8maxlen(""    , 2), "2");
  assert(1 === u8maxlen("a"   , 2), "a2");
  assert(1 === u8maxlen("æ"   , 2), "æ2");
  assert(1 === u8maxlen("æøå" , 2), "æøå2");
  assert(1 === u8maxlen("aæøå", 2), "aæøå2");
  assert(2 === u8maxlen("aaøå", 2), "aaæøå2");
  assert(0 === u8maxlen(""    , 3), "3");
  assert(1 === u8maxlen("a"   , 3), "a3");
  assert(1 === u8maxlen("æ"   , 3), "æ3");
  assert(1 === u8maxlen("æøå" , 3), "æøå3");
  assert(2 === u8maxlen("aæøå", 3), "aæøå3");
  assert(2 === u8maxlen("aaøå", 3), "aaæøå3");
  assert(0 === u8maxlen("𝌆"   , 0), "𝌆0");
  assert(0 === u8maxlen("𝌆"   , 1), "𝌆1");
  assert(0 === u8maxlen("𝌆"   , 2), "𝌆2");
  assert(0 === u8maxlen("𝌆"   , 3), "𝌆3");
  assert(2 === u8maxlen("𝌆"   , 4), "𝌆4");
  assert(2 === u8maxlen("𝌆"   , 5), "𝌆5");
  return "all good";
};

var assert = function(condition, message) {
  if (!condition) {
    message = message || "Assertion failed";
    throw new Error(message);
  }
};

let APYMAXBYTES = 4096; // TODO: APY endpoint to return select.PIPE_BUF ?

var lastSentenceEnd = function(str) {
  let sep = /[.:!?]\s/g;
  let found = 0;
  for(let res = sep.exec(str);
      res !== null;
      res = sep.exec(str)) {
    found = res.index + res.length;
  }
  if (found === 0) {
    let lastSpace = str.lastIndexOf(" ");
    if(lastSpace !== -1) {
      return lastSpace;
    }
    else {
      return str.length - 1;
    }
  }
  return found;
};

/* Find a length `i` s.t. `str.substr(0, i)` takes less than `max`
 * bytes when encoded in UTF-8, but more than `max*.8`, and preferably
 * ends with ". "
 */
var textCutOff = function(str/*:string*/, max_B/*:number*/)/*:number*/ {
  let len = str.length;
  let maxu8 = u8maxlen(str, max_B);
  // if it's shorter anyway, this is trivial:
  if(len <= maxu8) {
    return len;
  }
  // we'd like to find a cut-off point that looks like a sentence boundary
  // but not if that means cutting off too far back, so start
  // searching near the end:
  let minu8 = Math.floor(0.8 * maxu8);
  let sub = str.substring(minu8, maxu8);
  let found = lastSentenceEnd(sub);
  console.log(minu8, maxu8, found+minu8+1);
  return minu8 + found + 1;     // +1 because we want length, not index
};

var updateVariantDropdown = function(lang/*:string*/, variant/*:string*/)/*:void*/ {
  $('#the-variant').text(lang + " " + variant);
  $('#modes').find('li.mode').map(function(i, li){
    let $li = $(li);
    if($li.data("lang") === lang && $li.data("variant") === variant) {
      $li.addClass("mode-selected");
    }
    else {
      $li.removeClass("mode-selected");
    }
  });
};

var check = function() {
  let search = searchToObject(),
      lang = getLang(search),
      variant = getVariant(search),
      mode = langToMode(lang, variant);
  updateVariantDropdown(lang, variant);
  clearErrs();
  let text = getFText();
  window.localStorage["text"] = JSON.stringify(quill.getContents());

  let userpass = safeGetItem("userpass",
                             readLoginFormStoring());
  if(userpass == null) {
    showLogin();
  }
  else {
    while(checkXHR.length > 0) {
      // We only ever want to have the latest check results:
      checkXHR.pop().abort();
    }
    checkSubText(userpass, text, 0, mode);
  }
};

var checkSubText = function(userpass/*:userpass*/, text/*:string*/, off/*:number*/, mode/*:string*/)/*:void*/ {
  let max = textCutOff(text.substr(off), APYMAXBYTES);
  let subtext = text.substr(off, max);
  let next_off = off + max;
  if(next_off < text.length) {
    let cont = function(t, res, o) {
      checkSubText(userpass, text, next_off, mode);
      applyErrs(t, res, o);
    };
    checkXHR.push(servercheck(userpass, subtext, off, cont, mode));
  }
  else {
    checkXHR.push(servercheck(userpass, subtext, off, applyErrs, mode));
  }
};

var readLoginFormStoring = function()/*:userpass*/ {
  // What kind of failures can $('#id').val() give?
  var userpass = { u: $('#user').val(),
                   p: $('#password').val() };
  if(userpass.u != "" && userpass.p != "") {
    window.localStorage.setItem("userpass", JSON.stringify(userpass));
    return userpass;
  }
  else {
    return null;                // like JSON.parse(localStorage) gives
  }
};

var loginFromForm = function() {
  var userpass = readLoginFormStoring();
  if(userpass != null) {
    hideLogin();
  }
  // Ensure we don't reload the page (due to input type submit):
  return false;
};

var loginOnEnter = function (e) {
  if(e.which == 13) {
    loginFromForm();
  }
};

var loginOnClick = function (e) {
  loginFromForm();
  return false;
};

var idleTimer = null;
var checkOnIdle = function(delay=3000) {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(check, delay);
};

var onTextChange = function(delta, oldDelta, source) {
  if (source == 'api') {
  }
  else if (source == 'user') {
    // Note that our own replaceErr events are also source==user
    hiderep();
    checkOnIdle();
  }
};

var logout = function (e) {
  showLogin();
  window.localStorage.removeItem("userpass");
  $('#user').val("");
  $('#password').val("");
  return false;
};

var initSpinner = function() {
    $("#spinner").hide();
    $("#editor").removeClass("loading");
    $(document)
      .ajaxStart(function () {
        $("#spinner").show();
        $("#editor").addClass("loading");
        $(".ql-check").addClass("glyphicon glyphicon-refresh spinning");
        $(".ql-check").addClass("loading-check");
      })
      .ajaxStop(function () {
        $("#spinner").hide();
        $("#editor").removeClass("loading");
        $(".ql-check").removeClass("glyphicon glyphicon-refresh spinning");
        $(".ql-check").removeClass("loading-check");
      });

};

var safeSetItem = function/*::<T>*/(key/*:string*/, value/*:T*/)/*:void*/ {
  if(value && value.constructor && value.constructor.name === "Set") {
    // $FlowFixMe
    window.localStorage.setItem(key, JSON.stringify(Array.from(value)));
  }
  else {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

var safeGetItem = function/*::<T>*/(key/*:string*/, fallback/*:T*/)/*:T*/ {
  var fromStorage = window.localStorage.getItem(key);
  if(fromStorage == null) {
    return fallback;
  }
  else {
    try {
      var parsed = JSON.parse(fromStorage);
      if(parsed != null) {
        if(fallback && fallback.constructor && fallback.constructor.name === "Set") {
          // $FlowFixMe
          return new Set(parsed);
        }
        else{
          return parsed;
        }
      }
    }
    catch(e) {
      console.log(e);
    }
    return fallback;
  }
};

var initExamples = function()/*:void*/{
  // A bit of a hack: the messages example1 through example20 contain
  // the texts (with example1_title etc. containing the button title).
  // l20n.js unfortunately can't give us a list of all strings that
  // exist, so we have a hardcoded max of 20.
  var req = [],
      max = 20;
  for(var i = 1; i <= max; i++) {
    req.push('example'+i.toString()+'_title');
    req.push('example'+i.toString());
  }
  l10n().formatValues.apply(l10n(), req)
    .then(function(res) {
      var titles = [], texts = [];
      for(var i = 0; i < res.length; i++) {
        if(i % 2 === 0) {
          titles.push(res[i]);
        }
        else {
          texts.push(res[i]);
        }
      }
      for(i = 0; i < titles.length; i++) {
        if(titles[i].match(/^example[0-9]+_title$|^$|^""$/)) {
          // l20n.js just uses the input string as the "untranslated" value :-/
          continue;
        }
        var node = $(document.createElement('button'));
        node.text(titles[i]);
        node.attr("type", "button");
        node.addClass("btn btn-default");
        $(node).click({ text: texts[i] },
                      function (e) {
                        quill.setContents({ ops: [ { insert: e.data.text } ] });
                        check();
                      });
        $('#examples').append(node);
        $('#examples').append(" ");
      }
    });
};

var initL10n = function(lang/*:string*/)/*:void*/ {
  l10n().requestLanguages([lang]);
  l10n().formatValue('editor_placeholder')
    .then(function(t) {
      $('.ql-editor').attr('data-placeholder', t);
    });
  var el = $('<link/>');
  el.attr('rel', 'stylesheet');
  el.attr('href', 'locales/'+lang+'.css');
  $('head').append(el);
};

var init = function()/*:void*/ {
  if(window.location.protocol == "http:") {
    $('#password').attr("type", "text");
  }

  $('#login_b').click(loginOnClick);
  $('#password').keypress(loginOnEnter);
  $('#user').keypress(loginOnEnter);
  $('#logout_b').click(logout);
  $("#editor").click(hiderep);
  $("body").click(hiderep);

  initSpinner();

  getModes();

  var search = searchToObject();
  initL10n(getLang(search));
  initExamples();

  $.ajaxSetup({
    statusCode: {
      "401": function(){
        showLogin();
      }
    }
  });

  quill.on('text-change', onTextChange);
  quill.on('selection-change', onSelectionChange);

  var initText = { ops: [] };
  if(search.q !== undefined) {
    initText = { ops: [{ insert: search.q }]};
    window.location.search = ""; // so a reload doesn't undo the localStorage
  }
  else {
    initText = safeGetItem("text", initText);
  }
  quill.setContents(initText);
  clearErrs();
  hiderep();
  updateIgnored();
  check();
};

$(document).ready(init);
