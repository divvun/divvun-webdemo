

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = window.location.protocol === "file:";
var log = debug ? console.log.bind(window.console) : function () {};

var DEFAULT_LANG = "sme";

var l10n = function l10n() {
  if (document.l10n === undefined) {
    console.error("l20n.js failed?");
  }

  return document.l10n;
};

var Inline = Quill.import('blots/inline');

var ErrorBlot = function (_Inline) {
  _inherits(ErrorBlot, _Inline);

  function ErrorBlot() {
    _classCallCheck(this, ErrorBlot);

    return _possibleConstructorReturn(this, (ErrorBlot.__proto__ || Object.getPrototypeOf(ErrorBlot)).apply(this, arguments));
  }

  _createClass(ErrorBlot, [{
    key: "showrep",
    value: function showrep(beg, len) {
      var spanoff = $(this.domNode).offset(),
          newoff = { top: spanoff.top + 20,
        left: spanoff.left },
          repmenu = $('#repmenu'),
          at_same_err = repmenu.offset().top == newoff.top && repmenu.offset().left == newoff.left;
      if (repmenu.is(":visible") && at_same_err) {
        hiderep();
      } else {
        repmenu.show();
        repmenu.offset(newoff);
        if (!at_same_err) {
          this.makerepmenu(beg, len);
        }
      }
    }
  }, {
    key: "makerepmenu",
    value: function makerepmenu(beg, len) {
      var span = this.domNode,
          err = $(span).data("error");

      $("#repmenu_tbl").empty();
      var tbody = $(document.createElement('tbody'));
      tbody.attr("role", "listbox");

      if (err.msg == "") {
        err.msg = "Ukjend feiltype";
      }
      var tr_msg = $(document.createElement('tr')),
          td_msg = $(document.createElement('td')),
          a_msg = $(document.createElement('span'));
      a_msg.html(err.msg);
      a_msg.attr("aria-disabled", "true");
      td_msg.append(a_msg);
      td_msg.addClass("repmenu_msg");
      tr_msg.append(td_msg);
      tbody.append(tr_msg);

      err.rep.map(function (r) {
        var tr_rep = $(document.createElement('tr')),
            td_rep = $(document.createElement('td')),
            a_rep = $(document.createElement('a'));
        if (r == "") {
          a_rep.text("(fjern)");
        } else {
          a_rep.text(r.replace(/ /g, " "));
        }
        if (r.lastIndexOf(" ", 0) == 0 || r.indexOf(" ", r.length - 1) == r.length - 1) {
          a_rep.addClass("hl-space");
        }
        a_rep.attr("role", "option");
        td_rep.append(a_rep);
        td_rep.addClass("repmenu_rep");
        td_rep.addClass("repmenu_nonfirst");

        td_rep.click({ beg: beg,
          len: len,
          r: r
        }, replaceErr);
        tr_rep.append(td_rep);
        tbody.append(tr_rep);
      });

      var tr_ign = $(document.createElement('tr')),
          td_ign = $(document.createElement('td')),
          a_ign = $(document.createElement('a'));
      a_ign.text("Skjul feiltypen");
      a_ign.attr("role", "option");
      td_ign.append(a_ign);
      td_ign.addClass("repmenu_ign");
      td_ign.addClass("repmenu_nonfirst");
      tr_ign.append(td_ign);
      tbody.append(tr_ign);
      a_ign.click({ err: err }, function (e) {
        var err = e.data.err;
        var igntyps = safeGetItem("igntyps", new Set());
        igntyps.add(err.typ);
        safeSetItem("igntyps", igntyps);
        updateIgnored();
        _check();
      });

      $("#repmenu_tbl").append(tbody);
    }
  }], [{
    key: "create",
    value: function create(err) {
      var node = _get(ErrorBlot.__proto__ || Object.getPrototypeOf(ErrorBlot), "create", this).call(this);
      if ((typeof err === "undefined" ? "undefined" : _typeof(err)) != "object") {
        console.log("Error creating ErrorBlot, expected object, not " + (typeof err === "undefined" ? "undefined" : _typeof(err)));
        return _get(ErrorBlot.__proto__ || Object.getPrototypeOf(ErrorBlot), "create", this).call(this);
      }
      $(node).data("error", err);

      var colour = "blue";

      $(node).addClass("class", "error-" + colour);
      return node;
    }
  }, {
    key: "formats",
    value: function formats(node) {
      return $(node).data("error");
    }
  }]);

  return ErrorBlot;
}(Inline);

