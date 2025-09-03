// === MAIN CONFIGURATION & ENTRY POINT ===
// This is the main file - deploy this and the other files to Google Apps Script

// === MAIN CONFIGURATION ===
const CONFIG = {
  // Update these with your actual values
  SPREADSHEET_ID: '1BJvyyW4g68X9-ccg9TUNSBUDVtwjN-9NMFOhdFoGfzw', // Get from sheet URL
  DRIVE_FOLDER_NAME: 'ProjectCommunications', // Folder containing your text files
  PROJECT_DRIVE_ID: '1VQc2kv_-gFrFh4ubcK3bIz9z4l0HmX0e', // Project drive root folder ID
  
  // API Configuration for cloud deployment
  API_ENDPOINTS: {
    PRIMARY: 'https://fib-project-dashboard.vercel.app/api/knowledge-base',
    BACKUP: 'https://script.google.com/macros/s/prj_Zk0kK8EcpAAfJ1YHym5dnLWfbPTD/exec'
  },
  API_SECRET_KEY: 'fibonacci-secret-2025', // Change this in production
  ENABLE_DRIVE_BACKUP: false, // Set to true if you want to keep drive backups
  
  // Sheet names for all tabs
  SHEETS: {
    COMMUNICATIONS: 'All Communications',
    PROJECTS: 'Project Dashboard', 
    PEOPLE: 'People & Resources',
    TIMELINE: 'Timeline View',
    CONFIG: 'Config',
    INSIGHTS: 'Insights',
    // Individual source tabs
    SLACK: 'Slack Messages',
    EMAIL: 'Email Communications',
    MEETINGS: 'Meeting Notes',
    CALENDAR: 'Calendar Events',
    SPECS: 'Specifications',
    TICKETS: 'Support Tickets'
  }
};

// === GOOGLE SHEETS INTEGRATION CLASS ===
// Handles all Google Sheets operations and data visualization

class GoogleSheetsIntegration {
  constructor() {
    this.parser = new SimpleCommunicationParser();
    this.projectExtractor = new ProjectNameExtractor();
    this.projectRollup = new ProjectRollup();
    this.dynamicConfig = null;
  }

  // MAIN FUNCTION: Process files and update all sheets
  processAndUpdateAllSheets() {
    try {
      console.log('🔄 Starting Google Sheets integration...');
      
      // 1. Get spreadsheet
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      console.log(`📊 Opened spreadsheet: ${ss.getName()}`);
      
      // 2. Build and upload knowledge base first (this creates/updates Config sheet)
      console.log('🧠 Building knowledge base from Google Drive files...');
      const knowledgeBase = buildAndUploadKnowledgeBase();
      
      // 3. Read dynamic configuration from Config sheet (now populated)
      this.dynamicConfig = this.readConfigFromSheet(ss);
      console.log(`⚙️ Loaded dynamic configuration with ${this.dynamicConfig.totalPatterns} patterns`);
      
      // 4. Read files from Drive
      const files = this.readFilesFromDrive();
      console.log(`📁 Loaded ${Object.keys(files).length} files`);
      
      // 5. Parse communications using dynamic config
      if (this.parser.setDynamicConfig) {
        this.parser.setDynamicConfig(this.dynamicConfig);
      }
      const result = this.parser.parseAllFiles(files);
      console.log(`✅ Parsed ${result.communications.length} communications`);
      
      // 6. Extract and cluster project names using dynamic config
      this.projectExtractor.comms = result.communications;
      if (this.projectExtractor.setDynamicConfig) {
        this.projectExtractor.setDynamicConfig(this.dynamicConfig);
      }
      const projectDict = this.projectExtractor.run();
      console.log(`📋 Identified ${Object.keys(projectDict).length} canonical projects`);
      
      // 7. Create project rollups using dynamic project dictionary
      this.projectRollup = new ProjectRollup(result.communications, projectDict);
      if (this.projectRollup.setDynamicConfig) {
        this.projectRollup.setDynamicConfig(this.dynamicConfig);
      }
      const projectSummaries = this.projectRollup.aggregate();
      console.log(`📊 Created ${projectSummaries.length} project summaries`);
      
      // 8. Update all sheet tabs (Config and Insights already updated by knowledge base)
      this.createAndUpdateSheets(ss, result, projectSummaries, knowledgeBase);
      
      console.log('🎉 Successfully updated all sheets with knowledge base integration!');
      return result;
      
    } catch (error) {
      console.error('❌ Error in processAndUpdateAllSheets:', error.toString());
      throw error;
    }
  }

