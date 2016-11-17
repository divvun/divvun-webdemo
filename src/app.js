// @flow -*- indent-tabs-mode: nil; tab-width: 2; js2-basic-offset: 2; coding: utf-8; compile-command: "cd .. && make -j" -*-
/* global $, Quill, history, console, repl, external */

"use strict";

/* :: type reps = Array<string> */
/* :: type errlist = Array<[string, number, number, string, string, Array<string>]> */
/* :: type result = { text: string, errs: errlist } */
/* :: type cb = (text: string, X:result) => void */
/* :: type authcb = (text: string) => void */
/* :: type userpass = {u: string, p: string}|null */

var debug = window.location.protocol === "file:";
var log = debug ? console.log.bind(window.console) : function() {};

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
    node.setAttribute("class", "error error-"+colour);
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
    a_msg.text(err.msg);
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
    // var tr_ign =  $(document.createElement('tr')),
    // td_ign =  $(document.createElement('td')),
    // a_ign =  $(document.createElement('a'));
    // a_ign.text("Ignorer feiltypen");
    // a_ign.attr("role", "option");
    // td_ign.append(a_ign);
    // td_ign.addClass("repmenu_ign");
    // td_ign.addClass("repmenu_nonfirst");
    // tr_ign.append(td_ign);
    // tbody.append(tr_ign);

    $("#repmenu_tbl").append(tbody);
  };

}
ErrorBlot.blotName = 'error';
ErrorBlot.tagName = 'span';
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
  if(range != null && range.length === 0 && source == 'user') {
    var erroroffset = quill.scroll.descendant(ErrorBlot, range.index),
        error = erroroffset[0],
        offset = erroroffset[1];
    if(error != null) {
      var beg = range.index - offset,
          len = error.length();
      error.showrep(beg, len);
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

var applyErrs = function(text, res) {
  res.errs.forEach(function(x) {
    var length = x[2] - x[1];
    log(x);
    quill.formatText(x[1], length,
                     "error",{
                       str: x[0], // TODO: should we assert that the form is the same?
                       beg: x[1],
                       end: x[2],
                       len: length,
                       typ: x[3],
                       rep: x[5],
                       msg: x[4]
                     });
  });
  log(res);
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

// TODO: l10n
// Oavdumearkkat -> ovdamearkkat
// norvagismar -> dáromállegat
// punctuation errors -> čuokkesmeattáhusat
// congruence errors -> kongrueansameattáhusat
// case errors -> kásusmeattáhusat
// lexical errors -> leksikála meattáhusat
// adjective form errors -> adjektiivvahápmemeattáhusat
// ekteordsfeil -> čállinmeattáhusat (njuolga hápmi vearrukonteavsttas)
var examples = [
  { title: "Čállinmeattáhusat (njuolga hápmi vearrukonteavsttas)",
    delta: { ops: [{ insert:"Máŋggas ballet čohkkát busses, eandalii unnit mánát eai áiggo busse mielde, lohká rektor. Dušše čohkka ja juga gáfe. Dasto jearaimet beroštit go oahppat sámegiela buorebut, ja jos nu, de man suorggis ja mo háliidit oahppat. Sin máksu han lei varra seammá ollu maiddái sihke.\n\nGuttorm Utsi ballá sákka árbevirolaš sámi duodji sáhttá jávkat 10 jagi geahčes Deanus jos dasa ii dahkkut miige.\n\n Luohtti fámoleabbo go leat máŋggas.\n Earenoamážit jus ii luohte eannet iežat intuišuvdnii ja jierpmálašvuhtii, de manná duinna hui bures.\n Ja bisošii hal doppe nuppiin bieđagiin ovttas ovtta gaskka – de livččii ráfi ajihustit go dál ii leat čivga ge boŋkime, dat lea vižžojuvvon gávpogii eatnis olbmuid lusa ja galgá orrut muoŧŧás luhtte gitta go eatnis varrostuvvá.\n\nUlbmil lea movttiidahttit lohkamii ja oažžut eambbosiid liikot girjiide.\n\n– Moai Aleftina Serginain letne guhkit áiggi čohken  dieđuid Áhkkila sámiid birra ja dál lea munno girjii válmmas, čilge Leif Rantala."}]}},
  { title: "Dáromállegat",
    delta: { ops: [{ insert: "osv."}] }},
  { title: "Čuokkesmeattáhusat",
    delta: { ops: [{ insert: "\"nu - nu\""}] }},
  { title: "Kongrueansameattáhusat",
    delta: { ops: [{ insert: "Ráđđeolmmái jearai jos poasta ii lean beroštan ođđa dieđuid mat ledjet boahtán áššis.\nGo Davvinásti ollii 1796 Bergenii, ledje das mielde 2000 viegu goikeguolli."}] }},
  { title: "Valeansameattáhusat",
    delta: { ops: [{ insert: "Dasto jearaimet beroštit go oahppat sámegiela buorebut, ja jos nu, de man suorggis ja mo háliidit oahppat.\nMáŋggas ballet čohkkát busses, eandalii unnit mánát eai áiggo busse mielde, lohká rektor.\n"}] }},
  { title: "Kásusmeattáhusat",
    delta: { ops: [{ insert: "Muhto mon liikon nieiddade. Ráđđeolmmái jearai jos poasta ii lean beroštan ođđa dieđuid mat ledjet boahtán áššis.\n\nLiikon hirbmadit 1920- logu, ja lean lohkan girjii ja filmma The Great Gatsby, danin šattai Gatsby, muitala Ann."}] }},
  { title: "Leksikála meattáhusat",
    delta: { ops: [{ insert: "jna."}] }},
  { title: "Adjektiivvahápmemeattáhusat",
    delta: { ops: [{ insert: "Eallámušvallji eanan šaddá go gehppesmolláneaddji báktešlájat, ábaida kálkavallji šlájat, váikkuhuvvojit ja nu háddjanit (golladuvvojit).\nSu musihkka lea poehtalaš ja das lea roavis ja ihána čáppa ja fiinna."}]}},
];

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

var port/*:string*/ = window.location.protocol === "file:" ? "2737" : "2737"; //window.location.port – running on different servers!
var hostname/*:string*/ = window.location.hostname === "" ? "localhost" : window.location.hostname;
var protocol/*:string*/ = window.location.protocol === "file:" ? "http:" : window.location.protocol;

var checkUrl/*:string*/ = protocol+"//"+hostname+":"+(port.toString())+"/translateRaw";
log(checkUrl);

var userLang = function() {
  // TODO: browser prefs
  return "sme";
};

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
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

var basicAuthHeader = function (userpass) {
  // If we stored a previously successful auth *and* password is
  // unset, first try that:
  if(userpass != null) {
    return "Basic " + utoa(userpass.u + ":" + userpass.p);
  }
  else {
    $("#serverfault").html("Feil passord?");
    $("#serverfault").show();
    showLogin();
    return "Basic TODO";
  }
};

var checkXHR = null;
var servercheck = function(userpass/*:userpass*/,
                           text/*:string*/,
                           cb/*:cb*/
                          )/*:void*/
{
  log("servercheck:");
  // TODO: Should this be synchronous? We can't really change the text
  // after the user has typed unless the text still matches what we
  // sent.
  if(checkXHR != null) {
    // We only ever want to have the latest check results:
    checkXHR.abort();
  }
  checkXHR = $.ajax({
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Authorization", basicAuthHeader(userpass));
    },
    type: "POST",
    url: checkUrl,
    data: {
      langpair: "sme|sme_gram", // TODO: UI thingy
      q: text
    },
    success: function(res) {
      cb(text, res);
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
        $("#serverfault").html("Det kan sjå ut som om tenaren er nede, eller du er fråkopla internett. Prøv å lasta sida på nytt.");
        $("#serverfault").show();
      }
      else {
        $("#serverfault").html("Feil brukarnamn/passord? Fekk feilkode "+jqXHR.status+" med status "+errXHR+"/"+textStatus);
        $("#serverfault").show();
        showLogin();
        // var userpass = safeGetItem("userpass",
        //                            readLoginFormStoring());
        // if(userpass === null) {
        //   showLogin();
        // }
        // else {
        //   console.log("TODO: when can we recheck?");
        //   // servercheck(userpass, text, cb);
        // }
      }
    },
    dataType: "json"
  });
};


var check = function() {
  clearErrs();
  var text = getFText();
  window.localStorage["text"] = JSON.stringify(quill.getContents());

  var userpass = safeGetItem("userpass",
                             readLoginFormStoring());
  if(userpass == null) {
    showLogin();
  }
  else {
    servercheck(userpass, text, applyErrs);
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

  $('#examples-wrapper h4').text("Ovdamearkkat:");
  examples.map(function(ex){
    var node = $(document.createElement('button'));
    node.text(ex.title);
    node.attr("type", "button");
    node.addClass("btn btn-default");
    $(node).click(function () {
      quill.setContents(ex.delta);
      check();
    });
    $('#examples').append(node);
    $('#examples').append(" ");
  });

  $.ajaxSetup({
    statusCode: {
      "401": function(){
        showLogin();
      }
    }
  });

  quill.on('text-change', onTextChange);
  quill.on('selection-change', onSelectionChange);

  var search = searchToObject();
  var initText = { ops: [] };
  if(search.q != undefined) {
    initText = { ops: [{ insert: search.q }]};
    window.location.search = ""; // so a reload doesn't undo the localStorage
  }
  else {
    initText = safeGetItem("text", initText);
  }
  quill.setContents(initText);
  clearErrs();
  hiderep();
  check();
};

$(document).ready(init);

