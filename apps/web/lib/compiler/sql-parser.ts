// Port of internal/compiler/sql_parser.go — pattern-for-pattern.

export interface SQLColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isNullable: boolean;
  isForeignKey: boolean;
  refTable?: string;
  refColumn?: string;
  constraints: string[];
  defaultValue?: string;
}

export interface SQLTable {
  name: string;
  columns: SQLColumn[];
}

export interface SQLForeignKey {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  name?: string;
}

function removeSQLComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitSQLStatements(sql: string): string[] {
  const out: string[] = [];
  let current = "";
  let inString = false;
  let quote = "";
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]!;
    if ((ch === "'" || ch === '"' || ch === "`") && (i === 0 || sql[i - 1] !== "\\")) {
      if (!inString) {
        inString = true;
        quote = ch;
      } else if (ch === quote) {
        inString = false;
        quote = "";
      }
    }
    if (ch === ";" && !inString) {
      const t = current.trim();
      if (t) out.push(t);
      current = "";
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last) out.push(last);
  return out;
}

function cleanIdentifier(s: string): string {
  return s.trim().replace(/^["'`]+|["'`]+$/g, "");
}

function splitColumnDefinitions(content: string): string[] {
  const out: string[] = [];
  let current = "";
  let parens = 0;
  let inString = false;
  let quote = "";
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]!;
    if ((ch === "'" || ch === '"' || ch === "`") && (i === 0 || content[i - 1] !== "\\")) {
      if (!inString) {
        inString = true;
        quote = ch;
      } else if (ch === quote) {
        inString = false;
        quote = "";
      }
    }
    if (!inString) {
      if (ch === "(") parens++;
      else if (ch === ")") parens--;
    }
    if (ch === "," && parens === 0 && !inString) {
      const t = current.trim();
      if (t) out.push(t);
      current = "";
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last) out.push(last);
  return out;
}

function tokenizeColumnDef(def: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inString = false;
  let quote = "";
  let parens = 0;
  for (let i = 0; i < def.length; i++) {
    const ch = def[i]!;
    if ((ch === "'" || ch === '"' || ch === "`") && (i === 0 || def[i - 1] !== "\\")) {
      if (!inString) {
        inString = true;
        quote = ch;
      } else if (ch === quote) {
        inString = false;
        quote = "";
      }
      current += ch;
      continue;
    }
    if (!inString) {
      if (ch === "(") {
        parens++;
        current += ch;
      } else if (ch === ")") {
        parens--;
        current += ch;
      } else if (ch === " " || ch === "\t" || ch === "\n") {
        if (parens > 0) current += ch;
        else if (current.length) {
          tokens.push(current);
          current = "";
        }
      } else current += ch;
    } else current += ch;
  }
  if (current.length) tokens.push(current);
  return tokens;
}

function normalizeTypeString(typeStr: string): string {
  const u = typeStr.toUpperCase();
  if (u.startsWith("SERIAL")) return "integer";
  if (u.startsWith("BIGSERIAL")) return "bigint";
  if (u.startsWith("SMALLSERIAL")) return "integer";
  if (u === "UUID") return "uuid";
  if (u.startsWith("VARCHAR")) return u.toLowerCase();
  if (u.startsWith("CHARACTER VARYING")) return "varchar(255)";
  if (u === "TEXT") return "text";
  if (u === "INTEGER" || u === "INT") return "integer";
  if (u === "BIGINT") return "bigint";
  if (u === "SMALLINT") return "integer";
  if (u === "BOOLEAN" || u === "BOOL") return "boolean";
  if (u.startsWith("TIMESTAMP")) return "timestamp";
  if (u === "DATE") return "date";
  if (u === "TIME") return "timestamp";
  if (u.startsWith("NUMERIC") || u.startsWith("DECIMAL")) {
    return u.includes("(") ? u.toLowerCase() : "decimal(10,2)";
  }
  if (u === "REAL" || u === "FLOAT4") return "decimal(10,2)";
  if (u === "DOUBLE PRECISION" || u === "FLOAT8") return "decimal(10,2)";
  if (u === "JSONB" || u === "JSON") return "jsonb";
  if (u === "BYTEA" || u === "BLOB") return "text";
  if (u.startsWith("CHAR(")) return u.toLowerCase();
  if (u === "CHAR") return "varchar(255)";
  if (u.startsWith("INT(")) return "integer";
  if (u === "TINYINT" || u === "MEDIUMINT") return "integer";
  if (u.startsWith("TINYINT")) return "boolean";
  if (u === "DATETIME") return "timestamp";
  if (u.startsWith("ENUM") || u.startsWith("SET")) return "varchar(255)";
  return u.toLowerCase();
}

function normalizeDataType(tokens: string[]): string {
  if (!tokens.length) return "text";
  let typeStr = tokens[0]!.toUpperCase();
  if (typeStr.includes("(")) return normalizeTypeString(typeStr);
  if (tokens.length > 1 && tokens[1]!.startsWith("(")) {
    return normalizeTypeString(typeStr + tokens[1]);
  }
  return normalizeTypeString(typeStr);
}

function parseColumnDefinition(
  def: string,
  tableName: string,
): { col: SQLColumn; fk?: SQLForeignKey } {
  const col: SQLColumn = {
    name: "",
    type: "",
    isPrimaryKey: false,
    isUnique: false,
    isNullable: true,
    isForeignKey: false,
    constraints: [],
  };
  const tokens = tokenizeColumnDef(def);
  if (!tokens.length) return { col };

  col.name = cleanIdentifier(tokens[0]!);
  if (!col.name) return { col };

  if (tokens.length > 1) col.type = normalizeDataType(tokens.slice(1));

  const upper = def.toUpperCase();
  if (upper.includes("NOT NULL")) {
    col.isNullable = false;
    col.constraints.push("NN");
  }
  if (/\bUNIQUE\b/i.test(def)) {
    col.isUnique = true;
    if (!col.constraints.includes("UNQ")) col.constraints.push("UNQ");
  }
  if (/\bPRIMARY\s+KEY\b/i.test(def)) col.isPrimaryKey = true;
  if (/\b(AUTO_INCREMENT|SERIAL|BIGSERIAL|SMALLSERIAL|IDENTITY)\b/i.test(def)) {
    if (!col.constraints.includes("AI")) col.constraints.push("AI");
  }
  const defaultMatch = def.match(/\bDEFAULT\s+([^\s,]+(?:\([^)]*\))?)/i);
  if (defaultMatch) col.defaultValue = defaultMatch[1];

  const refMatch = def.match(/\bREFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/i);
  let fk: SQLForeignKey | undefined;
  if (refMatch) {
    col.isForeignKey = true;
    col.refTable = refMatch[1];
    col.refColumn = refMatch[2];
    if (!col.constraints.includes("FK")) col.constraints.push("FK");
    fk = {
      fromTable: tableName,
      fromColumn: col.name,
      toTable: refMatch[1]!,
      toColumn: refMatch[2]!,
    };
  }

  return { col, fk };
}

