import { SQLForeignKey, SQLTable, parseSQL } from "./sql-parser";

interface Position {
  x: number;
  y: number;
}

function calculateLayout(count: number): Position[] {
  if (count === 0) return [];
  if (count === 1) return [{ x: 400, y: 200 }];
  if (count === 2)
    return [
      { x: 200, y: 200 },
      { x: 600, y: 200 },
    ];
  const cols = Math.ceil(Math.sqrt(count));
  const spacing = 400;
  const startX = 100;
  const startY = 100;
  const out: Position[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    out.push({ x: startX + col * spacing, y: startY + row * spacing });
  }
  return out;
}

function convertSQLToCanvas(tables: SQLTable[], fks: SQLForeignKey[]) {
  const positions = calculateLayout(tables.length);
  const tableToNodeId: Record<string, string> = {};
  const tableColumnMap: Record<string, Record<string, string>> = {};

  const nodes = tables.map((table, i) => {
    const nodeId = `table_${i}`;
    tableToNodeId[table.name] = nodeId;
    tableColumnMap[table.name] = {};
    const columns = table.columns.map((col, j) => {
      const colId = `col_${i}_${j}`;
      tableColumnMap[table.name]![col.name] = colId;
      const constraints: string[] = [];
      if (!col.isNullable && !col.constraints.includes("NN")) constraints.push("NN");
      if (col.isUnique && !col.constraints.includes("UNQ")) constraints.push("UNQ");
      if (col.isForeignKey && !col.constraints.includes("FK")) constraints.push("FK");
      for (const c of col.constraints) if (!constraints.includes(c)) constraints.push(c);
      return {
        id: colId,
        name: col.name,
        type: col.type,
        isPrimaryKey: col.isPrimaryKey,
        constraints,
      };
    });
    const pos = positions[i]!;
    return {
      id: nodeId,
      type: "tableNode",
      position: { x: pos.x, y: pos.y },
      data: { name: table.name, columns },
    };
  });

  const edges: unknown[] = [];
  const seen = new Set<string>();
  let counter = 0;
  for (const fk of fks) {
    const sourceNodeId = tableToNodeId[fk.fromTable];
    const targetNodeId = tableToNodeId[fk.toTable];
    if (!sourceNodeId || !targetNodeId) continue;
    const sourceColId = tableColumnMap[fk.fromTable]?.[fk.fromColumn];
    const targetColId = tableColumnMap[fk.toTable]?.[fk.toColumn];
    if (!sourceColId || !targetColId) continue;
    const key = `${fk.fromTable}.${fk.fromColumn}->${fk.toTable}.${fk.toColumn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({
      id: `edge_${counter++}`,
      source: sourceNodeId,
      target: targetNodeId,
      sourceHandle: `${sourceColId}-source`,
      targetHandle: `${targetColId}-target`,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#b4befe", strokeWidth: 2 },
      label: `${fk.fromColumn} -> ${fk.toColumn}`,
      labelStyle: { fill: "#cdd6f4", fontSize: 10, fontWeight: 500 },
      labelBgStyle: { fill: "#1e1e2e", fillOpacity: 0.8 },
    });
  }

  return { nodes, edges };
}

export function importSQL(sqlContent: string): unknown {
  const { tables, foreignKeys } = parseSQL(sqlContent);
  if (!tables.length) throw new Error("no tables found in SQL file");
  return convertSQLToCanvas(tables, foreignKeys);
}
