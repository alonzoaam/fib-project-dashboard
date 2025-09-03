// === PROJECT ROLLUP MODULE ===
// Consolidates parsed communications into canonical project records

class ProjectRollup {
  constructor(communications, projectDict = {}) {
    this.comms = communications || [];
    this.projectDict = projectDict;
    this.projects = {};
  }

  // Use dynamic project dictionary to map project names
  normalizeProjectName(rawName) {
    if (!rawName) return "General";
    
    // Try to map to canonical project using project dictionary
    for (let key in this.projectDict) {
      const variants = this.projectDict[key].variants || [];
      if (variants.some(v => rawName.toLowerCase().includes(v.toLowerCase()))) {
        return this.projectDict[key].canonicalName;
      }
    }
    
    // Fallback to original name if no match found
    return rawName.trim();
  }

  // Enhanced aggregate method to extract comprehensive project details
  aggregate() {
    // First, find all project mentions and associated data
    this.extractProjectDetails();
    
    // Then aggregate and analyze the data
    return this.buildProjectDashboard();
  }

  extractProjectDetails() {
    this.comms.forEach(comm => {
      const content = this.getAllTextContent(comm);
      
      // Try to match against known projects from dictionary
      for (let key in this.projectDict) {
        const variants = this.projectDict[key].variants || [];
        
        if (variants.some(v => content.toLowerCase().includes(v.toLowerCase()))) {
          const canonical = this.projectDict[key].canonicalName;
          this.addProjectData(canonical, comm, content);
        }
      }
      
      // Also extract any explicit project mentions with details
      this.extractExplicitProjectMentions(comm, content);
    });
  }

  getAllTextContent(comm) {
    return [
      comm.content, comm.body, comm.subject, comm.title, 
      comm.Content, comm.Subject, comm['Message Content'], 
      comm.description, comm.messageContent
    ].filter(Boolean).join(' ');
  }

  addProjectData(projectName, comm, content) {
    if (!this.projects[projectName]) {
      this.projects[projectName] = {
        name: projectName,
        status: 'Unknown',
        volume: 0,
        volumeUnit: 'examples',
        targetDates: [],
        owners: new Set(),
        clients: new Set(),
        priority: 'Medium',
        health: 3,
        sources: [],
        blockers: [],
        risks: [],
        notes: []
      };
    }
    
    const proj = this.projects[projectName];
    proj.sources.push(comm);
    
    // Extract volume information
    this.extractVolumeInfo(content, proj);
    
    // Extract dates and deadlines
    this.extractDates(content, proj);
    
    // Extract people (owners, clients, assignees)
    this.extractPeople(comm, content, proj);
    
    // Extract status and priority
    this.extractStatusAndPriority(content, proj);
    
    // Extract blockers and risks
    this.extractBlockersAndRisks(content, proj);
    
    // Extract action items and notes
    this.extractNotesAndActions(comm, proj);
  }

