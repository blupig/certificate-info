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

document.addEventListener('DOMContentLoaded', function () {
  var background = chrome.extension.getBackgroundPage();
  var colors = background.colors;
  var tabProtocol = background.currentTabProtocol;
  var validationData = background.currentTabValidationData;

  // HTTP page
  if (tabProtocol === 'http') {
    updateTitle(colors['orange'], 'HTTP Page')
    updateOrganization('');
    updateMessage('Data sent to / received from this site is transmitted in plaintext.');
    return;
  }

  // HTTPS page
  if (tabProtocol === 'https') {
    if (validationData == null) {
      // Data failed to fetch if HTTPS page and no data available
      updateTitle(colors['red'], 'Data fetch error')
      updateOrganization('');
      updateMessage('Try reloading the page. Note that this extension only works with publicly accessible sites.');
    } else {
      // Display info
      updateTitle(colors[validationData['result_color']], validationData['validation_result']);
      updateOrganization(validationData['cert_organization']);
      updateMessage(validationData['message']);
    }
  } else {
    // Other pages
    updateTitle(colors['gray'], 'No HTTP(S) page loaded');
    updateOrganization('');
    updateMessage('Certificate information will display here when you open an HTTPS page.');
  }
});

function updateTitle(color, text) {
  document.getElementById('lblTitle').innerHTML = text;
  document.getElementById('lblTitle').style['background'] = color;
}

function updateOrganization(text) {
  document.getElementById('lblOrganization').innerHTML = '<b>' + text + '</b>';
}

function updateMessage(text) {
  document.getElementById('lblMessage').innerHTML = text;
}
