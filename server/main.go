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

package main

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

var evOIDs = map[string]bool{
	// Actalis
	"1.3.159.1.17.1": true,

	// AffirmTrust
	"1.3.6.1.4.1.34697.2.1": true,
	"1.3.6.1.4.1.34697.2.2": true,
	"1.3.6.1.4.1.34697.2.3": true,
	"1.3.6.1.4.1.34697.2.4": true,

	// A-Trust
	"1.2.40.0.17.1.22": true,

	// Buypass
	"2.16.578.1.26.1.3.3": true,

	// Camerfirma
	"1.3.6.1.4.1.17326.10.14.2.1.2": true,
	"1.3.6.1.4.1.17326.10.8.12.1.2": true,

	// Comodo Group
	"1.3.6.1.4.1.6449.1.2.1.5.1": true,

	// DigiCert
	"2.16.840.1.114412.2.1":     true,
	"2.16.840.1.114412.1.3.0.2": true,

	// E-Tugra
	"2.16.792.3.0.4.1.1.4": true,

	// Entrust
	"2.16.840.1.114028.10.1.2": true,

	// ETSI
	"0.4.0.2042.1.4": true,
	"0.4.0.2042.1.5": true,

	// Firmaprofesional
	"1.3.6.1.4.1.13177.10.1.3.10": true,

	// GeoTrust
	"1.3.6.1.4.1.14370.1.6": true,

	// GlobalSign
	"1.3.6.1.4.1.4146.1.1": true,

	// Go Daddy
	"2.16.840.1.114413.1.7.23.3": true,

	// Izenpe
	"1.3.6.1.4.1.14777.6.1.1": true,

	// Kamu Sertifikasyon Merkezi
	"2.16.792.1.2.1.1.5.7.1.9": true,

	// Logius PKIoverheid
	"2.16.528.1.1003.1.2.7": true,

	// Network Solutions
	"1.3.6.1.4.1.782.1.2.1.8.1": true,

	// OpenTrust/DocuSign France
	"1.3.6.1.4.1.22234.2.5.2.3.1": true,

	// QuoVadis
	"1.3.6.1.4.1.8024.0.2.100.1.2": true,

	// SECOM Trust Systems
	"1.2.392.200091.100.721.1": true,

	// Starfield Technologies
	"2.16.840.1.114414.1.7.23.3": true,

	// StartCom Certification Authority
	"1.3.6.1.4.1.23223.2":     true,
	"1.3.6.1.4.1.23223.1.1.1": true,

	// Swisscom
	"2.16.756.1.83.21.0": true,

	// SwissSign
	"2.16.756.1.89.1.2.1.1": true,

	// T-Systems
	"1.3.6.1.4.1.7879.13.24.1": true,

	// Thawte
	"2.16.840.1.113733.1.7.48.1": true,

	// Trustwave
	"2.16.840.1.114404.1.1.2.4.1": true,

	// Symantec (VeriSign)
	"2.16.840.1.113733.1.7.23.6": true,

	// Verizon Business (formerly Cybertrust)
	"1.3.6.1.4.1.6334.1.100.1": true,

	// Wells Fargo
	"2.16.840.1.114171.500.9": true,
}

// Cache validation response by hostname
var validationResultCache map[string]string

// rootHandler handles requests to /
func rootHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	fmt.Fprint(w, "certificate-info\nhttps://github.com/blupig/certificate-info")
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok\n")
}

func validateHandler(w http.ResponseWriter, r *http.Request) {
	// Check header first
	hostname := r.Header.Get("x-validate-host")

	// Check query string if header is not set (for compatibility reasons)
	// TODO: remove this
	if len(hostname) == 0 {
		hostname = r.URL.Query().Get("host")
		if len(hostname) == 0 {
			w.WriteHeader(http.StatusBadRequest)
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprint(w, "{\"message\":\"Invalid parameters\"}")
			return
		}
	}

	result := ""

	// Check cache
	if v, ok := validationResultCache[hostname]; ok {
		result = v
	} else {
		// Validate
		resultMap := validateHost(hostname)
		marshalled, _ := json.Marshal(resultMap)
		result = string(marshalled)

		// Cache response
		validationResultCache[hostname] = result
	}
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, result)
}