  // Read dynamic configuration from Config sheet
  readConfigFromSheet(ss) {
    try {
      const configSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG);
      if (!configSheet) {
        console.warn('⚠️ Config sheet not found, using default configuration');
        return this.getDefaultConfig();
      }

      const data = configSheet.getDataRange().getValues();
      const headers = data[0];
      const config = {
        projectPatterns: [],
        peoplePatterns: [],
        keywordPatterns: [],
        clientPatterns: [],
        discoveredProjects: [],
        discoveredPeople: [],
        totalPatterns: 0
      };

      // Parse config data
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const category = row[0];
        const type = row[1];
        const value = row[2];
        const description = row[3];

        if (!value) continue;

        switch (category) {
          case 'Project Patterns':
            config.projectPatterns.push(value);
            break;
          case 'People Patterns':
            config.peoplePatterns.push(value);
            break;
          case 'Keyword Patterns':
            config.keywordPatterns.push(value);
            break;
          case 'Client Patterns':
            config.clientPatterns.push(value);
            break;
          case 'Discovered Projects':
            config.discoveredProjects.push({ name: value, type: type });
            break;
          case 'Discovered People':
            config.discoveredPeople.push({ name: value, type: type, description: description });
            break;
        }
      }

      config.totalPatterns = config.projectPatterns.length + config.peoplePatterns.length + 
                           config.keywordPatterns.length + config.clientPatterns.length;

      console.log(`📋 Loaded ${config.projectPatterns.length} project patterns`);
      console.log(`👥 Loaded ${config.peoplePatterns.length} people patterns`);
      console.log(`🔑 Loaded ${config.keywordPatterns.length} keyword patterns`);
      console.log(`🏢 Loaded ${config.clientPatterns.length} client patterns`);

