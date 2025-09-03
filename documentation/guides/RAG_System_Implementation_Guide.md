RAG System for Fibonacci Project Communications - Implementation Guide

Author: [Your Name]
Date: October 30, 2024
Purpose: Retrieval-Augmented Generation system for parsing communications and enabling chatbot queries

System Overview

This RAG system will create a searchable knowledge base from all project communications, allowing users to ask natural language questions and get contextually accurate answers with specific line references and project counts.

Architecture Components

1. Enhanced Communication Parser
2. Vector Database Storage
3. Embedding Generation Pipeline
4. Retrieval System
5. Chatbot Interface with Context
6. Real-time Updates

RAG System Architecture

Raw Communications
↓
Enhanced Parser (with line-level tracking)
↓
Text Chunking & Metadata Extraction
↓
Embedding Generation (OpenAI/local models)
↓
Vector Database Storage (Pinecone/Chroma/FAISS)
↓
Query Interface & Retrieval
↓
Context-Aware Response Generation
↓
Chatbot UI with Source Citations

Implementation Plan

Phase 1: Enhanced Data Parsing

Create enhanced parser that tracks:
• Exact line numbers for each communication
• Specific project mentions with context
• Numerical data (project counts, volumes, dates)
• Action items with owners and deadlines
• Links and references
• Communication metadata (sender, recipient, timestamp)

File: enhanced_communication_parser.js

```javascript
class EnhancedCommunicationParser {
  parseWithLineNumbers(content, sourceFile) {
    const lines = content.split('\n');
    const parsedData = [];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const entry = {
        source_file: sourceFile,
        line_number: lineNumber,
        content: line,
        metadata: this.extractMetadata(line),
        projects_mentioned: this.extractProjects(line),
        numbers: this.extractNumbers(line),
        dates: this.extractDates(line),
        people: this.extractPeople(line),
        action_items: this.extractActionItems(line),
        links: this.extractLinks(line)
      };
      
      if (this.isSignificantLine(line)) {
        parsedData.push(entry);
      }
    });
    
    return parsedData;
  }
  
  extractMetadata(line) {
    // Extract communication type, priority, status
  }
  
  extractProjects(line) {
    // Identify all project mentions
  }
  
  extractNumbers(line) {
    // Find volumes, counts, percentages
  }
  
  isSignificantLine(line) {
    // Filter out empty lines and noise
  }
}
```

Phase 2: Vector Database Setup

Choose and implement vector database:

Option A: Pinecone (Cloud)
• Managed vector database
• Easy scaling
• Built-in similarity search

Option B: Chroma (Local)
• Open source
• Runs locally
• Good for development

Option C: FAISS (Facebook AI)
• High performance
• Local deployment
• More complex setup

Recommended: Start with Chroma for development, migrate to Pinecone for production

File: vector_database_manager.js

```javascript
class VectorDatabaseManager {
  constructor(dbType = 'chroma') {
    this.dbType = dbType;
    this.client = this.initializeClient();
  }
  
  async storeEmbeddings(parsedData) {
    for (const entry of parsedData) {
      const embedding = await this.generateEmbedding(entry.content);
      
      await this.client.upsert({
        id: `${entry.source_file}_line_${entry.line_number}`,
        values: embedding,
        metadata: {
          source_file: entry.source_file,
          line_number: entry.line_number,
          content: entry.content,
          projects: entry.projects_mentioned,
          numbers: entry.numbers,
          dates: entry.dates,
          people: entry.people,
          type: entry.metadata.type
        }
      });
    }
  }
  
  async search(query, topK = 10) {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const results = await this.client.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true
    });
    
    return results;
  }
}
```

Phase 3: Embedding Pipeline

Create embeddings for all parsed content:

File: embedding_generator.js

