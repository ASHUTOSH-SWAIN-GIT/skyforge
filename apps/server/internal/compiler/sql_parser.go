package compiler

import (
	"regexp"
	"strings"
)

type SQLTable struct {
	Name    string
	Columns []SQLColumn
}

type SQLColumn struct {
	Name         string
	Type         string
	IsPrimaryKey bool
	IsUnique     bool
	IsNullable   bool
	IsForeignKey bool
	RefTable     string
	RefColumn    string
	Constraints  []string
	DefaultValue string
}

type SQLForeignKey struct {
	FromTable  string
	FromColumn string
	ToTable    string
	ToColumn   string
	Name       string
}

// ParseSQL parses SQL CREATE TABLE statements and extracts schema information
func ParseSQL(sqlContent string) ([]SQLTable, []SQLForeignKey, error) {
	tables := []SQLTable{}
	foreignKeys := []SQLForeignKey{}

	// Normalize SQL - remove comments and extra whitespace
	sqlContent = removeSQLComments(sqlContent)
	sqlContent = strings.ReplaceAll(sqlContent, "\r\n", "\n")
	sqlContent = strings.ReplaceAll(sqlContent, "\r", "\n")
	// Normalize multiple spaces
	sqlContent = regexp.MustCompile(`\s+`).ReplaceAllString(sqlContent, " ")

	// Split by semicolons to get individual statements
	statements := splitSQLStatements(sqlContent)

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		upperStmt := strings.ToUpper(stmt)

		if strings.HasPrefix(upperStmt, "CREATE TABLE") {
			table, fks := parseCreateTable(stmt)
			if table.Name != "" {
				tables = append(tables, table)
				foreignKeys = append(foreignKeys, fks...)
			}
		} else if strings.HasPrefix(upperStmt, "ALTER TABLE") {
			// Parse ALTER TABLE ADD CONSTRAINT for foreign keys
			fk := parseAlterTableFK(stmt)
			if fk != nil {
				foreignKeys = append(foreignKeys, *fk)
			}
		}
	}

	return tables, foreignKeys, nil
}

func removeSQLComments(sql string) string {
	// Remove single-line comments (-- comment)
	re := regexp.MustCompile(`--[^\n]*`)
	sql = re.ReplaceAllString(sql, "")

	// Remove multi-line comments (/* comment */)
	re = regexp.MustCompile(`(?s)/\*.*?\*/`)
	sql = re.ReplaceAllString(sql, "")

	return sql
}

func splitSQLStatements(sql string) []string {
	// Split by semicolon, but be careful with semicolons inside strings
	statements := []string{}
	current := strings.Builder{}
	inString := false
	quoteChar := byte(0)

	for i := 0; i < len(sql); i++ {
		char := sql[i]

		if (char == '\'' || char == '"' || char == '`') && (i == 0 || sql[i-1] != '\\') {
			if !inString {
				inString = true
				quoteChar = char
			} else if char == quoteChar {
				inString = false
				quoteChar = 0
			}
		}

		if char == ';' && !inString {
			stmt := strings.TrimSpace(current.String())
			if stmt != "" {
				statements = append(statements, stmt)
			}
			current.Reset()
		} else {
			current.WriteByte(char)
		}
	}

	if strings.TrimSpace(current.String()) != "" {
		statements = append(statements, strings.TrimSpace(current.String()))
	}

	return statements
}