      return config;

    } catch (error) {
      console.error('❌ Error reading config sheet:', error.toString());
      return this.getDefaultConfig();
    }
  }

  // Fallback default configuration
  getDefaultConfig() {
    return {
      projectPatterns: ['RLHF', 'Safety', 'Multimodal', 'SFT', 'Classifier'],
      peoplePatterns: ['Alex Kumar', 'Sarah Miller', 'Maria Santos'],
      keywordPatterns: ['blocked', 'at risk', 'on track', 'complete'],
      clientPatterns: ['OpenAI', 'Anthropic', 'Google'],
      discoveredProjects: [],
      discoveredPeople: [],
      totalPatterns: 15
    };
  }

  // Read files from Google Drive folder
  readFilesFromDrive() {
    const files = {};
    
    try {
      const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
      if (!folders.hasNext()) {
        throw new Error(`Folder '${CONFIG.DRIVE_FOLDER_NAME}' not found in Google Drive`);
      }
      
      const folder = folders.next();
      const driveFiles = folder.getFiles();
      
      while (driveFiles.hasNext()) {
        const file = driveFiles.next();
        const filename = file.getName();
        
        // Only process text files
        if (filename.endsWith('.txt')) {
          const content = file.getBlob().getDataAsString();
          files[filename] = content;
          console.log(`📄 Loaded: ${filename} (${content.length} chars)`);
        }
      }
      
      return files;
      
    } catch (error) {
      console.error('❌ Error reading files from Drive:', error.toString());
      throw error;
    }
  }

  // Create and update all sheet tabs
  createAndUpdateSheets(ss, result, projectSummaries, knowledgeBase) {
    // 1. Communications Log (All communications chronologically)
    this.updateCommunicationsSheet(ss, result.communications);
    
    // 2. Project Dashboard (Using knowledge base project groups)
    this.updateProjectDashboardFromKB(ss, knowledgeBase);
    
    // 3. People & Resources (Using knowledge base people data)
    this.updatePeopleSheetFromKB(ss, knowledgeBase);
    
    // 4. Timeline View (Date-ordered events)
    this.updateTimelineSheet(ss, result.communications);
    
    // 5. Individual source tabs
    this.updateSourceSpecificSheets(ss, result.bySource);
    
    // Note: Config and Insights sheets are handled by the knowledge base builder
  }

  // Helper: Create consolidated DateTime from date and time
  createDateTime(dateStr, timeStr) {
    try {
      const date = new Date(dateStr);
      if (timeStr && timeStr !== '00:00') {
        // Parse time format like "10:00a", "2:30p", "14:30"
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})([ap])?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
          
          // Convert to 24-hour format
          if (ampm === 'p' && hours !== 12) hours += 12;
          if (ampm === 'a' && hours === 12) hours = 0;
          
          date.setHours(hours, minutes, 0, 0);
        }
      }
      return date;
    } catch (error) {
      console.warn('Error creating DateTime:', error.message);
      return new Date(dateStr);
    }
  }

  // CONFIG SHEET: Configuration patterns and discoveries
  updateConfigSheet(ss) {
    try {
      const sheetName = CONFIG.SHEETS.CONFIG;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Headers
      const headers = ['Category', 'Type', 'Value', 'Description'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285F4')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Add config data (this would be populated from knowledge base CSV upload)
      const configData = [
        ['Project Patterns', 'Known Project', 'RLHF Preference Collection', 'Predefined project name to look for'],
        ['Project Patterns', 'Known Project', 'RLHF Dialogue Data', 'Predefined project name to look for'],
        ['Project Patterns', 'Known Project', 'Safety Classifier Dataset', 'Predefined project name to look for'],
        ['People Patterns', 'Known Person', 'Alex Kumar', 'Predefined person name to look for'],
        ['People Patterns', 'Known Person', 'Sarah Miller', 'Predefined person name to look for'],
        ['Client Patterns', 'Known Client', 'OpenAI', 'Potential client organization'],
        ['Client Patterns', 'Known Client', 'Anthropic', 'Potential client organization'],
        ['Keyword Patterns', 'Status Keyword', 'blocked', 'Status and priority keywords'],
        ['Keyword Patterns', 'Status Keyword', 'at risk', 'Status and priority keywords'],
        ['Keyword Patterns', 'Status Keyword', 'on track', 'Status and priority keywords']
      ];
      
      if (configData.length > 0) {
        sheet.getRange(2, 1, configData.length, 4).setValues(configData);
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${configData.length} configuration entries`);
      
    } catch (error) {
      console.error(`❌ Error updating Config sheet: ${error.toString()}`);
    }
  }

  // INSIGHTS SHEET: Additional analytics and client relationships
  updateInsightsSheet(ss, result, projectSummaries) {
    try {
      const sheetName = CONFIG.SHEETS.INSIGHTS;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Headers
      const headers = ['Metric', 'Value', 'Details', 'Last_Updated'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285F4')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Generate insights data
      const insightsData = [];
      const now = new Date().toISOString();
      
      // Basic metrics
      insightsData.push(['Total Communications', result.communications.length, 'All parsed communications', now]);
      insightsData.push(['Total Projects', projectSummaries.length, 'Identified project summaries', now]);
      
      // Communication volume by source
      const sourceStats = {};
      result.communications.forEach(comm => {
        const source = comm.source || 'Unknown';
        sourceStats[source] = (sourceStats[source] || 0) + 1;
      });
      
      Object.entries(sourceStats).forEach(([source, count]) => {
        insightsData.push([`Communications from ${source}`, count, `Total messages from this source`, now]);
      });
      
      // Top projects by mentions (if available)
      projectSummaries.slice(0, 5).forEach(project => {
        const mentions = project.sources ? project.sources.length : 0;
        insightsData.push([`Top Project: ${project.name}`, mentions, 'Communication mentions', now]);
      });
      
      // Client analysis
      const potentialClients = this.identifyPotentialClients(result.communications);
      potentialClients.forEach(client => {
        insightsData.push(['Potential Client', client.name, `Projects: ${client.projects.join(', ')}`, now]);
      });
      
      if (insightsData.length > 0) {
        sheet.getRange(2, 1, insightsData.length, 4).setValues(insightsData);
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${insightsData.length} insights`);
      
    } catch (error) {
      console.error(`❌ Error updating Insights sheet: ${error.toString()}`);
    }
  }

  // Helper: Identify potential clients from communications
  identifyPotentialClients(communications) {
    const clientIndicators = ['client', 'customer', 'stakeholder', 'openai', 'anthropic', 'google'];
    const potentialClients = new Map();
    
    communications.forEach(comm => {
      const content = (comm.content || '').toLowerCase();
      const from = (comm.from || '').toLowerCase();
      
      // Check if communication mentions client indicators
      clientIndicators.forEach(indicator => {
        if (content.includes(indicator) || from.includes(indicator)) {
          const clientName = comm.from || 'Unknown Client';
          if (!potentialClients.has(clientName)) {
            potentialClients.set(clientName, {
              name: clientName,
              projects: new Set(),
              mentions: 0
            });
          }
          
          const client = potentialClients.get(clientName);
          client.mentions++;
          
          // Associate with projects mentioned
          if (comm.projects_mentioned) {
            comm.projects_mentioned.forEach(project => {
              client.projects.add(project);
            });
          }
        }
      });
    });
    
    // Convert to array and clean up
    return Array.from(potentialClients.values()).map(client => ({
      ...client,
      projects: Array.from(client.projects)
    })).slice(0, 10); // Top 10 potential clients
  }

  // PROJECT DASHBOARD FROM KNOWLEDGE BASE: Using project groups with variants
  updateProjectDashboardFromKB(ss, knowledgeBase) {
    try {
      const sheetName = CONFIG.SHEETS.PROJECTS;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Enhanced headers for knowledge base data
      const headers = [
        'Project_Group', 'Variants', 'Total_Mentions', 'Recent_Activity', 
        'Associated_Clients', 'Team_Members', 'Status', 'Priority', 'Last_Updated'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285F4')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Process knowledge base project groups
      const projectData = [];
      if (knowledgeBase && knowledgeBase.projectGroups) {
        Array.from(knowledgeBase.projectGroups.entries()).forEach(([groupName, groupData]) => {
          const communications = Array.from(groupData.communications.values());
          
          // Extract clients and team members from communications
          const clients = new Set();
          const teamMembers = new Set();
          let recentActivity = '';
          let status = 'Active';
          let priority = 'Medium';
          
          communications.forEach(comm => {
            if (comm.people) {
              comm.people.forEach(person => {
                if (person.includes('[Client]') || person.includes('[client]')) {
                  clients.add(person.replace(/\[Client\]/gi, '').trim());
                } else {
                  teamMembers.add(person);
                }
              });
            }
            
            // Get most recent activity
            if (!recentActivity && comm.date) {
              recentActivity = comm.date;
            }
            
            // Infer status from content
            const content = comm.content.toLowerCase();
            if (content.includes('blocked') || content.includes('stuck')) {
              status = 'Blocked';
              priority = 'High';
            } else if (content.includes('complete') || content.includes('done')) {
              status = 'Complete';
            } else if (content.includes('at risk') || content.includes('behind')) {
              status = 'At Risk';
              priority = 'High';
            }
          });
          
          projectData.push([
            groupName,
            groupData.variants.join(', '),
            groupData.totalMentions,
            recentActivity || 'N/A',
            Array.from(clients).join(', ') || 'None identified',
            Array.from(teamMembers).slice(0, 5).join(', '), // Limit to 5 for readability
            status,
            priority,
            new Date().toISOString().split('T')[0]
          ]);
        });
      }
      
      // Write data to sheet
      if (projectData.length > 0) {
        sheet.getRange(2, 1, projectData.length, headers.length).setValues(projectData);
        
        // Apply conditional formatting for status
        const statusRange = sheet.getRange(2, 7, projectData.length, 1);
        
        // Create conditional formatting rules
        const rules = [];
        
        // Blocked = Red
        rules.push(SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo('Blocked')
          .setBackground('#ffcccb')
          .setRanges([statusRange])
          .build());
        
        // At Risk = Yellow
        rules.push(SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo('At Risk')
          .setBackground('#fff2cc')
          .setRanges([statusRange])
          .build());
        
        // Complete = Green
        rules.push(SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo('Complete')
          .setBackground('#d4edda')
          .setRanges([statusRange])
          .build());
        
        sheet.setConditionalFormatRules(rules);
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${projectData.length} knowledge base project groups`);
      
    } catch (error) {
      console.error(`❌ Error updating Project Dashboard from KB: ${error.toString()}`);
    }
  }

  // PEOPLE & RESOURCES FROM KNOWLEDGE BASE: Enhanced with client detection
  updatePeopleSheetFromKB(ss, knowledgeBase) {
    try {
      const sheetName = CONFIG.SHEETS.PEOPLE;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Enhanced headers for knowledge base data
      const headers = [
        'Name', 'Type', 'Total_Mentions', 'Associated_Projects', 'Roles', 
        'Recent_Activity', 'Communication_Sources', 'Client_Indicator', 'Last_Updated'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285F4')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Process knowledge base people data
      const peopleData = [];
      if (knowledgeBase && knowledgeBase.people) {
        Array.from(knowledgeBase.people.entries()).forEach(([personName, personData]) => {
          // Determine if this person is a client
          const isClient = this.determineIfClientFromKB(personName, personData, knowledgeBase);
          
          // Get communication sources
          const sources = new Set();
          let recentActivity = '';
          let clientIndicator = '';
          
          knowledgeBase.communications.forEach(comm => {
            if (comm.people && comm.people.includes(personName)) {
              sources.add(comm.source);
              if (!recentActivity && comm.date) {
                recentActivity = comm.date;
              }
              
              // Check for client indicators in content
              if (comm.content.includes('[Client]') || comm.content.includes('[client]')) {
                clientIndicator = 'Found [Client] tag';
              }
            }
          });
          
          // If no explicit client indicator found but determined to be client
          if (!clientIndicator && isClient) {
            if (personName.includes('[Client]')) {
              clientIndicator = 'Name contains [Client]';
            } else {
              clientIndicator = 'Contextual analysis';
            }
          }
          
          peopleData.push([
            personName.replace(/\[Client\]/gi, '').trim(), // Clean name for display
            isClient ? '👤 Client Contact' : '👥 Team Member',
            personData.mentions || 0,
            Array.from(personData.projects || []).join(', ') || 'None',
            Array.from(personData.roles || []).join(', ') || 'Not specified',
            recentActivity || 'N/A',
            Array.from(sources).join(', ') || 'Unknown',
            clientIndicator || 'None',
            new Date().toISOString().split('T')[0]
          ]);
        });
      }
      
      // Sort by type (Clients first) then by mentions
      peopleData.sort((a, b) => {
        if (a[1].includes('Client') && !b[1].includes('Client')) return -1;
        if (!a[1].includes('Client') && b[1].includes('Client')) return 1;
        return b[2] - a[2]; // Sort by mentions descending
      });
      
      // Write data to sheet
      if (peopleData.length > 0) {
        sheet.getRange(2, 1, peopleData.length, headers.length).setValues(peopleData);
        
        // Apply conditional formatting for person type
        const typeRange = sheet.getRange(2, 2, peopleData.length, 1);
        
        // Client contacts = Light blue background
        const clientRule = SpreadsheetApp.newConditionalFormatRule()
          .whenTextContains('Client Contact')
          .setBackground('#cce5ff')
          .setRanges([typeRange])
          .build();
        
        // Team members = Light green background
        const teamRule = SpreadsheetApp.newConditionalFormatRule()
          .whenTextContains('Team Member')
          .setBackground('#e6f3e6')
          .setRanges([typeRange])
          .build();
        
        sheet.setConditionalFormatRules([clientRule, teamRule]);
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${peopleData.length} people from knowledge base`);
      
    } catch (error) {
      console.error(`❌ Error updating People sheet from KB: ${error.toString()}`);
    }
  }

  // Helper: Determine if person is client using knowledge base data
  determineIfClientFromKB(personName, personData, knowledgeBase) {
    const personLower = personName.toLowerCase();
    
    // PRIMARY: Check for [Client] indicator in name
    if (personName.includes('[Client]') || personName.includes('[client]')) {
      return true;
    }
    
    // SECONDARY: Check communications for client context
    let hasClientContext = false;
    knowledgeBase.communications.forEach(comm => {
      if (comm.people && comm.people.includes(personName)) {
        const content = comm.content.toLowerCase();
        // Look for [Client] in the same communication
        if (content.includes('[client]') && content.includes(personLower)) {
          hasClientContext = true;
        }
        // Look for client indicators in context
        if ((content.includes('client') || content.includes('customer') || content.includes('stakeholder')) 
            && content.includes(personLower)) {
          hasClientContext = true;
        }
      }
    });
    
    if (hasClientContext) return true;
    
    // TERTIARY: Check for known client organizations
    const clientOrgs = ['openai', 'anthropic', 'google', 'microsoft', 'meta', 'amazon'];
    if (clientOrgs.some(org => personLower.includes(org))) {
      return true;
    }
    
    return false;
  }

  // SHEET 1: All Communications (enhanced with critical data fields)
  updateCommunicationsSheet(ss, communications) {
    try {
      const sheetName = CONFIG.SHEETS.COMMUNICATIONS;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Enhanced headers with critical data fields
      const headers = [
        'Communication_ID', 'DateTime', 'Date Display', 'Source', 'From', 'To', 
        'Content', 'Projects_Mentioned', 'Action_Items', 'Priority_Level', 
        'Volume_Numbers', 'Timelines_Mentioned', 'Links'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285F4')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Add data
      if (communications.length > 0) {
        const data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          return [
            comm.communication_id || 'N/A',
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.source || 'Unknown',
            comm.from || 'Unknown',
            comm.to || 'Unknown',
            (comm.content || comm.messageContent || '').substring(0, 500), // Limit length
            (comm.projects_mentioned || []).join(', '),
            (comm.action_items || []).join('; '),
            comm.priority_level || 'Medium',
            (comm.volume_numbers || []).join(', '),
            (comm.timelines_mentioned || []).join(', '),
            (comm.links || []).join(', ')
          ];
        });
        
        sheet.getRange(2, 1, data.length, headers.length).setValues(data);
        
        // Format DateTime column
        sheet.getRange(2, 2, data.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${communications.length} items`);
      
    } catch (error) {
      console.error(`❌ Error updating communications sheet: ${error.toString()}`);
    }
  }

  // SHEET 2: Project Dashboard (using rollup data)
  updateProjectDashboard(ss, projectSummaries) {
    try {
      const sheetName = CONFIG.SHEETS.PROJECTS;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      sheet.clear();
      
      // Headers from ProjectRollup format
      const headers = [
        'Project', 'Total_Volume', 'Deliverables', 'Guidelines', 
        'Responsible', 'Status', 'Notes'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#FF6D00')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Add project data
      if (projectSummaries.length > 0) {
        const data = projectSummaries.map(proj => [
          proj.Project,
          proj.Total_Volume,
          proj.Deliverables,
          proj.Guidelines,
          proj.Responsible,
          proj.Status,
          proj.Notes
        ]);
        
        sheet.getRange(2, 1, data.length, headers.length).setValues(data);
      }
      
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${projectSummaries.length} projects`);
      
    } catch (error) {
      console.error(`❌ Error updating project dashboard: ${error.toString()}`);
    }
  }

  // SHEET 3: People & Resources
  updatePeopleSheet(ss, result) {
    try {
      const sheetName = CONFIG.SHEETS.PEOPLE;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      sheet.clear();
      
      const headers = [
        'Person', 'Projects_Mentioned', 'Total_Communications', 'Last_Activity', 'Role_Inferred'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers  
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#0F9D58')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Aggregate people data
      const peopleData = {};
      result.communications.forEach(comm => {
        const people = [comm.from, comm.to].flat().filter(p => p && p !== 'Unknown');
        people.forEach(person => {
          if (!peopleData[person]) {
            peopleData[person] = {
              projects: new Set(),
              commCount: 0,
              lastActivity: comm.date
            };
          }
          peopleData[person].commCount++;
          if (comm.projects_mentioned) {
            comm.projects_mentioned.forEach(p => peopleData[person].projects.add(p));
          }
          if (new Date(comm.date) > new Date(peopleData[person].lastActivity)) {
            peopleData[person].lastActivity = comm.date;
          }
        });
      });
      
      // Convert to sheet data
      const data = Object.entries(peopleData).map(([person, info]) => [
        person,
        Array.from(info.projects).join(', '),
        info.commCount,
        info.lastActivity,
        info.commCount > 10 ? 'Lead' : 'Contributor'
      ]);
      
      if (data.length > 0) {
        sheet.getRange(2, 1, data.length, headers.length).setValues(data);
      }
      
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${data.length} people`);
      
    } catch (error) {
      console.error(`❌ Error updating people sheet: ${error.toString()}`);
    }
  }

  // SHEET 4: Timeline View
  updateTimelineSheet(ss, communications) {
    try {
      const sheetName = CONFIG.SHEETS.TIMELINE;
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      sheet.clear();
      
      const headers = [
        'DateTime', 'Date Display', 'Source', 'Event_Summary', 'Participants', 'Impact_Level'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#9C27B0')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Add timeline data
      if (communications.length > 0) {
        const data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          const summary = (comm.content || comm.messageContent || '').substring(0, 100) + '...';
          const participants = [comm.from, comm.to].flat().filter(p => p && p !== 'Unknown').join(', ');
          
          return [
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.source,
            summary,
            participants,
            comm.priority_level || 'Medium'
          ];
        });
        
        sheet.getRange(2, 1, data.length, headers.length).setValues(data);
        sheet.getRange(2, 1, data.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      }
      
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${communications.length} timeline items`);
      
    } catch (error) {
      console.error(`❌ Error updating timeline sheet: ${error.toString()}`);
    }
  }

  // SHEET 5: Individual source tabs
  updateSourceSpecificSheets(ss, bySource) {
    const sourceConfigs = {
      'slack': { sheetName: CONFIG.SHEETS.SLACK, color: '#4A154B' },
      'email': { sheetName: CONFIG.SHEETS.EMAIL, color: '#D44638' },
      'meeting': { sheetName: CONFIG.SHEETS.MEETINGS, color: '#0F9D58' },
      'calendar': { sheetName: CONFIG.SHEETS.CALENDAR, color: '#4285F4' },
      'spec': { sheetName: CONFIG.SHEETS.SPECS, color: '#FF6D00' },
      'ticket': { sheetName: CONFIG.SHEETS.TICKETS, color: '#9C27B0' }
    };

    for (const [source, config] of Object.entries(sourceConfigs)) {
      if (bySource[source] && bySource[source].length > 0) {
        this.updateIndividualSourceSheet(ss, config.sheetName, bySource[source], config.color);
      }
    }
  }

  // Helper: Update individual source sheet with format-specific columns
  updateIndividualSourceSheet(ss, sheetName, communications, headerColor) {
    try {
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      sheet.clear();
      
      // Headers and data based on source type from formatting guidelines
      let headers = [];
      let data = [];
      
      if (sheetName === CONFIG.SHEETS.SLACK) {
        // [DateTime, Date Display, (Channel/DM), From, To (Channel name or recipient Name), Message Content, Links]
        headers = ['DateTime', 'Date Display', 'Channel/DM', 'From', 'To', 'Message Content', 'Links'];
        data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          return [
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.type || 'Message',
            comm.from || 'Unknown',
            comm.to || 'Unknown', 
            comm.messageContent || comm.content || '',
            (comm.links || []).join(', ')
          ];
        });
      } else if (sheetName === CONFIG.SHEETS.EMAIL) {
        // [date, from, to, subject, content, links]  
        headers = ['Date', 'From', 'To', 'Subject', 'Content', 'Links'];
        data = communications.map(comm => {
          return [
            comm.date,
            comm.from || 'Unknown',
            comm.to || 'Unknown',
            comm.subject || 'No Subject',
            comm.content || '',
            (comm.links || []).join(', ')
          ];
        });
      } else if (sheetName === CONFIG.SHEETS.MEETINGS) {
        // [DateTime, Date_Display, "Daily Standup" or meeting name, location, content, links]
        headers = ['DateTime', 'Date Display', 'Meeting Type/Name', 'Location', 'Content', 'Links'];
        data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          return [
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.meetingName || 'Meeting',
            comm.location || 'Virtual',
            comm.content || '',
            (comm.links || []).join(', ')
          ];
        });
      } else if (sheetName === CONFIG.SHEETS.TICKETS) {
        // [DateTime, Date_Display, Ticket #, Priority, Status, Description, Chat_Logs, Links]
        headers = ['DateTime', 'Date Display', 'Ticket #', 'Priority', 'Status', 'Description', 'Chat_Logs', 'Links'];
        data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          
          // Store chat logs as JSON string for dashboard parsing
          let chatLogsJSON = '[]';
          if (comm.logs && comm.logs.length > 0) {
            chatLogsJSON = JSON.stringify(comm.logs);
          }
          
          return [
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.ticketNum || 'Unknown',
            comm.priority || 'Medium',
            comm.status || 'Open',
            comm.description || '',
            chatLogsJSON,
            (comm.links || []).join(', ')
          ];
        });
      } else if (sheetName === CONFIG.SHEETS.CALENDAR) {
        // [DateTime, Date_Display, organizer, title, location, attendees, description, content, links]
        headers = ['DateTime', 'Date Display', 'Organizer', 'Title', 'Location', 'Attendees', 'Description', 'Content', 'Links'];
        data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          return [
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.organizer || 'Unknown',
            comm.title || 'Event',
            comm.location || 'Not specified',
            Array.isArray(comm.attendees) ? comm.attendees.join(', ') : (comm.attendees || ''),
            comm.description || '',
            comm.content || '',
            (comm.links || []).join(', ')
          ];
        });
      } else if (sheetName === CONFIG.SHEETS.SPECS) {
        // [DateTime, Date_Display, content, links]
        headers = ['DateTime', 'Date Display', 'Content', 'Links'];
        data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          return [
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.content || '',
            (comm.links || []).join(', ')
          ];
        });
      } else {
        // Generic format for other types
        headers = ['DateTime', 'Date Display', 'From', 'To', 'Content', 'Links'];
        data = communications.map(comm => {
          const dateTime = this.createDateTime(comm.date, comm.time);
          return [
            dateTime,
            Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'),
            comm.from || 'Unknown',
            comm.to || 'Unknown',
            comm.content || comm.messageContent || '',
            (comm.links || []).join(', ')
          ];
        });
      }
      
      // Set headers
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers with source-specific color
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground(headerColor)
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Set data
      if (data.length > 0) {
        sheet.getRange(2, 1, data.length, headers.length).setValues(data);
        
        // Format DateTime column (always column A for consistency)
        if (headers[0] === 'DateTime') {
          sheet.getRange(2, 1, data.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
        }
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Updated ${sheetName} with ${data.length} items`);
      
    } catch (error) {
      console.error(`❌ Error updating ${sheetName}: ${error.toString()}`);
    }
  }
}

// === GOOGLE APPS SCRIPT FUNCTIONS ===

// Main function to run manually or on trigger
function processProjectCommunications() {
  const integration = new GoogleSheetsIntegration();
  return integration.processAndUpdateAllSheets();
}

// Setup function to run once
function setupProjectTracker() {
  try {
    console.log('🔧 Setting up project tracker...');
    
    // Test that we can access the spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log(`✅ Connected to spreadsheet: ${ss.getName()}`);
    
    // Test that we can access the Drive folder
    const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
    if (!folders.hasNext()) {
      throw new Error(`❌ Folder '${CONFIG.DRIVE_FOLDER_NAME}' not found`);
    }
    
    console.log(`✅ Found Drive folder: ${CONFIG.DRIVE_FOLDER_NAME}`);
    
    // Run initial processing
    processProjectCommunications();
    
    console.log('🎉 Setup complete! You can now run processProjectCommunications() anytime.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.toString());
    console.log('\n📋 Setup checklist:');
    console.log('1. Update CONFIG.SPREADSHEET_ID with your Google Sheet ID');
    console.log('2. Create a Google Drive folder named "Project Communications"');
    console.log('3. Upload your .txt files to that folder');
    console.log('4. Make sure this script has permissions to access Drive and Sheets');
  }
}

// Optional: Set up automatic daily trigger
function createDailyTrigger() {
  ScriptApp.newTrigger('processProjectCommunications')
    .timeBased()
    .everyDays(1)
    .atHour(9) // 9 AM
    .create();
    
  console.log('✅ Created daily trigger for 9 AM');
}