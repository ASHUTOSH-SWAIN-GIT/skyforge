package compiler

import (
	"encoding/json"
	"fmt"
	"math"
)

// ConvertSQLToCanvas converts parsed SQL schema to React Flow canvas format
func ConvertSQLToCanvas(tables []SQLTable, foreignKeys []SQLForeignKey) (map[string]interface{}, error) {
	nodes := []map[string]interface{}{}
	edges := []map[string]interface{}{}

	// Map to track table names to node IDs
	tableToNodeID := make(map[string]string)
	// Map to track column names to column IDs within each table
	tableColumnMap := make(map[string]map[string]string)

	// Calculate optimal layout positions
	positions := calculateLayout(len(tables))

	for i, table := range tables {
		nodeID := fmt.Sprintf("table_%d", i)
		tableToNodeID[table.Name] = nodeID
		tableColumnMap[table.Name] = make(map[string]string)

		columns := []map[string]interface{}{}
		for j, col := range table.Columns {
			colID := fmt.Sprintf("col_%d_%d", i, j)
			tableColumnMap[table.Name][col.Name] = colID

			// Build constraints array
			constraints := []string{}
			if !col.IsNullable {
				if !containsStr(col.Constraints, "NN") {
					constraints = append(constraints, "NN")
				}
			}
			if col.IsUnique {
				if !containsStr(col.Constraints, "UNQ") {
					constraints = append(constraints, "UNQ")
				}
			}
			if col.IsForeignKey {
				if !containsStr(col.Constraints, "FK") {
					constraints = append(constraints, "FK")
				}
			}
			// Add remaining constraints from column
			for _, c := range col.Constraints {
				if !containsStr(constraints, c) {
					constraints = append(constraints, c)
				}
			}

			column := map[string]interface{}{
				"id":           colID,
				"name":         col.Name,
				"type":         col.Type,
				"isPrimaryKey": col.IsPrimaryKey,
				"constraints":  constraints,
			}
			columns = append(columns, column)
		}

		pos := positions[i]
		node := map[string]interface{}{
			"id":       nodeID,
			"type":     "tableNode",
			"position": map[string]interface{}{"x": pos.x, "y": pos.y},
			"data": map[string]interface{}{
				"name":    table.Name,
				"columns": columns,
			},
		}

		nodes = append(nodes, node)
	}

	// Create edges for foreign keys - deduplicate
	edgeMap := make(map[string]bool)
	edgeIDCounter := 0

	for _, fk := range foreignKeys {
		sourceNodeID, sourceExists := tableToNodeID[fk.FromTable]
		targetNodeID, targetExists := tableToNodeID[fk.ToTable]

		if !sourceExists || !targetExists {
			continue
		}

		sourceColID, sourceColExists := tableColumnMap[fk.FromTable][fk.FromColumn]
		targetColID, targetColExists := tableColumnMap[fk.ToTable][fk.ToColumn]

		if !sourceColExists || !targetColExists {
			continue
		}

		// Create a unique key for this edge to avoid duplicates
		edgeKey := fmt.Sprintf("%s.%s->%s.%s", fk.FromTable, fk.FromColumn, fk.ToTable, fk.ToColumn)
		if edgeMap[edgeKey] {
			continue
		}
		edgeMap[edgeKey] = true

		edge := map[string]interface{}{
			"id":           fmt.Sprintf("edge_%d", edgeIDCounter),
			"source":       sourceNodeID,
			"target":       targetNodeID,
			"sourceHandle": fmt.Sprintf("%s-source", sourceColID),
			"targetHandle": fmt.Sprintf("%s-target", targetColID),
			"type":         "smoothstep",
			"animated":     true,
			"style": map[string]interface{}{
				"stroke":      "#b4befe",
				"strokeWidth": 2,
			},
			"label":     fmt.Sprintf("%s -> %s", fk.FromColumn, fk.ToColumn),
			"labelStyle": map[string]interface{}{
				"fill":       "#cdd6f4",
				"fontSize":   10,
				"fontWeight": 500,
			},
			"labelBgStyle": map[string]interface{}{
				"fill":   "#1e1e2e",
				"fillOpacity": 0.8,
			},
		}

		edges = append(edges, edge)
		edgeIDCounter++
	}

	canvasData := map[string]interface{}{
		"nodes": nodes,
		"edges": edges,
	}

	return canvasData, nil
}

type position struct {
	x float64
	y float64
}

// calculateLayout calculates optimal positions for tables in a grid/circular layout
func calculateLayout(count int) []position {
	positions := make([]position, count)

	if count == 0 {
		return positions
	}

	if count == 1 {
		positions[0] = position{x: 400, y: 200}
		return positions
	}

	if count == 2 {
		positions[0] = position{x: 200, y: 200}
		positions[1] = position{x: 600, y: 200}
		return positions
	}

	// For larger counts, use a grid layout with spacing
	cols := int(math.Ceil(math.Sqrt(float64(count))))
	spacing := 400.0
	startX := 100.0
	startY := 100.0

	for i := 0; i < count; i++ {
		row := i / cols
		col := i % cols
		positions[i] = position{
			x: startX + float64(col)*spacing,
			y: startY + float64(row)*spacing,
		}
	}

	return positions
}

// ImportSQL parses SQL and converts it to canvas format
func ImportSQL(sqlContent string) (json.RawMessage, error) {
	tables, foreignKeys, err := ParseSQL(sqlContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse SQL: %w", err)
	}

	if len(tables) == 0 {
		return nil, fmt.Errorf("no tables found in SQL file")
	}

	canvasData, err := ConvertSQLToCanvas(tables, foreignKeys)
	if err != nil {
		return nil, fmt.Errorf("failed to convert to canvas: %w", err)
	}

	jsonData, err := json.Marshal(canvasData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal canvas data: %w", err)
	}

	return json.RawMessage(jsonData), nil
}

func containsStr(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
