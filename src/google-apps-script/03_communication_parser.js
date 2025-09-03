// === TWO-STEP COMMUNICATION PARSER ===
// Handles parsing of all communication types with enhanced data extraction

class SimpleCommunicationParser {
  constructor() {
    this.rawCommunications = [];
    this.communications = [];
    this.allProjects = new Set();
    this.allPeople = new Set();
  }

  parseAllFiles(files) {
    this.rawCommunications = [];
    this.communications = [];
    this.allProjects.clear();
    this.allPeople.clear();

    // STEP 1: Extract basic [date, time, source, content] from all files
    for (const [filename, content] of Object.entries(files)) {
      const sourceType = this.getSourceType(filename);
      console.log(`Step 1 - Extracting basics from ${filename} as ${sourceType}...`);
      
      const basicItems = this.extractBasicInfo(content, sourceType);
      this.rawCommunications.push(...basicItems);
    }

    // STEP 2: Parse detailed information from each source
    console.log(`Step 2 - Detailed parsing of ${this.rawCommunications.length} items...`);
    for (let i = 0; i < this.rawCommunications.length; i++) {
      const rawItem = this.rawCommunications[i];
      const detailedItem = this.parseDetailedInfo(rawItem);
      if (detailedItem) {
        // Add enhanced data extraction
        const fullText = detailedItem.content + ' ' + (detailedItem.messageContent || '') + ' ' + (detailedItem.description || '');
        
        detailedItem.communication_id = DataExtractors.generateCommunicationId(detailedItem.date, detailedItem.source, i);
        detailedItem.projects_mentioned = DataExtractors.extractProjectMentions(fullText);
        detailedItem.action_items = DataExtractors.extractActionItems(fullText);
        detailedItem.priority_level = DataExtractors.calculatePriorityLevel(fullText);
        detailedItem.volume_numbers = DataExtractors.extractVolumeNumbers(fullText);
        detailedItem.timelines_mentioned = DataExtractors.extractTimelines(fullText);
        
        this.communications.push(detailedItem);
      }
    }

    // Safety check
    if (!this.communications || !Array.isArray(this.communications)) {
      console.error('Communications array is invalid:', this.communications);
      this.communications = [];
    }

    console.log(`Successfully parsed ${this.communications.length} communications`);

    // Sort by date
    this.communications.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Extract projects and people
    this.communications.forEach(comm => {
      this.extractProjectsAndPeople(comm);
    });

    return {
      communications: this.communications,
      projects: Array.from(this.allProjects),
      people: Array.from(this.allPeople),
      bySource: this.groupBySource()
    };
  }

  getSourceType(filename) {
    if (filename.includes('slack')) return 'slack';
    if (filename.includes('email')) return 'email';
    if (filename.includes('meeting')) return 'meeting';
    if (filename.includes('calendar')) return 'calendar';
    if (filename.includes('spec')) return 'spec';
    if (filename.includes('ticket')) return 'ticket';
    return 'unknown';
  }

  // STEP 1: Extract basic [date, time, source, content] information
  extractBasicInfo(content, sourceType) {
    const basicItems = [];
    
    if (!content || typeof content !== 'string') {
      console.warn(`Invalid content for ${sourceType}:`, content);
      return basicItems;
    }
    
    const lines = content.split('\n');
    console.log(`Processing ${sourceType}: ${lines.length} lines`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for date patterns to identify communication blocks
      const dateMatch = this.findDateInLine(line, sourceType);
      if (dateMatch) {
        console.log(`Found ${sourceType} communication at line ${i}: ${line.substring(0, 50)}...`);
        const basicItem = {
          date: dateMatch.date,
          time: dateMatch.time || '00:00',
          source: sourceType,
          rawContent: this.extractRawContentBlock(lines, i),
          originalIndex: i
        };
        basicItems.push(basicItem);
        console.log(`  -> Added basic item #${basicItems.length} for ${sourceType}`);
      }
    }
    
    console.log(`Extracted ${basicItems.length} basic items from ${sourceType}`);
    return basicItems;
  }