ErrorBlot.blotName = 'error';
ErrorBlot.tagName = 'span';
ErrorBlot.className = 'error';
Quill.register(ErrorBlot);

var replaceErr = function replaceErr(e) {
  hiderep();
  var delta = { ops: [{ retain: e.data.beg }, { delete: e.data.len }, { insert: e.data.r }] };

  quill.updateContents(delta, "user");
  atMostOneSpace(e.data.beg);
  checkOnIdle(2000);
  quill.focus();
};

var hiderep = function hiderep() {
  var repmenu = $('#repmenu');
  repmenu.offset({ top: 0, left: 0 });
  repmenu.hide();
};

var onSelectionChange = function onSelectionChange(range, _oldRange, source) {
  if (range != null && range.length === 0 && source === 'user') {
    var erroroffset = quill.scroll.descendant(ErrorBlot, range.index),
        error = erroroffset[0],
        offset = erroroffset[1];
    if (error != null) {
      if ($(error.domNode).data("error")) {
        var beg = range.index - offset,
            len = error.length();
        error.showrep(beg, len);
      } else {
        console.log("descendant ErrorBlot at", range.index, "had no data, clearing markup");
        quill.formatText(range.index - offset, error.length(), "error", false);
      }
    }
  }
};

var atMostOneSpace = function atMostOneSpace(i) {
  var t = getFText();
  while (t[i - 1] == " ") {
    i--;
  }
  var len = 0;
  while (t[i + len] == " ") {
    len++;
  }

  if (len > 1) {
    quill.deleteText(i, len - 1, "user");
  }
};

var clearErrs = function clearErrs() {
  quill.formatText(0, quill.getLength(), "error", false);
};

var removeIgnored = function removeIgnored(e) {
  console.log("remove", e.data.typ);
  var igntyps = safeGetItem("igntyps", new Set());
  igntyps.delete(e.data.typ);
  safeSetItem("igntyps", igntyps);
  updateIgnored();
  _check();
};

var updateIgnored = function updateIgnored() {
  var igntyps = safeGetItem("igntyps", new Set());
  var ign = $('#igntyps');
  ign.empty();
  if (igntyps.size > 0) {
    igntyps.forEach(function (typ) {
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
  } else {
    var elt = $(document.createElement('li'));
    elt.text("klikk på eit ord for å skjula feiltypen");
    ign.append(elt);
  }
  $('#igntyps-wrapper button').addClass('glyphicon glyphicon-refresh glyphicon-refresh-animate  ');
  $('#igntyps-wrapper button').removeClass('glyphicon glyphicon-refresh glyphicon-refresh-animate  ');
};

var applyErrs = function applyErrs(text, res) {
  var igntyps = safeGetItem("igntyps", new Set());
  res.errs.forEach(function (x) {
    var length = x[2] - x[1];
    log(x);
    var err = {
      str: x[0],
      beg: x[1],
      end: x[2],
      len: length,
      typ: x[3],
      rep: x[5],
      msg: x[4]
    };
    if (igntyps.has(err.typ)) {
      return;
    }
    quill.formatText(err.beg, err.len, "error", err);
  });
  log(res);
};

var toolbarOptions = [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], ['link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean'], ['check']];

var quill = new Quill('#editor', {
  modules: {
    toolbar: {
      container: toolbarOptions,
      handlers: {
        check: function check(_val) {
          _check();
        }
      }
    }
  },
  theme: 'snow',
  placeholder: 'Čális dása, dahje válljes ovdmearkka dás vuolábealde'
});

var getFText = function getFText() {
  return quill.getContents().ops.map(function (op) {
    return typeof op.insert === 'string' ? op.insert : ' ';
  }).join('');
};

var searchToObject = function searchToObject() {
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

var hostname = window.location.hostname === "" ? "localhost" : window.location.hostname;
var port = hostname === "localhost" ? "2737" : window.location.port;
var protocol = hostname === "localhost" ? "http:" : window.location.protocol;
var subdir = hostname === "localhost" ? "" : "/apy";

if (hostname === "localhost") {
  hostname = "gtweb.uit.no";
  port = "80";
  protocol = "http:";
  subdir = "/apy";
}

var checkUrl = protocol + "//" + hostname + ":" + port.toString() + subdir + "/translateRaw";
log(checkUrl);

$(document).ready(function () {
  if (window.location.host.match("^localhost:")) {
    console.log("Connecting to skewer …");
    var s = document.createElement('script');
    s.src = 'https://localhost:38443/skewer';
    if (document.body) {
      document.body.appendChild(s);
    }
  }
});

var hideLogin = function hideLogin() {
  $("#serverfault").hide();
  $("#loginform").hide();
  $("#content").removeClass("blur");
  $("#login-wrapper").removeClass("block-view");
  $("#logout").show();
};

var showLogin = function showLogin() {
  $("#loginform").show();
  $("#content").addClass("blur");
  $("#login-wrapper").addClass("block-view");
  $("#logout").hide();
};

function utoa(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode(parseInt('0x' + p1));
  }));
}

