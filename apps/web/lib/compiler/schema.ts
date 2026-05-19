import {
  CanvasColumn,
  CanvasGraph,
  ColumnSchema,
  RelationSchema,
  Schema,
  TableSchema,
} from "./types";

export function cleanName(s: string): string {
  const t = (s ?? "").trim();
  if (!t) return "unnamed";
  return t.replace(/ /g, "_");
}

export function fallbackType(t: string): string {
  const x = (t ?? "").trim();
  return x || "text";
}

function hasConstraint(col: CanvasColumn, code: string): boolean {
  const target = code.toUpperCase();
  return (col.constraints ?? []).some((c) => c.toUpperCase() === target);
}

function isNotNull(col: CanvasColumn): boolean {
  if (col.isPrimaryKey) return true;
  if (hasConstraint(col, "NN")) return true;
  return col.isNullable === false;
}

function displayType(col: CanvasColumn): string {
  if (col.isPrimaryKey) return "primary_key";
  if (hasConstraint(col, "UNQ") || col.isUnique) return "unique";
  if (isNotNull(col)) return "not_null";
  return "regular";
}

function columnKey(nodeId: string, columnId: string): string {
  return `${nodeId}:${columnId}`;
}

function normalizeHandle(handle?: string): string {
  if (!handle) return "";
  return handle.replace(/-source$/, "").replace(/-target$/, "");
}

export function buildSchema(jsonData: Buffer | string | CanvasGraph): Schema {
  const graph: CanvasGraph =
    typeof jsonData === "string" || Buffer.isBuffer(jsonData)
      ? (JSON.parse(jsonData.toString()) as CanvasGraph)
      : jsonData;

  const tables: TableSchema[] = [];
  const tableMap = new Map<string, TableSchema>();
  const columnMap = new Map<string, ColumnSchema>();

  for (const node of graph.nodes ?? []) {
    const rawName = (node.data?.name ?? node.data?.label ?? "").trim();
    const tableName = rawName || `table_${node.id}`;

    const table: TableSchema = { id: node.id, name: tableName, columns: [] };

    for (const col of node.data?.columns ?? []) {
      if (!(col.name ?? "").trim()) continue;
      const c: ColumnSchema = {
        id: col.id,
        name: col.name,
        type: fallbackType(col.type),
        notNull: isNotNull(col),
        isUnique: !!col.isUnique || hasConstraint(col, "UNQ"),
        isPrimary: !!col.isPrimaryKey,
        displayType: displayType(col),
      };
      table.columns.push(c);
      columnMap.set(columnKey(node.id, col.id), c);
    }

    tables.push(table);
    tableMap.set(node.id, table);
  }

  const relations: RelationSchema[] = [];
  for (const edge of graph.edges ?? []) {
    const source = tableMap.get(edge.source);
    const target = tableMap.get(edge.target);
    if (!source || !target) continue;
    const sourceCol = columnMap.get(columnKey(edge.source, normalizeHandle(edge.sourceHandle)));
    const targetCol = columnMap.get(columnKey(edge.target, normalizeHandle(edge.targetHandle)));
    if (!sourceCol || !targetCol) continue;
    relations.push({
      fromTable: source.name,
      fromColumn: sourceCol.name,
      toTable: target.name,
      toColumn: targetCol.name,
    });
  }

  return { tables, relations };
}

export function findColumn(
  tables: TableSchema[],
  tableName: string,
  columnName: string,
): ColumnSchema | undefined {
  for (const t of tables) {
    if (t.name.toLowerCase() !== tableName.toLowerCase()) continue;
    for (const c of t.columns) {
      if (c.name.toLowerCase() === columnName.toLowerCase()) return c;
    }
  }
  return undefined;
}