```javascript
class EmbeddingGenerator {
  constructor(modelType = 'openai') {
    this.modelType = modelType;
    this.client = this.initializeModel();
  }
  
  async generateEmbedding(text) {
    switch (this.modelType) {
      case 'openai':
        return await this.openAIEmbedding(text);
      case 'sentence-transformers':
        return await this.localEmbedding(text);
      default:
        throw new Error('Unsupported model type');
    }
  }
  
  async openAIEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }
  
  async processAllCommunications() {
    const parser = new EnhancedCommunicationParser();
    const dbManager = new VectorDatabaseManager();
    
    const files = [
      'provided materials/emails.txt',
      'provided materials/slack-pings.txt',
      'provided materials/meeting-notes.txt',
      'provided materials/calendar-invites.txt',
      'provided materials/tickets.txt',
      'provided materials/spec-docs.txt'
    ];
    
    for (const file of files) {
      const content = await this.readFile(file);
      const parsedData = parser.parseWithLineNumbers(content, file);
      await dbManager.storeEmbeddings(parsedData);
    }
  }
}
```

Phase 4: Query Processing & Context Generation

File: query_processor.js

```javascript
class QueryProcessor {
  constructor() {
    this.dbManager = new VectorDatabaseManager();
    this.contextBuilder = new ContextBuilder();
  }
  
  async processQuery(userQuery) {
    // 1. Search for relevant content
    const searchResults = await this.dbManager.search(userQuery, 20);
    
    // 2. Extract specific data if query asks for counts/numbers
    const specificData = await this.extractSpecificData(userQuery, searchResults);
    
    // 3. Build context from results
    const context = this.contextBuilder.buildContext(searchResults, specificData);
    
    // 4. Generate response
    const response = await this.generateResponse(userQuery, context);
    
    return {
      answer: response.answer,
      sources: response.sources,
      context: context,
      confidence: response.confidence
    };
  }
  
  async extractSpecificData(query, results) {
    const data = {
      project_count: 0,
      total_examples: 0,
      people_mentioned: new Set(),
      dates_mentioned: [],
      specific_numbers: []
    };
    
    // Analyze query intent
    if (query.toLowerCase().includes('how many projects')) {
      data.project_count = this.countUniqueProjects(results);
    }
    
    if (query.toLowerCase().includes('total examples') || query.toLowerCase().includes('volume')) {
      data.total_examples = this.sumExampleVolumes(results);
    }
    
    return data;
  }
  
  countUniqueProjects(results) {
    const projects = new Set();
    results.matches.forEach(match => {
      match.metadata.projects?.forEach(project => projects.add(project));
    });
    return projects.size;
  }
}
```

Phase 5: Context Builder

File: context_builder.js

```javascript
class ContextBuilder {
  buildContext(searchResults, specificData) {
    const context = {
      relevant_communications: [],
      project_summary: {},
      numerical_data: specificData,
      timeline_info: [],
      action_items: [],
      sources: []
    };
    
    searchResults.matches.forEach(match => {
      const metadata = match.metadata;
      
      context.relevant_communications.push({
        source: metadata.source_file,
        line: metadata.line_number,
        content: metadata.content,
        relevance_score: match.score
      });
      
      // Build project summary
      metadata.projects?.forEach(project => {
        if (!context.project_summary[project]) {
          context.project_summary[project] = {
            mentions: 0,
            latest_update: null,
            status_indicators: []
          };
        }
        context.project_summary[project].mentions++;
      });
      
      // Extract timeline information
      if (metadata.dates?.length > 0) {
        context.timeline_info.push({
          date: metadata.dates[0],
          content: metadata.content,
          source: `${metadata.source_file}:${metadata.line_number}`
        });
      }
      
      // Track sources for citation
      context.sources.push({
        file: metadata.source_file,
        line: metadata.line_number,
        content: metadata.content.substring(0, 100) + '...'
      });
    });
    
    return context;
  }
}
```

Phase 6: Response Generator

File: response_generator.js

