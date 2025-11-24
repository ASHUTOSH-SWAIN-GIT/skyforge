import { create } from "zustand";
import type { Node, Edge } from "reactflow";

export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  constraints: string[];
}

export interface TableData {
  name: string;
  columns: Column[];
}

export interface TableNodeData {
  name: string;
  columns: Column[];
}

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  // Actions
  addTable: (x: number, y: number) => void;
  updateTableName: (nodeId: string, name: string) => void;
  addColumn: (nodeId: string) => void;
  updateColumn: (nodeId: string, columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (nodeId: string, columnId: string) => void;
  deleteTable: (nodeId: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  loadFromData: (data: any) => void;
  exportToData: () => any;
}

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  addTable: (x, y) => {
    const newNode: Node<TableNodeData> = {
      id: generateId(),
      type: "tableNode",
      position: { x, y },
      data: {
        name: "new_table",
        columns: [
          {
            id: generateId(),
            name: "id",
            type: "uuid",
            isPrimaryKey: true,
            constraints: ["NN"],
          },
        ],
      },
    };
    set((state) => {
      const newNodes = [...state.nodes, newNode];
      console.log("Adding table node. Total nodes:", newNodes.length);
      return { nodes: newNodes };
    });
  },

  updateTableName: (nodeId, name) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, name } } : node
      ),
    }));
  },

  addColumn: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                columns: [
                  ...node.data.columns,
                  {
                    id: generateId(),
                    name: "new_column",
                    type: "varchar(255)",
                    isPrimaryKey: false,
                    constraints: [],
                  },
                ],
              },
            }
          : node
      ),
    }));
  },

  updateColumn: (nodeId, columnId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                columns: node.data.columns.map((col) =>
                  col.id === columnId ? { ...col, ...updates } : col
                ),
              },
            }
          : node
      ),
    }));
  },

  deleteColumn: (nodeId, columnId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                columns: node.data.columns.filter((col) => col.id !== columnId),
              },
            }
          : node
      ),
    }));
  },

  deleteTable: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    }));
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  loadFromData: (data) => {
    if (!data) {
      set({
        nodes: [],
        edges: [],
      });
      return;
    }
    set({
      nodes: data.nodes || [],
      edges: data.edges || [],
      selectedNodeId: null,
    });
  },

  exportToData: () => {
    const state = get();
    return {
      nodes: state.nodes,
      edges: state.edges,
    };
  },
}));

