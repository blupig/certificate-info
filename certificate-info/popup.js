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
    if (typeof(popupData["not_after"]) !== 'undefined' && popupData["not_after"].length > 0) {

      const one_day=1000*60*60*24;
      const error_threshold_days = 14;      // number of days before certificate management is a FIRE
      const warning_threshold_days = 45;    // number of days before certificate management is a WARNING

      var not_after = new Date(popupData["not_after"]);
      var now = Date.now();

      var daysUntilExpiration = Math.floor((not_after - now) / one_day);

      // display the certification expiration date
      document.getElementById('lblExpiration').innerHTML = 'Expiration: ' + not_after;

      if (daysUntilExpiration <= 0) {
        document.getElementById('lblExpirationMsg').innerHTML = '<b class="ExpirationError">Certificate Expired</b>';
          // expired
      } else if (daysUntilExpiration <= error_threshold_days) {
        document.getElementById('lblExpirationMsg').innerHTML = '<b class="ExpirationError">Certificate will expire in '+daysUntilExpiration+' day(s)</b>';
      } else if (daysUntilExpiration <= warning_threshold_days) {
        document.getElementById('lblExpirationMsg').innerHTML = '<b class="ExpirationWarning">Certificate will expire in '+daysUntilExpiration+' day(s)</b>';
      } else {
        document.getElementById('lblExpirationMsg').innerHTML = '<b>Certificate will expire in '+daysUntilExpiration+' day(s)</b>';
      }
    } else {
      document.getElementById('lblExpiration').innerHTML = 'Unknown ';
      document.getElementById('lblExpirationMsg').style['display'] = 'none';
    }
});
