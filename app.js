// @flow -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8 -*-
/* global $, history, console, repl, external */

/**
 * TODO:
 * - Add an 'errorclass'-parameter to the list of errors/API? (for highlighting colours)
 */

(function(){
  "use strict";

  /* :: type reps = Array<string> */
  /* :: type errlist = Array<[number, number, string, Array<string>]> */
  /* :: type result = {text: string, errs: errlist}                   */
  /* :: type cb = (X:result) => void */

  var servercheck = function(plaintext/*:string*/,
                             cb/*:cb*/
                            )/*:void*/ {
    // TODO: Is post going to be syncronous? We can't really change
    // the text after the user has typed unless the text still
    // matches what we sent.
    console.log("$.post = ");
    var res = $.ajax({
      type: "POST",
      url: "http://localhost:8080/check",
      data: { q: plaintext },
      success: function(errors){
        // wrapper since test server only returns errors array:
        cb({text: plaintext,
            errs: errors});
      },
      dataType: "json"
    });
    console.log(res);
    console.log(res.statusText);

    // TODO: this is a mock, should send plaintext to server
    if(false) {
      cb({
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
        [140,150,"boasttuvuohta boasttuvuohta",["gáranasruitu",
                                                "gáranasbáhtii",
                                                "gáranasruitui",
                                                "gáranasbáhti"]]
      ]
      });
    }
  };

  var preclean = function(plaintext/*:string*/)/*:string*/ {
    // TODO: maybe keep \n\n?
    return plaintext.replace(/\s\s+/g, " ").trim();
  };

  /**
   * Gather plaintext, call server, change DOM
   */
  var checkit = function()/*:void*/ {
    //console.log("checkit");
    var plaintext = preclean($("#form").text());
    servercheck(plaintext,
                function(res) {
                  squiggle(res.text, res.errs);
                  $('.error')[0].click(); // DEBUG
                });
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
  var squiggle = function(text/*:string*/,
                          errors/*:errlist*/
                         )/*:void*/  {
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
        console.log("Overlapping (or unsorted) errors! Skipping error ", errors[i]);
        continue;
      }
      if(end < beg) {
        console.log("Impossible offsets! Skipping error ", errors[i]);
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
  var hiderep = function()/*:void*/ {
    //console.log("hiderep");
    var repmenu = $('#repmenu');
    repmenu.offset({top:0, left:0}); // avoid some potential bugs with misplacement
    repmenu.hide();
  };

  /**
   * Changes DOM
   * TODO: populate menu, handle replacement
   */
  var showrep = function(span/*:Node*/,
                         typ/*:string*/,
                         rep/*:reps*/
                        )/*:void*/  {
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
   */
  var makerepmenu = function(span/*:Node*/,
                             typ/*:string*/,
                             rep/*:reps*/
                            )/*:void*/  {
    // We're looking at a new error, populate the table anew:
    $("#repmenu_tbl").empty();
    var tbody = $(document.createElement('tbody')),
        tr_title =  $(document.createElement('tr')),
        td_title =  $(document.createElement('td')),
        a_title =  $(document.createElement('a'));
    a_title.text(typ);
    a_title.attr("aria-disabled", "true");
    a_title.attr("role", "option");
    td_title.append(a_title);
    td_title.addClass("repmenu_title");
    tr_title.append(td_title);
    tbody.append(tr_title);

    rep.map(function(r){
      var tr_rep =  $(document.createElement('tr')),
          td_rep =  $(document.createElement('td')),
          a_rep =  $(document.createElement('a'));
      a_rep.text(r);
      a_rep.attr("aria-disabled", "true");
      a_rep.attr("role", "option");
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

    var tr_ign =  $(document.createElement('tr')),
        td_ign =  $(document.createElement('td')),
        a_ign =  $(document.createElement('a'));
    a_ign.text("Ignorer feiltypen");
    a_ign.attr("aria-disabled", "true");
    a_ign.attr("role", "option");
    td_ign.append(a_ign);
    td_ign.addClass("repmenu_ign");
    td_ign.addClass("repmenu_nonfirst");
    tr_ign.append(td_ign);
    tbody.append(tr_ign);

    // This seems to be similar to what TinyMCE do; but can we do it
    // safely (cross-browser) with CSS instead? TODO
    var fontsize = $('#repmenu').css('font-size');
    var lineheight = Math.floor(parseInt(fontsize.replace('px','')) * 1.5);
    $('#repmenu').css('height', lineheight * (rep.length + 2));

    $("#repmenu_tbl").append(tbody);
  };

  var init = function ()/*:void*/ {
    $("#check_b").click(checkit);
    $("#form").click(hiderep);

    checkit(1); // DEBUG

  };
  window.onload=init;

})();