var basicAuthHeader = function basicAuthHeader(userpass) {
  if (userpass != null) {
    return "Basic " + utoa(userpass.u + ":" + userpass.p);
  } else {
    $("#serverfault").html("Čállet go beassansáni boastut?");
    $("#serverfault").show();
    showLogin();
    return "Basic TODO";
  }
};

var langToMode = function langToMode(lang) {
  return lang + "|" + lang + "_gram";
};

var checkXHR = null;
var servercheck = function servercheck(userpass, text, cb, lang) {
  log("servercheck:");

  if (checkXHR != null) {
    checkXHR.abort();
  }
  checkXHR = $.ajax(checkUrl, {
    beforeSend: function beforeSend(xhr) {
      xhr.setRequestHeader("Authorization", basicAuthHeader(userpass));
    },
    type: "POST",
    data: {
      langpair: langToMode(lang),
      q: text
    },
    success: function success(res) {
      cb(text, res);
    },
    error: function error(jqXHR, textStatus, errXHR) {
      console.log("error: " + textStatus + "\n" + errXHR);
      console.log(jqXHR);
      console.log(jqXHR.status);
      if (textStatus === "abort" && jqXHR.status === 0) {
        return;
      } else if (textStatus === "error" && jqXHR.status === 0) {
        l10n().formatValue('serverdown').then(function (t) {
          $("#serverfault").html(t).show();
        });
      } else {
        l10n().formatValue('loginfail', { errorCode: jqXHR.status + " " + errXHR,
          textStatus: textStatus }).then(function (t) {
          $("#serverfault").html(t).show();
        });
        $("#serverfault").show();
        showLogin();
      }
    },
    dataType: "json"
  });
};

var supportedLangs = ["sme", "fao"];

var getLang = function getLang(search) {
  if (search.lang !== undefined) {
    return search.lang;
  } else {
    return DEFAULT_LANG;
  }
};

var _check = function _check() {
  var lang = getLang(searchToObject());
  clearErrs();
  var text = getFText();
  window.localStorage["text"] = JSON.stringify(quill.getContents());

  var userpass = safeGetItem("userpass", readLoginFormStoring());
  if (userpass == null) {
    showLogin();
  } else {
    servercheck(userpass, text, applyErrs, lang);
  }
};

var readLoginFormStoring = function readLoginFormStoring() {
  var userpass = { u: $('#user').val(),
    p: $('#password').val() };
  if (userpass.u != "" && userpass.p != "") {
    window.localStorage.setItem("userpass", JSON.stringify(userpass));
    return userpass;
  } else {
    return null;
  }
};

