# 🔄 Fibonacci Project Dashboard

**Intelligent project tracking system with automated communication parsing and real-time insights**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Overview

Transform scattered project communications into centralized, actionable intelligence. This system automatically parses communications from multiple sources (Email, Slack, Meetings, etc.) and creates a comprehensive project tracking dashboard with AI-powered insights.

**Perfect for scaling teams** who need to organize project context that's currently scattered across various communication channels.

### 🎯 Key Features

- **🤖 Automated Communication Parsing** - Intelligently processes 6+ communication formats
- **📊 Dynamic Project Recognition** - Groups related projects across naming variations  
- **💬 AI Assistant** - Natural language queries about projects and team
- **🔍 Advanced Search & Filtering** - Find information instantly across all communications
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **⚡ Serverless Architecture** - Scales automatically with zero infrastructure management

### 📸 Screenshots

| Project Overview | Communications Dashboard | AI Assistant |
|------------------|-------------------------|--------------|
| ![Project Overview](docs/images/project-overview.png) | ![Communications](docs/images/communications.png) | ![AI Assistant](docs/images/ai-assistant.png) |

## 🚀 Quick Start

### Option 1: View Live Demo
Visit the [live dashboard](https://fib-project-dashboard.vercel.app) to explore the system with sample data.

### Option 2: Deploy Your Own
```bash
# Clone the repository
git clone https://github.com/your-username/fib-project-dashboard.git
cd fib-project-dashboard

# Deploy to Vercel (recommended)
npx vercel deploy

# Or run locally
open public/index.html
```

### Option 3: Full Setup with Google Sheets Integration
See the [Setup Guide](#setup-guide) for complete installation with automated data processing.

## 🏗️ System Architecture

```
Raw Communications → Google Apps Script → Google Sheets → REST API → Web Dashboard
```

The system consists of three main layers:

1. **📥 Data Processing** - Google Apps Script modules parse communications
2. **💾 Data Storage** - Google Sheets store structured project data  
3. **🖥️ Presentation** - Modern web dashboard with AI assistant

## 📂 File Structure

```
fib-project-dashboard/
├── 📱 public/                    # Web Dashboard
│   ├── index.html               # Main dashboard interface
│   ├── api-client.js            # API integration
│   └── knowledge_base.js        # Static data fallback
├── 🔧 api/                      # Serverless API
│   ├── health.js                # Health check endpoint
│   └── knowledge-base.js        # Data API for dashboard
├── 🤖 src/google-apps-script/   # Data Processing Engine
│   ├── 01_config_main.js        # Main configuration
│   ├── 02_data_extractors.js    # File reading utilities
│   ├── 03_communication_parser.js # Multi-format parsing
│   ├── 04_project_name_extractor.js # Project identification
│   ├── 05_project_rollup.js     # Data aggregation
│   ├── 06_knowledge_base_builder.js # API data prep
│   └── 07_dashboard_template.js # HTML generation
└── 📋 documentation/             # Raw communication data
    └── comms/                   # Sample communication files
```

## 🛠️ Setup Guide

### Prerequisites
- Google Account (for Google Sheets and Apps Script)
- Vercel Account (for deployment, optional)
- Basic familiarity with Google Sheets and Google Drive

### Step 1: Google Sheets Setup
1. **Create a new Google Spreadsheet**
2. **Copy the Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Step 2: Google Apps Script Setup
1. **Open [Google Apps Script](https://script.google.com/)**
2. **Create a new project**
3. **Upload all files** from `src/google-apps-script/`
4. **Update configuration** in `01_config_main.js`:
   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
     PROJECT_DRIVE_ID: 'YOUR_DRIVE_FOLDER_ID',
     DRIVE_FOLDER_NAME: 'ProjectCommunications'
   };
   ```

### Step 3: Google Drive Setup
1. **Create a Google Drive folder** named "ProjectCommunications"
2. **Upload your communication files** (emails.txt, slack-pings.txt, etc.)
3. **Copy the folder ID** from the Drive URL
4. **Update the PROJECT_DRIVE_ID** in the configuration

### Step 4: Process Communications
1. **In Google Apps Script**, run the function: `processAndUpdateAllSheets()`
2. **Wait for processing** to complete (usually 30-60 seconds)
3. **Check your Google Sheets** - data should populate automatically

### Step 5: Deploy Dashboard
```bash
# Clone the repository
git clone [your-repo-url]
cd fib-project-dashboard

# Deploy to Vercel
vercel deploy

# Update the API endpoint in your Google Apps Script config
# CONFIG.API_ENDPOINTS.PRIMARY = 'https://your-app.vercel.app/api/knowledge-base'
```

## 📊 Communication Formats Supported

The system intelligently parses multiple communication formats:

### 📧 Email Communications
- Standard email headers (From, To, Subject, Date)
- Body content with automatic link extraction
- Thread detection and conversation grouping

### 💬 Slack Messages
- Direct messages and channel conversations
- @mention detection and people extraction
- Timestamp normalization and thread tracking

### 📅 Meeting Notes & Calendar
- Meeting attendees and agenda items
- Action item extraction with assignments
- Calendar invite details and scheduling

### 🎫 Tickets & Specifications
- Issue tracking with priority levels
- Technical documentation parsing
- Requirement extraction and analysis

## 🔧 Configuration Options

### Basic Configuration
```javascript
const CONFIG = {
  // Google Sheets Integration
  SPREADSHEET_ID: 'your-spreadsheet-id',
  PROJECT_DRIVE_ID: 'your-drive-folder-id',
  
  // API Configuration
  API_ENDPOINTS: {
    PRIMARY: 'https://your-dashboard.vercel.app/api/knowledge-base'
  },
  
  // Processing Options
  ENABLE_DRIVE_BACKUP: false,
  AUTO_UPDATE_INTERVAL: 3600000 // 1 hour
};
```

### Advanced Project Recognition
```javascript
// Customize project patterns in 04_project_name_extractor.js
const PROJECT_PATTERNS = {
  'RLHF Projects': {
    variants: ['RLHF', 'rlhf', 'Dialogue Data', 'Safety Evals'],
    keywords: ['dialogue', 'safety', 'evaluation']
  },
  'Safety Classifier': {
    variants: ['Safety Classifier', 'safety classifier', 'classifier'],
    keywords: ['classification', 'safety', 'content']
  }
};
```

## 🎯 Usage Examples

### Project Manager Queries
Ask the AI assistant natural language questions:

- *"What's our current timeline for the Safety Classifier Data project?"*
- *"Can you show me all RLHF communications from this week?"*
- *"Which projects is Nina Patel working on?"*
- *"What are the volume commitments for Q4 evaluations?"*

### Advanced Filtering
Use the communications dashboard to filter by:
- **Source**: Slack, Email, Meetings, Calendar, Tickets, Specs
- **Project**: Focus on specific project communications
- **People**: Track individual involvement across projects
- **Date Range**: Filter by time periods
- **Content**: Search for specific terms or phrases

### Data Export
Export structured data for external tools:
```javascript
// API endpoint for programmatic access
GET /api/knowledge-base
{
  "projects": {...},
  "people": {...},
  "communications": [...],
  "metadata": {...}
}
```

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
# One-click deployment
npx vercel deploy

# Or use the Vercel button at the top of this README
```

### GitHub Pages
```bash
# Enable GitHub Pages in repository settings
# Point to /public directory
# Access at: https://username.github.io/fib-project-dashboard/
```

### Google Apps Script (Self-Contained)
```javascript
// Use the built-in dashboard template
// Run: generateStaticDashboard()
// Publishes as a web app directly from Google Apps Script
```

### Local Development
```bash
# Serve locally with Python
cd public
python -m http.server 8000
open http://localhost:8000

# Or use any static file server
npx serve public
```

## 🔍 API Documentation

### Knowledge Base Endpoint
```http
GET /api/knowledge-base
```

**Response:**
```json
{
  "projectGroups": {
    "RLHF Projects": {
      "variants": ["RLHF Dialogue Data", "RLHF Safety Evals"],
      "totalMentions": 15,
      "communications": [...],
      "timeline": "Dec 10-15, 2024",
      "volume": "44M examples"
    }
  },
  "people": {
    "Nina Patel": {
      "mentions": 8,
      "projects": ["RLHF Projects", "Safety Classifier"],
      "roles": ["Data Operations Lead"]
    }
  },
  "communications": [
    {
      "date": "2024-10-29",
      "source": "email",
      "content": "Green light for the second batch...",
      "projects": ["RLHF Projects"],
      "people": ["Lisa Park", "Nina Patel"],
      "actionItems": ["Review examples", "Send batch 3"]
    }
  ],
  "metadata": {
    "totalProjects": 5,
    "totalCommunications": 47,
    "lastUpdated": "2025-09-03T16:00:00Z"
  }
}
```

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-03T16:00:00Z",
  "version": "1.0.0"
}
```

## 🧪 Testing & Validation

### Data Quality Tests
```bash
# Run automated parsing tests
npm test

# Validate data extraction accuracy
node tests/parsing-validation.js

# Check API endpoint responses
curl https://your-app.vercel.app/api/health
```

### Manual Testing Checklist
- [ ] All communication sources parsed successfully
- [ ] Project associations correctly identified
- [ ] People and roles accurately extracted
- [ ] Timeline data properly formatted
- [ ] Links preserved and clickable
- [ ] Dashboard loads and displays data
- [ ] Search and filtering works
- [ ] Mobile responsive design

## 📈 Performance & Scaling

### Current Capacity
- **Communication Sources**: 6 different formats
- **Processing Speed**: <30 seconds for complete refresh
- **Dashboard Load Time**: <2 seconds
- **Concurrent Users**: 100+ (serverless scaling)

### Scaling Recommendations
For **100x growth** (1000+ communications, 100+ projects):

1. **Database Migration**: PostgreSQL with proper indexing
2. **Caching Layer**: Redis for frequently accessed data
3. **API Optimization**: GraphQL with query batching
4. **Real-time Updates**: WebSocket connections
5. **Search Enhancement**: Elasticsearch for advanced queries

## 🛡️ Security & Privacy

### Data Protection
- **Privacy**: Sample data uses placeholder information only
- **Access Control**: Google Sheets permissions manage data access
- **Encryption**: HTTPS for all API communications
- **Audit Trail**: Google Sheets provides change history

### Production Security Checklist
- [ ] Update default API secret keys
- [ ] Enable Google Sheets sharing restrictions
- [ ] Configure Vercel security headers
- [ ] Set up monitoring and alerts
- [ ] Regular backup verification

## 🤝 Contributing

### Development Setup
```bash
# Fork the repository
git clone https://github.com/your-username/fib-project-dashboard.git
cd fib-project-dashboard

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
# Submit pull request
```

### Code Style
- **JavaScript**: ES6+ with clear variable names
- **HTML/CSS**: Semantic markup with BEM methodology
- **Comments**: Explain complex logic and business rules
- **Testing**: Add tests for new parsing logic

## 📚 Documentation

- **📖 Technical Report**: [Complete implementation guide](../Fibonacci_Project_Tracker_Technical_Report.md)
- **🚀 Deployment Guide**: `src/google-apps-script/DEPLOYMENT_GUIDE.md`
- **🔧 API Reference**: `/docs/api-reference.md`
- **🎨 UI Components**: `/docs/ui-components.md`

## 🐛 Troubleshooting

### Common Issues

**Google Apps Script Permission Errors**
```javascript
// Solution: Authorize Google Apps Script to access Drive and Sheets
// Run any function once to trigger authorization flow
```

**Dashboard Shows No Data**
```javascript
// Check if knowledge base is properly generated
// Verify API endpoints in CONFIG
// Ensure CORS headers are configured
```

**Parsing Errors**
```javascript
// Check communication file formats
// Verify file encoding (should be UTF-8)
// Review parsing logs in Google Apps Script
```

**Deployment Issues**
```bash
# Ensure all files are committed to git
git add .
git commit -m "Deploy dashboard"
vercel deploy
```

### Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check the comprehensive technical report
- **Community**: Join discussions in GitHub Discussions

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Google Apps Script** for powerful automation capabilities
- **Vercel** for seamless serverless deployment
- **Google Sheets** for collaborative data management
- **Modern Web Standards** for responsive, accessible design

---

**Built with ❤️ for scaling teams who need better project visibility**

[🚀 Deploy Now](https://vercel.com/new/clone) | [📖 Read Full Documentation](../Fibonacci_Project_Tracker_Technical_Report.md) | [🎮 View Live Demo](https://fib-project-dashboard.vercel.app)