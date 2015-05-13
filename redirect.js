// redirects that do not respond will not be marked as valid. The
// first `rx` to match a request will be redirected to `redirect`
var nullurl = "http://example.com",
    urlMap = [
      {
        rx: /.*codebender.*\/chrome-client\.js.*/,
        redirect: nullurl,
        valid: true},

      {rx: /.*codebender.*\/compilerflasher(_new|)\.js/,
       redirect: nullurl,
       valid: true},

      // Log silencer
      {rx: /.*\/logdb\/.*/,
       redirect: nullurl,
       valid: true},

      {rx: /https?:\/\/localhost\/.*/,
       redirectCb: function (url) {
         return url.replace("http:", "https:")
           .replace("://localhost", "://staging.codebender.cc");
       },
       valid: true
      },

      {rx: /https?:\/\/tsiknas.codebender.cc.*/,
       redirectCb: function (url) {
         return url.replace("tsiknas", "staging");
       },
       valid: true
      }
    ];

// Mark url map entries that respond as valid.
// XXX: maybe make this blocking.
urlMap.forEach(function (ue) {
  if (ue.valid)
    return;

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 &&
        xhr.status == 200 &&
        xhr.responseText.length > 0) {
      ue.valid = true;
    }
  };
  xhr.open("GET", ue.redirect, true);
  xhr.send();
});

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log("Requesting:",details.url);
    for (var i = 0; i < urlMap.length; i++)
      if (urlMap[i].valid && urlMap[i].rx.test(details.url)) {
        console.log("Redirecting " + details.url + " -> " +
                    urlMap[i].redirect || urlMap[i].redirectCb(details.url));
        return {
          redirectUrl: urlMap[i].redirect || urlMap[i].redirectCb(details.url)
        };
      }
  },
  {urls: [
    "<all_urls>"
  ]},
  ["blocking"]);
