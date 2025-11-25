'use client';

import { useEffect, useState } from "react";
import { Edge, Node } from "reactflow";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useCanvasStore } from "./store";

export type CollaborationStatus = "idle" | "connecting" | "connected";

export interface CollaboratorPresence {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string | null;
}

interface UseCanvasCollaborationOptions {
  roomKey?: string | null;
  enabled: boolean;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

// Get WebSocket URL from environment or use default
const getWebSocketUrl = (roomKey: string): string => {
  if (typeof window !== "undefined") {
    // Use environment variable if set, otherwise derive from current location
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
      const baseUrl = wsUrl.replace(/\/$/, "");
      return `${baseUrl}/ws/collaboration/${roomKey}`;
    }
    
    // Derive WebSocket URL from current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    // For development (localhost), always use port 8080 for backend
    // In production, use the same host/port as frontend
    const isDev = host === "localhost" || host === "127.0.0.1";
    const wsPort = isDev ? ":8080" : (window.location.port ? `:${window.location.port}` : "");
    return `${protocol}//${host}${wsPort}/ws/collaboration/${roomKey}`;
  }
  return `ws://localhost:8080/ws/collaboration/${roomKey}`;
};

export function useCanvasCollaboration(options: UseCanvasCollaborationOptions) {
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const [status, setStatus] = useState<CollaborationStatus>("idle");
  const [peers, setPeers] = useState<CollaboratorPresence[]>([]);
  const userId = options.user?.id ?? null;
  const userName = options.user?.name ?? null;
  const userAvatarUrl = options.user?.avatarUrl ?? null;

  useEffect(() => {
    if (!options.enabled || !options.roomKey) {
      setStatus("idle");
      setPeers([]);
      return;
    }

    setStatus("connecting");

    const doc = new Y.Doc();
    const wsUrl = getWebSocketUrl(options.roomKey);
    console.log("[Collaboration] Connecting to WebSocket:", wsUrl);
    
    const provider = new WebsocketProvider(wsUrl, `skyforge-${options.roomKey}`, doc, {
      connect: true,
    });
    const awareness = provider.awareness;

    // Add error handler
    provider.on("connection-error", (event: Event, provider: WebsocketProvider) => {
      console.error("[Collaboration] Connection error:", event);
      setStatus("idle");
    });

    // Check connection state periodically as fallback
    const connectionCheck = setInterval(() => {
      if (provider.shouldConnect && provider.wsconnected) {
        setStatus("connected");
        clearInterval(connectionCheck);
      }
    }, 1000);

    // Clear interval on cleanup
    const cleanupInterval = () => clearInterval(connectionCheck);

    if (userId && userName) {
      awareness.setLocalStateField("user", {
        id: userId,
        name: userName,
        color: getColorForUser(userId),
        avatarUrl: userAvatarUrl,
      });
    }

    const nodesArray = doc.getArray<Node>("nodes");
    const edgesArray = doc.getArray<Edge>("edges");

    const applyingNodes = { current: false };
    const applyingEdges = { current: false };

    const syncNodesFromDoc = () => {
      applyingNodes.current = true;
      setNodes(nodesArray.toArray() as Node[]);
      applyingNodes.current = false;
    };

    const syncEdgesFromDoc = () => {
      applyingEdges.current = true;
      setEdges(edgesArray.toArray() as Edge[]);
      applyingEdges.current = false;
    };

    nodesArray.observeDeep(syncNodesFromDoc);
    edgesArray.observeDeep(syncEdgesFromDoc);

    const initialState = useCanvasStore.getState();
    doc.transact(() => {
      if (nodesArray.length === 0 && initialState.nodes.length > 0) {
        nodesArray.push(deepClone(initialState.nodes));
      }
      if (edgesArray.length === 0 && initialState.edges.length > 0) {
        edgesArray.push(deepClone(initialState.edges));
      }
    });

    if (nodesArray.length > 0) {
      syncNodesFromDoc();
    }
    if (edgesArray.length > 0) {
      syncEdgesFromDoc();
    }

    const statusHandler = (event: { status: "connecting" | "connected" | "disconnected" }) => {
      console.log("[Collaboration] Status changed:", event.status);
      if (event.status === "connected") {
        setStatus("connected");
        clearInterval(connectionCheck);
      } else if (event.status === "connecting") {
        setStatus("connecting");
      } else {
        setStatus("idle");
        clearInterval(connectionCheck);
      }
    };

    provider.on("status", statusHandler);

    const updatePeers = () => {
      try {
        // Get all awareness states (including local)
        const states = awareness.getStates();
        const allPeers: CollaboratorPresence[] = [];
        
        // Iterate through all client states
        states.forEach((state, clientId) => {
          const userData = (state as { user?: CollaboratorPresence }).user;
          if (userData && userData.id && userData.name) {
            allPeers.push(userData);
          }
        });
        
        // Ensure local user is included if they have user data
        if (userId && userName) {
          const localUserExists = allPeers.some(p => p.id === userId);
          if (!localUserExists) {
            allPeers.push({
              id: userId,
              name: userName,
              color: getColorForUser(userId),
              avatarUrl: userAvatarUrl ?? null,
            });
          }
        }
        
        // Deduplicate by user ID to prevent duplicate keys
        const uniquePeersMap = new Map<string, CollaboratorPresence>();
        for (const peer of allPeers) {
          if (!uniquePeersMap.has(peer.id)) {
            uniquePeersMap.set(peer.id, peer);
          }
        }
        
        const uniquePeers = Array.from(uniquePeersMap.values());
        
        console.log("[Collaboration] Peers updated:", uniquePeers.length, uniquePeers.map(p => p.name));
        
        setPeers(uniquePeers);
      } catch (error) {
        console.error("Error updating peers:", error);
      }
    };

    // Listen to multiple events to catch all peer changes
    const awarenessChangeHandler = () => {
      updatePeers();
    };
    const awarenessUpdateHandler = () => {
      updatePeers();
    };
    
    awareness.on("change", awarenessChangeHandler);
    awareness.on("update", awarenessUpdateHandler);
    
    // Also listen to sync events for peer connections
    const syncHandler = () => {
      // Small delay to ensure awareness state is synced
      setTimeout(updatePeers, 200);
    };
    provider.on("sync", syncHandler);
    
    // Initial update with delay to allow awareness to sync
    setTimeout(updatePeers, 500);
    
    // Periodic check as fallback (every 2 seconds)
    const peerCheckInterval = setInterval(updatePeers, 2000);

    const unsubscribeStore = useCanvasStore.subscribe((state, previousState) => {
      if (state.nodes !== previousState?.nodes && !applyingNodes.current) {
        doc.transact(() => {
          nodesArray.delete(0, nodesArray.length);
          nodesArray.push(deepClone(state.nodes));
        });
      }
      if (state.edges !== previousState?.edges && !applyingEdges.current) {
        doc.transact(() => {
          edgesArray.delete(0, edgesArray.length);
          edgesArray.push(deepClone(state.edges));
        });
      }
    });

    return () => {
      cleanupInterval();
      clearInterval(peerCheckInterval);
      unsubscribeStore();
      nodesArray.unobserveDeep(syncNodesFromDoc);
      edgesArray.unobserveDeep(syncEdgesFromDoc);
      awareness.off("change", awarenessChangeHandler);
      awareness.off("update", awarenessUpdateHandler);
      provider.off("sync", syncHandler);
      provider.off("status", statusHandler);
      provider.destroy();
      doc.destroy();
      setPeers([]);
      setStatus("idle");
    };
  }, [options.enabled, options.roomKey, userId, userName, userAvatarUrl, setNodes, setEdges]);

  return { status, peers };
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function getColorForUser(id: string): string {
  const palette = [
    "#cba6f7",
    "#89b4fa",
    "#f5c2e7",
    "#a6e3a1",
    "#f9e2af",
    "#89dceb",
    "#fab387",
  ];
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = Math.abs(hash) % palette.length;
  return palette[index] || "#cba6f7"; // Fallback color
}

