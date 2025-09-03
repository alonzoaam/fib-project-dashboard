# Google Apps Script Deployment Guide

## Overview
This enhanced Google Apps Script system now automatically builds a knowledge base from your Google Drive files and uploads configuration data directly to your Google Sheets.

## Files to Deploy

Deploy these files to your Google Apps Script project in this order:

1. **01_config_main.js** - Main configuration and integration class
2. **02_data_extractors.js** - Data extraction utilities
3. **03_communication_parser.js** - Communication parsing logic
4. **04_project_name_extractor.js** - Project name extraction and clustering
5. **05_project_rollup.js** - Project rollup and aggregation
6. **06_knowledge_base_builder.js** - *(NEW)* Knowledge base builder for Google Apps Script

## Key Improvements

### 🧠 Integrated Knowledge Base Building
- Automatically reads files from your `ProjectCommunications` Google Drive folder
- Builds knowledge base using predefined patterns and keywords
- No more manual CSV uploads needed!

### 📋 Automatic Config Sheet Creation
- Creates and populates the "Config" sheet with:
  - **Project Patterns**: Known project names to look for
  - **People Patterns**: Known team member names
  - **Keyword Patterns**: Status and priority keywords
  - **Client Patterns**: Known client organizations
  - **Discovered Projects**: Projects found in communications
  - **Discovered People**: People found (marked as Team Member or Client Contact)

### 💡 Enhanced Insights Sheet
- Automatically generates analytics including:
  - Communication volume by source
  - Top mentioned projects
  - Team vs Client activity analysis
  - Project-Client associations

### 🔄 Dynamic Configuration Reading
- Reads patterns from the Config sheet for processing
- Adapts to new patterns you add manually
- Self-improving system that learns from discoveries

## Setup Instructions

### 1. Google Drive Setup
Make sure you have a folder named `ProjectCommunications` in your Google Drive containing your `.txt` files:
- `emails.txt`
- `slack-pings.txt`
- `meeting-notes.txt`
- `calendar-invites.txt`
- `tickets.txt`
- `spec-docs.txt`

### 2. Google Sheets Setup
Update the `SPREADSHEET_ID` in `01_config_main.js`:
```javascript
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  DRIVE_FOLDER_NAME: 'ProjectCommunications',
  // ... rest of config
};
```

### 3. Deploy to Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Delete the default `Code.gs` file
4. Add each of the 6 files listed above
5. Save the project

### 4. Set Permissions
The script needs permissions to:
- Read files from Google Drive
- Write to Google Sheets
- Access your Google Drive folders

### 5. Run the Script
Execute the main function:
```javascript
function main() {
  const integration = new GoogleSheetsIntegration();
  return integration.processAndUpdateAllSheets();
}
```

## What Happens When You Run It

1. **🧠 Knowledge Base Building**
   - Reads all `.txt` files from `ProjectCommunications` folder
   - Processes each file line by line
   - Extracts projects, people, keywords, numbers, dates
   - Groups similar projects intelligently
   - Identifies potential clients vs team members

2. **📋 Config Sheet Population**
   - Creates "Config" sheet with all patterns and discoveries
   - Categorizes findings (Project Patterns, People Patterns, etc.)
   - Marks people as "Team Member" or "Client Contact"
   - Provides descriptions for each entry

3. **💡 Insights Generation**
   - Creates "Insights" sheet with analytics
   - Shows communication volume by source
   - Identifies top projects by mentions
   - Analyzes team vs client activity
   - Maps project-client relationships

4. **📊 Regular Sheet Updates**
   - Updates all existing sheets (Communications, Projects, People, etc.)
   - Uses dynamic configuration from Config sheet
   - Enhanced with client identification

## New Sheets Created

### Config Sheet Columns:
- **Category**: Project Patterns, People Patterns, Keyword Patterns, Client Patterns, Discovered Projects, Discovered People
- **Type**: Known Project, Known Person, Status Keyword, Known Client, Found Project, Team Member, Client Contact
- **Value**: The actual pattern or discovered item
- **Description**: Explanation of what this item represents

### Insights Sheet Columns:
- **Metric**: The type of insight (e.g., "Total Project Groups", "Communications from slack")
- **Value**: The numeric value or count
- **Details**: Additional context or breakdown
- **Last_Updated**: Timestamp of when this insight was generated

## Benefits

✅ **Fully Automated**: No more manual CSV uploads
✅ **Self-Improving**: Discovers new projects and people automatically
✅ **Client Tracking**: Automatically identifies potential clients
✅ **Dynamic Configuration**: Reads patterns from sheets, adapts to changes
✅ **Rich Analytics**: Comprehensive insights and metrics
✅ **Easy Maintenance**: Update patterns in Config sheet, not code

## Troubleshooting

### Common Issues:
1. **"Folder not found"**: Make sure `ProjectCommunications` folder exists in Google Drive
2. **"Permission denied"**: Run the script and authorize Google Drive/Sheets access
3. **"Spreadsheet not found"**: Update `SPREADSHEET_ID` in config
4. **"No data processed"**: Check that `.txt` files exist in the Drive folder

### Debug Mode:
The script logs detailed progress. Check the Apps Script execution log for:
- File loading status
- Processing progress
- Pattern matching results
- Sheet update confirmations

This enhanced system transforms your Google Apps Script into a powerful, self-managing project communication analysis tool! 🚀
