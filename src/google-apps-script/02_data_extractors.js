// === DATA EXTRACTION UTILITIES ===
// Enhanced data extraction functions for communications parsing

class DataExtractors {
  
  // Helper: Extract all links from text
  static extractLinks(text) {
    const links = [];
    const urlRegex = /https?:\/\/[^\s\]]+/gi;
    const matches = text.match(urlRegex);
    if (matches) {
      links.push(...matches);
    }
    return links;
  }

  // Enhanced Data Extraction Functions
  static extractVolumeNumbers(text) {
    const patterns = [
      /(\d+(?:,\d{3})*k?)\s*examples/gi,
      /(\d+(?:,\d{3})*k?)\s*samples/gi,
      /(\d+(?:,\d{3})*k?)\s*items/gi,
      /(\d+(?:,\d{3})*k?)\s*records/gi
    ];
    
    const volumes = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        let volume = match[1].toLowerCase();
        // Convert k notation to actual numbers
        if (volume.includes('k')) {
          const num = parseFloat(volume.replace('k', ''));
          volume = (num * 1000).toString();
        }
        volumes.push(volume.replace(/,/g, ''));
      }
    }
    return [...new Set(volumes)]; // Remove duplicates
  }

  static extractTimelines(text) {
    const patterns = [
      /(\d+)\s*(?:hour|hr)s?\s*(?:turnaround|delivery|deadline)/gi,
      /(\d+)\s*(?:day|business day)s?\s*(?:turnaround|delivery|deadline)/gi,
      /(\d+)\s*(?:week)s?\s*(?:turnaround|delivery|deadline)/gi,
      /(?:by|due|deadline)\s*([A-Z][a-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/gi,
      /(?:by|due|deadline)\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi,
      /(?:by|due|deadline)\s*(\d{4}-\d{1,2}-\d{1,2})/gi
    ];
    
    const timelines = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        timelines.push(match[1].trim());
      }
    }
    return [...new Set(timelines)];
  }

  static extractActionItems(text) {
    const patterns = [
      /(?:need|needs|must|should|will)\s+(?:to\s+)?([^.!?\n]+)/gi,
      /Action Items?:\s*([^.]*)/gi,
      /TODO:\s*([^.]*)/gi,
      /(?:^|\n)\s*[-*]\s*([^.\n]+)/gi // Bullet points
    ];
    
    const actions = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const action = match[1].trim();
        if (action.length > 5) { // Filter out very short matches
          actions.push(action);
        }
      }
    }
    return [...new Set(actions)];
  }

  static calculatePriorityLevel(text) {
    const highKeywords = ['urgent', 'asap', 'critical', 'blocker', 'emergency', 'high priority'];
    const mediumKeywords = ['important', 'medium priority', 'soon', 'needed'];
    const lowKeywords = ['low priority', 'whenever', 'nice to have', 'optional'];
    
    const lowerText = text.toLowerCase();
    
    for (const keyword of highKeywords) {
      if (lowerText.includes(keyword)) return 'High';
    }
    for (const keyword of mediumKeywords) {
      if (lowerText.includes(keyword)) return 'Medium';
    }
    for (const keyword of lowKeywords) {
      if (lowerText.includes(keyword)) return 'Low';
    }
    
    return 'Medium'; // Default
  }

  static extractProjectMentions(text) {
    const projectKeywords = [
      'rlhf', 'multimodal', 'safety', 'classifier', 'eval', 'evals',
      'sft', 'dataset', 'preference', 'dialogue', 'agentic', 'planning',
      'annotation', 'training', 'fine-tuning', 'reinforcement learning'
    ];
    
    const mentions = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of projectKeywords) {
      if (lowerText.includes(keyword)) {
        mentions.push(keyword.toUpperCase());
      }
    }
    
    return [...new Set(mentions)];
  }

  static generateCommunicationId(date, source, index) {
    const dateStr = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
    return `${source.toUpperCase()}_${dateStr}_${String(index).padStart(3, '0')}`;
  }
}