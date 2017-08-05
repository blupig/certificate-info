//
//    certificate-info
//    Copyright (C) 2017 Yunzhu Li
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

  xhr.open("GET", "https://api.blupig.net/certificate-info/cert?host=" + encodeURIComponent(hostname), true);
  xhr.send();
}