func parseCreateTable(stmt string) (SQLTable, []SQLForeignKey) {
	table := SQLTable{}
	foreignKeys := []SQLForeignKey{}

	// Extract table name - handle various formats
	// CREATE TABLE [IF NOT EXISTS] [schema.]table_name
	re := regexp.MustCompile(`(?i)CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["'\x60]?(\w+)["'\x60]?\.)?["'\x60]?(\w+)["'\x60]?\s*\(`)
	matches := re.FindStringSubmatch(stmt)
	if len(matches) < 3 {
		return table, foreignKeys
	}
	// Use schema.table or just table
	if matches[1] != "" {
		table.Name = matches[2] // Just use table name, ignore schema
	} else {
		table.Name = matches[2]
	}

	// Extract content between parentheses
	startIdx := strings.Index(stmt, "(")
	if startIdx == -1 {
		return table, foreignKeys
	}

	// Find matching closing parenthesis
	parenCount := 0
	endIdx := -1
	for i := startIdx; i < len(stmt); i++ {
		if stmt[i] == '(' {
			parenCount++
		} else if stmt[i] == ')' {
			parenCount--
			if parenCount == 0 {
				endIdx = i
				break
			}
		}
	}

	if endIdx == -1 {
		return table, foreignKeys
	}

	content := stmt[startIdx+1 : endIdx]

	// Parse column definitions and constraints
	definitions := splitColumnDefinitions(content)
	primaryKeys := []string{}
	uniqueKeys := map[string]bool{}

	for _, def := range definitions {
		def = strings.TrimSpace(def)
		if def == "" {
			continue
		}

		upperDef := strings.ToUpper(def)

		// Check for PRIMARY KEY constraint (table-level)
		if strings.HasPrefix(upperDef, "PRIMARY KEY") {
			pkRe := regexp.MustCompile(`(?i)PRIMARY\s+KEY\s*\(([^)]+)\)`)
			pkMatches := pkRe.FindStringSubmatch(def)
			if len(pkMatches) >= 2 {
				cols := strings.Split(pkMatches[1], ",")
				for _, col := range cols {
					col = cleanIdentifier(col)
					if col != "" {
						primaryKeys = append(primaryKeys, col)
					}
				}
			}
			continue
		}

		// Check for UNIQUE constraint (table-level)
		if strings.HasPrefix(upperDef, "UNIQUE") {
			uniqueRe := regexp.MustCompile(`(?i)UNIQUE\s*(?:KEY|INDEX)?\s*(?:\w+\s*)?\(([^)]+)\)`)
			uniqueMatches := uniqueRe.FindStringSubmatch(def)
			if len(uniqueMatches) >= 2 {
				cols := strings.Split(uniqueMatches[1], ",")
				for _, col := range cols {
					col = cleanIdentifier(col)
					if col != "" {
						uniqueKeys[col] = true
					}
				}
			}
			continue
		}

		// Check for FOREIGN KEY constraint (table-level)
		if strings.HasPrefix(upperDef, "FOREIGN KEY") || strings.HasPrefix(upperDef, "CONSTRAINT") {
			fk := parseForeignKeyConstraint(def, table.Name)
			if fk != nil {
				foreignKeys = append(foreignKeys, *fk)
			}
			continue
		}

		// Check for CHECK constraint
		if strings.HasPrefix(upperDef, "CHECK") {
			continue
		}

		// Check for INDEX
		if strings.HasPrefix(upperDef, "INDEX") || strings.HasPrefix(upperDef, "KEY") {
			continue
		}

		// Parse column definition
		col, inlineFk := parseColumnDefinition(def, table.Name)
		if col.Name != "" {
			table.Columns = append(table.Columns, col)
			if inlineFk != nil {
				foreignKeys = append(foreignKeys, *inlineFk)
			}
		}
	}

	// Mark primary key columns
	for i := range table.Columns {
		for _, pk := range primaryKeys {
			if strings.EqualFold(table.Columns[i].Name, pk) {
				table.Columns[i].IsPrimaryKey = true
				break
			}
		}
		// Mark unique columns
		if uniqueKeys[strings.ToLower(table.Columns[i].Name)] {
			table.Columns[i].IsUnique = true
			if !contains(table.Columns[i].Constraints, "UNQ") {
				table.Columns[i].Constraints = append(table.Columns[i].Constraints, "UNQ")
			}
		}
	}

	return table, foreignKeys
}

func splitColumnDefinitions(content string) []string {
	// Split by commas, but respect parentheses (for types like DECIMAL(10,2))
	definitions := []string{}
	current := strings.Builder{}
	parenCount := 0
	inString := false
	quoteChar := byte(0)

	for i := 0; i < len(content); i++ {
		char := content[i]

		// Handle string literals
		if (char == '\'' || char == '"' || char == '`') && (i == 0 || content[i-1] != '\\') {
			if !inString {
				inString = true
				quoteChar = char
			} else if char == quoteChar {
				inString = false
				quoteChar = 0
			}
		}

		if !inString {
			if char == '(' {
				parenCount++
			} else if char == ')' {
				parenCount--
			}
		}

		if char == ',' && parenCount == 0 && !inString {
			def := strings.TrimSpace(current.String())
			if def != "" {
				definitions = append(definitions, def)
			}
			current.Reset()
		} else {
			current.WriteByte(char)
		}
	}

	if strings.TrimSpace(current.String()) != "" {
		definitions = append(definitions, strings.TrimSpace(current.String()))
	}

	return definitions
}

