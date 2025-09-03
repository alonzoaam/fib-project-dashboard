// Dashboard HTML Template for Google Apps Script Knowledge Base Builder
// This template will be embedded with the knowledge base data

function getDashboardHTMLTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔬 Fibonacci Project Dashboard</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 20px; background: #f5f7fa; color: #2c3e50;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .build-info { color: #7f8c8d; font-size: 0.9em; }
        
        .tab-container { 
            display: flex; justify-content: center; margin-bottom: 30px; 
            background: white; border-radius: 8px; padding: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .tab-button { 
            padding: 12px 24px; margin: 0 2px; background: transparent; border: none; 
            cursor: pointer; border-radius: 6px; font-weight: 500; transition: all 0.3s;
        }
        .tab-button:hover { background: #ecf0f1; }
        .tab-button.active { background: #3498db; color: white; }
        
        .tab-content { 
            display: none; background: white; padding: 30px; border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 20px;
        }
        .tab-content.active { display: block; }
        .tab-content h2 { margin-top: 0; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        
        .project-group { 
            margin-bottom: 20px; padding: 20px; background: #f8f9fa; 
            border-left: 5px solid #3498db; border-radius: 8px; transition: all 0.3s;
        }
        .project-group:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .project-group h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .project-variants { color: #7f8c8d; margin-bottom: 15px; }
        .toggle-btn { 
            background: #3498db; color: white; border: none; padding: 8px 16px; 
            border-radius: 4px; cursor: pointer; font-size: 0.9em;
        }
        .toggle-btn:hover { background: #2980b9; }
        
        .project-mentions { 
            margin-top: 15px; padding: 15px; background: white; 
            border: 1px solid #ddd; border-radius: 6px; display: none;
        }
        
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #34495e; color: white; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 12px; border-bottom: 1px solid #ecf0f1; }
        .expandable-row { cursor: pointer; transition: background 0.2s; }
        .expandable-row:hover { background: #f8f9fa; }
        .expanded-content { 
            background: #e8f4fd !important; padding: 20px; 
            border-left: 4px solid #3498db; line-height: 1.6;
        }
        .expanded-content strong { color: #2c3e50; display: inline-block; min-width: 80px; }
        
        .search-container { 
            margin-bottom: 20px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;
        }
        .search-input { 
            flex: 1; min-width: 300px; padding: 12px; border: 2px solid #ddd; 
            border-radius: 6px; font-size: 16px;
        }
        .search-input:focus { outline: none; border-color: #3498db; }
        .filter-select { 
            padding: 12px; border: 2px solid #ddd; border-radius: 6px; 
            background: white; cursor: pointer;
        }
        
        .ai-container { text-align: center; }
        .ai-input { 
            width: 70%; max-width: 600px; padding: 15px; border: 2px solid #ddd; 
            border-radius: 8px; font-size: 16px; margin-right: 10px;
        }
        .ai-button { 
            background: #e74c3c; color: white; border: none; padding: 15px 25px; 
            border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;
        }
        .ai-button:hover { background: #c0392b; }
        .ai-output { 
            margin-top: 25px; padding: 20px; background: #f8f9fa; 
            border-radius: 8px; text-align: left; max-width: 800px; margin-left: auto; margin-right: auto;
        }
        
        .stats-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; margin-bottom: 30px;
        }
        .stat-card { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; padding: 20px; border-radius: 12px; text-align: center;
        }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        
        .loading { text-align: center; padding: 40px; color: #7f8c8d; }
        .error { background: #e74c3c; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔬 Fibonacci Project Dashboard</h1>
        <div class="build-info">Generated: <span id="buildDate">Loading...</span> | Cloud-Powered by Google Apps Script</div>
    </div>
    
    <div class="tab-container">
        <button class="tab-button active" onclick="showTab('project-overview')">📊 Project Overview</button>
        <button class="tab-button" onclick="showTab('people-resources')">👥 People & Resources</button>
        <button class="tab-button" onclick="showTab('communications')">📋 Communications</button>
        <button class="tab-button" onclick="showTab('ai-assistant')">🤖 AI Assistant</button>
    </div>
    
    <div id="project-overview" class="tab-content active">
        <h2>📊 Project Overview</h2>
        <div class="stats-grid" id="project-stats">
            <div class="stat-card">
                <div class="stat-number" id="total-projects">-</div>
                <div class="stat-label">Project Groups</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-communications">-</div>
                <div class="stat-label">Communications</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-people">-</div>
                <div class="stat-label">People Mentioned</div>
            </div>
        </div>
        <div id="project-groups" class="loading">Loading project groups...</div>
    </div>
    
    <div id="people-resources" class="tab-content">
        <h2>👥 People & Resources</h2>
        <div id="people-list" class="loading">Loading people data...</div>
    </div>
    
    <div id="communications" class="tab-content">
        <h2>📋 Communications</h2>
        <div class="search-container">
            <input type="text" id="comm-search" class="search-input" placeholder="Search communications...">
            <select id="source-filter" class="filter-select">
                <option value="">All Sources</option>
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="meeting">Meeting</option>
                <option value="calendar">Calendar</option>
                <option value="spec">Spec</option>
                <option value="ticket">Ticket</option>
            </select>
        </div>
        <div id="communications-list" class="loading">Loading communications...</div>
    </div>
    
    <div id="ai-assistant" class="tab-content">
        <h2>🤖 AI Assistant</h2>
        <div class="ai-container">
            <p>Ask questions about the project data:</p>
            <input type="text" id="question-input" class="ai-input" placeholder="e.g., 'What projects is Alex working on?'">
            <button onclick="askQuestion()" class="ai-button">Ask</button>
            <div id="answer-output" class="ai-output" style="display: none;"></div>
        </div>
    </div>
    
    <script src="knowledge_base.js"></script>
    <script>
        let currentData = { communications: [], people: {}, projectGroups: {} };
        
        document.addEventListener('DOMContentLoaded', function() {
            if (window.KNOWLEDGE_BASE) {
                initializeDashboard();
            } else {
                showError('Knowledge base failed to load');
            }
        });
        
        function initializeDashboard() {
            try {
                const kb = window.KNOWLEDGE_BASE;
                currentData = kb;
                
                document.getElementById('buildDate').textContent = 
                    kb.metadata?.buildDate ? new Date(kb.metadata.buildDate).toLocaleString() : 'Unknown';
                
                updateStats();
                loadProjectGroups();
                loadPeople();
                loadCommunications();
                setupSearch();
                
                console.log('✅ Dashboard initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing dashboard:', error);
                showError('Failed to initialize dashboard: ' + error.message);
            }
        }
        
        function updateStats() {
            const kb = window.KNOWLEDGE_BASE;
            document.getElementById('total-projects').textContent = Object.keys(kb.projectGroups || {}).length;
            document.getElementById('total-communications').textContent = (kb.communications || []).length;
            document.getElementById('total-people').textContent = Object.keys(kb.people || {}).length;
        }
        
        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
        
        function loadProjectGroups() {
            const container = document.getElementById('project-groups');
            const kb = window.KNOWLEDGE_BASE;
            
            if (!kb.projectGroups || Object.keys(kb.projectGroups).length === 0) {
                container.innerHTML = '<p>No project groups found.</p>';
                return;
            }
            
            let html = '';
            for (const [groupName, groupData] of Object.entries(kb.projectGroups)) {
                const safeId = groupName.replace(/[^a-zA-Z0-9]/g, '-');
                html += \`
                <div class="project-group">
                    <h3>\${groupName} <small>(\${groupData.communications.length} mentions)</small></h3>
                    <div class="project-variants"><strong>Variants:</strong> \${groupData.variants.join(', ')}</div>
                    <button class="toggle-btn" onclick="toggleProjectDetails('\${safeId}')">Show Details</button>
                    <div id="details-\${safeId}" class="project-mentions">
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Source</th><th>Content Preview</th></tr>
                            </thead>
                            <tbody>
                                \${groupData.communications.map((comm, idx) => \`
                                    <tr class="expandable-row" onclick="toggleRowExpansion(this, \${JSON.stringify(comm).replace(/"/g, '&quot;')})">
                                        <td>\${new Date(comm.date).toLocaleDateString()}</td>
                                        <td><span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">\${comm.source.toUpperCase()}</span></td>
                                        <td>\${(comm.content || comm.messageContent || 'No content').substring(0, 100)}...</td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                \`;
            }
            
            container.innerHTML = html;
        }
        
        function loadPeople() {
            const container = document.getElementById('people-list');
            const kb = window.KNOWLEDGE_BASE;
            
            if (!kb.people || Object.keys(kb.people).length === 0) {
                container.innerHTML = '<p>No people data found.</p>';
                return;
            }
            
            let html = '<table><thead><tr><th>Name</th><th>Mentions</th><th>Associated Projects</th><th>Type</th></tr></thead><tbody>';
            
            const sortedPeople = Object.entries(kb.people).sort((a, b) => (b[1].mentions || 0) - (a[1].mentions || 0));
            
            for (const [personName, personData] of sortedPeople) {
                const isClient = personName.includes('[Client]');
                const rowClass = isClient ? 'style="background: #e8f4fd;"' : '';
                const type = isClient ? '👤 Client' : '👥 Team Member';
                
                html += \`
                <tr \${rowClass}>
                    <td><strong>\${personName}</strong></td>
                    <td>\${personData.mentions || 0}</td>
                    <td>\${(personData.projects || []).join(', ') || 'N/A'}</td>
                    <td>\${type}</td>
                </tr>
                \`;
            }
            
            html += '</tbody></table>';
            container.innerHTML = html;
        }
        
        function loadCommunications(filter = {}) {
            const container = document.getElementById('communications-list');
            const kb = window.KNOWLEDGE_BASE;
            
            if (!kb.communications || kb.communications.length === 0) {
                container.innerHTML = '<p>No communications found.</p>';
                return;
            }
            
            let communications = kb.communications;
            
            if (filter.search) {
                communications = communications.filter(comm => 
                    (comm.content || '').toLowerCase().includes(filter.search.toLowerCase()) ||
                    (comm.from || '').toLowerCase().includes(filter.search.toLowerCase()) ||
                    (comm.subject || '').toLowerCase().includes(filter.search.toLowerCase())
                );
            }
            
            if (filter.source) {
                communications = communications.filter(comm => comm.source === filter.source);
            }
            
            let html = \`<table><thead><tr><th>Date</th><th>Source</th><th>From</th><th>Subject/Content Preview</th></tr></thead><tbody>\`;
            
            communications.slice(0, 100).forEach(comm => {
                html += \`
                <tr class="expandable-row" onclick="toggleRowExpansion(this, \${JSON.stringify(comm).replace(/"/g, '&quot;')})">
                    <td>\${new Date(comm.date).toLocaleDateString()}</td>
                    <td><span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">\${comm.source.toUpperCase()}</span></td>
                    <td>\${comm.from || 'N/A'}</td>
                    <td>\${(comm.subject || comm.content || comm.messageContent || 'No content').substring(0, 80)}...</td>
                </tr>
                \`;
            });
            
            html += '</tbody></table>';
            
            if (communications.length > 100) {
                html += \`<p style="text-align: center; margin-top: 20px; color: #7f8c8d;">Showing first 100 of \${communications.length} communications</p>\`;
            }
            
            container.innerHTML = html;
        }
        
        function setupSearch() {
            const searchInput = document.getElementById('comm-search');
            const sourceFilter = document.getElementById('source-filter');
            
            function applyFilters() {
                loadCommunications({
                    search: searchInput.value,
                    source: sourceFilter.value
                });
            }
            
            searchInput.addEventListener('input', applyFilters);
            sourceFilter.addEventListener('change', applyFilters);
        }
        
        function toggleProjectDetails(safeId) {
            const details = document.getElementById('details-' + safeId);
            const isVisible = details.style.display !== 'none';
            details.style.display = isVisible ? 'none' : 'block';
            
            const button = details.previousElementSibling;
            button.textContent = isVisible ? 'Show Details' : 'Hide Details';
        }
        
        function toggleRowExpansion(row, data) {
            if (row.classList.contains('expanded')) {
                row.classList.remove('expanded');
                row.innerHTML = row.getAttribute('data-original');
            } else {
                row.setAttribute('data-original', row.innerHTML);
                row.classList.add('expanded');
                row.innerHTML = \`
                    <td colspan="100%" class="expanded-content">
                        <strong>Date:</strong> \${new Date(data.date).toLocaleString()}<br>
                        <strong>Source:</strong> \${data.source}<br>
                        <strong>From:</strong> \${data.from || 'N/A'}<br>
                        \${data.subject ? \`<strong>Subject:</strong> \${data.subject}<br>\` : ''}
                        \${data.meetingName ? \`<strong>Meeting:</strong> \${data.meetingName}<br>\` : ''}
                        \${data.location ? \`<strong>Location:</strong> \${data.location}<br>\` : ''}
                        <strong>Content:</strong> \${data.content || data.messageContent || 'No content available'}
                        \${data.links && data.links.length > 0 ? \`<br><strong>Links:</strong> \${data.links.join(', ')}\` : ''}
                    </td>
                \`;
            }
        }
        
        function askQuestion() {
            const question = document.getElementById('question-input').value;
            const output = document.getElementById('answer-output');
            
            if (!question.trim()) {
                output.innerHTML = '<p>Please enter a question.</p>';
                output.style.display = 'block';
                return;
            }
            
            const kb = window.KNOWLEDGE_BASE;
            let answer = '';
            const q = question.toLowerCase();
            
            if (q.includes('project')) {
                const projectCount = Object.keys(kb.projectGroups || {}).length;
                const projects = Object.keys(kb.projectGroups || {}).slice(0, 5);
                answer = \`There are \${projectCount} project groups tracked: \${projects.join(', ')}\${projectCount > 5 ? ' and others' : ''}.\`;
            } else if (q.includes('people') || q.includes('who')) {
                const peopleCount = Object.keys(kb.people || {}).length;
                const topPeople = Object.entries(kb.people || {})
                    .sort((a, b) => (b[1].mentions || 0) - (a[1].mentions || 0))
                    .slice(0, 3)
                    .map(([name]) => name);
                answer = \`There are \${peopleCount} people mentioned. Most active: \${topPeople.join(', ')}.\`;
            } else if (q.includes('communication') || q.includes('message')) {
                const commCount = (kb.communications || []).length;
                const sources = [...new Set((kb.communications || []).map(c => c.source))];
                answer = \`There are \${commCount} communications from sources: \${sources.join(', ')}.\`;
            } else if (q.includes('client')) {
                const clients = Object.keys(kb.people || {}).filter(name => name.includes('[Client]'));
                answer = clients.length > 0 ? 
                    \`Identified clients: \${clients.join(', ')}\` : 
                    'No clients specifically identified with [Client] tags.';
            } else if (q.includes('recent') || q.includes('latest')) {
                const recentComms = (kb.communications || [])
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 3);
                answer = recentComms.length > 0 ?
                    \`Recent communications: \${recentComms.map(c => \`\${c.source} from \${c.from || 'unknown'} on \${new Date(c.date).toLocaleDateString()}\`).join('; ')}\` :
                    'No recent communications found.';
            } else {
                answer = \`I can help you explore the knowledge base containing \${Object.keys(kb.projectGroups || {}).length} projects, \${Object.keys(kb.people || {}).length} people, and \${(kb.communications || []).length} communications. Try asking about specific projects, people, or communication patterns.\`;
            }
            
            output.innerHTML = \`
                <p><strong>Q:</strong> \${question}</p>
                <p><strong>A:</strong> \${answer}</p>
            \`;
            output.style.display = 'block';
        }
        
        function showError(message) {
            document.body.innerHTML = \`
                <div class="error">
                    <h2>❌ Error</h2>
                    <p>\${message}</p>
                    <p>Please check the console for more details.</p>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
}