var loginFromForm = function loginFromForm() {
  var userpass = readLoginFormStoring();
  if (userpass != null) {
    hideLogin();
  }

  return false;
};

var loginOnEnter = function loginOnEnter(e) {
  if (e.which == 13) {
    loginFromForm();
  }
};

var loginOnClick = function loginOnClick(e) {
  loginFromForm();
  return false;
};

var idleTimer = null;
var checkOnIdle = function checkOnIdle() {
  var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3000;

  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(_check, delay);
};

var onTextChange = function onTextChange(delta, oldDelta, source) {
  if (source == 'api') {} else if (source == 'user') {
    hiderep();
    checkOnIdle();
  }
};

var logout = function logout(e) {
  showLogin();
  window.localStorage.removeItem("userpass");
  $('#user').val("");
  $('#password').val("");
  return false;
};

var initSpinner = function initSpinner() {
  $("#spinner").hide();
  $("#editor").removeClass("loading");
  $(document).ajaxStart(function () {
    $("#spinner").show();
    $("#editor").addClass("loading");
    $(".ql-check").addClass("glyphicon glyphicon-refresh spinning");
    $(".ql-check").addClass("loading-check");
  }).ajaxStop(function () {
    $("#spinner").hide();
    $("#editor").removeClass("loading");
    $(".ql-check").removeClass("glyphicon glyphicon-refresh spinning");
    $(".ql-check").removeClass("loading-check");
  });
};

var safeSetItem = function safeSetItem(key, value) {
  if (value && value.constructor && value.constructor.name === "Set") {
    window.localStorage.setItem(key, JSON.stringify(Array.from(value)));
  } else {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

var safeGetItem = function safeGetItem(key, fallback) {
  var fromStorage = window.localStorage.getItem(key);
  if (fromStorage == null) {
    return fallback;
  } else {
    try {
      var parsed = JSON.parse(fromStorage);
      if (parsed != null) {
        if (fallback && fallback.constructor && fallback.constructor.name === "Set") {
          return new Set(parsed);
        } else {
          return parsed;
        }
      }
    } catch (e) {
      console.log(e);
    }
    return fallback;
  }
};

var initExamples = function initExamples() {
  var req = [],
      max = 20;
  for (var i = 1; i <= max; i++) {
    req.push('example' + i.toString() + '_title');
    req.push('example' + i.toString());
  }
  l10n().formatValues.apply(l10n(), req).then(function (res) {
    var titles = [],
        texts = [];
    for (var i = 0; i < res.length; i++) {
      if (i % 2 === 0) {
        titles.push(res[i]);
      } else {
        texts.push(res[i]);
      }
    }
    for (i = 0; i < titles.length; i++) {
      if (titles[i].match(/^example[0-9]+_title$|^$|^""$/)) {
        continue;
      }
      var node = $(document.createElement('button'));
      node.text(titles[i]);
      node.attr("type", "button");
      node.addClass("btn btn-default");
      $(node).click({ text: texts[i] }, function (e) {
        quill.setContents({ ops: [{ insert: e.data.text }] });
        _check();
      });
      $('#examples').append(node);
      $('#examples').append(" ");
    }
  });
};

var initL10n = function initL10n(lang) {
  l10n().requestLanguages([lang]);
  l10n().formatValue('editor_placeholder').then(function (t) {
    $('.ql-editor').attr('data-placeholder', t);
  });
  var el = $('<link/>');
  el.attr('rel', 'stylesheet');
  el.attr('href', 'locales/' + lang + '.css');
  $('head').append(el);
};

var init = function init() {
  if (window.location.protocol == "http:") {
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
      "401": function _() {
        showLogin();
      }
    }
  });

  quill.on('text-change', onTextChange);
  quill.on('selection-change', onSelectionChange);

  var initText = { ops: [] };
  if (search.q !== undefined) {
    initText = { ops: [{ insert: search.q }] };
    window.location.search = "";
  } else {
    initText = safeGetItem("text", initText);
  }
  quill.setContents(initText);
  clearErrs();
  hiderep();
  updateIgnored();
  _check();
};

$(document).ready(init);
//# sourceMappingURL=app.js.map