```javascript
class ResponseGenerator {
  constructor() {
    this.llmClient = this.initializeLLM();
  }
  
  async generateResponse(query, context) {
    const prompt = this.buildPrompt(query, context);
    
    const response = await this.llmClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a project management assistant with access to Fibonacci team communications. Always cite specific sources (file:line) for your answers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1
    });
    
    return {
      answer: response.choices[0].message.content,
      sources: context.sources,
      confidence: this.calculateConfidence(context)
    };
  }
  
  buildPrompt(query, context) {
    let prompt = `Query: ${query}\n\n`;
    
    prompt += "Context from project communications:\n\n";
    
    // Add numerical data if available
    if (context.numerical_data.project_count > 0) {
      prompt += `Number of projects mentioned: ${context.numerical_data.project_count}\n`;
    }
    
    if (context.numerical_data.total_examples > 0) {
      prompt += `Total examples across projects: ${context.numerical_data.total_examples}\n`;
    }
    
    // Add relevant communications
    prompt += "\nRelevant communications:\n";
    context.relevant_communications.slice(0, 10).forEach(comm => {
      prompt += `[${comm.source}:${comm.line}] ${comm.content}\n`;
    });
    
    // Add project summary
    if (Object.keys(context.project_summary).length > 0) {
      prompt += "\nProject summary:\n";
      Object.entries(context.project_summary).forEach(([project, data]) => {
        prompt += `${project}: ${data.mentions} mentions\n`;
      });
    }
    
    prompt += "\nPlease answer the query based on this context and cite specific sources (file:line).";
    
    return prompt;
  }
}
```

Phase 7: Chatbot Interface

File: chatbot_interface.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Fibonacci Project Assistant</title>
    <style>
        .chat-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .messages {
            height: 500px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
        }
        
        .user-message {
            background: #e3f2fd;
            text-align: right;
        }
        
        .bot-message {
            background: #f5f5f5;
        }
        
        .sources {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
        }
        
        .input-area {
            display: flex;
            gap: 10px;
        }
        
        .query-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .send-button {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>Fibonacci Project Assistant</h1>
        <p>Ask questions about projects, team members, timelines, or any other information from the communications.</p>
        
        <div class="messages" id="messages">
            <div class="message bot-message">
                <strong>Assistant:</strong> Hello! I can help you find information about Fibonacci projects. Try asking:
                <ul>
                    <li>"How many projects are currently active?"</li>
                    <li>"What's the status of the RLHF project?"</li>
                    <li>"Who is working on safety evaluations?"</li>
                    <li>"What are the main blockers across projects?"</li>
                </ul>
            </div>
        </div>
        
        <div class="input-area">
            <input type="text" class="query-input" id="queryInput" placeholder="Ask about projects, timelines, team members..." />
            <button class="send-button" onclick="sendQuery()">Send</button>
        </div>
    </div>

    <script>
        async function sendQuery() {
            const input = document.getElementById('queryInput');
            const query = input.value.trim();
            
            if (!query) return;
            
            // Add user message
            addMessage('user', query);
            input.value = '';
            
            // Show loading
            const loadingDiv = addMessage('bot', 'Searching communications...');
            
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const result = await response.json();
                
                // Remove loading message
                loadingDiv.remove();
                
                // Add bot response
                const botMessage = addMessage('bot', result.answer);
                
                // Add sources
                if (result.sources && result.sources.length > 0) {
                    const sourcesDiv = document.createElement('div');
                    sourcesDiv.className = 'sources';
                    sourcesDiv.innerHTML = '<strong>Sources:</strong><br>' + 
                        result.sources.slice(0, 5).map(s => 
                            `${s.file}:${s.line} - ${s.content}`
                        ).join('<br>');
                    botMessage.appendChild(sourcesDiv);
                }
                
            } catch (error) {
                loadingDiv.remove();
                addMessage('bot', 'Sorry, I encountered an error processing your query.');
            }
        }
        
        function addMessage(type, content) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}-message`;
            messageDiv.innerHTML = `<strong>${type === 'user' ? 'You' : 'Assistant'}:</strong> ${content}`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            return messageDiv;
        }
        
        // Allow Enter key to send
        document.getElementById('queryInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendQuery();
            }
        });
    </script>
</body>
</html>
```