  // STEP 2: Parse detailed information based on source type
  parseDetailedInfo(rawItem) {
    if (!rawItem || !rawItem.source) {
      console.warn('Invalid rawItem:', rawItem);
      return null;
    }
    
    try {
      // For Slack, extract the actual date from the content if it was a header match
      if (rawItem.source === 'slack') {
        const dateMatch = rawItem.rawContent.match(/Date:\s*([^\n\r]+)/i);
        if (dateMatch) {
          const timeMatch = dateMatch[1].match(/(\d{1,2}:\d{2})/);
          rawItem.date = this.parseDate(dateMatch[1].trim());
          rawItem.time = timeMatch ? timeMatch[1] : '00:00';
          console.log(rawItem);
        }
      }
      
      // For Meeting, handle both Slack-style and traditional formats
      if (rawItem.source === 'meeting') {
        const dateMatch = rawItem.rawContent.match(/Date:\s*([^\n\r]+)/i);
        if (dateMatch) {
          const timeMatch = dateMatch[1].match(/(\d{1,2}:\d{2}[ap]?)/i);
          rawItem.date = this.parseDate(dateMatch[1].trim());
          rawItem.time = timeMatch ? timeMatch[1] : '00:00';
        }
      }
      
      switch (rawItem.source) {
        case 'slack': return this.parseSlackDetails(rawItem);
        case 'email': return this.parseEmailDetails(rawItem);
        case 'meeting': return this.parseMeetingDetails(rawItem);
        case 'calendar': return this.parseCalendarDetails(rawItem);
        case 'spec': return this.parseSpecDetails(rawItem);
        case 'ticket': return this.parseTicketDetails(rawItem);
        default: return this.parseGenericDetails(rawItem);
      }
    } catch (error) {
      console.error(`Error parsing ${rawItem.source}:`, error.message);
      return this.parseGenericDetails(rawItem);
    }
  }

