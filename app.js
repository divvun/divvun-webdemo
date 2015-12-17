// -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8 -*-
/* global $, history, console, repl, external */

(function(){
  "use strict";

  /**
   * @param {string} plaintext
   * @return {{text: string, errs:Array}}
   */
  var servercheck = function(plaintext) {
    // TODO: this is a mock, should send plaintext to server
    return {
      // Server has to send back what it considers the plaintext,
      // since we can't trust that the exact plaintext fully survives
      // the pipeline (and we don't want the squiggles to stop in the
      // middle of words etc.)
      text: plaintext,
      errs: [[0,4,"fail",["cake","cheese"]],
             [10,20,"weak",["coffee","armadillo"]]]
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
   * @param {string} plaintext
   * @param {Array} res
   */
  var squiggle = function(plaintext, res) {
    //console.log("squiggle");
    var errors = Array.sort(res);

    var form = document.getElementById('form');
    $('#form').empty();
    for(var i=0, done=0; i < errors.length; i++)
    {
      var beg = errors[i][0],
          end = errors[i][1],
          typ = errors[i][2],
          rep = errors[i][3],
          pre = plaintext.slice(done, beg),
          err = plaintext.slice(beg, end),
          span = document.createElement('span');
      form.appendChild(document.createTextNode(pre));
      span.textContent = err;
      $(span).click( function (e) { //console.log("spanclick");
                                    e.stopPropagation();
                                    return showsugg(this, rep); });
      span.className += " error";
      form.appendChild(span);
      done = end;
    }
    form.appendChild(document.createTextNode(plaintext.slice(done)));
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
   * TODO: populate menu
   *
   * @param {Node} span
   * @param {Array} rep
   */
  var showsugg = function(span, rep) {
    //console.log("showsugg");
    var spanoff = $(span).offset();
    var newoff = { top:  spanoff.top+20,
                   left: spanoff.left };
    var suggmenu = $('#suggmenu');
    if(suggmenu.is(":visible")
       &&
       suggmenu.offset().top == newoff.top
       &&
       suggmenu.offset().left == newoff.left) {
      hidesugg();
    }
    else {
      suggmenu.show();
      suggmenu.offset(newoff);
    }
  };

  var init = function () {
    $("#check_b").click(checkit);
    $("#form").click(hidesugg);
    checkit();
  };
  window.onload=init;

})();
