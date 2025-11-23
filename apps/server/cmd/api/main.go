package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/ASHUTOSH-SWAIN-GIT/DbAlly/server/internal/auth"
	"github.com/ASHUTOSH-SWAIN-GIT/DbAlly/server/internal/database"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq" // PostgreSQL driver
)

func main() {
	godotenv.Load()

	// db connection
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL environment variable not set")
	}
	conn, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening database connection: %v", err)
	}
	defer conn.Close()

	// Test the connection
	if err := conn.Ping(); err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	log.Println("Successfully connected to the database")

	queries := database.New(conn)
	authHandler := auth.NewHandler(queries)

	mux := http.NewServeMux()

	// CORS middleware
	corsMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next(w, r)
		}
	}

	mux.HandleFunc("/auth/google/login", authHandler.GoogleLogin)
	mux.HandleFunc("/auth/google/callback", authHandler.GoogleCallback)
	mux.HandleFunc("/auth/me", corsMiddleware(authHandler.GetMe))

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
