package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/ASHUTOSH-SWAIN-GIT/skyforge/server/internal/compiler"
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

// The Main Function
func (s *AIService) GenerateSQLFromGraph(rawJSON []byte) (string, error) {
	schema, err := compiler.BuildSchema(rawJSON)
	if err != nil {
		return "", err
	}
	if len(schema.Tables) == 0 {
		return "", fmt.Errorf("no tables defined in canvas")
	}

	promptPayload := struct {
		Summary string           `json:"summary"`
		Schema  *compiler.Schema `json:"schema"`
	}{
		Summary: "Normalized ER graph captured from Skyforge canvas. Use table+column names exactly as provided.",
		Schema:  schema,
	}

	promptData, _ := json.MarshalIndent(promptPayload, "", "  ")

	prompt := fmt.Sprintf(`
You are a meticulous Senior Database Architect. Convert the provided JSON schema into high-quality PostgreSQL DDL.

Requirements:
1. Emit CREATE TABLE statements for every table.
2. Use column definitions exactly as provided (names + data types). Default to TEXT only when the type is omitted.
3. Apply NOT NULL and UNIQUE constraints when indicated.
4. Add PRIMARY KEY clauses using the provided primary columns.
5. Add FOREIGN KEY constraints for every relation. Use meaningful constraint names.
6. Include INDEX statements when a foreign-key column is not part of the primary key.
7. Return ONLY executable SQL (no explanations, no Markdown, no backticks).

JSON Schema:
%s
`, string(promptData))

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