function parseForeignKeyConstraint(def: string, tableName: string): SQLForeignKey | undefined {
  const re =
    /(?:CONSTRAINT\s+["'`]?(\w+)["'`]?\s+)?FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/i;
  const m = def.match(re);
  if (!m) return undefined;
  return {
    name: m[1],
    fromTable: tableName,
    fromColumn: m[2]!,
    toTable: m[3]!,
    toColumn: m[4]!,
  };
}

function parseAlterTableFK(stmt: string): SQLForeignKey | undefined {
  const re =
    /ALTER\s+TABLE\s+["'`]?(\w+)["'`]?\s+ADD\s+(?:CONSTRAINT\s+["'`]?\w+["'`]?\s+)?FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/i;
  const m = stmt.match(re);
  if (!m) return undefined;
  return {
    fromTable: m[1]!,
    fromColumn: m[2]!,
    toTable: m[3]!,
    toColumn: m[4]!,
  };
}

function parseCreateTable(stmt: string): { table: SQLTable; fks: SQLForeignKey[] } {
  const fks: SQLForeignKey[] = [];
  const table: SQLTable = { name: "", columns: [] };

  const headRe =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["'`]?(\w+)["'`]?\.)?["'`]?(\w+)["'`]?\s*\(/i;
  const m = stmt.match(headRe);
  if (!m) return { table, fks };
  table.name = m[2]!;

  const startIdx = stmt.indexOf("(");
  if (startIdx === -1) return { table, fks };
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < stmt.length; i++) {
    if (stmt[i] === "(") depth++;
    else if (stmt[i] === ")") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) return { table, fks };

  const content = stmt.slice(startIdx + 1, endIdx);
  const defs = splitColumnDefinitions(content);
  const primaryKeys: string[] = [];
  const uniqueKeys = new Set<string>();

  for (const raw of defs) {
    const def = raw.trim();
    if (!def) continue;
    const upper = def.toUpperCase();

    if (upper.startsWith("PRIMARY KEY")) {
      const pk = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pk) for (const c of pk[1]!.split(",")) {
        const id = cleanIdentifier(c);
        if (id) primaryKeys.push(id);
      }
      continue;
    }
    if (upper.startsWith("UNIQUE")) {
      const u = def.match(/UNIQUE\s*(?:KEY|INDEX)?\s*(?:\w+\s*)?\(([^)]+)\)/i);
      if (u) for (const c of u[1]!.split(",")) {
        const id = cleanIdentifier(c);
        if (id) uniqueKeys.add(id.toLowerCase());
      }
      continue;
    }
    if (upper.startsWith("FOREIGN KEY") || upper.startsWith("CONSTRAINT")) {
      const fk = parseForeignKeyConstraint(def, table.name);
      if (fk) fks.push(fk);
      continue;
    }
    if (upper.startsWith("CHECK") || upper.startsWith("INDEX") || upper.startsWith("KEY")) continue;

    const { col, fk } = parseColumnDefinition(def, table.name);
    if (col.name) {
      table.columns.push(col);
      if (fk) fks.push(fk);
    }
  }

  for (const c of table.columns) {
    if (primaryKeys.some((pk) => pk.toLowerCase() === c.name.toLowerCase())) c.isPrimaryKey = true;
    if (uniqueKeys.has(c.name.toLowerCase())) {
      c.isUnique = true;
      if (!c.constraints.includes("UNQ")) c.constraints.push("UNQ");
    }
  }

  return { table, fks };
}

export function parseSQL(sqlContent: string): { tables: SQLTable[]; foreignKeys: SQLForeignKey[] } {
  let sql = removeSQLComments(sqlContent);
  sql = sql.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\s+/g, " ");
  const stmts = splitSQLStatements(sql);

  const tables: SQLTable[] = [];
  const foreignKeys: SQLForeignKey[] = [];

  for (const raw of stmts) {
    const stmt = raw.trim();
    const upper = stmt.toUpperCase();
    if (upper.startsWith("CREATE TABLE")) {
      const { table, fks } = parseCreateTable(stmt);
      if (table.name) {
        tables.push(table);
        foreignKeys.push(...fks);
      }
    } else if (upper.startsWith("ALTER TABLE")) {
      const fk = parseAlterTableFK(stmt);
      if (fk) foreignKeys.push(fk);
    }
  }

  return { tables, foreignKeys };
}
