//
// Cache results
var cached_levels = {};

// Update on activation
chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({active: true}, function(tab) {
    badgeValidationLevel(tab[0].url);
  });
});

// Update on content change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({active: true}, function(tab) {
    badgeValidationLevel(tab[0].url);
  });
});

// Update badge text to validation level
function badgeValidationLevel(url) {
  // Check if https
  if (url.substring(0, 8) !== 'https://') {
    chrome.browserAction.setBadgeText({text: ''});
    return;
  }

  // Set badge if already cached
  if (typeof cached_levels[url] !== 'undefined') {
    chrome.browserAction.setBadgeText({text: cached_levels[url]});
    return;
  }

  // Make request
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (typeof this.responseText === 'undefined' ||
        this.responseText.length === 0) {

      chrome.browserAction.setBadgeText({text: ''});
      return;
    }
    var cert_info = JSON.parse(this.responseText);
    var lvl = cert_info['validation_level'];
    cached_levels[url] = lvl;
    chrome.browserAction.setBadgeText({text: lvl});
  };

  xhr.open("GET", "http://192.81.217.28/?url=" + encodeURIComponent(url), true);
  xhr.send();
}
