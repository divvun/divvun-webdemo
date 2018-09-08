

"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = window.location.protocol === "file:";
var log = debug ? console.log.bind(window.console) : function () {};

var DEFAULT_LANG = "sme";
var DEFAULT_VARIANT = "gram";

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
      l10n().formatValue('hide_errtype').then(function (t) {
        a_ign.text(t);
      });
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
      var a = $('<a class="glyphicon glyphicon-remove pull-right">').click({ typ: typ }, removeIgnored);
      var elt = $('<li class="ma2">').text(typ).append(a);
      ign.append(elt);
    });
  } else {
    var elt = $(document.createElement('li'));
    l10n().formatValue('hide_errtype_explanation').then(function (t) {
      elt.text(t);
    });
    ign.append(elt);
  }
  $('#igntyps-wrapper button').addClass('glyphicon glyphicon-refresh glyphicon-refresh-animate  ');
  $('#igntyps-wrapper button').removeClass('glyphicon glyphicon-refresh glyphicon-refresh-animate  ');
};

var mergeErrs = function mergeErrs(errs) {
  var byIndices = groupBy(errs, function (x) {
    return x[1].toString() + "→" + x[2].toString();
  });
  return Array.from(byIndices.values()).map(function (val) {
    if (val.length > 1) {
      return val.reduce(function (x1, x2) {
        return [x1[0], x1[1], x1[2], x1[3] + "/" + x2[3], x1[4] + "\n / \n" + x2[4], x1[5].concat(x2[5])];
      });
    } else {
      return val[0];
    }
  });
};

