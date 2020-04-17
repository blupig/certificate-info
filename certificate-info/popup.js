// certificate-info
// Copyright (C) 2017-2018 Yunzhu Li
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

document.addEventListener('DOMContentLoaded', function () {
  var background = chrome.extension.getBackgroundPage();
  var currentTabId = background.currentTabId;
  var popupData = background.popupData[currentTabId];

  if (typeof popupData === 'undefined') return;

  document.getElementById('lblValidationResult').style['background'] = popupData['result_color_hex'];
  document.getElementById('lblValidationResult').innerHTML = popupData['validation_result'];
  document.getElementById('lblMessage').innerHTML = popupData['message'];

  // Identity
  if (popupData["subject_organization"].length > 0) {
    document.getElementById('lblSubjectOrganization').innerHTML = 'Organization:<br><b>' + popupData['subject_organization'] + '</b>';
  } else {
    document.getElementById('lblSubjectOrganization').innerHTML = '';
  }

  // Issuer
  if (popupData["issuer_common_name"].length > 0) {
    document.getElementById('pIssuer').style['display'] = 'block';
    document.getElementById('lblIssuerOrganization').innerHTML = '<b>' + popupData['issuer_organization'] + '</b>';
    document.getElementById('lblIssuerCommonName').innerHTML = popupData['issuer_common_name'];
  } else {
    document.getElementById('pIssuer').style['display'] = 'none';
  }

  // Expiration
  if (typeof (popupData["not_after"]) !== 'undefined' && popupData["not_after"].length > 0) {

    var notAfter = new Date(popupData['not_after']);

    var expiration_days_until = popupData['expiration_days_until'];
    var expiration_class = popupData['expiration_class'];

    // display the certification expiration date with a tooltip
    document.getElementById('lblExpirationDate').innerHTML =
      '<div class="tooltip">' +
      notAfter.toLocaleDateString() +
      '<span class="tooltiptext">' + notAfter + '</span>' +
      '</div>'

    // display detail about how many days until expiration, all in appropriate styling based on days until expiration
    if (expiration_days_until <= 0) {
      document.getElementById('lblExpirationMessage').innerHTML = '<b class="ExpirationError">Certificate Expired</b>';
      // expired
    } else {
      document.getElementById('lblExpirationMessage').innerHTML = '<b class="' + expiration_class + '">Certificate will expire in ' + expiration_days_until + ' day(s)</b>';
    }
  } else {
    // An error occurred when trying to get certificate information
    document.getElementById('lblExpirationDate').innerHTML = '<span class="ExpirationError">Unknown</span>';
    document.getElementById('lblExpirationMessage').style['display'] = 'none';
  }
});
