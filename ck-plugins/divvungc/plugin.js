// @flow -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8; -*-
/* global $, CKEDITOR, rangy, history, console, repl, external */

"use strict";

/* :: type reps = Array<string> */
/* :: type errlist = Array<[string, number, number, string, string, Array<string>]> */
/* :: type result = { text: string, errs: errlist } */
/* :: type cb = (text: string, X:result) => void */
/* :: type authcb = (text: string) => void */
/* :: type userpass = {u: string, p: string}|null */

(function(){
delete CKEDITOR.plugins.registered['divvungc'];

CKEDITOR.plugins.add('divvungc', {
  // requires: '',          // TODO: require contextmenu?

  icons: 'divvungc',

  TODO: function(arg) {
    console.log("Move more functions out of init1 and into more testable functions like this", arg);
  },

  beforeInit: function(editor) {
    editor.addContentsCss(this.path + 'styles/divvungc.css');
  },

  loadHandle: function(next) {
    return function(loaded, failed) {
      if(failed instanceof Array && failed.length !== 0) {
        console.error("Failed loading ", failed);
      }
      else {
        next(this);
      }
    };
  },

  init: function(editor) {
      CKEDITOR.scriptLoader.load([this.path + "lib/jquery-2.2.4.min.js",
                                  this.path + "lib/rangy-core.js"],
                                 this.loadHandle(function(e){ e.init0(editor); }),
                                 this);
  },

  init0: function(editor) {
      CKEDITOR.scriptLoader.load([this.path + "lib/rangy-textrange.js"],
                                 this.loadHandle(function(e){ e.init1(editor); }),
                                 this);
  },

  init1: function(editor/*:CKEditorInstance*/) {
    var divvungc = this;
    console.log(this.path);

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

    var idleTimer = null;
    var checkOnIdle = function(delay=3000) {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(check, delay);
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

    var onTextChange = function(ev) {
      hiderep();
      checkOnIdle(1000);
    };

    var replaceErr = function(e) {
      hiderep();
      var delta = { ops:[
        { retain: e.data.beg },
        { delete: e.data.len },
        { insert: e.data.r }
      ]};
      // source=user since user clicked "replace":
      // quill.updateContents(delta, "user");
      atMostOneSpace(e.data.beg);
      checkOnIdle(2000);
      // quill.focus();
    };


    var onSelectionChange = function(range, _oldRange, source) {
      if(range != null && range.length === 0 && source === 'user') {
        // $FlowFixMe – this whole function todo
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
            // quill.formatText(range.index - offset, error.length(), "error", false);
          }
        }
      }
    };

    var getFText = function() {
      var range = rangy.createRange();
      var body = editor.editable().$;
      range.selectNode(body);
      var text = range.text();
      return text;              // TODO: linebreak hack
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
        // quill.deleteText(i, len-1, "user");
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


    var clearErrs = function () {
      // editor.formatText(0, quill.getLength(), "error", false);
      if(editor.editable() !== undefined) {
        var body = editor.editable().$;
        $(body).find('span.error').each(function() {
          $(this).replaceWith(this.childNodes);
        });
        console.log("clearErrs");
      }
      else {
        console.log("clearErrs: no editable");
      }
    };

    var showLogin = function () {
      // caller decides whether to show #serverfault
      $("#loginform").show();
      $("#content").addClass("blur");
      $("#login-wrapper").addClass("block-view");
      $("#logout").hide();
    };


    var lastCheckedContents = "";
    var check = function() {
      var curContents = getFText();
      if(lastCheckedContents == curContents) {
        console.log("No change in text, not checking");
        return;
      }
      lastCheckedContents = curContents;
      clearErrs();
      window.localStorage["cktext"] = JSON.stringify(CKEDITOR.instances.ckeditor.getData());
      var text = getFText();
      var lang = "sme";         // TODO: editor config it

      var userpass = safeGetItem("userpass",
                                 readLoginFormStoring());
      if(userpass == null) {
        showLogin();
      }
      else {
        servercheck(userpass, text, applyErrs, lang);
      }
    };

    /**
     * Changes DOM
     */
    var showrep = function(beg/*:number*/,
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

    var makeRepCmd = function(suggestion, element) {
      return {
        exec: function(editor) {
          console.log("replace ", suggestion, "in", element, this);
          var el = $(element.$);
          el.text(suggestion);
          el.contents().unwrap();
			  }
		  };
	  };

    var applyErrs/*:cb*/ = function(text, res) {
      res.errs.forEach(function(x) {
        var length = x[2] - x[1];
        var range = rangy.createRange();
        var body = editor.editable().$;
        range.selectCharacters(body, x[1], x[2]);
        var text = range.text();
        var colour = "blue";
        if(text != x[0]) {
          colour = "red";       // Some error somewhere, TODO (shouldn't show such errors to user)
          console.log("Indexing mismatch", text, "!=", x[0], "where x=", x, "and range=", range);
        }
        if(!range.canSurroundContents()) {
          console.log("Can't surround contents of", range);
        }
        else {
          var error = $('<span>')
              .addClass("error")
              .addClass("error-" + colour);
          error.data("error", x);
          range.surroundContents(error[0]);
        }
        //                    str: x[0], // TODO: should we assert that the form is the same?
        //                    beg: x[1],
        //                    end: x[2],
        //                    len: length,
        //                    typ: x[3],
        //                    rep: x[5],
        //                    msg: x[4]
      });
      console.log(res);
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

    // TODO: If we dep on this, it ought to be in the same folder:
    var l10n = function() {
      if(document.l10n === undefined) {
        console.error("l20n.js failed?");
      }
      // $FlowFixMe
      return document.l10n;
    };

    var hostname/*:string*/ = window.location.hostname === "" ? "localhost" : window.location.hostname;
    var port/*:string*/ = hostname === "localhost" ? "2737" : window.location.port;
    var protocol/*:string*/ = hostname === "localhost" ? "http:" : window.location.protocol;
    var subdir/*:string*/ = hostname === "localhost" ? "" : "/apy";

    var checkUrl/*:string*/ = protocol+"//"+hostname+":"+(port.toString())+subdir+"/translateRaw";

    var checkXHR = null;
    var servercheck = function(userpass/*:userpass*/,
                               text/*:string*/,
                               cb/*:cb*/,
                               lang/*:string*/
                              )/*:void*/
    {
      console.log("servercheck:");
      // TODO: Should this be synchronous? We can't really change the text
      // after the user has typed unless the text still matches what we
      // sent.
      if(checkXHR != null) {
        // We only ever want to have the latest check results:
        checkXHR.abort();
      }
      checkXHR = $.ajax(checkUrl, {
        beforeSend: function(xhr) {
          xhr.setRequestHeader("Authorization", basicAuthHeader(userpass));
        },
        type: "POST",
        data: {
          langpair: langToMode(lang), // TODO: UI thingy
          q: text
        },
        success: function(res) {
          cb(text, res);
        },
        error: function(jqXHR, textStatus/*:string*/, errXHR/*:string*/)/*:void*/ {
          console.log("error: "+textStatus+"\n"+errXHR);
          console.log(jqXHR);
          console.log(jqXHR.status);
          $("#serverfault").hide();
          if(textStatus === "parsererror" && jqXHR.status === 200) {
            // MY BAD! So don't log out, but should still show a message
            l10n().formatValue('serverdown')
              .then(function(t){
                $("#serverfault").html(t).show();
              });
            return;
          }
          else if(textStatus === "abort" && jqXHR.status === 0) {
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


    CKEDITOR.dialog.add( 'gcDialog', this.path + 'dialogs/divvungc.js' );
    editor.addCommand('divvungc', new CKEDITOR.dialogCommand('gcDialog'));
    editor.ui.addButton('divvungc', {
      label: 'Grammar checker options',
      command: 'divvungc',
      toolbar: 'editing'
    });

    if (editor.contextMenu) {
      editor.addMenuGroup('gcGroup');
      editor.contextMenu.addListener(function(element, selection, path) {
        console.log('context-gclistener', element, selection, path, this);
        if (element.getAscendant(function(el) { return el.hasClass instanceof Function && el.hasClass('error'); },
                                 true)) {
          var x = $(element.$).data("error");
          var items = {};
          for(var i = 0; i < x[5].length; i++) {
            var sugg = x[5][i];
            var cmd = 'divvungc_suggestion_' + x[1].toString() + "_" + utoa(sugg);
            editor.addCommand(cmd, makeRepCmd(sugg, element));
            editor.addMenuItem(cmd, {
              label: sugg,
              icon: divvungc.path + 'icons/divvungc.png',
              command: cmd,
              group: 'gcGroup'
            });
            items[cmd] = CKEDITOR.TRISTATE_OFF;
          }
          return items;
        }
        else {
          return {};
        }
      });
    }

    var removeChangeListener = editor.on('change', onTextChange);
    var removeReadyListener = editor.on('dataReady', onTextChange);
    $("#editor").click(hiderep);
    $("body").click(hiderep);
    clearErrs();
    hiderep();
    console.log("end of init1");

  }                           // init1

});

})();
