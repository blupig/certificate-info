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

// Colors
var badgeColors = {'...': '#757575', 'ERR': '#FF1744', 'DV': '#FF9800', 'IV': '#2196F3'}

// Cache data
var cachedData = {};

// Current validation data
var currentPageHTTPS = false;
var currentCertInfo = null;

// Update on activation
chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({active: true}, function(tab) {
    onURLUpdated(tab[0].url);
  });
});

// Update on content change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({active: true}, function(tab) {
    onURLUpdated(tab[0].url);
  });
});

// Update badge
function updateBadge(text) {
  // Clear badge
  if (text == null) {
    chrome.browserAction.setBadgeText({text: ''});
    return;
  }

  // Default: gray
  var color = '#757575'
  if (text in badgeColors) {
    color = badgeColors[text]
  }

  chrome.browserAction.setBadgeBackgroundColor({color: badgeColors[text]});
  chrome.browserAction.setBadgeText({text: text});
}

// Fetch and display cert info
function onURLUpdated(url) {
  // Skip non-https urls
  if (url.substring(0, 8) !== 'https://') {
    currentPageHTTPS = false;
    currentCertInfo = null;
    updateBadge(null);
    return;
  } else {
    currentPageHTTPS = true;
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
  if (hostname in cachedData) {
    displayCertInfo(cachedData[hostname])
    return;
  }

  // Fetch if not cached
  // Temporarily disable popup
  chrome.browserAction.setPopup({popup: ''});
  updateBadge('...');
  fetchCertInfo(hostname, function(data) {
    // Enable popup
    chrome.browserAction.setPopup({popup: 'popup.html'});
    displayCertInfo(data);
  })
}

// Display cert info
function displayCertInfo(data) {
  currentCertInfo = data;

  // Failed to fetch data
  if (data === null) {
    updateBadge('ERR');
    return;
  }

  // Certificate not validated
  if (!('validation_level' in data)) {
    updateBadge('ERR');
    return;
  }

  updateBadge(data['validation_level_short']);
}

// Fetch cert info through API
// Only hostname is sent
function fetchCertInfo(hostname, callback) {
  // Create XHR
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    // Only handle event when request is finished
    if (xhr.readyState !== 4) {
      return;
    }

    if (typeof this.responseText === 'undefined' || this.responseText.length === 0) {
      callback(null);
      return;
    }

    // Parse and cache response
    try {
      var cert_info = JSON.parse(this.responseText);
      cachedData[hostname] = cert_info;
      // Pass data back
      callback(cert_info);
    } catch(e) {
      callback(null);
    }
  };

  // Make request
  xhr.open('GET', 'https://api.blupig.net/certificate-info/cert?host=' + encodeURIComponent(hostname), true);
  xhr.send();
}