// Validate host and return response
func validateHost(hostname string) map[string]string {
	// Result
	validationResult := ""
	validationResultShort := ""
	resultColorHex := ""
	message := ""

	// Certs info
	subjectCommonName := ""
	subjectOrganization := ""
	subjectEVOID := ""
	issuerCommonName := ""
	issuerOrganization := ""
	not_after := ""

	// Add port number if not already
	if !strings.Contains(hostname, ":") {
		hostname += ":443"
	}

	// Create TLS connection
	dialer := new(net.Dialer)
	dialer.Timeout = 5 * time.Second // Timeout: 5 seconds
	conn, err := tls.DialWithDialer(dialer, "tcp", hostname, nil)
	if err != nil {
		// Connection failed
		validationResult = "Not Validated"
		validationResultShort = "!"
		resultColorHex = "#FF1744"
		message = err.Error()
	} else {
		defer conn.Close()

		// Get certificate info
		cert := conn.ConnectionState().PeerCertificates[0]
		certInfo := getCertInfo(cert)

		subjectCommonName = certInfo["subject_common_name"]
		subjectOrganization = certInfo["subject_organization"]
		subjectEVOID = certInfo["subject_ev_oid"]
		issuerCommonName = certInfo["issuer_common_name"]
		issuerOrganization = certInfo["issuer_organization"]
		not_after = certInfo["not_after"]

		// Validation level set to default (DV)
		validationResult = "Domain Control Validation"
		validationResultShort = "DV"
		resultColorHex = "#FF9800"
		message = "The website operator's control over this domain has been validated."

		// Set to IV if cert has O field
		if len(certInfo["subject_organization"]) > 0 {
			validationResult = "Identity Validation"
			validationResultShort = "IV"
			resultColorHex = "#2196F3"
			message = "The website operator's identity (individual or organization) has been validated."
		}

		// EV certificate
		if len(subjectEVOID) > 0 {
			validationResult = "Extended Validation"
			validationResultShort = "EV"
			resultColorHex = "#2CBE4E"
			message = "The website operator's identity (usually organization) has been validated."
		}
	}

	// Result object
	result := map[string]string{
		"validation_result":       validationResult,
		"validation_result_short": validationResultShort,
		"subject_common_name":     subjectCommonName,
		"subject_organization":    subjectOrganization,
		"issuer_common_name":      issuerCommonName,
		"issuer_organization":     issuerOrganization,
		"result_color_hex":        resultColorHex,
		"not_after":               not_after,
		"message":                 message,
	}

	return result
}

// Get cert info
func getCertInfo(cert *x509.Certificate) map[string]string {
	// Result object
	result := map[string]string{
		"subject_common_name":  "",
		"subject_organization": "",
		"subject_ev_oid":       "",
		"issuer_common_name":   "",
		"issuer_organization":  "",
		"not_after":            "",
	}

	subject := cert.Subject
	subjectOrgs := subject.Organization
	issuer := cert.Issuer
	issuerOrgs := issuer.Organization

	// Required fields
	result["subject_common_name"] = subject.CommonName
	result["issuer_common_name"] = issuer.CommonName
	result["not_after"] = cert.NotAfter.Format(time.RFC3339)

	// Optional fields
	if len(subjectOrgs) > 0 {
		result["subject_organization"] = subjectOrgs[0]
	}

	if len(issuerOrgs) > 0 {
		result["issuer_organization"] = issuerOrgs[0]
	}

	// Check all OIDs to identify EV certificates
	for _, oid := range cert.PolicyIdentifiers {
		// Construct OID string
		var buf bytes.Buffer
		for idx, num := range oid {
			buf.WriteString(strconv.Itoa(num))
			if idx < len(oid)-1 {
				buf.WriteString(".")
			}
		}
		oidString := buf.String()
		if evOIDs[oidString] {
			result["subject_ev_oid"] = oidString
		}
	}

	return result
}

// Application entry point
func main() {
	// Log to stdout
	log.SetOutput(os.Stdout)

	// Configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	// Initialize cache
	validationResultCache = make(map[string]string)

	// Purge cache periodically
	purgeTimer := time.NewTicker(time.Hour * 8)
	go func() {
		for {
			<-purgeTimer.C
			validationResultCache = make(map[string]string)
		}
	}()

	// Routes
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/status", statusHandler)
	http.HandleFunc("/validate", validateHandler)

	// Start serving
	log.Println("Starting service...")
	http.ListenAndServe(":"+port, nil)
}
