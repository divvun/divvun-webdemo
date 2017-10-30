// @flow -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8; compile-command: "cd .. && make -j" -*-
/* global $, Quill, history, console, repl, external */

"use strict";

/* :: type reps = Array<string> */
/* :: type errlist = Array<[string, number, number, string, string, Array<string>]> */
/* :: type result = { text: string, errs: errlist } */
/* :: type cb = (text: string, X:result, off: number) => void */
/* :: type authcb = (text: string) => void */
/* :: type userpass = {u: string, p: string}|null */

var debug = window.location.protocol === "file:";
var log = debug ? console.log.bind(window.console) : function() {};

var DEFAULT_LANG = "sme";

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
      var elt = $(document.createElement('li'));
      elt.text(typ);
      var x = $(document.createElement('span'));
      x.addClass("glyphicon");
      x.addClass("glyphicon-remove");
      x.addClass("pull-right");
      x.click({ typ: typ }, removeIgnored);
      elt.append(x);
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


var applyErrs = function(text, res/*:result*/, off/*:number*/) {
  var igntyps = safeGetItem("igntyps", new Set());
  res.errs.forEach(function(x) {
    var length = x[2] - x[1];
    log(x);
    var err = {
      str: x[0], // TODO: should we assert that the form is the same?
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

var checkUrl/*:string*/ = protocol+"//"+hostname+":"+(port.toString())+subdir+"/translateRaw";
log(checkUrl);

$(document).ready(function() {
  if(window.location.host.match("^localhost:")) {
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

var langToMode = function(lang/*:string*/)/*:string*/ {
  return lang + "|" + lang + "_gram";
};



var checkXHR/*:Array<JQueryXHR>*/ = [];
var servercheck = function(userpass/*:userpass*/,
                           text/*:string*/,
                           off/*:number*/,
                           cb/*:cb*/,
                           lang/*:string*/
                          )/*:JQueryXHR*/
{
  log("servercheck:");
  // TODO: Should this be synchronous? We can't really change the text
  // after the user has typed unless the text still matches what we
  // sent.
  return $.ajax(checkUrl, {
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Authorization", basicAuthHeader(userpass));
    },
    type: "POST",
    data: {
      langpair: langToMode(lang), // TODO: UI thingy
      q: text
    },
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

var supportedLangs = ["sme", "fao"]; // TODO: validate in getLang

var getLang = function(search) {
  if(search.lang !== undefined) {
    return search.lang;
  }
  else {
    return DEFAULT_LANG;
  }
};


let APYMAXBYTES = 4096; // TODO: APY endpoint to return select.PIPE_BUF ?

var lastSentenceEnd = function(str) {
  let sep = /[.:!]\s/g;
  let found = 0;
  for(let res = sep.exec(str);
      res !== null;
      res = sep.exec(str)) {
    found = res.index + res.length;
  }
  return found;
};

/* Find a length `i` s.t. `str.substr(0, i)` takes less than `max`
 * bytes when encoded in UTF-8, but more than `max*.8`, and preferably
 * ends with ". "
 */
var textCutOff = function(str/*:string*/, max/*:number*/)/*:number*/ {
  let len = str.length;
  // worst-case, str is made up of code points that all take 4 bytes in UTF-8:
  let maxu8 = max/4;
  // if it's shorter anyway, this is trivial:
  if(len < maxu8) {
    return len;
  }
  // we'd like to find a cut-off point that looks like a sentence boundary
  // but not if that means cutting off too far back, so start
  // searching near the end:
  let minu8 = 0.8 * maxu8;
  let sub = str.substring(minu8, maxu8);
  let found = lastSentenceEnd(sub);
  return minu8 + found + 1;     // +1 because we want length, not index
};

var check = function() {
  var lang = getLang(searchToObject());
  clearErrs();
  var text = getFText();
  window.localStorage["text"] = JSON.stringify(quill.getContents());

  var userpass = safeGetItem("userpass",
                             readLoginFormStoring());
  if(userpass == null) {
    showLogin();
  }
  else {
    let len = text.length;
    let off = 0;
    while(checkXHR.length > 0) {
      // We only ever want to have the latest check results:
      checkXHR.pop().abort();
    }
    while(off < len) {
      let max = textCutOff(text.substr(off), APYMAXBYTES);
      let subtext = text.substr(off, max);
      checkXHR.push(servercheck(userpass, subtext, off, applyErrs, lang));
      off += max;
    }
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