Phase 8: API Server

File: rag_api_server.js

```javascript
const express = require('express');
const cors = require('cors');

class RAGAPIServer {
  constructor() {
    this.app = express();
    this.queryProcessor = new QueryProcessor();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }
  
  setupRoutes() {
    this.app.post('/api/query', async (req, res) => {
      try {
        const { query } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }
        
        const result = await this.queryProcessor.processQuery(query);
        res.json(result);
        
      } catch (error) {
        console.error('Query processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getSystemStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
      }
    });
  }
  
  async getSystemStats() {
    // Return statistics about the knowledge base
    return {
      total_communications: await this.queryProcessor.dbManager.getCount(),
      last_updated: new Date().toISOString(),
      available_sources: [
        'emails.txt',
        'slack-pings.txt',
        'meeting-notes.txt',
        'calendar-invites.txt',
        'tickets.txt',
        'spec-docs.txt'
      ]
    };
  }
  
  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`RAG API server running on port ${port}`);
    });
  }
}

// Initialize and start server
const server = new RAGAPIServer();
server.start();
```

Deployment Instructions

1. Install Dependencies
```bash
npm init -y
npm install express cors openai chromadb sentence-transformers
```

2. Set up Environment Variables
```
OPENAI_API_KEY=your_openai_api_key
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

3. Initialize Vector Database
```bash
# Start Chroma server
chroma run --host localhost --port 8000
```

4. Process Communications
```javascript
const embeddingGenerator = new EmbeddingGenerator();
await embeddingGenerator.processAllCommunications();
```

5. Start API Server
```bash
node rag_api_server.js
```

6. Access Chatbot
Open http://localhost:3000 in your browser

Sample Queries the System Can Handle

Project Information:
• "How many projects are currently active?"
• "What's the status of the RLHF preference collection project?"
• "Which projects are blocked and why?"
• "What's the total volume of examples across all projects?"

Team & Resources:
• "Who is working on safety evaluations?"
• "What's Alex Kumar's current workload?"
• "Which team members are overallocated?"

Timeline & Deadlines:
• "What are the upcoming deadlines this week?"
• "Which projects are at risk of missing their deadlines?"
• "When is the multimodal SFT project due?"

Specific Details:
• "What are the main blockers for the RLHF project?"
• "Where can I find the safety classifier guidelines?"
• "What action items were mentioned in the latest meeting?"

Expected Output Examples

Query: "How many projects are currently active?"
Response: "Based on the communications, there are 8 active projects currently being tracked:

1. RLHF Preference Collection (25k examples) - Blocked
2. Multimodal SFT Dataset (82k examples) - At Risk  
3. Safety Classifier Dataset (12k examples) - On Track
4. RLHF Safety Evaluations (45k examples) - On Track
5. Agentic Planning Corpus (3.5k examples) - Complete
6. RLHF Dialogue Data - Batch 2 (44k examples) - Blocked
7. RLHF Dialogue Data - Batch 3 (91k examples) - Blocked
8. Q4 Safety Evals (3.5k examples) - On Track

Sources: fibonacci_project_tracker.html:301-380, provided materials/emails.txt:12, provided materials/slack-pings.txt:25"

Integration with Existing System

The RAG system can be integrated with your existing tracker by:

1. Using the same Google Sheets as a data source
2. Adding a "Ask Assistant" button to your HTML dashboards
3. Embedding the chatbot as an iframe in your project tracker
4. Setting up real-time updates when new communications are added

This RAG system will provide contextual, accurate answers with specific line references, making it easy for users to verify information and dive deeper into the source communications.
