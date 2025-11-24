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
	Constraints  []string
}

type SQLForeignKey struct {
	FromTable  string
	FromColumn string
	ToTable    string
	ToColumn   string
}

// ParseSQL parses SQL CREATE TABLE statements and extracts schema information
func ParseSQL(sqlContent string) ([]SQLTable, []SQLForeignKey, error) {
	tables := []SQLTable{}
	foreignKeys := []SQLForeignKey{}

	// Normalize SQL - remove comments and extra whitespace
	sqlContent = removeSQLComments(sqlContent)
	sqlContent = strings.ReplaceAll(sqlContent, "\r\n", "\n")
	sqlContent = strings.ReplaceAll(sqlContent, "\r", "\n")

	// Split by semicolons to get individual statements
	statements := splitSQLStatements(sqlContent)

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if strings.HasPrefix(strings.ToUpper(stmt), "CREATE TABLE") {
			table, fks := parseCreateTable(stmt)
			if table.Name != "" {
				tables = append(tables, table)
				foreignKeys = append(foreignKeys, fks...)
			}
		} else if strings.HasPrefix(strings.ToUpper(stmt), "ALTER TABLE") {
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
	re := regexp.MustCompile(`--.*`)
	sql = re.ReplaceAllString(sql, "")

	// Remove multi-line comments (/* comment */)
	re = regexp.MustCompile(`/\*.*?\*/`)
	sql = re.ReplaceAllString(sql, "")

	return sql
}

func splitSQLStatements(sql string) []string {
	// Split by semicolon, but be careful with semicolons inside strings
	statements := []string{}
	current := ""
	inString := false
	quoteChar := byte(0)

	for i := 0; i < len(sql); i++ {
		char := sql[i]

		if (char == '\'' || char == '"') && (i == 0 || sql[i-1] != '\\') {
			if !inString {
				inString = true
				quoteChar = char
			} else if char == quoteChar {
				inString = false
				quoteChar = 0
			}
		}

		if char == ';' && !inString {
			stmt := strings.TrimSpace(current)
			if stmt != "" {
				statements = append(statements, stmt)
			}
			current = ""
		} else {
			current += string(char)
		}
	}

	if strings.TrimSpace(current) != "" {
		statements = append(statements, strings.TrimSpace(current))
	}

	return statements
}

func parseCreateTable(stmt string) (SQLTable, []SQLForeignKey) {
	table := SQLTable{}
	foreignKeys := []SQLForeignKey{}

	// Extract table name
	re := regexp.MustCompile(`(?i)CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:` + "`" + `)?(\w+)(?:` + "`" + `)?\s*\(`)
	matches := re.FindStringSubmatch(stmt)
	if len(matches) < 2 {
		return table, foreignKeys
	}
	table.Name = matches[1]

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
	lines := strings.Split(content, "\n")

	primaryKeys := []string{}

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(strings.ToUpper(line), "PRIMARY KEY") {
			// Parse PRIMARY KEY constraint
			if strings.HasPrefix(strings.ToUpper(line), "PRIMARY KEY") {
				pkRe := regexp.MustCompile(`(?i)PRIMARY\s+KEY\s*\(([^)]+)\)`)
				pkMatches := pkRe.FindStringSubmatch(line)
				if len(pkMatches) >= 2 {
					cols := strings.Split(pkMatches[1], ",")
					for _, col := range cols {
						col = strings.TrimSpace(strings.Trim(col, "`\"'"))
						primaryKeys = append(primaryKeys, col)
					}
				}
			}
			continue
		}

		// Remove trailing comma
		line = strings.TrimRight(line, ",")

		// Parse column definition
		col := parseColumnDefinition(line)
		if col.Name != "" {
			// Check if this column is a primary key
			for _, pk := range primaryKeys {
				if strings.EqualFold(col.Name, pk) {
					col.IsPrimaryKey = true
					break
				}
			}
			table.Columns = append(table.Columns, col)
		}

		// Check for inline FOREIGN KEY constraint
		fkRe := regexp.MustCompile(`(?i)FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)`)
		fkMatches := fkRe.FindStringSubmatch(line)
		if len(fkMatches) >= 4 {
			fk := SQLForeignKey{
				FromTable:  table.Name,
				FromColumn: strings.TrimSpace(strings.Trim(fkMatches[1], "`\"'")),
				ToTable:    strings.TrimSpace(strings.Trim(fkMatches[2], "`\"'")),
				ToColumn:   strings.TrimSpace(strings.Trim(fkMatches[3], "`\"'")),
			}
			foreignKeys = append(foreignKeys, fk)
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
	}

	return table, foreignKeys
}

func parseColumnDefinition(line string) SQLColumn {
	col := SQLColumn{
		IsNullable:  true,
		Constraints: []string{},
	}

	// Extract column name (first word, may be quoted)
	parts := strings.Fields(line)
	if len(parts) == 0 {
		return col
	}

	col.Name = strings.Trim(parts[0], "`\"'")

	// Extract data type (second part)
	if len(parts) > 1 {
		col.Type = parts[1]
		// Handle types with parentheses like VARCHAR(255)
		if strings.Contains(col.Type, "(") {
			// Type is complete
		} else if len(parts) > 2 && strings.HasPrefix(parts[2], "(") {
			// Type continues to next part
			col.Type += " " + parts[2]
		}
	}

	// Check for constraints
	upperLine := strings.ToUpper(line)
	if strings.Contains(upperLine, "NOT NULL") {
		col.IsNullable = false
		col.Constraints = append(col.Constraints, "NN")
	}
	if strings.Contains(upperLine, "UNIQUE") {
		col.IsUnique = true
		col.Constraints = append(col.Constraints, "UNQ")
	}
	if strings.Contains(upperLine, "PRIMARY KEY") {
		col.IsPrimaryKey = true
	}

	return col
}

func parseAlterTableFK(stmt string) *SQLForeignKey {
	// Pattern: ALTER TABLE table_name ADD CONSTRAINT constraint_name FOREIGN KEY (column) REFERENCES ref_table(ref_column)
	re := regexp.MustCompile(`(?i)ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)`)
	matches := re.FindStringSubmatch(stmt)
	if len(matches) >= 5 {
		return &SQLForeignKey{
			FromTable:  strings.TrimSpace(strings.Trim(matches[1], "`\"'")),
			FromColumn: strings.TrimSpace(strings.Trim(matches[2], "`\"'")),
			ToTable:    strings.TrimSpace(strings.Trim(matches[3], "`\"'")),
			ToColumn:   strings.TrimSpace(strings.Trim(matches[4], "`\"'")),
		}
	}
	return nil
}
