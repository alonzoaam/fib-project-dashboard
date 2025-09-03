const fs = require('fs');
const path = require('path');

class KnowledgeBaseBuilder {
  constructor() {
    this.knowledgeBase = {
      communications: [],
      projects: new Map(),
      people: new Map(),
      keywords: new Map(),
      metadata: {
        totalProjects: 0,
        totalCommunications: 0,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Track initial configuration - the hardcoded patterns that drive the system
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
      numberPatterns: [
        'examples', 'hours', 'percentage', 'volume', 'k'
      ],
      statusKeywords: [
        'blocked', 'at risk', 'on track', 'complete', 'delayed', 'finished'
      ]
    };
  }
  
  buildFromFiles() {
    const files = [
      '../../provided materials/emails.txt',
      '../../provided materials/slack-pings.txt',
      '../../provided materials/meeting-notes.txt',
      '../../provided materials/calendar-invites.txt',
      '../../provided materials/tickets.txt',
      '../../provided materials/spec-docs.txt'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        this.processFile(content, file);
      } else {
        console.warn(`File not found: ${file}`);
      }
    });
    
    this.generateSearchIndex();
    this.saveKnowledgeBase();
  }
  
  processFile(content, fileName) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim().length === 0) return;
      
      const entry = {
        id: `${fileName}_${index + 1}`,
        line: index + 1,
        content: line.trim(),
        source: fileName,
        projects: this.extractProjects(line),
        people: this.extractPeople(line),
        numbers: this.extractNumbers(line),
        dates: this.extractDates(line),
        keywords: this.extractKeywords(line),
        type: this.detectContentType(line, fileName)
      };
      
      this.knowledgeBase.communications.push(entry);
      
      // Update aggregated data
      entry.projects.forEach(project => {
        if (!this.knowledgeBase.projects.has(project)) {
          this.knowledgeBase.projects.set(project, {
            name: project,
            mentions: 0,
            latestUpdate: null,
            status: 'unknown',
            volume: null,
            owner: null,
            dueDate: null
          });
        }
        this.knowledgeBase.projects.get(project).mentions++;
      });
      
      entry.people.forEach(person => {
        if (!this.knowledgeBase.people.has(person)) {
          this.knowledgeBase.people.set(person, {
            name: person,
            mentions: 0,
            projects: new Set(),
            roles: new Set()
          });
        }
        const personData = this.knowledgeBase.people.get(person);
        personData.mentions++;
        entry.projects.forEach(project => personData.projects.add(project));
      });
    });
  }
  
  extractProjects(line) {
    const projects = [];
    const projectPatterns = [
      /RLHF\s+Preference\s+Collection/gi,
      /RLHF\s+Dialogue\s+Data/gi,
      /RLHF\s+Safety\s+Evaluations?/gi,
      /Multimodal\s+SFT\s+Dataset?/gi,
      /Safety\s+Classifier\s+Dataset?/gi,
      /Agentic\s+Planning\s+Corpus/gi,
      /Q4\s+Safety\s+Evals?/gi,
      /RLHF/gi,
      /Safety\s+Classifier/gi,
      /Multimodal\s+SFT/gi
    ];
    
    projectPatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (!projects.includes(cleanMatch)) {
            projects.push(cleanMatch);
          }
        });
      }
    });
    
    return projects;
  }
  
  extractPeople(line) {
    const people = [];
    const namePatterns = [
      /Alex\s+Kumar?/gi,
      /Sarah\s+Miller/gi,
      /Maria\s+Santos/gi,
      /Nina\s+Patel/gi,
      /James\s+Wilson/gi,
      /Tom\s+Martinez/gi,
      /Lisa\s+Park/gi,
      /Bill\s+Wong/gi,
      /John\s+Chen/gi,
      /Eric\s+Chen/gi,
      /Maya\s+Thompson/gi,
      /Jason\s+Kim/gi
    ];
    
    namePatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (!people.includes(cleanMatch)) {
            people.push(cleanMatch);
          }
        });
      }
    });
    
    return people;
  }
  
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
        numbers.push({
          value: match[1],
          context: match[0],
          type: this.classifyNumber(match[0])
        });
      }
    });
    
    return numbers;
  }
  
  extractDates(line) {
    const dates = [];
    const datePatterns = [
      /(?:Oct|Nov|Dec)\s+\d{1,2}(?:,\s*\d{4})?/gi,
      /\d{4}-\d{2}-\d{2}/gi,
      /\d{1,2}\/\d{1,2}\/\d{4}/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => dates.push(match.trim()));
      }
    });
    
    return dates;
  }
  
  extractKeywords(line) {
    const keywords = [];
    const keywordPatterns = [
      /blocked?/gi,
      /at\s+risk/gi,
      /on\s+track/gi,
      /complete/gi,
      /deadline/gi,
      /priority/gi,
      /urgent/gi,
      /guidelines?/gi,
      /security/gi,
      /approval/gi,
      /high\s+priority/gi,
      /medium\s+priority/gi,
      /low\s+priority/gi
    ];
    
    keywordPatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.push(match.toLowerCase().trim()));
      }
    });
    
    return keywords;
  }
  
  detectContentType(line, fileName) {
    if (fileName.includes('slack')) return 'slack';
    if (fileName.includes('email')) return 'email';
    if (fileName.includes('meeting')) return 'meeting';
    if (fileName.includes('calendar')) return 'calendar';
    if (fileName.includes('ticket')) return 'ticket';
    if (fileName.includes('spec')) return 'spec';
    return 'unknown';
  }
  
  classifyNumber(context) {
    if (context.includes('example')) return 'volume';
    if (context.includes('hour')) return 'time';
    if (context.includes('%')) return 'percentage';
    if (context.includes('k') && !context.includes('example')) return 'volume';
    return 'other';
  }
  
  generateSearchIndex() {
    // Create keyword index for fast searching
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
    
    // Update metadata
    this.knowledgeBase.metadata.totalProjects = this.knowledgeBase.projectGroups.size;
    this.knowledgeBase.metadata.totalCommunications = this.knowledgeBase.communications.length;
  }
  
  groupSimilarProjects() {
    console.log('🔄 Grouping similar projects...');
    
    // Create project groups with fuzzy matching
    this.knowledgeBase.projectGroups = new Map();
    const allProjects = Array.from(this.knowledgeBase.projects.keys());
    
    // Define project grouping rules - more comprehensive grouping
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
        priority: 1 // Higher priority for broader matching
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
    
    // Group projects using priority-based fuzzy matching
    // Sort project groups by priority (lower number = higher priority)
    const sortedGroups = projectGroups.sort((a, b) => (a.priority || 3) - (b.priority || 3));
    
    allProjects.forEach(projectName => {
      const lowerProject = projectName.toLowerCase();
      let grouped = false;
      
      for (const group of sortedGroups) {
        // Check if project matches this group
        if (this.projectMatchesGroup(lowerProject, group)) {
          if (!this.knowledgeBase.projectGroups.has(group.name)) {
            this.knowledgeBase.projectGroups.set(group.name, {
              name: group.name,
              variants: [],
              mentions: [],
              totalMentions: 0,
              communications: new Map() // Use Map to avoid duplicates by line number
            });
          }
          
          const groupData = this.knowledgeBase.projectGroups.get(group.name);
          const projectData = this.knowledgeBase.projects.get(projectName);
          
          if (!groupData.variants.includes(projectName)) {
            groupData.variants.push(projectName);
          }
          groupData.totalMentions += projectData.mentions;
          
          // Find all communications mentioning this project and remove duplicates
          this.knowledgeBase.communications.forEach(comm => {
            if (comm.projects.includes(projectName)) {
              const key = `${comm.source}_${comm.line}`;
              if (!groupData.communications.has(key)) {
                groupData.communications.set(key, {
                  ...comm,
                  variant: projectName
                });
              } else {
                // If duplicate line, combine variants
                const existing = groupData.communications.get(key);
                if (!existing.allVariants) {
                  existing.allVariants = [existing.variant];
                }
                if (!existing.allVariants.includes(projectName)) {
                  existing.allVariants.push(projectName);
                }
                existing.variant = existing.allVariants.join(', ');
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
  
  projectMatchesGroup(projectName, group) {
    // Check exact name match
    if (projectName === group.name.toLowerCase()) return true;
    
    // Check aliases
    for (const alias of group.aliases) {
      if (projectName.includes(alias.toLowerCase()) || alias.toLowerCase().includes(projectName)) {
        return true;
      }
    }
    
    // Check keywords (must match at least 2 keywords for multi-keyword groups)
    const matchedKeywords = group.keywords.filter(keyword => 
      projectName.includes(keyword.toLowerCase())
    );
    
    if (group.keywords.length === 1) {
      return matchedKeywords.length >= 1;
    } else {
      return matchedKeywords.length >= 2;
    }
  }
  
  saveKnowledgeBase() {
    // Convert Maps to Objects for JSON serialization
    const output = {
      communications: this.knowledgeBase.communications,
      projects: Object.fromEntries(this.knowledgeBase.projects),
      projectGroups: Object.fromEntries(
        Array.from(this.knowledgeBase.projectGroups).map(([key, value]) => [
          key,
          {
            ...value,
            communications: Array.from(value.communications.values()) // Convert Map to Array
          }
        ])
      ),
      people: Object.fromEntries(Array.from(this.knowledgeBase.people).map(([key, value]) => [
        key,
        {
          ...value,
          projects: Array.from(value.projects),
          roles: Array.from(value.roles)
        }
      ])),
      keywords: Object.fromEntries(this.knowledgeBase.keywords),
      metadata: this.knowledgeBase.metadata,
      initialConfig: this.initialConfig // Include the initial patterns that drive the system
    };
    
    const jsContent = `window.KNOWLEDGE_BASE = ${JSON.stringify(output, null, 2)};`;
    fs.writeFileSync('knowledge_base.js', jsContent);
    
    // Also create CSV files for Google Sheets upload
    this.generateConfigCSV(output);
    this.generateInsightsCSV(output);
    
    console.log('✅ Knowledge base generated successfully!');
    console.log(`📊 Processed ${output.communications.length} communications`);
    console.log(`🏗️ Found ${Object.keys(output.projects).length} projects`);
    console.log(`👥 Identified ${Object.keys(output.people).length} people`);
  }

  generateConfigCSV(output) {
    // Create Config sheet data with all patterns and keywords
    let configCSV = 'Category,Type,Value,Description\n';
    
    // Project patterns
    this.initialConfig.projectPatterns.forEach(pattern => {
      configCSV += `"Project Patterns","Known Project","${pattern}","Predefined project name to look for"\n`;
    });
    
    // People patterns  
    this.initialConfig.peoplePatterns.forEach(pattern => {
      configCSV += `"People Patterns","Known Person","${pattern}","Predefined person name to look for"\n`;
    });
    
    // Keyword patterns
    this.initialConfig.keywordPatterns.forEach(pattern => {
      configCSV += `"Keyword Patterns","Status Keyword","${pattern}","Status and priority keywords"\n`;
    });
    
    // Client patterns (enhanced)
    const clientPatterns = [
      'OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Meta', 'Amazon', 
      'Apple', 'NVIDIA', 'Hugging Face', 'Cohere', 'Stability AI'
    ];
    clientPatterns.forEach(pattern => {
      configCSV += `"Client Patterns","Known Client","${pattern}","Potential client organization"\n`;
    });
    
    // Add discovered insights
    Object.keys(output.projects).forEach(project => {
      configCSV += `"Discovered Projects","Found Project","${project}","Project discovered from communications"\n`;
    });
    
    Object.keys(output.people).forEach(person => {
      const personData = output.people[person];
      const isClient = this.determineIfClient(person, personData);
      configCSV += `"Discovered People","${isClient ? 'Client Contact' : 'Team Member'}","${person}","Person discovered from communications"\n`;
    });
    
    fs.writeFileSync('config_upload.csv', configCSV);
    console.log('📋 Config CSV generated for Google Sheets upload');
  }

  generateInsightsCSV(output) {
    // Create Insights sheet with additional analysis
    let insightsCSV = 'Metric,Value,Details,Last_Updated\n';
    
    // Project insights
    insightsCSV += `"Total Project Groups","${Object.keys(output.projectGroups).length}","${Object.keys(output.projectGroups).join(', ')}","${new Date().toISOString()}"\n`;
    
    // Communication volume by source
    const sourceStats = {};
    output.communications.forEach(comm => {
      sourceStats[comm.source] = (sourceStats[comm.source] || 0) + 1;
    });
    
    Object.entries(sourceStats).forEach(([source, count]) => {
      insightsCSV += `"Communications from ${source}","${count}","Total messages from this source","${new Date().toISOString()}"\n`;
    });
    
    // Top mentioned projects
    const projectMentions = Object.entries(output.projectGroups)
      .sort((a, b) => b[1].totalMentions - a[1].totalMentions)
      .slice(0, 5);
    
    projectMentions.forEach(([project, data]) => {
      insightsCSV += `"Top Project: ${project}","${data.totalMentions}","Mentions across communications","${new Date().toISOString()}"\n`;
    });
    
    // People activity
    const peopleActivity = Object.entries(output.people)
      .sort((a, b) => (b[1].mentions || 0) - (a[1].mentions || 0))
      .slice(0, 10);
    
    peopleActivity.forEach(([person, data]) => {
      const isClient = this.determineIfClient(person, data);
      insightsCSV += `"${isClient ? 'Client Activity' : 'Team Activity'}: ${person}","${data.mentions || 0}","Mentions in communications","${new Date().toISOString()}"\n`;
    });
    
    // Project-Client associations
    Object.entries(output.projectGroups).forEach(([project, data]) => {
      const clients = this.extractClientsFromProject(data);
      if (clients.length > 0) {
        insightsCSV += `"Project-Client: ${project}","${clients.length}","Associated clients: ${clients.join(', ')}","${new Date().toISOString()}"\n`;
      }
    });
    
    fs.writeFileSync('insights_upload.csv', insightsCSV);
    console.log('💡 Insights CSV generated for Google Sheets upload');
  }

  determineIfClient(person, personData) {
    // Enhanced client detection logic
    const clientIndicators = [
      'client', 'customer', 'stakeholder', 'partner', 'vendor',
      'openai', 'anthropic', 'google', 'microsoft', 'meta', 'amazon'
    ];
    
    const personLower = person.toLowerCase();
    const roles = personData.roles || [];
    const projects = personData.projects || [];
    
    // Check if person name contains client indicators
    if (clientIndicators.some(indicator => personLower.includes(indicator))) {
      return true;
    }
    
    // Check roles for client indicators
    if (roles.some(role => 
      clientIndicators.some(indicator => role.toLowerCase().includes(indicator))
    )) {
      return true;
    }
    
    // Check if person is associated with external projects
    const externalProjectIndicators = ['external', 'client', 'partner'];
    if (projects.some(project => 
      externalProjectIndicators.some(indicator => project.toLowerCase().includes(indicator))
    )) {
      return true;
    }
    
    return false;
  }

  extractClientsFromProject(projectData) {
    const clients = [];
    const communications = projectData.communications || [];
    
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
}

// Run the builder
if (require.main === module) {
  const builder = new KnowledgeBaseBuilder();
  builder.buildFromFiles();
}

module.exports = KnowledgeBaseBuilder;
