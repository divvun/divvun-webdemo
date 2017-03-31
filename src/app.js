// @flow -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8; compile-command: "cd .. && make -j" -*-
/* global $, CKEDITOR, skewer, history, console, repl, external */

"use strict";

/* :: type reps = Array<string> */
/* :: type errlist = Array<[string, number, number, string, string, Array<string>]> */
/* :: type result = { text: string, errs: errlist } */
/* :: type cb = (text: string, X:result) => void */
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



var supportedLangs = ["sme", "fao"]; // TODO: validate in getLang

var getLang = function(search) {
  if(search.lang !== undefined) {
    return search.lang;
  }
  else {
    return DEFAULT_LANG;
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

var showLogin = function () {
  // caller decides whether to show #serverfault
  $("#loginform").show();
  $("#content").addClass("blur");
  $("#login-wrapper").addClass("block-view");
  $("#logout").hide();
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

var safeGetItem = function/*::<T>*/(key/*:string*/, fallback/*:T*/)/*:T*/ {
  var fromStorage = window.localStorage.getItem(key);
  if(fromStorage == null) {
    return fallback;
  }
  else {
    try {
      var parsed = JSON.parse(fromStorage);
      if(parsed != null) {
        return parsed;
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
        if(titles[i].match(/^example[0-9]+_title$|^$/)) {
          // l20n.js just uses the input string as the "untranslated" value :-/
          continue;
        }
        var node = $(document.createElement('button'));
        node.text(titles[i]);
        node.attr("type", "button");
        node.addClass("btn btn-default");
        $(node).click({ text: texts[i] },
                      function (e) {
                        // quill.setContents({ ops: [ { insert: e.data.text } ] });
                        CKEDITOR.instances.ckeditor.setData(e.data.text.replace("\n", "<br>"));
                        // check();
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
};

var init = function()/*:void*/ {
  if(window.location.protocol == "http:") {
    $('#password').attr("type", "text");
  }

  $('#login_b').click(loginOnClick);
  $('#password').keypress(loginOnEnter);
  $('#user').keypress(loginOnEnter);
  $('#logout_b').click(logout);

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

  CKEDITOR.plugins.addExternal('divvungc', window.location.href + '/ck-plugins/divvungc/', 'plugin.js');
  CKEDITOR.replace( 'ckeditor', {
    extraPlugins: 'divvungc'
  });

  // quill.on('text-change', onTextChange);
  // quill.on('selection-change', onSelectionChange);

  var initCKText = "";
  if(search.q !== undefined) {
    initCKText = search.q;
    window.location.search = ""; // so a reload doesn't undo the localStorage
  }
  else {
    initCKText = safeGetItem("cktext", initCKText);
  }

  CKEDITOR.on('instanceCreated', function (e) {
    console.log("instanceCreated");
    e.editor.setData(initCKText);
    // if(e.editor.name == 'ckeditor') {
    //   e.editor.setData(initCKText);
    // }
  });
  CKEDITOR.instances.ckeditor.setData(initCKText);
  // check();
};
$(document).ready(init);

// range.selectCharacters(body, 2, 10);console.log(range.text());range.surroundContents($('<abbr title="hi">')[0])
