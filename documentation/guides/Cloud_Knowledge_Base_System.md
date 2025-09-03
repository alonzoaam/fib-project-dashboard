# ☁️ Cloud-Based Knowledge Base System

## Overview

The Fibonacci Project Dashboard now features a **fully cloud-based knowledge base system** powered by Google Apps Script and Google Drive. This eliminates the need for local Node.js dependencies and provides automatic, cloud-native dashboard generation.

## 🏗️ Architecture

### **Data Flow:**
1. **📁 Google Drive** → Communication files stored in `ProjectCommunications` folder
2. **🔧 Google Apps Script** → Processes files and builds knowledge base
3. **📊 Google Sheets** → Stores configuration and insights data
4. **💾 Google Drive** → Stores generated `knowledge_base.js` and `index.html`
5. **🌐 Public Access** → Shareable dashboard link for stakeholders

### **Components:**

#### 1. **Google Apps Script Files**
- `01_config_main.js` - Main orchestrator
- `02_data_extractors.js` - Data extraction utilities
- `03_communication_parser.js` - Enhanced communication parsing (now supports Slack-style meeting notes)
- `04_project_name_extractor.js` - Project name recognition
- `05_project_rollup.js` - Project data consolidation
- `06_knowledge_base_builder.js` - **NEW**: Cloud-based knowledge base builder
- `07_dashboard_template.js` - **NEW**: HTML dashboard template

#### 2. **Google Drive Structure**
```
📁 ProjectCommunications/          # Source data folder
   ├── emails.txt
   ├── slack-pings.txt
   ├── meeting-notes.txt
   ├── calendar-invites.txt
   ├── spec-docs.txt
   └── tickets.txt

📁 FibonacciDashboard/            # Generated output folder
   ├── knowledge_base.js          # Generated knowledge base
   ├── index.html                 # Complete dashboard with embedded data
   └── improved_dashboard_template.html  # Optional: Custom template
```

#### 3. **Google Sheets Integration**
- **Config Sheet**: Stores dynamic patterns and discovered entities
- **Insights Sheet**: Analytics and metrics
- **Project Dashboard Sheet**: Rich project data from knowledge base
- **People & Resources Sheet**: Enhanced people data with client detection

## 🚀 How It Works

### **1. Trigger the Process**
```javascript
// In Google Apps Script
function processAndUpdateAllSheets() {
  // This function now:
  // 1. Builds knowledge base from Google Drive
  // 2. Updates Google Sheets with config/insights
  // 3. Generates knowledge_base.js in Drive
  // 4. Creates complete dashboard HTML in Drive
  // 5. Returns shareable dashboard URL
}
```

### **2. Knowledge Base Building**
The `GoogleAppsScriptKnowledgeBuilder` class:

- **Reads** communication files from Google Drive's `ProjectCommunications` folder
- **Parses** all communication types (including enhanced Slack-style meeting notes)
- **Extracts** projects, people, keywords, and relationships
- **Groups** similar projects intelligently
- **Detects** clients using `[Client]` tags and contextual analysis
- **Generates** structured knowledge base data

### **3. Cloud Storage**
Two key files are generated in Google Drive:

#### **`knowledge_base.js`**
```javascript
// Knowledge Base - Generated 2024-01-15T10:30:00.000Z
window.KNOWLEDGE_BASE = {
  "projects": { /* ... */ },
  "people": { /* ... */ },
  "communications": [ /* ... */ ],
  "projectGroups": { /* ... */ },
  "initialConfig": { /* ... */ },
  "metadata": {
    "buildDate": "2024-01-15T10:30:00.000Z",
    "totalProjects": 8,
    "totalCommunications": 156
  }
};
```

#### **`index.html`**
Complete dashboard with:
- **Embedded knowledge base** (no external dependencies)
- **Modern UI** with tabs, search, and filtering
- **Interactive features** (expandable rows, project grouping)
- **AI-like assistant** for querying data
- **Responsive design** for all devices

### **4. Public Access**
The `FibonacciDashboard` folder is automatically set to public sharing, providing:
- **Direct browser access** to `index.html`
- **No authentication required** for stakeholders
- **Always up-to-date** data from latest script run

## 📋 Enhanced Features

### **Meeting Notes Parser**
Now supports both formats:

**Traditional Format:**
```
Meeting Minutes: Data Labeling Team Sync
Date: Oct 30, 2024, 3:00p
Attendees: Alex K, Sarah M, Data Team
Location: Zoom Room 3
...
```

**Slack-Style Format:**
```
From: Daily Stand-up Notes
Channel: #team-standups
Date: Oct 30, 2024, 10:00a
Message: ``` Team Updates - Oct 30
Completed: Q3 metrics review...
```

### **Client Detection**
Enhanced logic identifies clients through:
- **`[Client]` tags** in names (e.g., "John Smith [Client]")
- **Contextual analysis** of communication patterns
- **Known client organizations** from configuration

### **Project Grouping**
Smart grouping consolidates variations:
- "RLHF Dialogue Data" + "RLHF" + "rlhf" → **"RLHF Projects"**
- "Safety Classifier" + "Safety classifier dataset" → **"Safety Classifier Projects"**

## 🔧 Setup Instructions

### **1. Deploy Google Apps Script**
1. Copy all files from `src/google-apps-script/` to Google Apps Script
2. Update `CONFIG.SPREADSHEET_ID` with your Google Sheets ID
3. Update `CONFIG.DRIVE_FOLDER_NAME` with your communication folder name

### **2. Prepare Google Drive**
1. Create `ProjectCommunications` folder with your communication files
2. Ensure files follow the expected naming pattern:
   - `emails.txt`
   - `slack-pings.txt`
   - `meeting-notes.txt`
   - `calendar-invites.txt`
   - `spec-docs.txt`
   - `tickets.txt`

### **3. Run the Process**
Execute `processAndUpdateAllSheets()` in Google Apps Script. This will:
- Build the knowledge base
- Update Google Sheets
- Generate dashboard files in Google Drive
- Return the shareable dashboard URL

### **4. Share with Stakeholders**
The generated dashboard URL can be shared directly - no additional setup required!

## 🌟 Benefits

### **For Developers:**
- ✅ **No local dependencies** (Node.js not required)
- ✅ **Cloud-native** processing and storage
- ✅ **Automatic updates** via Google Apps Script triggers
- ✅ **Version control** through Google Drive revision history

### **For Stakeholders:**
- ✅ **Instant access** via shareable link
- ✅ **Always current** data
- ✅ **No authentication** barriers
- ✅ **Mobile-friendly** responsive design

### **For Organizations:**
- ✅ **Zero hosting costs** (uses Google infrastructure)
- ✅ **Enterprise security** through Google Workspace
- ✅ **Scalable** to any data volume
- ✅ **Maintainable** through familiar Google tools

## 🔄 Automation Options

### **Scheduled Updates**
Set up Google Apps Script triggers to automatically rebuild the knowledge base:
- **Daily** at a specific time
- **On file changes** in the ProjectCommunications folder
- **Manual** execution as needed

### **Integration Possibilities**
- **Slack webhooks** to trigger updates on new communications
- **Email parsing** to automatically add new communications
- **API endpoints** for external system integration

## 🎯 Next Steps

The cloud-based system is now fully functional and ready for deployment. Key advantages include:

1. **Simplified deployment** - just run the Google Apps Script
2. **Automatic knowledge base generation** from Google Drive files
3. **Enhanced parsing** for all communication formats
4. **Professional dashboard** with embedded data
5. **Public sharing** for stakeholder access

This represents a complete evolution from the local Node.js approach to a fully cloud-native solution that's easier to maintain and deploy.
