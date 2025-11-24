package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type AIService struct {
	client *genai.Client
	model  *genai.GenerativeModel
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

	model := client.GenerativeModel("gemini-2.5-flash") // Use a fast model for code gen
	return &AIService{client: client, model: model}, nil
}

// Define clean structs to send to AI (We exclude positions/handles to save tokens)
type CleanNode struct {
	Table   string        `json:"table"`
	Columns []CleanColumn `json:"columns"`
}

type CleanColumn struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	IsPrimaryKey bool   `json:"is_pk"`
	IsUnique     bool   `json:"is_unique"`
}

type CleanEdge struct {
	FromTable string `json:"from_table"`
	ToTable   string `json:"to_table"`
	RelType   string `json:"relationship"` // e.g. "one-to-many"
}

// The Main Function
func (s *AIService) GenerateSQLFromGraph(rawJSON []byte) (string, error) {
	// 1. Parse Raw JSON (from React Flow)
	// We map the raw structure to our Clean structure
	var rawGraph struct {
		Nodes []struct {
			Data struct {
				Label   string `json:"label"`
				Columns []struct {
					Name         string `json:"name"`
					Type         string `json:"type"`
					IsPrimaryKey bool   `json:"isPrimaryKey"`
					IsUnique     bool   `json:"isUnique"`
				} `json:"columns"`
			} `json:"data"`
		} `json:"nodes"`
		Edges []struct {
			Source string `json:"source"`
			Target string `json:"target"`
		} `json:"edges"`
	}

	if err := json.Unmarshal(rawJSON, &rawGraph); err != nil {
		return "", err
	}

	// 2. Build Clean Context
	// Map node IDs to Table Names for edges
	// (Simplified logic: In prod, map IDs correctly)
	cleanData := map[string]interface{}{
		"tables":    rawGraph.Nodes,
		"relations": rawGraph.Edges, // Note: You might need to resolve ID -> Label mapping here if Edges use IDs
	}

	promptData, _ := json.MarshalIndent(cleanData, "", "  ")

	// 3. Construct Prompt
	prompt := fmt.Sprintf(`
		You are a Senior Database Architect. 
		Convert the following JSON representation of a database schema into production-ready PostgreSQL SQL code.
		
		Rules:
		1. Use CREATE TABLE statements.
		2. Add appropriate Foreign Key constraints.
		3. Add comments explaining complex relationships.
		4. Return ONLY the SQL code. No markdown formatting (no backticks), no conversational text.
		
		JSON Schema Input:
		%s
	`, string(promptData))

	// 4. Call Gemini
	ctx := context.Background()
	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	// 5. Extract Text
	if txt, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		return string(txt), nil
	}

	return "", fmt.Errorf("unexpected response format")
}
