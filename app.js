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

    var form = $('#form');
    form.empty();
    for(var i=0, done=0; i < errors.length; i++)
    {
      var beg = errors[i][0],
          end = errors[i][1],
          typ = errors[i][2],
          rep = errors[i][3],
          pre = text.slice(done, beg),
          err = text.slice(beg, end),
          span = $(document.createElement('span'));
      if(beg < done) {
        console.log("Overlapping (or unsorted) errors! Skipping error "+errors[i]);
        continue;
      }
      // console.log("!",done,beg,end,typ,pre,"←pre,err→",err);
      form.append($(document.createTextNode(pre)));
      span.text(err);
      span.click({typ:typ, rep:rep},
                    function (e) {
                      e.stopPropagation();
                      return showrep(this, e.data.typ, e.data.rep);
                    });
      span.addClass("error");
      form.append(span);
      done = end;
    }
    form.append($(document.createTextNode(text.slice(done))));
  };

  /**
   * Changes DOM
   */
  var hiderep = function() {
    //console.log("hiderep");
    var repmenu = $('#repmenu');
    repmenu.offset({top:0, left:0}); // avoid some potential bugs with misplacement
    repmenu.hide();
  };

  /**
   * Changes DOM
   * TODO: populate menu, handle replacement
   *
   * @param {Node} span
   * @param {string} typ
   * @param {Array} rep
   */
  var showrep = function(span, typ, rep) {
    //console.log("showrep");
    var spanoff = $(span).offset();
    var newoff = { top:  spanoff.top+20,
                   left: spanoff.left };
    var repmenu = $('#repmenu');
    var at_same_err = repmenu.offset().top == newoff.top && repmenu.offset().left == newoff.left;
    if(repmenu.is(":visible") && at_same_err) {
      hiderep();
    }
    else {
      repmenu.show();
      repmenu.offset(newoff);
      if(!at_same_err) {
        makerepmenu(span, typ, rep);
      }
    }
  };

  /**
   * Changes DOM
   * Populates menu.
   * TODO: ignore-button
   *
   * @param {Node} span
   * @param {string} typ
   * @param {Array} rep
   */
  var makerepmenu = function(span, typ, rep) {
    // We're looking at a new error, populate the table anew:
    $("#repmenu_tbl").empty();
    var tbody = $(document.createElement('tbody')),
        tr_title =  $(document.createElement('tr')),
        td_title =  $(document.createElement('td')),
        a_title =  $(document.createElement('a'));
    a_title.text(typ);
    a_title.attr("aria-disabled", "true");
    td_title.append(a_title);
    td_title.addClass("repmenu_title");
    tr_title.append(td_title);
    tbody.append(tr_title);

    rep.map(function(r){
      var tr_rep =  $(document.createElement('tr')),
          td_rep =  $(document.createElement('td')),
          a_rep =  $(document.createElement('a'));
      a_rep.text(r);
      td_rep.append(a_rep);
      td_rep.addClass("repmenu_rep");
      td_rep.addClass("repmenu_nonfirst");
      // has to be on td since <a> doesn't fill the whole td
      td_rep.click({span:span, r:r},
                   function(e){
                     var r = e.data.r,
                         span = $(e.data.span);
                     span.replaceWith(r);
                     hiderep();
                   });
      tr_rep.append(td_rep);
      tbody.append(tr_rep);
    });

    $("#repmenu_tbl").append(tbody);
  };

  var init = function () {
    $("#check_b").click(checkit);
    $("#form").click(hiderep);

    // DEBUG:
    checkit();
    $('.error')[0].click();

  };
  window.onload=init;

})();
