package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type AIService struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

// Column represents a table column in canvas format
type Column struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Type         string   `json:"type"`
	IsPrimaryKey bool     `json:"isPrimaryKey"`
	Constraints  []string `json:"constraints"`
}

// TableData represents table data in canvas format
type TableData struct {
	Name    string   `json:"name"`
	Columns []Column `json:"columns"`
}

// Node represents a React Flow node
type Node struct {
	ID       string             `json:"id"`
	Type     string             `json:"type"`
	Position map[string]float64 `json:"position"`
	Data     TableData          `json:"data"`
}

// Edge represents a React Flow edge (for foreign key relationships)
type Edge struct {
	ID           string `json:"id"`
	Source       string `json:"source"`
	Target       string `json:"target"`
	SourceHandle string `json:"sourceHandle"`
	TargetHandle string `json:"targetHandle"`
	Type         string `json:"type"`
	Animated     bool   `json:"animated"`
}

// CanvasData represents the full canvas structure
type CanvasData struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

// AIGeneratedTable represents a table as returned by the AI
type AIGeneratedTable struct {
	Name    string `json:"name"`
	Columns []struct {
		Name         string   `json:"name"`
		Type         string   `json:"type"`
		IsPrimaryKey bool     `json:"isPrimaryKey"`
		Constraints  []string `json:"constraints"`
	} `json:"columns"`
}

// AIGeneratedRelation represents a foreign key relationship
type AIGeneratedRelation struct {
	FromTable  string `json:"fromTable"`
	FromColumn string `json:"fromColumn"`
	ToTable    string `json:"toTable"`
	ToColumn   string `json:"toColumn"`
}

// AIResponse represents the expected AI output structure
type AIResponse struct {
	Tables    []AIGeneratedTable    `json:"tables"`
	Relations []AIGeneratedRelation `json:"relations"`
}

func NewAIService() (*AIService, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}

	model := client.GenerativeModel("gemini-2.0-flash")
	return &AIService{client: client, model: model}, nil
}

func generateID() string {
	rand.Seed(time.Now().UnixNano())
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 9)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return fmt.Sprintf("id_%d_%s", time.Now().UnixNano(), string(b))
}

// GenerateTablesFromPrompt generates canvas-compatible table data from a user prompt
func (s *AIService) GenerateTablesFromPrompt(prompt string) (*CanvasData, error) {
	systemPrompt := `You are a database schema designer. Based on the user's description, generate a database schema with tables and their relationships.

IMPORTANT: Return ONLY valid JSON, no markdown, no backticks, no explanations.

The JSON must follow this exact structure:
{
  "tables": [
    {
      "name": "table_name_in_snake_case",
      "columns": [
        {
          "name": "column_name",
          "type": "uuid|varchar(255)|text|integer|bigint|boolean|timestamp|date|decimal(10,2)|jsonb",
          "isPrimaryKey": true/false,
          "constraints": ["NN"] 
        }
      ]
    }
  ],
  "relations": [
    {
      "fromTable": "child_table",
      "fromColumn": "foreign_key_column",
      "toTable": "parent_table",
      "toColumn": "primary_key_column"
    }
  ]
}

Rules:
1. Every table MUST have an "id" column with type "uuid" as primary key
2. Use snake_case for all table and column names
3. Include created_at (timestamp) and updated_at (timestamp) columns for most tables
4. Use appropriate data types: uuid for IDs, varchar(255) for short strings, text for long content, integer for counts, boolean for flags, timestamp for dates
5. Add "NN" (NOT NULL) constraint to required fields
6. For foreign keys, name them as: referenced_table_id (e.g., user_id references users.id)
7. Create sensible relationships between tables based on the user's description
8. Return ONLY the JSON object, nothing else`

	fullPrompt := fmt.Sprintf("%s\n\nUser request: %s", systemPrompt, prompt)

	ctx := context.Background()
	resp, err := s.model.GenerateContent(ctx, genai.Text(fullPrompt))
	if err != nil {
		return nil, fmt.Errorf("AI generation failed: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	// Extract text response
	var responseText string
	if txt, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		responseText = string(txt)
	} else {
		return nil, fmt.Errorf("unexpected response format")
	}

	// Clean up the response (remove markdown code blocks if present)
	responseText = strings.TrimSpace(responseText)
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	// Parse AI response
	var aiResp AIResponse
	if err := json.Unmarshal([]byte(responseText), &aiResp); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w (response: %s)", err, responseText[:min(200, len(responseText))])
	}

	if len(aiResp.Tables) == 0 {
		return nil, fmt.Errorf("AI did not generate any tables")
	}

	// Convert AI response to canvas format
	canvasData := &CanvasData{
		Nodes: make([]Node, 0, len(aiResp.Tables)),
		Edges: make([]Edge, 0, len(aiResp.Relations)),
	}

	// Track table name to node ID and column name to column ID mappings
	tableNodeMap := make(map[string]string)
	columnIDMap := make(map[string]map[string]string) // tableNodeID -> columnName -> columnID

	// Create nodes for each table
	for i, table := range aiResp.Tables {
		nodeID := generateID()
		tableNodeMap[table.Name] = nodeID
		columnIDMap[nodeID] = make(map[string]string)

		// Position tables in a grid layout
		x := float64((i%3)*350 + 100)
		y := float64((i/3)*400 + 100)

		columns := make([]Column, 0, len(table.Columns))
		for _, col := range table.Columns {
			colID := generateID()
			columnIDMap[nodeID][col.Name] = colID
			columns = append(columns, Column{
				ID:           colID,
				Name:         col.Name,
				Type:         col.Type,
				IsPrimaryKey: col.IsPrimaryKey,
				Constraints:  col.Constraints,
			})
		}

		node := Node{
			ID:   nodeID,
			Type: "tableNode",
			Position: map[string]float64{
				"x": x,
				"y": y,
			},
			Data: TableData{
				Name:    table.Name,
				Columns: columns,
			},
		}
		canvasData.Nodes = append(canvasData.Nodes, node)
	}

	// Create edges for relationships
	for _, rel := range aiResp.Relations {
		sourceNodeID, sourceExists := tableNodeMap[rel.FromTable]
		targetNodeID, targetExists := tableNodeMap[rel.ToTable]

		if !sourceExists || !targetExists {
			continue
		}

		sourceColID, sourceColExists := columnIDMap[sourceNodeID][rel.FromColumn]
		targetColID, targetColExists := columnIDMap[targetNodeID][rel.ToColumn]

		if !sourceColExists || !targetColExists {
			continue
		}

		edge := Edge{
			ID:           generateID(),
			Source:       sourceNodeID,
			Target:       targetNodeID,
			SourceHandle: fmt.Sprintf("%s-source", sourceColID),
			TargetHandle: fmt.Sprintf("%s-target", targetColID),
			Type:         "smoothstep",
			Animated:     true,
		}
		canvasData.Edges = append(canvasData.Edges, edge)
	}

	return canvasData, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
