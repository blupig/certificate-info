// MIT License
//
// Copyright (c) 2016 Yunzhu Li
// https://github.com/yunzhu-li/chrome-cert-info
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

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

  // Extract hostname
  var hostname = url.substr(8, url.length - 1 - 8);
  for (var i = 8, len = url.length; i < len; i++) {
    if (url[i] === '/') {
      hostname = url.substr(8, i - 8);
      break;
    }
  }

  // Set badge if already cached
  if (typeof cached_levels[hostname] !== 'undefined') {
    chrome.browserAction.setBadgeText({text: cached_levels[hostname]});
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
    cached_levels[hostname] = lvl;
    chrome.browserAction.setBadgeText({text: lvl});
  };

  xhr.open("GET", "http://192.81.217.28/?hostname=" + encodeURIComponent(hostname), true);
  xhr.send();
}
