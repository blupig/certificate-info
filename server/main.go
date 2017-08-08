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

package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

// rootHandler handles requests to /
func rootHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "certificate-info\nhttps://github.com/yunzhu-li/certificate-info")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
}

func validateHandler(w http.ResponseWriter, r *http.Request) {
	hostname := r.URL.Query().Get("host")
	if len(hostname) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, "{\"message\":\"Invalid parameters\"}")
		return
	}

	// Marshal and write response
	result := validateHost(hostname)
	m, _ := json.Marshal(result)
	fmt.Fprint(w, string(m))
}

// Validate host and return response
func validateHost(hostname string) map[string]string {
	// Result
	validationResult := ""
	validationResultShort := ""
	resultColor := ""
	message := ""

	// Cert info
	certOrganization := ""

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
		resultColor = "red"
		message = err.Error()

	} else {
		defer conn.Close()

		// Get certificate info
		cert := conn.ConnectionState().PeerCertificates[0]
		subj := cert.Subject
		orgs := subj.Organization

		// Default validation level
		validationResult = "Domain Control Validated"
		validationResultShort = "DV"
		certOrganization = ""
		resultColor = "yellow"
		message = "The website operator's control over this domain has been validated."

		// Set to IV if cert has O field
		if len(orgs) > 0 {
			validationResult = "Identity Validated"
			validationResultShort = "IV"
			certOrganization = orgs[0]
			resultColor = "blue"
			message = "The website operator's identity (organization or individual) has been validated."
		}
	}

	// Result object
	result := map[string]string{
		"validation_result":       validationResult,
		"validation_result_short": validationResultShort,
		"validation_level":        validationResult,
		"validation_level_short":  validationResultShort,
		"cert_organization":       certOrganization,
		"organization":            certOrganization,
		"result_color":            resultColor,
		"message":                 message,
	}

	return result
}

// Application entry point
func main() {
	// Configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	// Routes
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/cert", validateHandler)
	http.HandleFunc("/validate", validateHandler)

	// Start serving
	log.Println("Starting service...")
	http.ListenAndServe(":"+port, nil)
}