  // Helper functions for Step 1
  findDateInLine(line, sourceType) {
    if (!line || typeof line !== 'string') return null;
    
    // Look for common date patterns - DIFFERENT BY SOURCE TYPE
    let patterns = [];
    
    if (sourceType === 'slack') {
      // For Slack, ONLY look for "From:" - ignore standalone "Date:" lines
      patterns = [
        { regex: /^From:/i, capture: 0, type: 'slack_header' }
      ];
    } else if (sourceType === 'meeting') {
      // For Meetings, handle both Slack-style and traditional formats
      patterns = [
        // Slack-style meeting notes: "From: ... Channel: ... Date: ... Message:"
        { regex: /^From:.*Channel:.*Date:/i, capture: 0, type: 'slack_meeting_header' },
        
        // Traditional meeting format: "Meeting Minutes: ... Date:"
        { regex: /Meeting Minutes:.*Date:\s*([^\n\r]+)/i, capture: 1 },
        
        // Explicit Date: patterns
        { regex: /Date:\s*([^\n\r]+?)(?:\s+(?:Attendees|Location|Message):|$)/i, capture: 1 },
        
        // Generic date patterns (fallback)
        { regex: /(\w+\s+\d{1,2},?\s+\d{4})/, capture: 1 }
      ];
    } else {
      // For other sources, use normal date patterns
      patterns = [
        // Explicit Date: patterns
        { regex: /Date:\s*([^\n\r]+?)(?:\s+(?:To|Subject|Message|Channel):|$)/i, capture: 1 },
        { regex: /Created:\s*([^\n\r]+?)(?:\s+Status:|$)/i, capture: 1 },
        
        // Calendar patterns
        { regex: /Calendar Invite Title:/i, capture: 0 },
        
        // Ticket patterns
        { regex: /TICKET\s+#\d+.*Created:\s*([^\n\r]+)/i, capture: 1 },
        
        // Email patterns
        { regex: /From:.*Date:\s*([^\n\r]+)/i, capture: 1 },
        
        // Generic date patterns (fallback)
        { regex: /(\w+\s+\d{1,2},?\s+\d{4})/, capture: 1 }
      ];
    }
    
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        let dateStr = '';
        
        // Special handling for Slack headers
        if (pattern.type === 'slack_header') {
          // This is a Slack "From:" line - we need to look ahead for the Date: line
          return { date: new Date().toISOString(), time: '00:00', type: 'slack_header' };
        }
        
        // Special handling for Slack-style meeting headers
        if (pattern.type === 'slack_meeting_header') {
          // This is a Slack-style meeting note - extract date from the same line
          const dateMatch = line.match(/Date:\s*([^M]+?)(?:\s+Message:|$)/i);
          if (dateMatch) {
            const timeMatch = dateMatch[1].match(/(\d{1,2}:\d{2}[ap]?)/i);
            return { 
              date: dateMatch[1].trim(), 
              time: timeMatch ? timeMatch[1] : '00:00', 
              type: 'slack_meeting_header' 
            };
          }
          return { date: new Date().toISOString(), time: '00:00', type: 'slack_meeting_header' };
        }
        
        // Special handling for Calendar
        if (line.includes('Calendar Invite Title:')) {
          return { date: new Date().toISOString(), time: '00:00' };
        }
        
        if (pattern.capture > 0 && match[pattern.capture]) {
          dateStr = match[pattern.capture].trim();
        }
        
        if (dateStr) {
          const timeMatch = dateStr.match(/(\d{1,2}:\d{2})/); 
          return {
            date: this.parseDate(dateStr),
            time: timeMatch ? timeMatch[1] : '00:00'
          };
        }
      }
    }
    return null;
  }

  extractRawContentBlock(lines, startIndex) {
    // Extract a reasonable block of content around the date line
    let endIndex = startIndex + 1;
    let blockContent = lines[startIndex];
    
    // For Slack messages, we need to find the actual Date: line and extract the date
    if (lines[startIndex].match(/^From:/i)) {
      // Look ahead for Date: line in next few lines
      for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 5); i++) {
        const line = lines[i];
        if (line.match(/Date:\s*([^\n\r]+)/i)) {
          // Found the date line - update the raw item's date
          const dateMatch = line.match(/Date:\s*([^\n\r]+)/i);
          if (dateMatch) {
            // Store the actual date for later use
            blockContent = blockContent.replace(/Date:\s*[^\n\r]+/i, '') + '\n' + line;
          }
          break;
        }
      }
    }
    
    // Look for the next communication start or end of meaningful content
    while (endIndex < lines.length && endIndex < startIndex + 20) {
      const line = lines[endIndex];
      
      // Stop at next communication start (From:, TICKET #, Meeting Minutes:, etc.)
      if (line.match(/^(From:|TICKET\s+#|Meeting Minutes:|Calendar Invite Title:)/i)) {
        break;
      }
      
      if (line.trim() === '' && endIndex > startIndex + 3) {
        const nextNonEmpty = lines.slice(endIndex + 1, endIndex + 5)
          .findIndex(l => l.trim() !== '');
        if (nextNonEmpty === -1) break;
      }
      blockContent += '\n' + line;
      endIndex++;
    }
    
    return blockContent;
  }

  // Detailed parsing functions for each source type
  // Slack: [DateTime, Date Display, (Channel/DM), From, To (Channel name or recipient Name), Message Content, Links]
  parseSlackDetails(rawItem) {
    try {
      const content = rawItem.rawContent;
      console.log('=== PARSING SLACK CONTENT ===');
      console.log(content);
      
      // Step 1: Extract "From:" - flexible parsing
      const fromMatch = content.match(/From:\s*([^]*?)(?=->|Channel:|Date:|Message:|$)/i);
      if (!fromMatch) {
        console.log('❌ No From: found');
        return null;
      }
      
      let sender = fromMatch[1].replace(/\[Client\]/g, '').trim();
      console.log('Sender extracted:', sender);
      
      // Step 2: Determine type by checking for keywords
      let type, recipient, channelName;
      
      // Check for "->" anywhere in content (Direct Message)
      const dmMatch = content.match(/From:\s*([^]*?)->\s*([^]*?)(?=\s+Direct Message|Channel:|Date:|Message:|$)/i);
      if (dmMatch) {
        type = 'DM';
        sender = dmMatch[1].replace(/\[Client\]/g, '').trim();
        recipient = dmMatch[2].replace(/\[Client\]/g, '').trim();
        console.log(`DM detected: ${sender} -> ${recipient}`);
        
      } else if (content.match(/Channel:/i)) {
        // Channel message
        type = 'Channel';
        const channelMatch = content.match(/Channel:\s*([^]*?)(?=Date:|Message:|$)/i);
        channelName = channelMatch ? channelMatch[1].trim() : 'Unknown Channel';
        console.log(`Channel detected: ${sender} in ${channelName}`);
        
      } else {
        // Default to DM if no clear indicators
        type = 'DM';
        recipient = 'Unknown';
        console.log(`Default DM: ${sender}`);
      }
      
      // Step 3: Extract Date - flexible parsing
      const dateMatch = content.match(/Date:\s*([^]*?)(?=Message:|$)/i);
      let date = rawItem.date;
      let time = rawItem.time;
      if (dateMatch) {
        const dateStr = dateMatch[1].trim();
        const timeMatch = dateStr.match(/(\d{1,2}:\d{2}[ap]?)/i);
        date = this.parseDate(dateStr);
        time = timeMatch ? timeMatch[1] : '00:00';
        console.log(`Date extracted: ${date}, Time: ${time}`);
      }
      
      // Step 4: Extract Message content - flexible parsing
      const messageMatch = content.match(/Message:\s*"?([^]*?)(?=\n\s*From:|$)/i);
      let messageContent = '';
      if (messageMatch) {
        messageContent = messageMatch[1].trim();
        // Clean up quotes
        messageContent = messageContent.replace(/^["']|["']$/g, '');
        console.log(`Message content: ${messageContent.substring(0, 50)}...`);
      }
      
      if (!messageContent) {
        console.log('❌ No message content found');
        return null;
      }
      
      // Step 5: Extract links
      const links = DataExtractors.extractLinks(messageContent);
      
      // Step 6: Build the result
      const result = {
        date: date,
        time: time,
        type: type,
        from: sender,
        to: type === 'Channel' ? channelName : recipient,
        messageContent: messageContent,
        links: links,
        source: 'slack'
      };
      
      console.log('✅ Parsed Slack result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to parse slack details:', error.message);
      return null;
    }
  }

  // Email: [date, from, to, subject, date, content, links]
  parseEmailDetails(rawItem) {
    try {
      const content = rawItem.rawContent;
      
      // More precise regex patterns to extract only the field values
      const fromMatch = content.match(/From:\s*([^\n\r]+?)(?:\s+To:|$)/i);
      const toMatch = content.match(/To:\s*([^\n\r]+?)(?:\s+Subject:|$)/i);
      const subjectMatch = content.match(/Subject:\s*([^\n\r]+?)(?:\s+Date:|$)/i);
      const dateMatch = content.match(/Date:\s*([^\n\r]+?)(?:\s+Content:|$)/i);
      
      // Find content after headers
      const contentMatch = content.match(/(?:Content:\s*|Date:\s*[^\n\r]+\s*)([\s\S]*?)$/i);
      let emailContent = '';
      
      if (contentMatch) {
        emailContent = contentMatch[1].trim();
      } else {
        // Fallback: find content after all headers
        const lines = content.split('\n');
        let contentStarted = false;
        const contentLines = [];
        
        for (const line of lines) {
          if (contentStarted) {
            contentLines.push(line);
          } else if (line.trim() && !line.match(/^(From|To|Subject|Date):/i)) {
            contentStarted = true;
            contentLines.push(line);
          }
        }
        emailContent = contentLines.join('\n').trim();
      }

      if (!fromMatch || !emailContent) return null;

      const from = fromMatch[1].replace(/\[Client\]/g, '').trim();
      const to = toMatch ? toMatch[1].replace(/\[Client\]/g, '').trim() : 'Unknown';
      const subject = subjectMatch ? subjectMatch[1].trim() : 'No Subject';
      const links = DataExtractors.extractLinks(emailContent);

      return {
        date: rawItem.date,
        time: rawItem.time,
        from: from,
        to: to,
        subject: subject,
        content: emailContent,
        links: links,
        source: 'email'
      };
    } catch (error) {
      console.warn('Failed to parse email details:', error.message);
      return null;
    }
  }

  // Meeting: [date, "Daily Standup" or meeting name, location, content, links]
  parseMeetingDetails(rawItem) {
    try {
      const content = rawItem.rawContent;
      let meetingName = '', location = 'Virtual', meetingContent = '';

      // Enhanced Slack-style format detection: "From: ... Channel: ... Date: ... Message: ..."
      if (content.match(/^From:.*Channel:.*Date:.*Message:/i)) {
        console.log('Parsing Slack-style meeting note');
        
        // Extract the meeting name from "From:" field
        const fromMatch = content.match(/From:\s*([^C]+?)(?:\s*Channel:|$)/i);
        if (fromMatch) {
          meetingName = fromMatch[1].trim();
        }
        
        // Extract channel
        const channelMatch = content.match(/Channel:\s*([^D]+?)(?:\s*Date:|$)/i);
        if (channelMatch) {
          location = channelMatch[1].trim(); // Use channel as location
        }
        
        // Extract message content - handle both ``` wrapped and unwrapped
        let messageMatch = content.match(/Message:\s*```\s*(.*?)\s*```/ms);
        if (messageMatch) {
          meetingContent = messageMatch[1].trim();
        } else {
          // Try without backticks
          messageMatch = content.match(/Message:\s*(.*?)$/ms);
          if (messageMatch) {
            meetingContent = messageMatch[1].trim();
            // Remove trailing backticks if present
            meetingContent = meetingContent.replace(/```\s*$/, '').trim();
          }
        }
        
        // Determine meeting type based on content structure
        const hasStandupSections = /\b(completed|in progress|blockers|notes)\s*:/i.test(meetingContent);
        const hasTeamUpdates = /team updates/i.test(meetingContent);
        
        if (hasStandupSections || hasTeamUpdates) {
          meetingName = meetingName || 'Daily Standup';
        } else {
          meetingName = meetingName || 'Team Meeting';
        }

      } else if (content.includes('Meeting Minutes:')) {
        // Other format
        const titleMatch = content.match(/Meeting Minutes:\s*([^D]+?)(?:\s*Date:|$)/);
        const locationMatch = content.match(/Location:\s*([^\n]+)/);
        
        if (titleMatch) meetingName = titleMatch[1].trim();
        if (locationMatch) location = locationMatch[1].trim();
        
        const lines = content.split('\n');
        const contentStart = lines.findIndex(line => 
          !line.includes('Meeting Minutes:') && 
          !line.includes('Date:') && 
          !line.includes('Attendees:') &&
          !line.includes('Location:') &&
          line.trim()
        );
        
        if (contentStart > -1) {
          meetingContent = lines.slice(contentStart).join('\n').trim();
        }
      }

      if (!meetingContent) return null;

      const links = DataExtractors.extractLinks(meetingContent);

      return {
        date: rawItem.date,
        time: rawItem.time,
        meetingName: meetingName || 'Meeting',
        location: location,
        content: meetingContent,
        messageContent: meetingContent, // For consistency with other parsers
        links: links,
        from: 'Meeting Organizer',
        to: 'Team',
        source: 'meeting',
        communication_id: DataExtractors.generateCommunicationId(rawItem.date, rawItem.source, rawItem.originalIndex),
        projects_mentioned: DataExtractors.extractProjectMentions(meetingContent),
        action_items: DataExtractors.extractActionItems(meetingContent),
        priority_level: DataExtractors.calculatePriorityLevel(meetingContent),
        volume_numbers: DataExtractors.extractVolumeNumbers(meetingContent),
        timelines_mentioned: DataExtractors.extractTimelines(meetingContent)
      };
    } catch (error) {
      console.warn('Failed to parse meeting details:', error.message);
      return null;
    }
  }

  // Calendar: [date, organizer, title, location, attendees, description, note, content, links]
  parseCalendarDetails(rawItem) {
    try {
      const content = rawItem.rawContent;
      
      // More precise regex patterns
      const titleMatch = content.match(/Calendar Invite Title:\s*([^\n\r]+?)(?:\s+Organizer:|$)/i);
      const organizerMatch = content.match(/Organizer:\s*([^\n\r]+?)(?:\s+(?:Date|Location):|$)/i);
      const locationMatch = content.match(/Location:\s*([^\n\r]+?)(?:\s+(?:Attendees|Description):|$)/i);
      const attendeesMatch = content.match(/Attendees:\s*([^\n\r]+?)(?:\s+(?:Description|Content):|$)/i);
      const descriptionMatch = content.match(/Description:\s*([\s\S]*?)$/i);

      const title = titleMatch ? titleMatch[1].trim() : 'Calendar Event';
      const organizer = organizerMatch ? organizerMatch[1].trim() : 'Unknown';
      const location = locationMatch ? locationMatch[1].trim() : 'Not specified';
      const attendees = attendeesMatch ? attendeesMatch[1].split(',').map(a => a.trim()).filter(a => a) : [];
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';
      const note = '';

      const fullContent = description || 'Calendar invite';
      const links = DataExtractors.extractLinks(fullContent);

      return {
        date: rawItem.date,
        time: rawItem.time,
        organizer: organizer,
        title: title,
        location: location,
        attendees: attendees,
        description: description,
        note: note,
        content: fullContent,
        links: links,
        from: organizer,
        to: attendees.join(', ') || 'Unknown',
        source: 'calendar'
      };
    } catch (error) {
      console.warn('Failed to parse calendar details:', error.message);
      return null;
    }
  }

  // Spec: [date_created, content, links]
  parseSpecDetails(rawItem) {
    try {
      const content = rawItem.rawContent;
      let title = '', author = '';
      
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes('Technical Specification')) {
          title = line.trim();
        } else if (line.startsWith('Author:')) {
          author = line.replace('Author:', '').trim();
        }
      }

      const links = DataExtractors.extractLinks(content);

      return {
        date: rawItem.date,
        time: rawItem.time,
        title: title || 'Technical Specification',
        content: content,
        links: links,
        from: author || 'Unknown',
        to: 'Development Team',
        source: 'spec'
      };
    } catch (error) {
      console.warn('Failed to parse spec details:', error.message);
      return null;
    }
  }

  // Ticket: [ticketNum, date_created, priority, status, description, logs, links]
  parseTicketDetails(rawItem) {
    try {
      const content = rawItem.rawContent;
      console.log('=== PARSING TICKET CONTENT ===');
      console.log(content);
      
      // More flexible ticket header parsing
      // Format: TICKET #123 - Description Priority: High Created: Oct 28, 2024 Status: Open
      const headerMatch = content.match(/TICKET\s+#(\d+)\s*-\s*(.+?)\s*Priority:\s*(\w+).*?Created:\s*([^S]+?)\s*Status:\s*(\w+)/i);
      
      if (!headerMatch) {
        console.log('❌ No ticket header found');
        return null;
      }

      const ticketNum = headerMatch[1];
      const description = headerMatch[2].trim();
      const priority = headerMatch[3];
      const createdDate = headerMatch[4].trim();
      const status = headerMatch[5];
      
      console.log(`Ticket #${ticketNum}: ${description} | ${priority} | ${status}`);

      // Extract conversation logs - format: [Oct 28, 10:15a] Alex K Need access to...
      const lines = content.split('\n');
      const logs = [];
      const allLinks = [];
      
      for (const line of lines) {
        const logMatch = line.match(/^\[([^\]]+)\]\s*([^\s]+(?:\s+[^\s]+)*?)\s+(.+)$/);
        if (logMatch) {
          const logDate = logMatch[1].trim();
          const sender = logMatch[2].trim();
          const message = logMatch[3].trim();
          const messageLinks = DataExtractors.extractLinks(message);
          
          logs.push({
            date: logDate,
            sender: sender,
            message: message,
            links: messageLinks
          });
          
          allLinks.push(...messageLinks);
          console.log(`  Log: ${logDate} | ${sender} | ${message.substring(0, 50)}...`);
        }
      }
      
      console.log(`✅ Parsed ticket with ${logs.length} log entries`);

      return {
        date: this.parseDate(createdDate),
        time: '00:00',
        ticketNum: ticketNum,
        priority: priority,
        status: status,
        description: description,
        logs: logs,
        links: [...new Set(allLinks)],
        from: 'Support System',
        to: 'Support Team',
        source: 'ticket',
        content: `Ticket #${ticketNum}: ${description}` // Add content for compatibility
      };
    } catch (error) {
      console.error('❌ Failed to parse ticket details:', error.message);
      console.log('Raw content:', rawItem.rawContent);
      return null;
    }
  }

  parseGenericDetails(rawItem) {
    const links = DataExtractors.extractLinks(rawItem.rawContent);
    return {
      date: rawItem.date,
      time: rawItem.time,
      content: rawItem.rawContent.substring(0, 200) + '...',
      links: links,
      from: 'Unknown',
      to: 'Unknown',
      source: rawItem.source
    };
  }

  // Helper: Group communications by source for individual tabs
  groupBySource() {
    const grouped = {};
    this.communications.forEach(comm => {
      if (!grouped[comm.source]) {
        grouped[comm.source] = [];
      }
      grouped[comm.source].push(comm);
    });
    return grouped;
  }

  parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') {
      return new Date().toISOString();
    }
    
    try {
      let cleaned = dateStr.replace(/,/g, '').trim();
      
      const patterns = [
        {
          regex: /(\w+\s+\d{1,2}\s+\d{4})\s+(\d{1,2}:\d{2})([ap])/i,
          transform: (match) => `${match[1]} ${match[2]} ${match[3].toUpperCase()}M`
        },
        {
          regex: /(\w+\s+\d{1,2}\s+\d{4})\s+(\d{1,2})([ap])/i,
          transform: (match) => `${match[1]} ${match[2]}:00 ${match[3].toUpperCase()}M`
        },
        {
          regex: /^(\w+\s+\d{1,2}\s+\d{4})$/,
          transform: (match) => match[1]
        }
      ];
      
      for (const { regex, transform } of patterns) {
        const match = cleaned.match(regex);
        if (match) {
          const transformedDate = transform(match);
          const parsed = new Date(transformedDate);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
      }
      
      const directParse = new Date(cleaned);
      if (!isNaN(directParse.getTime())) {
        return directParse.toISOString();
      }
      
      const monthMapping = {
        'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
        'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
        'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
      };
      
      const monthMatch = cleaned.match(/(\w{3})\s+(\d{1,2})\s+(\d{4})(\s+.*)?/i);
      if (monthMatch) {
        const monthAbbr = monthMatch[1].toLowerCase();
        const fullMonth = monthMapping[monthAbbr];
        if (fullMonth) {
          const reconstructed = `${fullMonth} ${monthMatch[2]}, ${monthMatch[3]}${monthMatch[4] || ''}`;
          const parsed = new Date(reconstructed);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
      }
      
    } catch (error) {
      console.warn(`Date parsing error for "${dateStr}":`, error.message);
    }
    
    return new Date().toISOString();
  }

  extractProjectsAndPeople(communication) {
    // Handle different content fields based on communication structure
    let text = '';
    if (communication.content) text += communication.content;
    if (communication.messageContent) text += ' ' + communication.messageContent;
    if (communication.description) text += ' ' + communication.description;
    if (communication.subject) text += ' ' + communication.subject;
    if (communication.title) text += ' ' + communication.title;
    if (communication.meetingName) text += ' ' + communication.meetingName;
    
    text = text.toLowerCase();
    
    const projectKeywords = [
      'rlhf', 'multimodal', 'safety', 'classifier', 'eval', 'evals',
      'sft', 'dataset', 'preference', 'dialogue', 'agentic', 'planning'
    ];
    
    projectKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        this.allProjects.add(keyword);
      }
    });

    // Extract people from different fields based on communication structure
    const people = [];
    if (communication.from) people.push(communication.from);
    if (communication.to) {
      if (Array.isArray(communication.to)) {
        people.push(...communication.to);
      } else if (typeof communication.to === 'string') {
        people.push(...communication.to.split(',').map(p => p.trim()));
      }
    }
    if (communication.organizer) people.push(communication.organizer);
    if (communication.attendees && Array.isArray(communication.attendees)) {
      people.push(...communication.attendees);
    }
    
    // Extract people from ticket logs
    if (communication.logs && Array.isArray(communication.logs)) {
      communication.logs.forEach(log => {
        if (log.sender) {
          people.push(log.sender);
        }
      });
    }

    people.forEach(person => {
      if (person && person !== 'Team' && person !== 'Unknown' && person !== 'Attendees' && person !== 'Support Team' && person !== 'Development Team') {
        // Expand abbreviated names like "Alex K" to "Alex Kumar" if needed
        let expandedName = person.replace(/\[Client\]/g, '').trim();
        
        // Handle common abbreviations - you can extend this list
        if (expandedName === 'Alex K') expandedName = 'Alex Kumar';
        if (expandedName === 'DevOps Team') expandedName = 'DevOps Team'; // Keep team names
        
        this.allPeople.add(expandedName);
      }
    });
  }
}