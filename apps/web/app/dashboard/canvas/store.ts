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
  toggleColumnNotNull: (nodeId: string, columnId: string) => void;
  toggleAllColumnsNotNull: (nodeId: string) => void;
  deleteColumn: (nodeId: string, columnId: string) => void;
  deleteTable: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
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
    set((state) => ({ nodes: [...state.nodes, newNode] }));
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
                columns: node.data.columns.map((col: Column) => {
                  // If setting a column as primary key, remove primary key from all other columns
                  if (updates.isPrimaryKey === true && col.id !== columnId) {
                    return { ...col, isPrimaryKey: false };
                  }
                  // Apply updates to the target column
                  if (col.id === columnId) {
                    return { ...col, ...updates };
                  }
                  return col;
                }),
              },
            }
          : node
      ),
    }));
  },

  toggleColumnNotNull: (nodeId, columnId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                columns: node.data.columns.map((col: Column) => {
                  if (col.id !== columnId) return col;
                  
                  const constraints = col.constraints || [];
                  const hasNN = constraints.includes("NN");
                  
                  return {
                    ...col,
                    constraints: hasNN
                      ? constraints.filter((c) => c !== "NN")
                      : [...constraints, "NN"],
                  };
                }),
              },
            }
          : node
      ),
    }));
  },

  toggleAllColumnsNotNull: (nodeId) => {
    set((state) => {
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return state;

      const allNotNull = node.data.columns.every(
        (col: Column) => (col.constraints || []).includes("NN") || col.isPrimaryKey
      );

      return {
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  columns: n.data.columns.map((col: Column) => {
                    // Don't toggle primary keys - they should always be NOT NULL
                    if (col.isPrimaryKey) return col;
                    
                    const constraints = col.constraints || [];
                    const hasNN = constraints.includes("NN");
                    
                    if (allNotNull && hasNN) {
                      // Remove NN constraint
                      return {
                        ...col,
                        constraints: constraints.filter((c) => c !== "NN"),
                      };
                    } else if (!allNotNull && !hasNN) {
                      // Add NN constraint
                      return {
                        ...col,
                        constraints: [...constraints, "NN"],
                      };
                    }
                    
                    return col;
                  }),
                },
              }
            : n
        ),
      };
    });
  },

  deleteColumn: (nodeId, columnId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                columns: node.data.columns.filter((col: Column) => col.id !== columnId),
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

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
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
    
    // Normalize nodes to ensure constraints is always an array
    const normalizedNodes = (data.nodes || []).map((node: any) => ({
      ...node,
      data: {
        ...node.data,
        columns: (node.data?.columns || []).map((col: any) => ({
          ...col,
          constraints: Array.isArray(col.constraints) ? col.constraints : [],
        })),
      },
    }));
    
    set({
      nodes: normalizedNodes,
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

