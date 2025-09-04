// === KNOWLEDGE BASE BUILDER FOR GOOGLE APPS SCRIPT ===
// Builds knowledge base directly from Google Drive files and uploads to Config sheet

class GoogleAppsScriptKnowledgeBuilder {
  constructor() {
    this.knowledgeBase = {
      communications: [],
      projects: new Map(),
      people: new Map(),
      keywords: new Map(),
      projectGroups: new Map(),
      metadata: {
        totalProjects: 0,
        totalCommunications: 0,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Initial configuration patterns
    this.initialConfig = {
      projectPatterns: [
        'RLHF Preference Collection',
        'RLHF Dialogue Data', 
        'RLHF Safety Evaluations',
        'Multimodal SFT Dataset',
        'Safety Classifier Dataset',
        'Agentic Planning Corpus',
        'Q4 Safety Evaluations'
      ],
      peoplePatterns: [
        'Alex Kumar',
        'Sarah Miller',
        'Maria Santos', 
        'Nina Patel',
        'James Wilson',
        'David Chen',
        'Emily Rodriguez',
        'Michael Kim'
      ],
      keywordPatterns: [
        'blocked', 'at risk', 'on track', 'complete', 'deadline',
        'urgent', 'priority', 'examples', 'volume', 'batch'
      ],
      clientPatterns: [
        'OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Meta', 'Amazon', 
        'Apple', 'NVIDIA', 'Hugging Face', 'Cohere', 'Stability AI'
      ],
      statusKeywords: [
        'blocked', 'at risk', 'on track', 'complete', 'delayed', 'finished'
      ]
    };
  }
  
  // Main method to build knowledge base from Google Drive files
  buildFromGoogleDrive(folderName) {
    try {
      console.log('🔄 Starting knowledge base building from Google Drive...');
      
      // 1. Read files from Google Drive
      const files = this.readFilesFromDrive(folderName);
      console.log(`📁 Loaded ${Object.keys(files).length} files from Drive`);
      
      // 2. Use the SimpleCommunicationParser to properly parse communications
      const parser = new SimpleCommunicationParser();
      const parsedData = parser.parseAllFiles(files);
      
      // 3. Convert parsed communications to knowledge base format
      this.knowledgeBase.communications = parsedData.communications.map((comm, index) => ({
        id: comm.communication_id || `comm_${index}`,
        date: comm.date || 'N/A',
        source: comm.source || 'unknown',
        line: comm.originalIndex || index,
        content: comm.content || '',
        from: comm.from || '',
        to: comm.to || (Array.isArray(comm.recipients) ? comm.recipients.join(', ') : ''),
        projects: comm.projects_mentioned || [],
        people: this.extractPeopleFromComm(comm),
        actionItems: comm.action_items || [],
        links: comm.links || [],
        volumes: comm.volume_numbers || [],
        timelines: comm.timelines_mentioned || [],
        priority: comm.priority_level || 'normal',
        type: this.detectCommunicationType(comm)
      }));
      
      // 4. Build projects and people from parsed data
      this.buildProjectsFromParsed(parsedData);
      this.buildPeopleFromParsed(parsedData);
      
      // 5. Generate search index and group projects
      this.generateSearchIndex();
      
      // 6. Update metadata
      this.knowledgeBase.metadata.totalCommunications = this.knowledgeBase.communications.length;
      this.knowledgeBase.metadata.totalProjects = this.knowledgeBase.projects.size;
      this.knowledgeBase.metadata.lastUpdated = new Date().toISOString();
      
      console.log('✅ Knowledge base built successfully!');
      console.log(`📊 Processed ${this.knowledgeBase.communications.length} communications`);
      console.log(`🏗️ Found ${this.knowledgeBase.projects.size} projects`);
      console.log(`👥 Identified ${this.knowledgeBase.people.size} people`);
      
      return this.knowledgeBase;
      
    } catch (error) {
      console.error('❌ Error building knowledge base:', error.toString());
      throw error;
    }
  }
  
  // Read files from Google Drive folder in project drive
  readFilesFromDrive(folderName) {
    const files = {};
    
    try {
      // Use the project drive structure
      const projectFolder = DriveApp.getFolderById(CONFIG.PROJECT_DRIVE_ID);
      
      // Look for the ProjectCommunications folder
      const commFolders = projectFolder.getFoldersByName(folderName);
      if (!commFolders.hasNext()) {
        throw new Error(`Folder '${folderName}' not found in project drive`);
      }
      
      const folder = commFolders.next();
      const driveFiles = folder.getFiles();
      
      console.log(`📁 Reading files from ${folderName} in project drive...`);
      
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
      
      console.log(`✅ Successfully loaded ${Object.keys(files).length} files from project drive`);
      return files;
      
    } catch (error) {
      console.error('❌ Error reading files from project drive:', error.toString());
      throw error;
    }
  }
  
  // Process individual file content
  processFile(content, fileName) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim().length === 0) return;
      
      const entry = {
        id: `${fileName}_${index + 1}`,
        line: index + 1,
        source: this.detectSourceType(fileName),
        content: line.trim(),
        date: this.extractDate(line),
        projects: this.extractProjects(line),
        people: this.extractPeople(line),
        numbers: this.extractNumbers(line),
        dates: this.extractDates(line),
        keywords: this.extractKeywords(line),
        type: this.detectContentType(line, fileName)
      };
      
      this.knowledgeBase.communications.push(entry);
      
      // Update projects and people maps
      entry.projects.forEach(project => {
        if (!this.knowledgeBase.projects.has(project)) {
          this.knowledgeBase.projects.set(project, { mentions: 0, communications: [] });
        }
        this.knowledgeBase.projects.get(project).mentions++;
        this.knowledgeBase.projects.get(project).communications.push(entry.id);
      });
      
      entry.people.forEach(person => {
        if (!this.knowledgeBase.people.has(person)) {
          this.knowledgeBase.people.set(person, { 
            mentions: 0, 
            projects: new Set(), 
            roles: new Set() 
          });
        }
        this.knowledgeBase.people.get(person).mentions++;
        entry.projects.forEach(project => {
          this.knowledgeBase.people.get(person).projects.add(project);
        });
      });
    });
  }
  
  // Helper methods for the updated knowledge base building
  extractPeopleFromComm(comm) {
    const people = [];
    if (comm.from) people.push(comm.from);
    if (comm.to) {
      if (Array.isArray(comm.to)) {
        people.push(...comm.to);
      } else if (typeof comm.to === 'string') {
        people.push(...comm.to.split(',').map(p => p.trim()));
      }
    }
    if (comm.recipients && Array.isArray(comm.recipients)) {
      people.push(...comm.recipients);
    }
    return [...new Set(people.filter(p => p && p.trim() && !p.includes('@')))];
  }
  
  detectCommunicationType(comm) {
    if (comm.messageContent || comm.channel) return 'message';
    if (comm.subject) return 'email';
    if (comm.meeting) return 'meeting';
    if (comm.eventTitle) return 'calendar';
    if (comm.ticketNumber) return 'ticket';
    if (comm.documentTitle) return 'document';
    return comm.source || 'unknown';
  }
  
  buildProjectsFromParsed(parsedData) {
    parsedData.projects.forEach(projectName => {
      if (!this.knowledgeBase.projects.has(projectName)) {
        this.knowledgeBase.projects.set(projectName, { 
          mentions: 0, 
          communications: [], 
          people: new Set(),
          timeline: null,
          volume: null
        });
      }
    });
    
    // Add project mentions from communications
    this.knowledgeBase.communications.forEach(comm => {
      comm.projects.forEach(project => {
        if (this.knowledgeBase.projects.has(project)) {
          const projectData = this.knowledgeBase.projects.get(project);
          projectData.mentions++;
          projectData.communications.push(comm.id);
          comm.people.forEach(person => projectData.people.add(person));
        }
      });
    });
  }
  
  buildPeopleFromParsed(parsedData) {
    parsedData.people.forEach(personName => {
      if (!this.knowledgeBase.people.has(personName)) {
        this.knowledgeBase.people.set(personName, { 
          mentions: 0, 
          projects: new Set(), 
          roles: new Set(),
          isClient: false
        });
      }
    });
    
    // Add people mentions from communications
    this.knowledgeBase.communications.forEach(comm => {
      comm.people.forEach(person => {
        if (this.knowledgeBase.people.has(person)) {
          const personData = this.knowledgeBase.people.get(person);
          personData.mentions++;
          comm.projects.forEach(project => personData.projects.add(project));
          
          // Detect if person is a client based on communication patterns
          if (comm.content && comm.content.toLowerCase().includes('[client]')) {
            personData.isClient = true;
          }
        }
      });
    });
  }
  
  // Detect source type from filename
  detectSourceType(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('slack')) return 'slack';
    if (name.includes('email')) return 'email';
    if (name.includes('meeting')) return 'meeting';
    if (name.includes('calendar')) return 'calendar';
    if (name.includes('spec')) return 'spec';
    if (name.includes('ticket')) return 'ticket';
    return 'unknown';
  }
  
  // Extract date from line content
  extractDate(line) {
    const datePatterns = [
      /(?:Oct|Nov|Dec)\s+\d{1,2}(?:,\s*\d{4})?/gi,
      /\d{4}-\d{2}-\d{2}/gi,
      /\d{1,2}\/\d{1,2}\/\d{4}/gi
    ];
    
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return new Date().toISOString().split('T')[0];
  }
  
  // Extract projects using configured patterns
  extractProjects(line) {
    const projects = [];
    const projectPatterns = this.initialConfig.projectPatterns;
    
    projectPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.replace(/\s+/g, '\\s+'), 'gi');
      if (regex.test(line)) {
        projects.push(pattern);
      }
    });
    
    return [...new Set(projects)];
  }
  
  // Extract people using configured patterns and [Client] indicators
  extractPeople(line) {
    const people = [];
    
    // First, extract people using configured patterns
    const peoplePatterns = this.initialConfig.peoplePatterns;
    peoplePatterns.forEach(pattern => {
      const regex = new RegExp(pattern.replace(/\s+/g, '\\s+'), 'gi');
      if (regex.test(line)) {
        people.push(pattern);
      }
    });
    
    // Second, look for [Client] indicators and extract names
    const clientRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\[Client\]/gi;
    let match;
    while ((match = clientRegex.exec(line)) !== null) {
      const clientName = match[1].trim() + ' [Client]';
      people.push(clientName);
    }
    
    // Third, look for general name patterns (First Last format)
    const nameRegex = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
    while ((match = nameRegex.exec(line)) !== null) {
      const name = match[1].trim();
      // Only add if not already captured and looks like a person name
      if (!people.some(p => p.includes(name)) && this.looksLikePersonName(name)) {
        people.push(name);
      }
    }
    
    return [...new Set(people)];
  }
  
  // Helper to determine if a name looks like a person name
  looksLikePersonName(name) {
    // Avoid common false positives
    const nonNames = [
      'Google Drive', 'Google Sheets', 'Project Manager', 'Data Science', 
      'Machine Learning', 'Open AI', 'Safety Classifier', 'RLHF Project'
    ];
    
    if (nonNames.some(nonName => name.includes(nonName))) {
      return false;
    }
    
    // Check if it follows typical name patterns
    const parts = name.split(' ');
    if (parts.length === 2 && parts.every(part => part.length >= 2 && part.length <= 15)) {
      return true;
    }
    
    return false;
  }
  
  // Extract numbers (volumes, percentages, etc.)
  extractNumbers(line) {
    const numbers = [];
    const numberPatterns = [
      /(\d+(?:,\d+)*)\s*k?\s*examples?/gi,
      /(\d+)\s*hours?/gi,
      /(\d+)%/gi,
      /(\d+(?:,\d+)*k)/gi
    ];
    
    numberPatterns.forEach(pattern => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        numbers.push(match[1]);
      }
    });
    
    return numbers;
  }
  
  // Extract dates from content
  extractDates(line) {
    const dates = [];
    const datePatterns = [
      /(?:Oct|Nov|Dec)\s+\d{1,2}(?:,\s*\d{4})?/gi,
      /\d{4}-\d{2}-\d{2}/gi,
      /\d{1,2}\/\d{1,2}\/\d{4}/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        dates.push(match[0]);
      }
    });
    
    return dates;
  }
  
  // Extract keywords using configured patterns
  extractKeywords(line) {
    const keywords = [];
    const keywordPatterns = this.initialConfig.keywordPatterns;
    
    keywordPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      if (regex.test(line)) {
        keywords.push(pattern.toLowerCase());
      }
    });
    
    return keywords;
  }
  
  // Detect content type
  detectContentType(line, fileName) {
    if (fileName.includes('slack')) return 'slack';
    if (fileName.includes('email')) return 'email';
    if (fileName.includes('meeting')) return 'meeting';
    if (fileName.includes('calendar')) return 'calendar';
    if (fileName.includes('spec')) return 'spec';
    if (fileName.includes('ticket')) return 'ticket';
    return 'general';
  }
  
  // Generate search index and group similar projects
  generateSearchIndex() {
    console.log('🔄 Generating search index and grouping projects...');
    
    // Create keyword index
    this.knowledgeBase.communications.forEach(entry => {
      const words = entry.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 2) {
          if (!this.knowledgeBase.keywords.has(cleanWord)) {
            this.knowledgeBase.keywords.set(cleanWord, []);
          }
          this.knowledgeBase.keywords.get(cleanWord).push(entry.id);
        }
      });
    });
    
    // Group similar projects
    this.groupSimilarProjects();
  }
  
  // Group similar projects
  groupSimilarProjects() {
    console.log('🔄 Grouping similar projects...');
    this.knowledgeBase.projectGroups = new Map();
    const allProjects = Array.from(this.knowledgeBase.projects.keys());
    
    // Define project grouping rules
    const projectGroups = [
      {
        name: 'RLHF Projects',
        aliases: [
          'RLHF Preference Collection', 'RLHF Preference', 'preference collection', 'rlhf preference',
          'RLHF Dialogue Data', 'RLHF Dialogue', 'dialogue data', 'rlhf dialogue',
          'RLHF Safety Evaluations', 'RLHF Safety', 'rlhf safety', 'rlhf safety evals',
          'RLHF', 'rlhf'
        ],
        keywords: ['rlhf'],
        priority: 1
      },
      {
        name: 'Safety Classifier Dataset',
        aliases: ['Safety Classifier', 'safety classifier dataset', 'classifier', 'safety classifier'],
        keywords: ['safety', 'classifier'],
        priority: 2
      },
      {
        name: 'Multimodal SFT Dataset',
        aliases: ['Multimodal SFT', 'multimodal dataset', 'mm sft', 'multimodal sft'],
        keywords: ['multimodal', 'sft'],
        priority: 2
      },
      {
        name: 'Agentic Planning Corpus',
        aliases: ['Agentic Planning', 'planning corpus', 'agent planning', 'agentic planning'],
        keywords: ['agentic', 'planning'],
        priority: 2
      },
      {
        name: 'Q4 Safety Evaluations',
        aliases: ['Q4 Safety', 'q4 evals', 'quarterly safety', 'q4 safety evals'],
        keywords: ['q4', 'safety', 'eval'],
        priority: 2
      }
    ];
    
    // Sort by priority
    const sortedGroups = projectGroups.sort((a, b) => (a.priority || 3) - (b.priority || 3));
    
    allProjects.forEach(projectName => {
      const lowerProject = projectName.toLowerCase();
      let grouped = false;
      
      for (const group of sortedGroups) {
        if (this.projectMatchesGroup(lowerProject, group)) {
          if (!this.knowledgeBase.projectGroups.has(group.name)) {
            this.knowledgeBase.projectGroups.set(group.name, {
              name: group.name,
              variants: [],
              mentions: [],
              totalMentions: 0,
              communications: new Map()
            });
          }
          
          const groupData = this.knowledgeBase.projectGroups.get(group.name);
          const projectData = this.knowledgeBase.projects.get(projectName);
          
          if (!groupData.variants.includes(projectName)) {
            groupData.variants.push(projectName);
          }
          groupData.totalMentions += projectData.mentions;
          
          // Add communications without duplicates
          this.knowledgeBase.communications.forEach(comm => {
            if (comm.projects.includes(projectName)) {
              const key = `${comm.source}_${comm.line}`;
              if (!groupData.communications.has(key)) {
                groupData.communications.set(key, {
                  ...comm,
                  variant: projectName
                });
              }
            }
          });
          
          grouped = true;
          break;
        }
      }
      
      // If no group found, create individual group
      if (!grouped) {
        const commMap = new Map();
        this.knowledgeBase.communications.forEach(comm => {
          if (comm.projects.includes(projectName)) {
            const key = `${comm.source}_${comm.line}`;
            commMap.set(key, {...comm, variant: projectName});
          }
        });
        
        this.knowledgeBase.projectGroups.set(projectName, {
          name: projectName,
          variants: [projectName],
          mentions: [],
          totalMentions: this.knowledgeBase.projects.get(projectName).mentions,
          communications: commMap
        });
      }
    });
    
    console.log(`📊 Grouped ${allProjects.length} projects into ${this.knowledgeBase.projectGroups.size} groups`);
  }
  
  // Check if project matches a group
  projectMatchesGroup(projectName, group) {
    // Check aliases
    if (group.aliases && group.aliases.some(alias => 
      projectName.includes(alias.toLowerCase()) || alias.toLowerCase().includes(projectName)
    )) {
      return true;
    }
    
    // Check keywords
    if (group.keywords) {
      const matchedKeywords = group.keywords.filter(keyword => 
        projectName.includes(keyword.toLowerCase())
      );
      
      if (group.keywords.length === 1) {
        return matchedKeywords.length >= 1;
      } else {
        return matchedKeywords.length >= 2;
      }
    }
    
    return false;
  }
  
  // Upload Config data to Google Sheets
  uploadConfigToSheet(spreadsheet) {
    try {
      console.log('📋 Uploading Config data to Google Sheets...');
      
      const sheetName = 'Config';
      let sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
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
      
      // Prepare config data
      const configData = [];
      
      // Project patterns
      this.initialConfig.projectPatterns.forEach(pattern => {
        configData.push(['Project Patterns', 'Known Project', pattern, 'Predefined project name to look for']);
      });
      
      // People patterns  
      this.initialConfig.peoplePatterns.forEach(pattern => {
        configData.push(['People Patterns', 'Known Person', pattern, 'Predefined person name to look for']);
      });
      
      // Keyword patterns
      this.initialConfig.keywordPatterns.forEach(pattern => {
        configData.push(['Keyword Patterns', 'Status Keyword', pattern, 'Status and priority keywords']);
      });
      
      // Client patterns
      this.initialConfig.clientPatterns.forEach(pattern => {
        configData.push(['Client Patterns', 'Known Client', pattern, 'Potential client organization']);
      });
      
      // Add discovered projects
      Array.from(this.knowledgeBase.projects.keys()).forEach(project => {
        configData.push(['Discovered Projects', 'Found Project', project, 'Project discovered from communications']);
      });
      
      // Add discovered people with client detection
      Array.from(this.knowledgeBase.people.keys()).forEach(person => {
        const personData = this.knowledgeBase.people.get(person);
        const isClient = this.determineIfClient(person, personData);
        configData.push(['Discovered People', isClient ? 'Client Contact' : 'Team Member', person, 'Person discovered from communications']);
      });
      
      // Write data to sheet
      if (configData.length > 0) {
        sheet.getRange(2, 1, configData.length, 4).setValues(configData);
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Uploaded ${configData.length} config entries to Config sheet`);
      
    } catch (error) {
      console.error('❌ Error uploading Config data:', error.toString());
      throw error;
    }
  }
  
  // Upload Insights data to Google Sheets
  uploadInsightsToSheet(spreadsheet) {
    try {
      console.log('💡 Uploading Insights data to Google Sheets...');
      
      const sheetName = 'Insights';
      let sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
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
      
      // Prepare insights data
      const insightsData = [];
      const now = new Date().toISOString();
      
      // Project insights
      insightsData.push(['Total Project Groups', this.knowledgeBase.projectGroups.size, Array.from(this.knowledgeBase.projectGroups.keys()).join(', '), now]);
      
      // Communication volume by source
      const sourceStats = {};
      this.knowledgeBase.communications.forEach(comm => {
        sourceStats[comm.source] = (sourceStats[comm.source] || 0) + 1;
      });
      
      Object.entries(sourceStats).forEach(([source, count]) => {
        insightsData.push([`Communications from ${source}`, count, 'Total messages from this source', now]);
      });
      
      // Top mentioned projects
      const projectMentions = Array.from(this.knowledgeBase.projectGroups.entries())
        .sort((a, b) => b[1].totalMentions - a[1].totalMentions)
        .slice(0, 5);
      
      projectMentions.forEach(([project, data]) => {
        insightsData.push([`Top Project: ${project}`, data.totalMentions, 'Mentions across communications', now]);
      });
      
      // People activity
      const peopleActivity = Array.from(this.knowledgeBase.people.entries())
        .sort((a, b) => (b[1].mentions || 0) - (a[1].mentions || 0))
        .slice(0, 10);
      
      peopleActivity.forEach(([person, data]) => {
        const isClient = this.determineIfClient(person, data);
        insightsData.push([`${isClient ? 'Client Activity' : 'Team Activity'}: ${person}`, data.mentions || 0, 'Mentions in communications', now]);
      });
      
      // Project-Client associations
      Array.from(this.knowledgeBase.projectGroups.entries()).forEach(([project, data]) => {
        const clients = this.extractClientsFromProject(data);
        if (clients.length > 0) {
          insightsData.push([`Project-Client: ${project}`, clients.length, `Associated clients: ${clients.join(', ')}`, now]);
        }
      });
      
      // Write data to sheet
      if (insightsData.length > 0) {
        sheet.getRange(2, 1, insightsData.length, 4).setValues(insightsData);
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
      
      console.log(`✅ Uploaded ${insightsData.length} insights to Insights sheet`);
      
    } catch (error) {
      console.error('❌ Error uploading Insights data:', error.toString());
      throw error;
    }
  }
  
  // Determine if person is likely a client
  determineIfClient(person, personData) {
    const personLower = person.toLowerCase();
    
    // PRIMARY: Check for [Client] indicator in name
    if (person.includes('[Client]') || person.includes('[client]')) {
      return true;
    }
    
    // SECONDARY: Check communications for client context
    let hasClientContext = false;
    this.knowledgeBase.communications.forEach(comm => {
      if (comm.people.includes(person)) {
        const content = comm.content.toLowerCase();
        // Look for [Client] in the same communication
        if (content.includes('[client]') && content.includes(personLower)) {
          hasClientContext = true;
        }
        // Look for client indicators in context
        if (content.includes('client') || content.includes('customer') || content.includes('stakeholder')) {
          if (content.includes(personLower)) {
            hasClientContext = true;
          }
        }
      }
    });
    
    if (hasClientContext) return true;
    
    // TERTIARY: Check for known client organizations
    const clientOrgs = ['openai', 'anthropic', 'google', 'microsoft', 'meta', 'amazon'];
    if (clientOrgs.some(org => personLower.includes(org))) {
      return true;
    }
    
    // QUATERNARY: Check if person is associated with external projects
    const projects = Array.from(personData.projects || []);
    const externalProjectIndicators = ['external', 'client', 'partner'];
    if (projects.some(project => 
      externalProjectIndicators.some(indicator => project.toLowerCase().includes(indicator))
    )) {
      return true;
    }
    
    return false;
  }
  
  // Extract clients from project data
  extractClientsFromProject(projectData) {
    const clients = [];
    const communications = Array.from(projectData.communications.values());
    
    communications.forEach(comm => {
      if (comm.people) {
        comm.people.forEach(person => {
          // Simple heuristic: if person appears in external-facing communications
          if (comm.source === 'email' || comm.source === 'calendar') {
            if (!clients.includes(person)) {
              clients.push(person);
            }
          }
        });
      }
    });
    
    return clients;
  }
  
  // NEW: Publish knowledge base to cloud API endpoints
  publishToCloudAPI(knowledgeBase) {
    try {
      console.log('☁️ Publishing knowledge base to cloud API...');
      
      // Convert Maps to Objects for JSON serialization
      const serializedKB = {
        projects: Object.fromEntries(this.knowledgeBase.projects),
        people: Object.fromEntries(this.knowledgeBase.people),
        keywords: Object.fromEntries(this.knowledgeBase.keywords),
        communications: this.knowledgeBase.communications,
        projectGroups: Object.fromEntries(
          Array.from(this.knowledgeBase.projectGroups.entries()).map(([key, value]) => [
            key,
            {
              ...value,
              communications: Array.from(value.communications.values())
            }
          ])
        ),
        initialConfig: this.initialConfig,
        metadata: {
          ...this.knowledgeBase.metadata,
          buildDate: new Date().toISOString(),
          version: this.generateVersion()
        }
      };
      
      // API endpoints to publish to
      const endpoints = [
        {
          url: CONFIG.API_ENDPOINTS?.PRIMARY || 'https://fib-project-dashboard.vercel.app/api/knowledge-base',
          name: 'Primary API'
        }
      ];
      
      // Only add backup API if it's properly configured
      if (CONFIG.API_ENDPOINTS?.BACKUP && !CONFIG.API_ENDPOINTS.BACKUP.includes('SCRIPT_ID')) {
        endpoints.push({
          url: CONFIG.API_ENDPOINTS.BACKUP,
          name: 'Backup API'
        });
      }
      
      const publishResults = [];
      
      for (const endpoint of endpoints) {
        try {
          const result = this.publishToEndpoint(endpoint.url, serializedKB);
          publishResults.push({
            endpoint: endpoint.name,
            success: true,
            url: endpoint.url,
            response: result
          });
          console.log(`✅ Successfully published to ${endpoint.name}: ${endpoint.url}`);
        } catch (error) {
          publishResults.push({
            endpoint: endpoint.name,
            success: false,
            url: endpoint.url,
            error: error.message
          });
          console.error(`❌ Failed to publish to ${endpoint.name}: ${error.message}`);
        }
      }
      
      // Log results
      const successCount = publishResults.filter(r => r.success).length;
      console.log(`📊 Published to ${successCount}/${endpoints.length} endpoints successfully`);
      
      if (successCount === 0) {
        console.warn('⚠️ Warning: Failed to publish to any API endpoints, but continuing...');
        console.log('💡 The knowledge base is still available in Google Sheets');
        return 'https://fib-project-dashboard.vercel.app'; // Return default URL
      }
      
      // Return the primary endpoint URL for dashboard access
      return endpoints[0].url.replace('/api/knowledge-base', '');
      
    } catch (error) {
      console.error('❌ Error publishing to cloud API:', error.message);
      console.log('💡 Continuing without API publishing - knowledge base available in Google Sheets');
      return 'https://fib-project-dashboard.vercel.app'; // Don't throw, just return default
    }
  }
  
  // Helper: Publish to a specific endpoint
  publishToEndpoint(url, data) {
    console.log(`🌐 Attempting to publish to: ${url}`);
    
    const payload = {
      data: data,
      timestamp: new Date().toISOString(),
      version: this.generateVersion(),
      source: 'google-apps-script'
    };
    
    const options = {
      method: 'POST', // Changed from PUT to POST - more common for APIs
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (CONFIG.API_SECRET_KEY || 'fibonacci-secret-2025')
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // This prevents throwing errors on non-200 responses
    };
    
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      console.log(`📡 Response from ${url}: ${responseCode}`);
      console.log(`📄 Response body preview: ${responseText.substring(0, 200)}...`);
      
      if (responseCode >= 200 && responseCode < 300) {
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.log(`⚠️ Response not JSON, returning raw text: ${responseText}`);
          return { success: true, raw: responseText };
        }
      } else {
        throw new Error(`HTTP ${responseCode}: ${responseText}`);
      }
    } catch (fetchError) {
      console.error(`❌ Network error publishing to ${url}:`, fetchError.message);
      throw new Error(`Network error: ${fetchError.message}`);
    }
  }
  
  // Helper: Generate version number
  generateVersion() {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // NEW: Update existing knowledge_base.js file in project drive
  saveKnowledgeBaseToDrive() {
    try {
      console.log('💾 Updating knowledge base file in project drive...');
      
      // Convert Maps to Objects for JSON serialization
      const serializedKB = {
        projects: Object.fromEntries(this.knowledgeBase.projects),
        people: Object.fromEntries(this.knowledgeBase.people),
        keywords: Object.fromEntries(this.knowledgeBase.keywords),
        communications: this.knowledgeBase.communications,
        projectGroups: Object.fromEntries(
          Array.from(this.knowledgeBase.projectGroups.entries()).map(([key, value]) => [
            key,
            {
              ...value,
              communications: Array.from(value.communications.values())
            }
          ])
        ),
        initialConfig: this.initialConfig,
        metadata: {
          ...this.knowledgeBase.metadata,
          buildDate: new Date().toISOString()
        }
      };
      
      // Create the knowledge base JavaScript file content
      const knowledgeBaseContent = `// Knowledge Base - Generated ${new Date().toISOString()}
// This file contains parsed communication data for the Fibonacci Project Dashboard

window.KNOWLEDGE_BASE = ${JSON.stringify(serializedKB, null, 2)};

console.log('📚 Knowledge Base loaded:', window.KNOWLEDGE_BASE);
`;
      
      // Update existing knowledge_base.js in src/dashboard/
      const knowledgeBaseFile = this.findFileInProjectDrive('knowledge_base.js', 'src/dashboard');
      if (knowledgeBaseFile) {
        knowledgeBaseFile.setContent(knowledgeBaseContent);
        console.log('✅ Updated knowledge_base.js in src/dashboard/');
      } else {
        console.warn('⚠️ knowledge_base.js not found in src/dashboard/ - please create it first');
      }
      
      return serializedKB;
      
    } catch (error) {
      console.error('❌ Error updating knowledge base file:', error);
      throw error;
    }
  }
  
  // NEW: Update existing index.html file in project drive
  generateDashboardToDrive() {
    try {
      console.log('🎨 Updating dashboard HTML in project drive...');
      
      // First, get the existing index.html content or use template
      let dashboardHTML;
      const existingIndexFile = this.findFileInProjectDrive('index.html', 'src/dashboard');
      
      if (existingIndexFile) {
        dashboardHTML = existingIndexFile.getBlob().getDataAsString();
        console.log('📄 Using existing index.html from src/dashboard/');
      } else {
        dashboardHTML = this.getDashboardTemplate();
        console.log('📄 Using built-in dashboard template');
      }
      
      // Convert Maps to Objects for embedding
      const serializedKB = {
        projects: Object.fromEntries(this.knowledgeBase.projects),
        people: Object.fromEntries(this.knowledgeBase.people),
        keywords: Object.fromEntries(this.knowledgeBase.keywords),
        communications: this.knowledgeBase.communications,
        projectGroups: Object.fromEntries(
          Array.from(this.knowledgeBase.projectGroups.entries()).map(([key, value]) => [
            key,
            {
              ...value,
              communications: Array.from(value.communications.values())
            }
          ])
        ),
        initialConfig: this.initialConfig,
        metadata: {
          ...this.knowledgeBase.metadata,
          buildDate: new Date().toISOString()
        }
      };
      
      // Update the knowledge base data in the HTML
      // Look for existing embedded knowledge base or script tag
      let updatedHTML;
      
      if (dashboardHTML.includes('window.KNOWLEDGE_BASE = ')) {
        // Replace existing embedded knowledge base
        updatedHTML = dashboardHTML.replace(
          /window\.KNOWLEDGE_BASE = [\s\S]*?(?=<\/script>)/,
          `window.KNOWLEDGE_BASE = ${JSON.stringify(serializedKB, null, 2)};

console.log('📚 Knowledge Base loaded:', window.KNOWLEDGE_BASE);`
        );
        console.log('🔄 Updated existing embedded knowledge base');
      } else if (dashboardHTML.includes('<script src="knowledge_base.js"></script>')) {
        // Replace script tag with embedded knowledge base
        updatedHTML = dashboardHTML.replace(
          '<script src="knowledge_base.js"></script>',
          `<script>
// Embedded Knowledge Base - Generated ${new Date().toISOString()}
window.KNOWLEDGE_BASE = ${JSON.stringify(serializedKB, null, 2)};

console.log('📚 Knowledge Base loaded:', window.KNOWLEDGE_BASE);
</script>`
        );
        console.log('🔄 Replaced script tag with embedded knowledge base');
      } else {
        // Add knowledge base before closing </body> tag
        updatedHTML = dashboardHTML.replace(
          '</body>',
          `<script>
// Embedded Knowledge Base - Generated ${new Date().toISOString()}
window.KNOWLEDGE_BASE = ${JSON.stringify(serializedKB, null, 2)};

console.log('📚 Knowledge Base loaded:', window.KNOWLEDGE_BASE);
</script>
</body>`
        );
        console.log('➕ Added new embedded knowledge base');
      }
      
      // Update the existing index.html file
      if (existingIndexFile) {
        existingIndexFile.setContent(updatedHTML);
        console.log('✅ Updated existing index.html in src/dashboard/');
        
        // Get shareable link to the file
        const fileUrl = existingIndexFile.getUrl();
        console.log('🔗 Dashboard URL:', fileUrl);
        return fileUrl;
      } else {
        console.warn('⚠️ index.html not found in src/dashboard/ - please create it first');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error updating dashboard file:', error);
      throw error;
    }
  }
  
  // Helper: Find file in project drive by path
  findFileInProjectDrive(fileName, relativePath) {
    try {
      // Project drive root folder ID from CONFIG
      const PROJECT_DRIVE_ID = CONFIG.PROJECT_DRIVE_ID;
      
      // Get the project drive folder
      const projectFolder = DriveApp.getFolderById(PROJECT_DRIVE_ID);
      
      // Navigate to the specified path (e.g., 'src/dashboard')
      let currentFolder = projectFolder;
      const pathParts = relativePath.split('/').filter(part => part.length > 0);
      
      for (const part of pathParts) {
        const subFolders = currentFolder.getFoldersByName(part);
        if (subFolders.hasNext()) {
          currentFolder = subFolders.next();
        } else {
          console.warn(`⚠️ Folder '${part}' not found in path '${relativePath}'`);
          return null;
        }
      }
      
      // Look for the file in the final folder
      const files = currentFolder.getFilesByName(fileName);
      if (files.hasNext()) {
        const file = files.next();
        console.log(`✅ Found ${fileName} in ${relativePath}`);
        return file;
      } else {
        console.warn(`⚠️ File '${fileName}' not found in '${relativePath}'`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error finding file ${fileName} in ${relativePath}:`, error);
      return null;
    }
  }
  
  // Helper: Get dashboard HTML template
  getDashboardTemplate() {
    // Try to find the dashboard template in Google Drive first
    try {
      const templateFiles = DriveApp.getFilesByName('improved_dashboard_template.html');
      if (templateFiles.hasNext()) {
        const templateFile = templateFiles.next();
        const content = templateFile.getBlob().getDataAsString();
        console.log('📄 Using dashboard template from Google Drive');
        return content;
      }
    } catch (error) {
      console.warn('⚠️ Dashboard template not found in Drive, using built-in template');
    }
    
    // Fallback: use the template from the separate file
    // Note: In Google Apps Script, you'd need to include the template function
    if (typeof getDashboardHTMLTemplate === 'function') {
      console.log('📄 Using built-in dashboard template');
      return getDashboardHTMLTemplate();
    }
    
    // Final fallback: basic template
    console.warn('⚠️ Using minimal fallback template');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔬 Fibonacci Project Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .tab-container { margin-bottom: 20px; }
        .tab-button { padding: 10px 20px; margin-right: 10px; background: #f0f0f0; border: 1px solid #ddd; cursor: pointer; }
        .tab-button.active { background: #007bff; color: white; }
        .tab-content { display: none; padding: 20px; border: 1px solid #ddd; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <h1>🔬 Fibonacci Project Dashboard</h1>
    <p>Generated: <span id="buildDate"></span></p>
    
    <div class="tab-container">
        <button class="tab-button active" onclick="showTab('project-overview')">Project Overview</button>
        <button class="tab-button" onclick="showTab('people-resources')">People & Resources</button>
        <button class="tab-button" onclick="showTab('communications')">Communications</button>
        <button class="tab-button" onclick="showTab('ai-assistant')">AI Assistant</button>
    </div>
    
    <div id="project-overview" class="tab-content active">
        <h2>📊 Project Overview</h2>
        <div id="project-groups"></div>
    </div>
    
    <div id="people-resources" class="tab-content">
        <h2>👥 People & Resources</h2>
        <div id="people-list"></div>
    </div>
    
    <div id="communications" class="tab-content">
        <h2>📋 Communications</h2>
        <div id="communications-list"></div>
    </div>
    
    <div id="ai-assistant" class="tab-content">
        <h2>🤖 AI Assistant</h2>
        <p>Knowledge base loaded successfully.</p>
    </div>
    
    <script src="knowledge_base.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.KNOWLEDGE_BASE) {
                document.getElementById('buildDate').textContent = new Date().toLocaleString();
                console.log('Dashboard loaded with knowledge base');
            }
        });
        
        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }
}

