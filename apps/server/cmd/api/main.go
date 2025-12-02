package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/api"
	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/auth"
	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/database"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	// db connection using pgx
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback to DB_URL for backward compatibility
		dbURL = os.Getenv("DB_URL")
		if dbURL == "" {
			log.Fatal("DATABASE_URL or DB_URL environment variable not set")
	}
	}

	// Parse config for connection
	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Error parsing database URL: %v", err)
	}

	// Disable prepared statements for connection pooler compatibility (Supabase)
	// This prevents "prepared statement already exists" errors with poolers
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	// Override LookupFunc to prefer IPv4 but allow IPv6 as fallback
	config.LookupFunc = func(ctx context.Context, host string) ([]string, error) {
		// Resolve hostname to IP addresses
		ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
		if err != nil {
			return nil, err
		}

		// Separate IPv4 and IPv6 addresses
		var ipv4Addrs []string
		var ipv6Addrs []string
		for _, ip := range ips {
			if ip.IP.To4() != nil {
				ipv4Addrs = append(ipv4Addrs, ip.IP.String())
			} else {
				ipv6Addrs = append(ipv6Addrs, ip.IP.String())
			}
		}

		// Prefer IPv4, but return IPv6 if IPv4 is not available
		if len(ipv4Addrs) > 0 {
			return ipv4Addrs, nil
		}
		if len(ipv6Addrs) > 0 {
			log.Printf("Warning: No IPv4 address found for %s, using IPv6. If connection fails, try using Supabase connection pooler.", host)
			return ipv6Addrs, nil
		}

		return nil, fmt.Errorf("no IP address found for %s", host)
	}

	// Custom dial function that tries IPv4 first, then IPv6
	config.DialFunc = func(ctx context.Context, network, addr string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(addr)
		if err != nil {
			return nil, err
		}

		// Check if it's already an IP address
		ip := net.ParseIP(host)
		if ip != nil {
			// It's an IP address, dial directly
			if ip.To4() != nil {
				dialer := &net.Dialer{}
				return dialer.DialContext(ctx, "tcp4", addr)
			} else {
				// IPv6 - try to dial, but this might fail if IPv6 is not available
				dialer := &net.Dialer{}
				return dialer.DialContext(ctx, "tcp6", addr)
			}
		}

		// It's a hostname, resolve and try IPv4 first
		ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
		if err != nil {
			return nil, err
		}

		// Try IPv4 first
		for _, ipAddr := range ips {
			if ipAddr.IP.To4() != nil {
				dialer := &net.Dialer{}
				return dialer.DialContext(ctx, "tcp4", net.JoinHostPort(ipAddr.IP.String(), port))
			}
		}

		// Fallback to IPv6 if IPv4 not available
		for _, ipAddr := range ips {
			if ipAddr.IP.To4() == nil {
				log.Printf("Warning: Attempting IPv6 connection to %s", host)
				dialer := &net.Dialer{}
				return dialer.DialContext(ctx, "tcp6", net.JoinHostPort(ipAddr.IP.String(), port))
			}
		}

		return nil, fmt.Errorf("no IP address found for %s", host)
	}

	// Test connection using pgx.ConnectConfig
	conn, err := pgx.ConnectConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}
	defer conn.Close(context.Background())

	// Example query to test connection
	var version string
	if err := conn.QueryRow(context.Background(), "SELECT version()").Scan(&version); err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	log.Println("Connected to:", version)

	// Convert to *sql.DB for sqlc compatibility using stdlib
	var db *sql.DB = stdlib.OpenDB(*config)
	defer db.Close()

	queries := database.New(db)
	authHandler := auth.NewHandler(queries)
	projectHandler := api.NewProjectHandler(queries)
	collabHub := api.NewCollaborationHub()

	mux := api.NewRouter(authHandler, projectHandler, collabHub)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
