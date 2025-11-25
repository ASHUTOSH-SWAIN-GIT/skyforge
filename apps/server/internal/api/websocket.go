package api

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in development
		// In production, you should check the origin
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Room represents a collaboration room
type Room struct {
	clients map[*websocket.Conn]bool
	mu      sync.RWMutex
}

// CollaborationHub manages all collaboration rooms
type CollaborationHub struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

func NewCollaborationHub() *CollaborationHub {
	return &CollaborationHub{
		rooms: make(map[string]*Room),
	}
}

func (h *CollaborationHub) getOrCreateRoom(roomKey string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.rooms[roomKey]
	if !exists {
		room = &Room{
			clients: make(map[*websocket.Conn]bool),
		}
		h.rooms[roomKey] = room
	}
	return room
}

func (h *CollaborationHub) removeRoom(roomKey string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.rooms, roomKey)
}

func (h *CollaborationHub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extract room key from URL path: /ws/collaboration/{roomKey}
	roomKey := r.URL.Path[len("/ws/collaboration/"):]
	if roomKey == "" {
		http.Error(w, "Room key required", http.StatusBadRequest)
		return
	}

	// Upgrade connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	room := h.getOrCreateRoom(roomKey)

	// Add client to room
	room.mu.Lock()
	room.clients[conn] = true
	room.mu.Unlock()

	log.Printf("Client connected to room: %s (total clients: %d)", roomKey, len(room.clients))

	// Remove client when they disconnect
	defer func() {
		room.mu.Lock()
		delete(room.clients, conn)
		room.mu.Unlock()

		// Remove room if empty
		room.mu.RLock()
		clientCount := len(room.clients)
		room.mu.RUnlock()

		if clientCount == 0 {
			h.removeRoom(roomKey)
			log.Printf("Room %s removed (no clients)", roomKey)
		} else {
			log.Printf("Client disconnected from room: %s (remaining clients: %d)", roomKey, clientCount)
		}
	}()

	// Broadcast messages to all clients in the room (including sender for Yjs sync)
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Broadcast to all clients in the room (Yjs needs echo back to sender)
		room.mu.RLock()
		clients := make([]*websocket.Conn, 0, len(room.clients))
		for client := range room.clients {
			clients = append(clients, client)
		}
		room.mu.RUnlock()

		// Broadcast to all clients
		for _, client := range clients {
			if err := client.WriteMessage(messageType, message); err != nil {
				log.Printf("Error broadcasting message: %v", err)
				client.Close()
				room.mu.Lock()
				delete(room.clients, client)
				room.mu.Unlock()
			}
		}
	}
}

