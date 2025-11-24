package compiler

import (
	"encoding/json"
	"fmt"
)

// ConvertSQLToCanvas converts parsed SQL schema to React Flow canvas format
func ConvertSQLToCanvas(tables []SQLTable, foreignKeys []SQLForeignKey) (map[string]interface{}, error) {
	nodes := []map[string]interface{}{}
	edges := []map[string]interface{}{}

	// Map to track table names to node IDs
	tableToNodeID := make(map[string]string)
	// Map to track column names to column IDs within each table
	tableColumnMap := make(map[string]map[string]string)

	// Create nodes for each table
	xPos := 100
	yPos := 100
	spacing := 350

	for i, table := range tables {
		nodeID := fmt.Sprintf("table_%d", i)
		tableToNodeID[table.Name] = nodeID
		tableColumnMap[table.Name] = make(map[string]string)

		columns := []map[string]interface{}{}
		for j, col := range table.Columns {
			colID := fmt.Sprintf("col_%d_%d", i, j)
			tableColumnMap[table.Name][col.Name] = colID

			column := map[string]interface{}{
				"id":           colID,
				"name":         col.Name,
				"type":         col.Type,
				"isPrimaryKey": col.IsPrimaryKey,
				"isUnique":     col.IsUnique,
				"isNullable":   col.IsNullable,
				"constraints":  col.Constraints,
			}
			columns = append(columns, column)
		}

		node := map[string]interface{}{
			"id":       nodeID,
			"type":     "tableNode",
			"position": map[string]interface{}{"x": float64(xPos), "y": float64(yPos)},
			"data": map[string]interface{}{
				"name":    table.Name,
				"columns": columns,
			},
		}

		nodes = append(nodes, node)

		// Arrange tables in a grid
		xPos += spacing
		if (i+1)%3 == 0 {
			xPos = 100
			yPos += spacing
		}
	}

	// Create edges for foreign keys
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

		edge := map[string]interface{}{
			"id":           fmt.Sprintf("edge_%d", edgeIDCounter),
			"source":       sourceNodeID,
			"target":       targetNodeID,
			"sourceHandle": fmt.Sprintf("%s-source", sourceColID),
			"targetHandle": fmt.Sprintf("%s-target", targetColID),
			"type":         "smoothstep",
			"animated":     true,
			"style": map[string]interface{}{
				"stroke":          "#b4befe",
				"strokeWidth":     2,
				"strokeDasharray": "5 5",
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
