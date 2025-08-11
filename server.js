// server.js - Deploy this to Render.com
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for Make.com
app.use(cors());
app.use(express.json());

// Table mapping data with priority
const tableMapping = [
  {
    "name": "Tafel 1",
    "capacity": 2,
    "calendarId": "cd5b13df801bb7f4851daa24e8b1ed29978e96ec3080796d7488ae743368111d@group.calendar.google.com",
    "type": "inside",
    "priority": 1
  },
  {
    "name": "Tafel 2",
    "capacity": 3,
    "calendarId": "d355d099e805d4f64d4ab740e3b50fa67d7bcdd7dd7e25943aa58ed9c53155cc@group.calendar.google.com",
    "type": "inside",
    "priority": 1
  },
  {
    "name": "Tafel 3",
    "capacity": 4,
    "calendarId": "179a989e03b77a900a444a4a5e900296446a5bccc70100f6de5dca226f549ae9@group.calendar.google.com",
    "type": "inside",
    "priority": 1
  },
  {
    "name": "Tafel Raam",
    "capacity": 10,
    "calendarId": "993e6379bc1d5fbef15269d174f1963799ff3db2112ed99a2a5f2df7ad5866d7@group.calendar.google.com",
    "type": "window",
    "priority": 2
  },
  {
    "name": "Terras Tafel",
    "capacity": 10,
    "calendarId": "7c9bfa9e99b1b96c4bf84be1a2065a28fa17f65d108e304479be27c177d7f88d@group.calendar.google.com",
    "type": "outside",
    "priority": 3
  },
  {
    "name": "Party Tafel",
    "capacity": 8,
    "calendarId": "f4e182c05edf935f743ddbc2f1359de6a1cd2fd71eeaa3126debea6a1c15bc12@group.calendar.google.com",
    "type": "inside",
    "priority": 4
  }
];

// Table selection logic endpoint
app.post('/select-table', (req, res) => {
  try {
    const { partySize, tablePreference } = req.body;
    
    if (!partySize) {
      return res.status(400).json({ error: 'partySize is required' });
    }

    // Filter tables that can accommodate the party size
    let suitableTables = tableMapping.filter(table => table.capacity >= parseInt(partySize));

    // Find exact match first
    let selectedTable = suitableTables.find(table => table.name === tablePreference);

    // If no exact match, find by type with priority
    if (!selectedTable) {
      if (tablePreference && (tablePreference.toLowerCase().includes('terras') || 
          tablePreference.toLowerCase().includes('buiten'))) {
        selectedTable = suitableTables.find(table => table.type === 'outside');
      } else if (tablePreference && tablePreference.toLowerCase().includes('raam')) {
        selectedTable = suitableTables.find(table => table.type === 'window');
      } else {
        // Default to inside tables, pick by priority (lowest number = highest priority)
        selectedTable = suitableTables
          .filter(table => table.type === 'inside')
          .sort((a, b) => a.priority - b.priority)[0];
      }
    }

    // Final fallback: pick any suitable table by priority
    if (!selectedTable && suitableTables.length > 0) {
      selectedTable = suitableTables.sort((a, b) => a.priority - b.priority)[0];
    }

    if (!selectedTable) {
      return res.status(404).json({ 
        error: 'No suitable table found',
        partySize: partySize,
        tablePreference: tablePreference,
        message: `Geen tafel beschikbaar voor ${partySize} personen`
      });
    }

    res.json({
      success: true,
      selectedTable: selectedTable,
      reasoning: {
        partySize: partySize,
        requestedTable: tablePreference,
        selectionMethod: selectedTable.name === tablePreference ? 'exact_match' : 'smart_selection'
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get all tables endpoint
app.get('/tables', (req, res) => {
  res.json({
    success: true,
    tables: tableMapping,
    total_tables: tableMapping.length
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'AI Pilots Table Mapping API is running',
    version: '1.0.0',
    endpoints: {
      'POST /select-table': 'Select best table based on party size and preference',
      'GET /tables': 'Get all available tables',
      'GET /': 'Health check'
    },
    example_request: {
      url: '/select-table',
      method: 'POST',
      body: {
        partySize: 4,
        tablePreference: 'Tafel Raam'
      }
    }
  });
});

app.listen(port, () => {
  console.log(`AI Pilots Table Mapping API running on port ${port}`);
  console.log(`Managing ${tableMapping.length} tables`);
});