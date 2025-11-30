'use client';

import { useEffect, useState, useRef, useCallback } from "react";
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

// Get WebSocket base URL (without room key - y-websocket appends room name)
const getWebSocketBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // Use environment variable if set
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
      return wsUrl.replace(/\/$/, "") + "/ws/collaboration";
    }
    
    // Derive WebSocket URL from current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    // For development (localhost), always use port 8080 for backend
    const isDev = host === "localhost" || host === "127.0.0.1";
    const wsPort = isDev ? ":8080" : (window.location.port ? `:${window.location.port}` : "");
    return `${protocol}//${host}${wsPort}/ws/collaboration`;
  }
  return "ws://localhost:8080/ws/collaboration";
};

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
  return palette[index] || "#cba6f7";
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

// Serialize peer list to a stable string for comparison
function serializePeers(peers: CollaboratorPresence[]): string {
  return peers
    .map(p => `${p.id}:${p.name}:${p.avatarUrl || ''}`)
    .sort()
    .join('|');
}

export function useCanvasCollaboration(options: UseCanvasCollaborationOptions) {
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const [status, setStatus] = useState<CollaborationStatus>("idle");
  const [peers, setPeers] = useState<CollaboratorPresence[]>([]);
  
  // Use refs to track current state without causing re-renders
  const lastPeersRef = useRef<string>("");
  const awarenessSetRef = useRef(false);
  const isConnectedRef = useRef(false);
  
  const userId = options.user?.id ?? null;
  const userName = options.user?.name ?? null;
  const userAvatarUrl = options.user?.avatarUrl ?? null;

  useEffect(() => {
    if (!options.enabled || !options.roomKey) {
      setStatus("idle");
      setPeers([]);
      lastPeersRef.current = "";
      awarenessSetRef.current = false;
      isConnectedRef.current = false;
      return;
    }

    setStatus("connecting");

    const doc = new Y.Doc();
    const wsBaseUrl = getWebSocketBaseUrl();
    const roomName = `skyforge-${options.roomKey}`;
    console.log("[Collaboration] Connecting to WebSocket:", wsBaseUrl, "room:", roomName);
    
    const provider = new WebsocketProvider(wsBaseUrl, roomName, doc, {
      connect: true,
    });
    const awareness = provider.awareness;

    // Set awareness state once
    const setAwarenessState = () => {
      if (userId && userName && !awarenessSetRef.current) {
        const userPresence: CollaboratorPresence = {
          id: userId,
          name: userName,
          color: getColorForUser(userId),
          avatarUrl: userAvatarUrl ?? null,
        };
        awareness.setLocalStateField("user", userPresence);
        awarenessSetRef.current = true;
        console.log("[Collaboration] Set awareness state for user:", userName, "avatar:", userAvatarUrl);
      }
    };

    // Force update awareness (used when reconnecting)
    const forceUpdateAwareness = () => {
      if (userId && userName) {
        const userPresence: CollaboratorPresence = {
          id: userId,
          name: userName,
          color: getColorForUser(userId),
          avatarUrl: userAvatarUrl ?? null,
        };
        awareness.setLocalStateField("user", userPresence);
        console.log("[Collaboration] Force updated awareness for:", userName);
      }
    };

    // Update peers from awareness state
    const updatePeers = () => {
      try {
        const states = awareness.getStates();
        const allPeers: CollaboratorPresence[] = [];
        
        // Collect all peers from awareness states
        states.forEach((state) => {
          const userData = (state as { user?: CollaboratorPresence }).user;
          if (userData && userData.id && userData.name) {
            allPeers.push({
              id: userData.id,
              name: userData.name,
              color: userData.color || getColorForUser(userData.id),
              avatarUrl: userData.avatarUrl ?? null,
            });
          }
        });
        
        // Ensure local user is always included
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
        
        // Deduplicate by user ID
        const uniquePeersMap = new Map<string, CollaboratorPresence>();
        for (const peer of allPeers) {
          // If we already have this peer, keep the one with more complete data
          const existing = uniquePeersMap.get(peer.id);
          if (!existing || (peer.avatarUrl && !existing.avatarUrl)) {
            uniquePeersMap.set(peer.id, peer);
          }
        }
        
        const uniquePeers = Array.from(uniquePeersMap.values());
        const serialized = serializePeers(uniquePeers);
        
        // Only update state if peers actually changed
        if (serialized !== lastPeersRef.current) {
          console.log("[Collaboration] Peers changed:", uniquePeers.length, uniquePeers.map(p => `${p.name} (avatar: ${p.avatarUrl ? 'yes' : 'no'})`));
          lastPeersRef.current = serialized;
          setPeers([...uniquePeers]);
        }
      } catch (error) {
        console.error("[Collaboration] Error updating peers:", error);
      }
    };

    // Add error handler
    provider.on("connection-error", (event: Event) => {
      console.error("[Collaboration] Connection error:", event);
      setStatus("idle");
      isConnectedRef.current = false;
    });

    provider.on("connection-close", () => {
      console.log("[Collaboration] Connection closed");
      setStatus("idle");
      isConnectedRef.current = false;
    });

    const statusHandler = (event: { status: "connecting" | "connected" | "disconnected" }) => {
      console.log("[Collaboration] Status changed:", event.status);
      if (event.status === "connected") {
        setStatus("connected");
        isConnectedRef.current = true;
        // Set awareness immediately on connection
        setAwarenessState();
        updatePeers();
        // Quick follow-up updates to ensure sync with other clients
        setTimeout(() => {
          forceUpdateAwareness();
          updatePeers();
        }, 50);
        setTimeout(() => {
          forceUpdateAwareness();
          updatePeers();
        }, 200);
        setTimeout(() => {
          forceUpdateAwareness();
          updatePeers();
        }, 500);
      } else if (event.status === "connecting") {
        setStatus("connecting");
      } else {
        setStatus("idle");
        isConnectedRef.current = false;
      }
    };

    provider.on("status", statusHandler);

    // Check connection state periodically as fallback
    const connectionCheck = setInterval(() => {
      if (provider.shouldConnect && provider.wsconnected && !isConnectedRef.current) {
        setStatus("connected");
        isConnectedRef.current = true;
        setAwarenessState();
        updatePeers();
      }
    }, 2000);

    // Set up document sync
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

    // Initialize document with current state if empty
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

    // Listen to awareness changes
    const awarenessChangeHandler = ({ added, removed, updated }: { added: number[]; removed: number[]; updated: number[] }) => {
      console.log("[Collaboration] Awareness change - added:", added.length, "removed:", removed.length, "updated:", updated.length);
      // Immediately update peers on any awareness change
      updatePeers();
      // When new peers are added, force update our own awareness so they see us
      if (added.length > 0) {
        forceUpdateAwareness();
        // Quick follow-up to ensure bidirectional sync
        setTimeout(updatePeers, 50);
        setTimeout(updatePeers, 150);
      }
    };
    
    awareness.on("change", awarenessChangeHandler);
    
    // Listen to sync events
    const syncHandler = (synced: boolean) => {
      console.log("[Collaboration] Sync event:", synced);
      if (synced) {
        forceUpdateAwareness();
        updatePeers();
        // Follow-up updates to ensure full sync
        setTimeout(updatePeers, 50);
        setTimeout(updatePeers, 150);
      }
    };
    provider.on("sync", syncHandler);
    
    // Initial setup
    setAwarenessState();
    
    // Aggressive initial peer updates for fast sync
    setTimeout(updatePeers, 100);
    setTimeout(updatePeers, 300);
    setTimeout(updatePeers, 600);
    setTimeout(updatePeers, 1000);
    
    // Periodic peer check (every 2 seconds for responsive updates)
    const peerCheckInterval = setInterval(() => {
      if (isConnectedRef.current) {
        updatePeers();
      }
    }, 2000);

    // Subscribe to store changes for syncing
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
      clearInterval(connectionCheck);
      clearInterval(peerCheckInterval);
      unsubscribeStore();
      nodesArray.unobserveDeep(syncNodesFromDoc);
      edgesArray.unobserveDeep(syncEdgesFromDoc);
      awareness.off("change", awarenessChangeHandler);
      provider.off("sync", syncHandler);
      provider.off("status", statusHandler);
      provider.destroy();
      doc.destroy();
      setPeers([]);
      setStatus("idle");
      lastPeersRef.current = "";
      awarenessSetRef.current = false;
      isConnectedRef.current = false;
    };
  }, [options.enabled, options.roomKey, userId, userName, userAvatarUrl, setNodes, setEdges]);

  return { status, peers };
}
