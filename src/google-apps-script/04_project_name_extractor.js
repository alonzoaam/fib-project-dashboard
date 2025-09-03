// === PROJECT NAME EXTRACTOR MODULE ===
// Scans parsed communications for candidate project names, clusters variants, and outputs canonical dictionary

class ProjectNameExtractor {
  constructor(communications) {
    this.comms = communications || [];
    this.projectCandidates = {}; // raw mentions by comm
    this.canonicalProjects = {}; // clustered canonical names
  }

  // Enhanced regex patterns to catch diverse project mentions
  static getProjectPatterns() {
    return [
      // Specific known project patterns
      /RLHF\s+(Preference\s+Collection|Dialogue\s+Data|Safety\s+Eval(?:uation)?s?|Dialogue\s+Data\s*-?\s*Batch\s*\d*)/gi,
      /Multimodal\s+SFT\s+Dataset/gi,
      /Safety\s+Classifier\s+Dataset/gi,
      /Agentic\s+Planning\s+Corpus/gi,
      /Q\d+\s+Safety\s+Evals?/gi,
      
      // General patterns with descriptors
      /(RLHF|Safety|Classifier|Dialogue|Planning|Multimodal|SFT|Eval|Evaluation|Corpus|Dataset)\s+([\w\s\-\d]+?)(?=\s+(?:project|is|has|will|should|needs|due|target|status|examples|volume)|$)/gi,
      
      // Project with batch/version numbers
      /(\w+(?:\s+\w+)*?)\s*(?:Batch|Version|V|Phase)\s*\d+/gi,
      
      // Direct project mentions
      /(?:Project|Workstream|Study|Initiative)\s*:?\s*([A-Z][\w\s\-]+?)(?=\s+(?:is|has|will|should|needs|due|target|status|examples|volume)|[.!?]|$)/gi,
      
      // Named datasets/corpora
      /([A-Z][\w\s]+?)\s+(?:Dataset|Corpus|Collection|Data|Examples?)(?:\s+(?:Batch|Version|V|Phase)\s*\d+)?/gi
    ];
  }

  extractCandidates() {
    this.comms.forEach((comm, idx) => {
      // Use all available text fields
      const fields = [
        comm.subject, comm.title, comm.content, comm.messageContent, 
        comm.Content, comm.Subject, comm['Message Content'], comm.description
      ].filter(Boolean);
      
      fields.forEach(field => {
        const patterns = ProjectNameExtractor.getProjectPatterns();
        
        patterns.forEach(pattern => {
          let match;
          // Reset regex lastIndex to avoid issues with global flag
          pattern.lastIndex = 0;
          
          while ((match = pattern.exec(field)) !== null) {
            // Get the most meaningful part of the match
            let mention = match[1] ? match[1].trim() : match[0].trim();
            
            // Clean up the mention
            mention = this.cleanProjectMention(mention);
            
            // Skip if too short or generic
            if (mention.length < 3 || this.isGenericTerm(mention)) {
              continue;
            }
            
            if (!this.projectCandidates[mention]) {
              this.projectCandidates[mention] = [];
            }
            
            this.projectCandidates[mention].push({ 
              commId: idx, 
              snippet: field.slice(Math.max(0, match.index - 50), match.index + 150),
              fullMatch: match[0],
              source: comm.source || 'unknown'
            });
          }
        });
        
        // Also look for explicit project references with numbers/metrics
        this.extractProjectsWithMetrics(field, idx, comm);
      });
    });
    return this.projectCandidates;
  }

  cleanProjectMention(mention) {
    return mention
      .replace(/^(the|a|an)\s+/i, '') // Remove articles
      .replace(/\s+(project|dataset|corpus|collection|data|examples?)$/i, '') // Remove trailing descriptors
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  isGenericTerm(term) {
    const genericTerms = ['project', 'dataset', 'corpus', 'data', 'examples', 'collection', 'study', 'work', 'task'];
    return genericTerms.includes(term.toLowerCase());
  }

  extractProjectsWithMetrics(field, commId, comm) {
    // Look for patterns like "Project X: 25k examples" or "Working on Y - 82k volume"
    const metricPatterns = [
      /([A-Z][\w\s]+?)\s*[:\-–]\s*(\d+k?\s+examples?|\d+k?\s+volume|\d+\.\d+k?\s+examples?)/gi,
      /(\d+k?\s+examples?)\s+(?:for|of|in)\s+([A-Z][\w\s]+)/gi,
      /([A-Z][\w\s]+?)\s+(?:has|needs|requires)\s+(\d+k?\s+examples?)/gi
    ];
    
    metricPatterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(field)) !== null) {
        let projectName = match[1] || match[2];
        let metric = match[2] || match[1];
        
        // Determine which is the project name vs metric
        if (/\d/.test(projectName)) {
          [projectName, metric] = [metric, projectName];
        }
        
        projectName = this.cleanProjectMention(projectName);
        
        if (projectName.length > 3 && !this.isGenericTerm(projectName)) {
          if (!this.projectCandidates[projectName]) {
            this.projectCandidates[projectName] = [];
          }
          
          this.projectCandidates[projectName].push({
            commId: commId,
            snippet: field.slice(Math.max(0, match.index - 50), match.index + 150),
            fullMatch: match[0],
            metric: metric,
            source: comm.source || 'unknown'
          });
        }
      }
    });
  }

  // Simple string similarity function (replaces Natural.js)
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Simple edit distance approximation
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Simple Levenshtein distance implementation
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // cluster variants into canonical names
  clusterCandidates(threshold = 0.8) {
    const mentions = Object.keys(this.projectCandidates);

    const clusters = [];
    mentions.forEach(m => {
      let placed = false;
      for (const cluster of clusters) {
        const sim = this.calculateSimilarity(cluster.rep.toLowerCase(), m.toLowerCase());
        if (sim >= threshold) {
          cluster.variants.push(m);
          cluster.rep = cluster.rep.length >= m.length ? cluster.rep : m; // prefer longer name
          placed = true;
          break;
        }
      }
      if (!placed) {
        clusters.push({ rep: m, variants: [m] });
      }
    });

    clusters.forEach((c, idx) => {
      this.canonicalProjects[c.rep] = {
        canonicalName: c.rep,
        variants: c.variants,
        mentions: c.variants.flatMap(v => this.projectCandidates[v])
      };
    });

    return this.canonicalProjects;
  }

  run() {
    this.extractCandidates();
    return this.clusterCandidates();
  }
}

// Example usage:
// const extractor = new ProjectNameExtractor(parsedCommunications);
// const projectDict = extractor.run();
// console.log(projectDict);
// -> {
//   "RLHF Dialogue Data": { canonicalName: "RLHF Dialogue Data", variants: ["RLHF Dialogue Batch 2", ...], mentions: [...] },
//   "Safety Classifier Dataset": {...},
//   ...
// }
