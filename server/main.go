package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

// rootHandler handles requests to /
func rootHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "certificate-info\nhttps://github.com/yunzhu-li/certificate-info")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
}

func certHandler(w http.ResponseWriter, r *http.Request) {
	hostname := r.URL.Query().Get("host")

	// Create TLS connection
	conn, err := tls.Dial("tcp", hostname+":443", nil)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, "{\"message\":\""+err.Error()+"\"")
		return
	}
	defer conn.Close()

	// Get certificate info
	cert := conn.ConnectionState().PeerCertificates[0]
	subj := cert.Subject
	orgs := subj.Organization

	// Default validation level
	validationLevel := "DV"

	// Set to IV if cert has O field
	if len(orgs) > 0 {
		validationLevel = "IV"
	}

	// Result object
	result := map[string]string{"validation_level": validationLevel, "message": "ok"}

	// Marshal and write response
	m, _ := json.Marshal(result)
	fmt.Fprint(w, string(m))
	return
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
	http.HandleFunc("/cert", certHandler)

	// Start serving
	log.Println("Starting service...")
	http.ListenAndServe(":"+port, nil)
}
