/**
 * protect window.console method calls, e.g. console is not defined on ie
 * unless dev tools are open, and ie doesn't define console.debug
 */
(function() {
  if (!window.console) {
    window.console = {};
  }
  // union of Chrome, FF, IE, and Safari console methods
  var m = [
    "log", "info", "warn", "error", "debug", "trace", "dir", "group",
    "groupCollapsed", "groupEnd", "time", "timeEnd", "profile", "profileEnd",
    "dirxml", "assert", "count", "markTimeline", "timeStamp", "clear"
  ];
  // define undefined methods as noops to prevent errors
  for (var i = 0; i < m.length; i++) {
    if (!window.console[m[i]]) {
      window.console[m[i]] = function() {};
    }
  }
})();

// log()  -  the complete, cross-browser (we don't judge!)
// console.log wrapper for his or her logging pleasure
if (!window.log) {
  window.log = function () {
    // store logs to an array for reference
    log.history = log.history || [];
    log.history.push(arguments);
    // Modern browsers
    if (typeof console != 'undefined' && typeof console.log == 'function') {

      // Opera 11
      if (window.opera) {
        var i = 0;
        while (i < arguments.length) {
          console.log("Item " + (i + 1) + ": " + arguments[i]);
          i++;
        }
      }

      // all other modern browsers
      else if ((Array.prototype.slice.call(arguments)).length == 1 &&
        typeof Array.prototype.slice.call(arguments)[0] == 'string') {
        console.log((Array.prototype.slice.call(arguments)).toString());
      }
      else {
        console.log(Array.prototype.slice.call(arguments));
      }

    }

      // IE8
    else if (!Function.prototype.bind &&
      typeof console != 'undefined' && typeof console.log == 'object') {
      Function.prototype.call.call(
        console.log, console, Array.prototype.slice.call(arguments));
    }

      // IE7 and lower, and other old browsers
    else {
      // Inject Firebug lite
      if (!document.getElementById('firebug-lite')) {
        // Include the script
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.id = 'firebug-lite';
        // if you run the script locally,
        // point to /path/to/firebug-lite/build/firebug-lite.js
        script.src = 'https://getfirebug.com/firebug-lite.js';
        // if you want to expand the console window by default,
        // uncomment this line
        // document.getElementsByTagName('HTML')[0].setAttribute('debug','true');
        document.getElementsByTagName('HEAD')[0].appendChild(script);
        setTimeout(
          function () { log(Array.prototype.slice.call(arguments)); }, 2000);
      }
      else {
        // fbl was included but it hasn't finished loading yet, so try again
        // momentarily
        setTimeout(
          function () { log(Array.prototype.slice.call(arguments)); }, 500);
      }
    }
  };
}

log = function () { console.log(arguments); };