// Function to be called from the main Google Apps Script
function buildAndUploadKnowledgeBase() {
  try {
    console.log('🚀 Starting integrated knowledge base building and upload...');
    
    // Get spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Create knowledge base builder
    const builder = new GoogleAppsScriptKnowledgeBuilder();
    
    // Build knowledge base from Google Drive
    const knowledgeBase = builder.buildFromGoogleDrive(CONFIG.DRIVE_FOLDER_NAME);
    
    // Upload Config and Insights to Google Sheets
    builder.uploadConfigToSheet(ss);
    builder.uploadInsightsToSheet(ss);
    
    // NEW: Publish knowledge base to cloud API
    const apiUrl = builder.publishToCloudAPI(knowledgeBase);
    
    // Optional: Still save to drive as backup
    if (CONFIG.ENABLE_DRIVE_BACKUP) {
      builder.saveKnowledgeBaseToDrive();
    }
    
    console.log('🎉 Knowledge base building and upload completed successfully!');
    const dashboardUrl = CONFIG.API_ENDPOINTS?.PRIMARY || 'https://fib-project-dashboard.vercel.app';
    console.log('🌐 Dashboard available at:', dashboardUrl);
    return knowledgeBase;
    
  } catch (error) {
    console.error('❌ Error in buildAndUploadKnowledgeBase:', error.toString());
    throw error;
  }
}
