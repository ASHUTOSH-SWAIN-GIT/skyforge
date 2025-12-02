'use client';

import { useEffect, useState, useRef } from "react";
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

const USER_COLORS = ["#cba6f7", "#89b4fa", "#f5c2e7", "#a6e3a1", "#f9e2af", "#89dceb", "#fab387"];

const getWebSocketBaseUrl = (): string => {
  if (typeof window === "undefined") return "ws://localhost:8080/ws/collaboration";
  
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (wsUrl) return wsUrl.replace(/\/$/, "") + "/ws/collaboration";
  
  const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (backendUrl) return backendUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/ws/collaboration";
  
  const host = window.location.hostname;
  const isDev = host === "localhost" || host === "127.0.0.1";
  if (isDev) return `ws://${host}:8080/ws/collaboration`;
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${host}/ws/collaboration`;
};

const getColorForUser = (id: string): string => {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length] || "#cba6f7";
};

const deepClone = <T>(value: T): T => {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
};

const serializePeers = (peers: CollaboratorPresence[]): string => {
  return peers.map(p => `${p.id}:${p.name}`).sort().join('|');
};

export function useCanvasCollaboration(options: UseCanvasCollaborationOptions) {
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const [status, setStatus] = useState<CollaborationStatus>("idle");
  const [peers, setPeers] = useState<CollaboratorPresence[]>([]);
  
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
    const provider = new WebsocketProvider(getWebSocketBaseUrl(), `skyforge-${options.roomKey}`, doc, {
      connect: true,
      maxBackoffTime: 2500,
      disableBc: false,
    });
    const awareness = provider.awareness;

    const setAwarenessState = () => {
      if (userId && userName && !awarenessSetRef.current) {
        awareness.setLocalStateField("user", {
          id: userId,
          name: userName,
          color: getColorForUser(userId),
          avatarUrl: userAvatarUrl ?? null,
        });
        awarenessSetRef.current = true;
      }
    };

    const forceUpdateAwareness = () => {
      if (userId && userName) {
        awareness.setLocalStateField("user", {
          id: userId,
          name: userName,
          color: getColorForUser(userId),
          avatarUrl: userAvatarUrl ?? null,
        });
      }
    };

    const updatePeers = () => {
      const states = awareness.getStates();
      const uniquePeersMap = new Map<string, CollaboratorPresence>();
      
      states.forEach((state) => {
        const userData = (state as { user?: CollaboratorPresence }).user;
        if (userData?.id && userData?.name) {
          const existing = uniquePeersMap.get(userData.id);
          if (!existing || (userData.avatarUrl && !existing.avatarUrl)) {
            uniquePeersMap.set(userData.id, {
              id: userData.id,
              name: userData.name,
              color: userData.color || getColorForUser(userData.id),
              avatarUrl: userData.avatarUrl ?? null,
            });
          }
        }
      });
      
      if (userId && userName && !uniquePeersMap.has(userId)) {
        uniquePeersMap.set(userId, {
          id: userId,
          name: userName,
          color: getColorForUser(userId),
          avatarUrl: userAvatarUrl ?? null,
        });
      }
      
      const uniquePeers = Array.from(uniquePeersMap.values());
      const serialized = serializePeers(uniquePeers);
      
      if (serialized !== lastPeersRef.current) {
        lastPeersRef.current = serialized;
        setPeers(uniquePeers);
      }
    };

    provider.on("connection-error", () => {
      setStatus("idle");
      isConnectedRef.current = false;
    });

    provider.on("connection-close", () => {
      setStatus("idle");
      isConnectedRef.current = false;
    });

    const statusHandler = (event: { status: "connecting" | "connected" | "disconnected" }) => {
      if (event.status === "connected") {
        setStatus("connected");
        isConnectedRef.current = true;
        setAwarenessState();
        updatePeers();
        setTimeout(() => { forceUpdateAwareness(); updatePeers(); }, 100);
      } else if (event.status === "connecting") {
        setStatus("connecting");
      } else {
        setStatus("idle");
        isConnectedRef.current = false;
      }
    };

    provider.on("status", statusHandler);

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

    if (nodesArray.length > 0) syncNodesFromDoc();
    if (edgesArray.length > 0) syncEdgesFromDoc();

    const awarenessChangeHandler = ({ added, removed }: { added: number[]; removed: number[] }) => {
      updatePeers();
      if (removed.length > 0) requestAnimationFrame(updatePeers);
      if (added.length > 0) {
        forceUpdateAwareness();
        setTimeout(updatePeers, 100);
      }
    };
    
    awareness.on("change", awarenessChangeHandler);
    
    const syncHandler = (synced: boolean) => {
      if (synced) {
        forceUpdateAwareness();
        updatePeers();
      }
    };
    provider.on("sync", syncHandler);
    
    setAwarenessState();
    setTimeout(updatePeers, 100);
    setTimeout(updatePeers, 500);
    
    const peerCheckInterval = setInterval(() => {
      if (isConnectedRef.current) updatePeers();
    }, 3000);

    let syncTimeout: NodeJS.Timeout | null = null;
    let pendingNodesSync = false;
    let pendingEdgesSync = false;
    
    const flushSync = () => {
      const state = useCanvasStore.getState();
      
      if (pendingNodesSync && !applyingNodes.current) {
        doc.transact(() => {
          nodesArray.delete(0, nodesArray.length);
          nodesArray.push(deepClone(state.nodes));
        });
        pendingNodesSync = false;
      }
      
      if (pendingEdgesSync && !applyingEdges.current) {
        doc.transact(() => {
          edgesArray.delete(0, edgesArray.length);
          edgesArray.push(deepClone(state.edges));
        });
        pendingEdgesSync = false;
      }
    };
    
    const unsubscribeStore = useCanvasStore.subscribe((state, previousState) => {
      if (state.nodes !== previousState?.nodes && !applyingNodes.current) {
        pendingNodesSync = true;
      }
      if (state.edges !== previousState?.edges && !applyingEdges.current) {
        pendingEdgesSync = true;
      }
      
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(flushSync, 32);
    });

    const cleanupAwareness = () => awareness.setLocalState(null);
    const handleBeforeUnload = () => cleanupAwareness();
    const handlePageHide = () => cleanupAwareness();

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      cleanupAwareness();
      if (syncTimeout) clearTimeout(syncTimeout);
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