func parseColumnDefinition(def string, tableName string) (SQLColumn, *SQLForeignKey) {
	col := SQLColumn{
		IsNullable:  true,
		Constraints: []string{},
	}
	var fk *SQLForeignKey

	// Tokenize the definition
	tokens := tokenizeColumnDef(def)
	if len(tokens) == 0 {
		return col, nil
	}

	// First token is column name
	col.Name = cleanIdentifier(tokens[0])
	if col.Name == "" {
		return col, nil
	}

	// Find data type (next token after name)
	if len(tokens) > 1 {
		col.Type = normalizeDataType(tokens[1:])
	}

	// Parse constraints from the rest of the definition
	upperDef := strings.ToUpper(def)

	// Check for NOT NULL
	if strings.Contains(upperDef, "NOT NULL") {
		col.IsNullable = false
		col.Constraints = append(col.Constraints, "NN")
	}

	// Check for UNIQUE
	if regexp.MustCompile(`(?i)\bUNIQUE\b`).MatchString(def) {
		col.IsUnique = true
		if !contains(col.Constraints, "UNQ") {
			col.Constraints = append(col.Constraints, "UNQ")
		}
	}

	// Check for PRIMARY KEY
	if regexp.MustCompile(`(?i)\bPRIMARY\s+KEY\b`).MatchString(def) {
		col.IsPrimaryKey = true
	}

	// Check for AUTO_INCREMENT / SERIAL / IDENTITY
	if regexp.MustCompile(`(?i)\b(AUTO_INCREMENT|SERIAL|BIGSERIAL|SMALLSERIAL|IDENTITY)\b`).MatchString(def) {
		if !contains(col.Constraints, "AI") {
			col.Constraints = append(col.Constraints, "AI")
		}
	}

	// Check for DEFAULT value
	defaultRe := regexp.MustCompile(`(?i)\bDEFAULT\s+([^\s,]+(?:\([^)]*\))?)`)
	defaultMatches := defaultRe.FindStringSubmatch(def)
	if len(defaultMatches) >= 2 {
		col.DefaultValue = defaultMatches[1]
	}

	// Check for inline REFERENCES (foreign key)
	refRe := regexp.MustCompile(`(?i)\bREFERENCES\s+["'\x60]?(\w+)["'\x60]?\s*\(\s*["'\x60]?(\w+)["'\x60]?\s*\)`)
	refMatches := refRe.FindStringSubmatch(def)
	if len(refMatches) >= 3 {
		col.IsForeignKey = true
		col.RefTable = refMatches[1]
		col.RefColumn = refMatches[2]
		if !contains(col.Constraints, "FK") {
			col.Constraints = append(col.Constraints, "FK")
		}
		fk = &SQLForeignKey{
			FromTable:  tableName,
			FromColumn: col.Name,
			ToTable:    refMatches[1],
			ToColumn:   refMatches[2],
		}
	}

	return col, fk
}

func tokenizeColumnDef(def string) []string {
	tokens := []string{}
	current := strings.Builder{}
	inString := false
	quoteChar := byte(0)
	parenCount := 0

	for i := 0; i < len(def); i++ {
		char := def[i]

		// Handle string literals
		if (char == '\'' || char == '"' || char == '`') && (i == 0 || def[i-1] != '\\') {
			if !inString {
				inString = true
				quoteChar = char
			} else if char == quoteChar {
				inString = false
				quoteChar = 0
			}
			current.WriteByte(char)
			continue
		}

		if !inString {
			if char == '(' {
				parenCount++
				current.WriteByte(char)
			} else if char == ')' {
				parenCount--
				current.WriteByte(char)
			} else if char == ' ' || char == '\t' || char == '\n' {
				if parenCount > 0 {
					// Inside parentheses, keep spaces for types like DECIMAL(10, 2)
					current.WriteByte(char)
				} else if current.Len() > 0 {
					tokens = append(tokens, current.String())
					current.Reset()
				}
			} else {
				current.WriteByte(char)
			}
		} else {
			current.WriteByte(char)
		}
	}

	if current.Len() > 0 {
		tokens = append(tokens, current.String())
	}

	return tokens
}

func normalizeDataType(tokens []string) string {
	if len(tokens) == 0 {
		return "text"
	}

	typeStr := strings.ToUpper(tokens[0])

	// Handle types with parameters
	if strings.Contains(typeStr, "(") {
		return normalizeTypeString(typeStr)
	}

	// Check if next token is a parameter
	if len(tokens) > 1 && strings.HasPrefix(tokens[1], "(") {
		return normalizeTypeString(typeStr + tokens[1])
	}

	// Map common types
	return normalizeTypeString(typeStr)
}