var applyErrs = function applyErrs(text, res, off) {
  var igntyps = safeGetItem("igntyps", new Set());
  var mergedErrs = mergeErrs(res.errs);
  mergedErrs.forEach(function (x) {
    var length = x[2] - x[1];

    var err = {
      str: x[0],
      beg: x[1] + off,
      end: x[2] + off,
      len: length,
      typ: x[3],
      rep: x[5],
      msg: x[4]
    };
    if (igntyps.has(err.typ)) {
      return;
    }
    if (err.str !== text.substr(err.beg, err.len)) {
      console.warn("Unexpected difference between error string '" + err.str + "' and text at error indices '" + text.substr(err.beg, err.len) + "'");
    }
    quill.formatText(err.beg, err.len, "error", err);
  });
  log(res);
  $("#serverfault").hide();
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

var modesUrl = protocol + "//" + hostname + ":" + port.toString() + subdir + "/listPairs";
var checkUrl = protocol + "//" + hostname + ":" + port.toString() + subdir + "/translateRaw";
log(checkUrl);
var hunUrl = protocol + "//" + hostname + ":" + port.toString() + subdir + "/hunspell";

$(document).ready(function () {
  if (window.location.host.match("^localhost:") || window.location.protocol === "file:") {
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

var langToMode = function langToMode(lang, variant) {
  return lang + "|" + lang + "_" + variant;
};

var checkXHR = [];
var servercheck = function servercheck(userpass, text, off, cb, mode) {
  log("servercheck:");

  var url = checkUrl;
  var data = {
    langpair: mode,
    q: text
  };
  if (getVariant(searchToObject()) === "hunspell") {
    url = hunUrl;
    data = {
      lang: getLang(searchToObject()),
      q: text
    };
  }
  return $.ajax(url, {
    beforeSend: function beforeSend(xhr) {
      xhr.setRequestHeader("Authorization", basicAuthHeader(userpass));
    },
    type: "POST",
    data: data,
    success: function success(res) {
      cb(text, res, off);
    },
    error: function error(jqXHR, textStatus, errXHR) {
      console.log("error: " + textStatus + "\n" + errXHR);
      console.log(jqXHR);
      console.log(jqXHR.status);
      if (textStatus === "abort" && jqXHR.status === 0) {
        return;
      } else if (textStatus === "parsererror" && jqXHR.status === 200) {
        l10n().formatValue('parserfail', { errorCode: jqXHR.status + " " + errXHR,
          textStatus: textStatus }).then(function (t) {
          $("#serverfault").html(t).show();
        });
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

var groupBy = function groupBy(list, keyGetter) {
  var map = new Map();
  list.forEach(function (item) {
    var key = keyGetter(item);
    var collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
};

var modes = {};

var getModes = function getModes() {
  var _xhr = $.ajax(modesUrl, {
    type: "GET",
    data: {},
    success: function success(res) {
      var modelist = res.responseData.map(function (m) {
        var src = m.sourceLanguage;
        var trg = m.targetLanguage;
        var trgsuff = trg.replace(/^[^_]*_/, "");
        var trglang = trg.replace(/_.*/, "");
        return { src: src, trglang: trglang, trgsuff: trgsuff };
      }).filter(function (mm) {
        return mm.src == mm.trglang && mm.trgsuff.match(/(gram|spell)/);
      });

      Array.from(groupBy(modelist, function (m) {
        return m["src"];
      }).entries()).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            k = _ref2[0],
            elts = _ref2[1];

        modes[k] = elts;
        elts.forEach(modeToDropdown);
      });
    },
    dataType: "json"
  });
  modeToDropdown({ src: "se_NO", trglang: "se_NO", trgsuff: "hunspell" });
};

var modeToDropdown = function modeToDropdown(m) {
  var a = $('<a>').text(m.src + "_" + m.trgsuff).on('click', function (_ev) {
    window.location.search = '?lang=' + m.src + "&variant=" + m.trgsuff;
  });
  var li = $('<li class="mode ma2">').append(a);
  $('#modes').append(li);
};

var getLang = function getLang(search) {
  if (search.lang !== undefined) {
    return search.lang;
  } else {
    return DEFAULT_LANG;
  }
};

var getVariant = function getVariant(search) {
  if (search.variant !== undefined) {
    return search.variant;
  } else {
    return DEFAULT_VARIANT;
  }
};

var u8maxlen = function u8maxlen(str, max_B) {
  var len = str.length;
  var blen = 0;
  var best = 0;
  for (var i = 0; i < len; i++) {
    var code = str.charCodeAt(i);
    if (code > 0x7F && code <= 0x7FF) {
      blen += 2;
    } else if (code >= 0xD800 && code <= 0xDBFF) {
      i++;
      blen += 4;
    } else if (code > 0x7FF && code <= 0xFFFF) {
      blen += 3;
    } else {
      blen += 1;
    }
    if (blen <= max_B) {
      best = i + 1;
    } else {
      break;
    }
  }
  return best;
};

var test_u8maxlen = function test_u8maxlen() {
  assert(0 === u8maxlen("", 0), "0");
  assert(0 === u8maxlen("a", 0), "a0");
  assert(0 === u8maxlen("æ", 0), "æ0");
  assert(0 === u8maxlen("æøå", 0), "æøå0");
  assert(0 === u8maxlen("aæøå", 0), "aæøå0");
  assert(0 === u8maxlen("", 1), "1");
  assert(1 === u8maxlen("a", 1), "a1");
  assert(0 === u8maxlen("æ", 1), "æ1");
  assert(0 === u8maxlen("æøå", 1), "æøå1");
  assert(1 === u8maxlen("aæøå", 1), "aæøå1");
  assert(0 === u8maxlen("", 2), "2");
  assert(1 === u8maxlen("a", 2), "a2");
  assert(1 === u8maxlen("æ", 2), "æ2");
  assert(1 === u8maxlen("æøå", 2), "æøå2");
  assert(1 === u8maxlen("aæøå", 2), "aæøå2");
  assert(2 === u8maxlen("aaøå", 2), "aaæøå2");
  assert(0 === u8maxlen("", 3), "3");
  assert(1 === u8maxlen("a", 3), "a3");
  assert(1 === u8maxlen("æ", 3), "æ3");
  assert(1 === u8maxlen("æøå", 3), "æøå3");
  assert(2 === u8maxlen("aæøå", 3), "aæøå3");
  assert(2 === u8maxlen("aaøå", 3), "aaæøå3");
  assert(0 === u8maxlen("𝌆", 0), "𝌆0");
  assert(0 === u8maxlen("𝌆", 1), "𝌆1");
  assert(0 === u8maxlen("𝌆", 2), "𝌆2");
  assert(0 === u8maxlen("𝌆", 3), "𝌆3");
  assert(2 === u8maxlen("𝌆", 4), "𝌆4");
  assert(2 === u8maxlen("𝌆", 5), "𝌆5");
  return "all good";
};

var assert = function assert(condition, message) {
  if (!condition) {
    message = message || "Assertion failed";
    throw new Error(message);
  }
};

var APYMAXBYTES = 4096;

var lastSentenceEnd = function lastSentenceEnd(str) {
  var sep = /[.:!?]\s/g;
  var found = 0;
  for (var res = sep.exec(str); res !== null; res = sep.exec(str)) {
    found = res.index + res.length;
  }
  if (found === 0) {
    var lastSpace = str.lastIndexOf(" ");
    if (lastSpace !== -1) {
      return lastSpace;
    } else {
      return str.length - 1;
    }
  }
  return found;
};

var textCutOff = function textCutOff(str, max_B) {
  var len = str.length;
  var maxu8 = u8maxlen(str, max_B);

  if (len <= maxu8) {
    return len;
  }

  var minu8 = Math.floor(0.8 * maxu8);
  var sub = str.substring(minu8, maxu8);
  var found = lastSentenceEnd(sub);
  console.log(minu8, maxu8, found + minu8 + 1);
  return minu8 + found + 1;
};

var _check = function _check() {
  var mode = langToMode(getLang(searchToObject()), getVariant(searchToObject()));
  clearErrs();
  var text = getFText();
  window.localStorage["text"] = JSON.stringify(quill.getContents());

  var userpass = safeGetItem("userpass", readLoginFormStoring());
  if (userpass == null) {
    showLogin();
  } else {
    while (checkXHR.length > 0) {
      checkXHR.pop().abort();
    }
    checkSubText(userpass, text, 0, mode);
  }
};

var checkSubText = function checkSubText(userpass, text, off, mode) {
  var max = textCutOff(text.substr(off), APYMAXBYTES);
  var subtext = text.substr(off, max);
  var next_off = off + max;
  if (next_off < text.length) {
    var cont = function cont(t, res, o) {
      checkSubText(userpass, text, next_off, mode);
      applyErrs(t, res, o);
    };
    checkXHR.push(servercheck(userpass, subtext, off, cont, mode));
  } else {
    checkXHR.push(servercheck(userpass, subtext, off, applyErrs, mode));
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

  getModes();

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