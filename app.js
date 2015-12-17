// -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8 -*-
/* global $, history, console, repl, external */

(function(){
  "use strict";

  /**
   * @param {string} plaintext
   * @return {{text: string, errs: Array}}
   */
  var servercheck = function(plaintext) {
    // TODO: this is a mock, should send plaintext to server
    return {
      // Server has to send back what it considers the plaintext,
      // since we can't trust that the exact plaintext fully survives
      // the pipeline (and we don't want the squiggles to stop in the
      // middle of words etc.)
      text: plaintext,
      errs: [
        [28,46,"boasttu kásushápmi",["meahccespiidni",
                                     "meahccespiidnii"]],
        [4,11,"boasttuvuohta",["gáranasruitu",
                               "gáranasbáhti"]],
      ]
    };
  };

  /**
   * @param {string} plaintext
   * @return {string}
   */
  var preclean = function(plaintext) {
    // TODO: maybe keep \n\n?
    return plaintext.replace(/\s\s+/g, " ").trim();
  };

  /**
   * Gather plaintext, call server, change DOM
   */
  var checkit = function() {
    //console.log("checkit");
    var plaintext = preclean($("#form").text());
    var res = servercheck(plaintext);
    // TODO: worth looking into doing it async? We can't really change
    // the text after the user has typed unless the text still
    // matches what we sent.
    squiggle(res.text, res.errs);
  };

  /**
   * Changes DOM
   *
   * The text replaces the content of #form, and adds spans to errors
   * of errs.
   *
   * @param {string} text
   * @param {Array} errs
   */
  var squiggle = function(text, errors) {
    //console.log("squiggle");
    // Ensure the first error (by start-offset) is first:
    errors.sort(function(a,b){return a[0] - b[0];});

    var form = document.getElementById('form');
    $('#form').empty();
    for(var i=0, done=0; i < errors.length; i++)
    {
      var beg = errors[i][0],
          end = errors[i][1],
          typ = errors[i][2],
          rep = errors[i][3],
          pre = text.slice(done, beg),
          err = text.slice(beg, end),
          span = document.createElement('span');
      if(beg < done) {
        console.log("Overlapping (or unsorted) errors! Skipping error "+errors[i]);
        continue;
      }
      console.log(done,beg,end,typ,pre,"←pre,err→",err);
      form.appendChild(document.createTextNode(pre));
      span.textContent = err;
      $(span).click({typ:typ, rep:rep},
                    function (e) {
                      e.stopPropagation();
                      return showsugg(this, e.data.typ, e.data.rep);
                    });
      span.className += " error "+typ;
      form.appendChild(span);
      done = end;
    }
    form.appendChild(document.createTextNode(text.slice(done)));
  };

  /**
   * Changes DOM
   */
  var hidesugg = function() {
    //console.log("hidesugg");
    var suggmenu = $('#suggmenu');
    suggmenu.offset({top:0, left:0}); // avoid some potential bugs with misplacement
    suggmenu.hide();
  };
  /**
   * Changes DOM
   * TODO: populate menu, handle replacement
   *
   * @param {Node} span
   * @param {string} typ
   * @param {Array} rep
   */
  var showsugg = function(span, typ, rep) {
    //console.log("showsugg");
    var spanoff = $(span).offset();
    var newoff = { top:  spanoff.top+20,
                   left: spanoff.left };
    var suggmenu = $('#suggmenu');
    var at_same_err = suggmenu.offset().top == newoff.top && suggmenu.offset().left == newoff.left;
    if(suggmenu.is(":visible") && at_same_err) {
      hidesugg();
    }
    else {
      suggmenu.show();
      suggmenu.offset(newoff);
      console.log(typ);
      if(!at_same_err) {
        $("#suggmenu_tbl").html(typ);
      }
    }
  };

  var init = function () {
    $("#check_b").click(checkit);
    $("#form").click(hidesugg);
    checkit();
  };
  window.onload=init;

})();