func normalizeTypeString(typeStr string) string {
	typeStr = strings.ToUpper(typeStr)

	// PostgreSQL types
	switch {
	case strings.HasPrefix(typeStr, "SERIAL"):
		return "integer"
	case strings.HasPrefix(typeStr, "BIGSERIAL"):
		return "bigint"
	case strings.HasPrefix(typeStr, "SMALLSERIAL"):
		return "integer"
	case typeStr == "UUID":
		return "uuid"
	case strings.HasPrefix(typeStr, "VARCHAR"):
		return strings.ToLower(typeStr)
	case strings.HasPrefix(typeStr, "CHARACTER VARYING"):
		return "varchar(255)"
	case typeStr == "TEXT":
		return "text"
	case typeStr == "INTEGER" || typeStr == "INT":
		return "integer"
	case typeStr == "BIGINT":
		return "bigint"
	case typeStr == "SMALLINT":
		return "integer"
	case typeStr == "BOOLEAN" || typeStr == "BOOL":
		return "boolean"
	case strings.HasPrefix(typeStr, "TIMESTAMP"):
		return "timestamp"
	case typeStr == "DATE":
		return "date"
	case typeStr == "TIME":
		return "timestamp"
	case strings.HasPrefix(typeStr, "NUMERIC") || strings.HasPrefix(typeStr, "DECIMAL"):
		if strings.Contains(typeStr, "(") {
			return strings.ToLower(typeStr)
		}
		return "decimal(10,2)"
	case typeStr == "REAL" || typeStr == "FLOAT4":
		return "decimal(10,2)"
	case typeStr == "DOUBLE PRECISION" || typeStr == "FLOAT8":
		return "decimal(10,2)"
	case typeStr == "JSONB" || typeStr == "JSON":
		return "jsonb"
	case typeStr == "BYTEA" || typeStr == "BLOB":
		return "text"
	case strings.HasPrefix(typeStr, "CHAR("):
		return strings.ToLower(typeStr)
	case typeStr == "CHAR":
		return "varchar(255)"
	// MySQL types
	case strings.HasPrefix(typeStr, "INT("):
		return "integer"
	case typeStr == "TINYINT":
		return "integer"
	case typeStr == "MEDIUMINT":
		return "integer"
	case strings.HasPrefix(typeStr, "TINYINT"):
		return "boolean"
	case typeStr == "DATETIME":
		return "timestamp"
	case strings.HasPrefix(typeStr, "ENUM"):
		return "varchar(255)"
	case strings.HasPrefix(typeStr, "SET"):
		return "varchar(255)"
	default:
		return strings.ToLower(typeStr)
	}
}

func parseForeignKeyConstraint(def string, tableName string) *SQLForeignKey {
	// Pattern: [CONSTRAINT name] FOREIGN KEY (column[, ...]) REFERENCES ref_table(ref_column[, ...])
	re := regexp.MustCompile(`(?i)(?:CONSTRAINT\s+["'\x60]?(\w+)["'\x60]?\s+)?FOREIGN\s+KEY\s*\(\s*["'\x60]?(\w+)["'\x60]?\s*\)\s+REFERENCES\s+["'\x60]?(\w+)["'\x60]?\s*\(\s*["'\x60]?(\w+)["'\x60]?\s*\)`)
	matches := re.FindStringSubmatch(def)
	if len(matches) >= 5 {
		return &SQLForeignKey{
			Name:       matches[1],
			FromTable:  tableName,
			FromColumn: matches[2],
			ToTable:    matches[3],
			ToColumn:   matches[4],
		}
	}
	return nil
}

func parseAlterTableFK(stmt string) *SQLForeignKey {
	// Pattern: ALTER TABLE table_name ADD [CONSTRAINT constraint_name] FOREIGN KEY (column) REFERENCES ref_table(ref_column)
	re := regexp.MustCompile(`(?i)ALTER\s+TABLE\s+["'\x60]?(\w+)["'\x60]?\s+ADD\s+(?:CONSTRAINT\s+["'\x60]?\w+["'\x60]?\s+)?FOREIGN\s+KEY\s*\(\s*["'\x60]?(\w+)["'\x60]?\s*\)\s+REFERENCES\s+["'\x60]?(\w+)["'\x60]?\s*\(\s*["'\x60]?(\w+)["'\x60]?\s*\)`)
	matches := re.FindStringSubmatch(stmt)
	if len(matches) >= 5 {
		return &SQLForeignKey{
			FromTable:  matches[1],
			FromColumn: matches[2],
			ToTable:    matches[3],
			ToColumn:   matches[4],
		}
	}
	return nil
}

func cleanIdentifier(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "`\"'")
	return s
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