  extractVolumeInfo(content, proj) {
    const volumePatterns = [
      /(\d+(?:\.\d+)?)\s*k\s+examples?/gi,
      /(\d+(?:\.\d+)?)\s*k\s+volume/gi,
      /(\d+(?:,\d{3})*)\s+examples?/gi,
      /volume:\s*(\d+(?:\.\d+)?k?)/gi,
      /target:\s*(\d+(?:\.\d+)?k?)\s+examples?/gi
    ];
    
    volumePatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        let volume = parseFloat(match[1]);
        if (match[0].includes('k') && volume < 1000) {
          volume = volume * 1000;
        }
        if (volume > proj.volume) {
          proj.volume = volume;
        }
      }
    });
  }

  extractDates(content, proj) {
    const datePatterns = [
      /(?:due|target|deadline|delivery):\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/gi,
      /(?:by|before)\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/gi,
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi
    ];
    
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        proj.targetDates.push(match[1]);
      }
    });
  }

  extractPeople(comm, content, proj) {
    // Add communication participants
    if (comm.from) {
      const cleanName = this.cleanPersonName(comm.from);
      if (cleanName) proj.owners.add(cleanName);
    }
    
    // Extract explicit assignments and ownership
    const peoplePatterns = [
      /(?:owner|assigned to|responsible):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /(?:client|customer|stakeholder):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:will|is)\s+(?:handle|handling|responsible|owning)/gi
    ];
    
    peoplePatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const cleanName = this.cleanPersonName(match[1]);
        if (cleanName) {
          if (index === 1) { // client pattern
            proj.clients.add(cleanName);
          } else {
            proj.owners.add(cleanName);
          }
        }
      }
    });
  }

  extractStatusAndPriority(content, proj) {
    // Status detection
    const statusPatterns = [
      { pattern: /(?:blocked|blocker|can't proceed|stuck)/gi, status: 'Blocked' },
      { pattern: /(?:at risk|behind|concern|delay)/gi, status: 'At Risk' },
      { pattern: /(?:on track|progressing|good|normal)/gi, status: 'On Track' },
      { pattern: /(?:complete|done|finished|delivered)/gi, status: 'Complete' }
    ];
    
    statusPatterns.forEach(({ pattern, status }) => {
      if (pattern.test(content)) {
        proj.status = status;
      }
    });
    
    // Priority detection
    if (/high\s+priority|urgent|critical/gi.test(content)) {
      proj.priority = 'High';
    } else if (/low\s+priority|nice\s+to\s+have/gi.test(content)) {
      proj.priority = 'Low';
    }
  }

  extractBlockersAndRisks(content, proj) {
    const blockerPatterns = [
      /blocked\s+(?:by|on)\s+([^.!?]+)/gi,
      /(?:blocker|issue):\s*([^.!?]+)/gi,
      /can't\s+proceed\s+(?:because|due to)\s+([^.!?]+)/gi
    ];
    
    blockerPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        proj.blockers.push(match[1].trim());
      }
    });
  }

  extractNotesAndActions(comm, proj) {
    if (comm.action_items) {
      const actions = Array.isArray(comm.action_items) ? comm.action_items : [comm.action_items];
      proj.notes.push(...actions);
    }
  }

  cleanPersonName(name) {
    if (!name) return null;
    return name
      .replace(/@.*$/, '') // Remove email domain
      .replace(/[<>()]/g, '') // Remove brackets
      .trim();
  }

  extractExplicitProjectMentions(comm, content) {
    // Look for explicit project declarations with details
    const explicitPatterns = [
      /(?:Project|Working on)\s+([A-Z][\w\s]+?)(?:\s*[:\-–]\s*(.+?))?(?=\.|$)/gi
    ];
    
    explicitPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const projectName = this.cleanProjectMention(match[1]);
        if (projectName && projectName.length > 3) {
          this.addProjectData(projectName, comm, content);
        }
      }
    });
  }

  cleanProjectMention(mention) {
    return mention
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\s+(project|dataset|corpus|collection|data|examples?)$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  buildProjectDashboard() {
    const projects = [];
    
    for (const [name, proj] of Object.entries(this.projects)) {
      // Calculate health score
      const health = this.calculateHealthScore(proj);
      
      // Format volume
      const volumeDisplay = proj.volume > 0 ? 
        (proj.volume >= 1000 ? `${(proj.volume / 1000).toFixed(1)}k` : proj.volume.toString()) + ' examples' : 
        'TBD';
      
      // Get latest target date
      const targetDate = proj.targetDates.length > 0 ? 
        proj.targetDates[proj.targetDates.length - 1] : 'TBD';
      
      // Get primary owner and client
      const owner = Array.from(proj.owners)[0] || 'Unassigned';
      const client = Array.from(proj.clients)[0] || Array.from(proj.owners)[1] || 'TBD';
      
      projects.push({
        Project: name,
        Status: proj.status,
        Volume: volumeDisplay,
        'Target Date': targetDate,
        Owner: owner,
        Client: client,
        Priority: proj.priority,
        Health: `${health}/5`,
        Total_Volume: volumeDisplay, // For backward compatibility
        Deliverables: targetDate, // For backward compatibility
        Responsible: owner, // For backward compatibility
        Notes: proj.notes.slice(0, 3).join(' | ') || 'None'
      });
    }
    
    return projects;
  }

  calculateHealthScore(proj) {
    let score = 3; // Start at neutral
    
    // Status impact
    switch (proj.status) {
      case 'Complete': score = 5; break;
      case 'On Track': score = 4; break;
      case 'At Risk': score = 2; break;
      case 'Blocked': score = 1; break;
    }
    
    // Adjust for blockers
    if (proj.blockers.length > 0) {
      score = Math.max(1, score - 1);
    }
    
    // Adjust for missing data
    if (proj.volume === 0) score = Math.max(1, score - 0.5);
    if (proj.targetDates.length === 0) score = Math.max(1, score - 0.5);
    if (proj.owners.size === 0) score = Math.max(1, score - 0.5);
    
    return Math.round(score);
  }

  // Legacy rollup method for backwards compatibility
  rollup() {
    return this.aggregate();
  }

  addToProject(projectName, comm) {
    if (!this.projects[projectName]) {
      this.projects[projectName] = {
        name: projectName,
        volumes: [],
        deadlines: [],
        guidelines: new Set(),
        people: new Set(),
        status: "In Flight",
        notes: []
      };
    }
    const proj = this.projects[projectName];

    if (comm.volume_numbers && comm.volume_numbers.length > 0) {
      proj.volumes.push(...comm.volume_numbers);
    }
    if (comm.timelines_mentioned && comm.timelines_mentioned.length > 0) {
      proj.deadlines.push(...comm.timelines_mentioned);
    }
    if (comm.guidelines && comm.guidelines.length > 0) {
      comm.guidelines.forEach(g => proj.guidelines.add(g));
    }
    if (comm.from) proj.people.add(comm.from);
    if (comm.to) {
      if (Array.isArray(comm.to)) {
        comm.to.forEach(p => proj.people.add(p));
      } else {
        proj.people.add(comm.to);
      }
    }
    if (comm.action_items && comm.action_items.length > 0) {
      proj.notes.push(...comm.action_items);
    }
  }

  formatProjects() {
    const rows = [];
    for (const [name, proj] of Object.entries(this.projects)) {
      const totalVol = proj.volumes.length > 0 ? proj.volumes.join(", ") : "0";
      const deadlines = proj.deadlines.length > 0 ? proj.deadlines.join(", ") : "None";
      const guidelines = proj.guidelines.size > 0 ? Array.from(proj.guidelines).join(", ") : "None";
      const people = proj.people.size > 0 ? Array.from(proj.people).join(", ") : "Unassigned";
      const notes = proj.notes.length > 0 ? proj.notes.join(" | ") : "None";

      rows.push({
        Project: name,
        Total_Volume: totalVol,
        Deliverables: deadlines,
        Guidelines: guidelines,
        Responsible: people,
        Status: proj.status,
        Notes: notes
      });
    }
    return rows;
  }
}

// Example usage:
// const rollup = new ProjectRollup(parsedCommunications);
// const projectSummary = rollup.rollup();
// -> push projectSummary rows to "Project Dashboard" tab
