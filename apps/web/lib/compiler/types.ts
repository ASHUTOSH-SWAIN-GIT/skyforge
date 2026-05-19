export interface CanvasColumn {
  id: string;
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  constraints?: string[];
}

export interface CanvasNode {
  id: string;
  data: { name?: string; label?: string; columns?: CanvasColumn[] };
}

export interface CanvasEdge {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface CanvasGraph {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
}

export interface ColumnSchema {
  id: string;
  name: string;
  type: string;
  notNull: boolean;
  isUnique: boolean;
  isPrimary: boolean;
  displayType: string;
}

export interface TableSchema {
  id: string;
  name: string;
  columns: ColumnSchema[];
}

export interface RelationSchema {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface Schema {
  tables: TableSchema[];
  relations: RelationSchema[];
}
