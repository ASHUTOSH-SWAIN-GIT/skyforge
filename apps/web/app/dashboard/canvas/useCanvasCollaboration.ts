'use client';

import { useEffect, useState } from "react";
import { Edge, Node } from "reactflow";
import { WebrtcProvider } from "y-webrtc";
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

const SIGNALING_SERVERS = [
  "wss://signaling.yjs.dev",
  "wss://y-webrtc-signaling-eu.herokuapp.com",
  "wss://y-webrtc-signaling-us.herokuapp.com",
];

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
    const provider = new WebrtcProvider(`skyforge-${options.roomKey}`, doc, {
      signaling: SIGNALING_SERVERS,
    });
    const awareness = provider.awareness;

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

    const statusHandler = (event: { connected: boolean }) => {
      setStatus(event.connected ? "connected" : "connecting");
    };

    provider.on("status", statusHandler);

    const updatePeers = () => {
      const current = Array.from(awareness.getStates().values())
        .map((state) => (state as { user?: CollaboratorPresence }).user)
        .filter((presence): presence is CollaboratorPresence => Boolean(presence));
      setPeers(current);
    };

    awareness.on("change", updatePeers);
    updatePeers();

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
      unsubscribeStore();
      nodesArray.unobserveDeep(syncNodesFromDoc);
      edgesArray.unobserveDeep(syncEdgesFromDoc);
      awareness.off("change", updatePeers);
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

function getColorForUser(id: string) {
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
  return palette[Math.abs(hash) % palette.length];
}

