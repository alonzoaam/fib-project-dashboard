window.KNOWLEDGE_BASE = {
  "communications": [
    {
      "id": "email_001",
      "date": "2024-10-29",
      "source": "email",
      "line": 2,
      "content": "Green light for the second batch of dialogue data! Based on what we learned from batch 1, we've refined the examples but keeping same basic parameters: 44M examples this time (smaller than batch 1 to test new pattern types). Same guidelines: https://guidelines.client/rlhf/v1. Data drop: https://data.client/dialogue3. Looking at Dec 10 delivery, Dec 15 latest. Once you've had a chance to review these examples, I'll send batch 3 which incorporates more complex interaction patterns (91k examples).",
      "from": "Lisa Park",
      "to": "Nina Patel, Data Operations Team",
      "projects": ["RLHF Dialogue Data", "RLHF Projects"],
      "people": ["Lisa Park", "Nina Patel"],
      "actionItems": ["Review examples", "Send batch 3"],
      "links": ["https://guidelines.client/rlhf/v1", "https://data.client/dialogue3"],
      "volumes": ["44M examples", "91k examples"],
      "timelines": ["Dec 10 delivery", "Dec 15 latest"],
      "priority": "high",
      "type": "email"
    },
    {
      "id": "email_002",
      "date": "2024-10-29",
      "source": "email",
      "line": 28,
      "content": "Safety classifier dataset project (12k examples) - James, I know you've been tagged for this. We can be a bit flexible on timing - ideally by Nov 2, but internal deadline isn't till 11/5/23. Guidelines at https://guidelines.client/safety/v3. Haven't kicked this off yet but marking it as high priority for next sprint.",
      "from": "Sarah Miller",
      "to": "Data Strategy Team, ML Infrastructure, James Wilson",
      "projects": ["Safety Classifier Dataset", "Safety Classifier"],
      "people": ["Sarah Miller", "James Wilson"],
      "actionItems": ["Start safety classifier project"],
      "links": ["https://guidelines.client/safety/v3"],
      "volumes": ["12k examples"],
      "timelines": ["Nov 2", "11/5/23"],
      "priority": "high",
      "type": "email"
    },
    {
      "id": "slack_001",
      "date": "2024-10-29",
      "source": "slack",
      "line": 8,
      "content": "we can probably do 48h if we prioritize it. it's only 3.5k examples. let me check with the team",
      "from": "Maria Santos",
      "to": "Bill Wong",
      "projects": [],
      "people": ["Maria Santos", "Bill Wong"],
      "actionItems": ["Check with team"],
      "links": [],
      "volumes": ["3.5k examples"],
      "timelines": ["48h"],
      "priority": "normal",
      "type": "message"
    },
    {
      "id": "slack_002",
      "date": "2024-10-29",
      "source": "slack",
      "line": 16,
      "content": "heads up - client wants Q4 safety evals by nov 1, but with current capacity we need 72h minimum to do this properly 🤷‍♀️",
      "from": "Maria Santos",
      "to": "#project-updates",
      "projects": ["Q4 Safety Evaluations", "Q4 Evals"],
      "people": ["Maria Santos"],
      "actionItems": [],
      "links": [],
      "volumes": [],
      "timelines": ["nov 1", "72h"],
      "priority": "urgent",
      "type": "message"
    },
    {
      "id": "calendar_001",
      "date": "2024-10-31",
      "source": "calendar",
      "line": 4,
      "content": "Safety Classifier Dataset Kickoff - Kicking off new safety classifier project. Will cover: Project scope and timeline, Data requirements and quality standards, Team assignments and responsibilities, Technical implementation approach",
      "from": "James Wilson",
      "to": "Sarah Miller, ML Team, Data Quality Team",
      "projects": ["Safety Classifier Dataset"],
      "people": ["James Wilson", "Sarah Miller"],
      "actionItems": ["Review project scope", "Assign team responsibilities"],
      "links": [],
      "volumes": [],
      "timelines": ["Oct 31, 2024, 2:00p-3:00p"],
      "priority": "normal",
      "type": "calendar"
    },
    {
      "id": "meeting_001",
      "date": "2024-10-30",
      "source": "meeting",
      "line": 12,
      "content": "Weekly Data Operations Standup - Updates: RLHF dialogue batch 2 in progress (40% complete), Quality review found some edge cases in safety evals, New GPU cluster deployment pushed to December. Action items: Nina to coordinate with client on batch 3 timeline, Alex to review edge case handling in safety protocols, Team to prepare capacity planning for Q4 rush",
      "from": "Nina Patel",
      "to": "Data Operations Team",
      "projects": ["RLHF Dialogue Data", "Q4 Safety Evaluations"],
      "people": ["Nina Patel", "Alex Kumar"],
      "actionItems": ["Coordinate batch 3 timeline", "Review edge case handling", "Prepare capacity planning"],
      "links": [],
      "volumes": [],
      "timelines": ["December", "Q4"],
      "priority": "normal",
      "type": "meeting"
    }
  ],
  "projectGroups": {
    "RLHF Projects": {
      "variants": ["RLHF Dialogue Data", "RLHF Safety Evaluations", "RLHF", "rlhf"],
      "totalMentions": 8,
      "communications": [
        {
          "id": "email_001",
          "source": "email",
          "line": 2,
          "content": "Green light for the second batch of dialogue data...",
          "variant": "RLHF Dialogue Data"
        },
        {
          "id": "meeting_001",
          "source": "meeting", 
          "line": 12,
          "content": "RLHF dialogue batch 2 in progress (40% complete)...",
          "variant": "RLHF Dialogue Data"
        }
      ],
      "timeline": "Dec 10-15, 2024",
      "volume": "44M examples",
      "primaryOwner": "Nina Patel",
      "clientContact": "Lisa Park",
      "status": "in-progress"
    },
    "Safety Classifier": {
      "variants": ["Safety Classifier Dataset", "Safety Classifier", "safety classifier"],
      "totalMentions": 5,
      "communications": [
        {
          "id": "email_002",
          "source": "email",
          "line": 28,
          "content": "Safety classifier dataset project (12k examples)...",
          "variant": "Safety Classifier Dataset"
        },
        {
          "id": "calendar_001",
          "source": "calendar",
          "line": 4,
          "content": "Safety Classifier Dataset Kickoff...",
          "variant": "Safety Classifier Dataset"
        }
      ],
      "timeline": "Nov 2, 2024",
      "volume": "12k examples",
      "primaryOwner": "James Wilson",
      "clientContact": "Sarah Miller",
      "status": "planning"
    },
    "Q4 Safety Evaluations": {
      "variants": ["Q4 Safety Evaluations", "Q4 Evals", "safety evals"],
      "totalMentions": 3,
      "communications": [
        {
          "id": "slack_002",
          "source": "slack",
          "line": 16,
          "content": "client wants Q4 safety evals by nov 1...",
          "variant": "Q4 Safety Evaluations"
        },
        {
          "id": "meeting_001",
          "source": "meeting",
          "line": 12,
          "content": "Quality review found some edge cases in safety evals...",
          "variant": "Q4 Safety Evaluations"
        }
      ],
      "timeline": "Nov 1, 2024",
      "volume": "TBD",
      "primaryOwner": "Maria Santos",
      "clientContact": "Unknown",
      "status": "urgent"
    }
  },
  "people": {
    "Lisa Park": {
      "mentions": 2,
      "projects": ["RLHF Projects"],
      "roles": ["Client Contact"],
      "isClient": true
    },
    "Nina Patel": {
      "mentions": 4,
      "projects": ["RLHF Projects"],
      "roles": ["Data Operations Lead"],
      "isClient": false
    },
    "Sarah Miller": {
      "mentions": 3,
      "projects": ["Safety Classifier"],
      "roles": ["Client Contact", "Project Manager"],
      "isClient": true
    },
    "James Wilson": {
      "mentions": 3,
      "projects": ["Safety Classifier"],
      "roles": ["Technical Lead"],
      "isClient": false
    },
    "Maria Santos": {
      "mentions": 4,
      "projects": ["Q4 Safety Evaluations"],
      "roles": ["Operations Manager"],
      "isClient": false
    },
    "Alex Kumar": {
      "mentions": 2,
      "projects": ["Q4 Safety Evaluations"],
      "roles": ["Quality Engineer"],
      "isClient": false
    }
  },
  "keywords": {
    "urgent": 2,
    "priority": 3,
    "deadline": 4,
    "examples": 6,
    "batch": 3
  },
  "metadata": {
    "buildDate": "2025-09-03T16:00:00Z",
    "totalProjects": 3,
    "totalCommunications": 6,
    "lastUpdated": "2025-09-03T16:00:00Z",
    "totalPeople": 6
  },
  "initialConfig": {
    "projectPatterns": [
      "RLHF Dialogue Data",
      "RLHF Safety Evaluations", 
      "Safety Classifier Dataset",
      "Q4 Safety Evaluations"
    ],
    "peoplePatterns": [
      "Lisa Park",
      "Nina Patel",
      "Sarah Miller",
      "James Wilson", 
      "Maria Santos",
      "Alex Kumar"
    ],
    "keywordPatterns": [
      "urgent", "priority", "deadline", "examples", "batch", "complete", "blocked"
    ],
    "clientPatterns": [
      "[Client]"
    ],
    "statusKeywords": [
      "blocked", "at risk", "on track", "complete", "urgent", "planning"
    ]
  }
};