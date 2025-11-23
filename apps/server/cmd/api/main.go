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

	mux.HandleFunc("/auth/google/login", authHandler.GoogleLogin)
	mux.HandleFunc("/auth/google/callback", authHandler.GoogleCallback)

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
