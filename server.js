// server.js - Deploy this to Render.com
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for Make.com
app.use(cors());
app.use(express.json());

// Updated table mapping data with all new tables from Google Calendar
const tableMapping = [
  // Inside tables (Binnen) - Priority 1 (highest)
  {
    "name": "Tafel 7 Binnen",
    "capacity": 2,
    "calendarId": "4059e99a26abecfffe6088745ee4b36c224cf417106ed653f1bc34492dc662bf@group.calendar.google.com",
    "type": "inside",
    "priority": 1
  },
  {
    "name": "Tafel 8 Binnen",
    "capacity": 3,
    "calendarId": "c2349d791c4a9132fb25697525a03cc6f6ac19eb0c85f3ca8f7802babea28bd0@group.calendar.google.com",
    "type": "inside",
    "priority": 1
  },
  {
    "name": "Tafel 9 Binnen",
    "capacity": 4,
    "calendarId": "0333dccfb2bd968c4a9aab47d192314c39c58f1074b558d628c1e1bd88a96fc2@group.calendar.google.com",
    "type": "inside",
    "priority": 1
  },
  
  // Window tables (Raam) - Priority 2
  {
    "name": "Tafel 1 Raam",
    "capacity": 2,
    "calendarId": "cd5b13df801bb7f4851daa24e8b1ed29978e96ec3080796d7488ae743368111d@group.calendar.google.com",
    "type": "window",
    "priority": 2
  },
  {
    "name": "Tafel 2 Raam",
    "capacity": 3,
    "calendarId": "d355d099e805d4f64d4ab740e3b50fa67d7bcdd7dd7e25943aa58ed9c53155cc@group.calendar.google.com",
    "type": "window",
    "priority": 2
  },
  {
    "name": "Tafel 3 Raam",
    "capacity": 4,
    "calendarId": "179a989e03b77a900a444a4a5e900296446a5bccc70100f6de5dca226f549ae9@group.calendar.google.com",
    "type": "window",
    "priority": 2
  },
  {
    "name": "Tafel Raam",
    "capacity": 8,
    "calendarId": "993e6379bc1d5fbef15269d174f1963799ff3db2112ed99a2a5f2df7ad5866d7@group.calendar.google.com",
    "type": "window",
    "priority": 2
  },
  
  // Terrace tables (Terras) - Priority 3
  {
    "name": "Tafel 4 Terras",
    "capacity": 2,
    "calendarId": "566ed6f6d6d186f85c10d0a0d8e22b8da86fd0a88a2d267905805b397ea5d142@group.calendar.google.com",
    "type": "outside",
    "priority": 3
  },
  {
    "name": "Tafel 5 Terras",
    "capacity": 3,
    "calendarId": "5db88b9fb6bc14a8655e287bf0652b03e3fe2654a355aef70b3a98ddcbea6433@group.calendar.google.com",
    "type": "outside",
    "priority": 3
  },
  {
    "name": "Tafel 6 Terras",
    "capacity": 4,
    "calendarId": "4c073c15b8208787ad606e5dd79dd5799086b0b6cf795a092db377ff4bab615d@group.calendar.google.com",
    "type": "outside",
    "priority": 3
  },
  {
    "name": "Terras Tafel",
    "capacity": 8,
    "calendarId": "7c9bfa9e99b1b96c4bf84be1a2065a28fa17f65d108e304479be27c177d7f88d@group.calendar.google.com",
    "type": "outside",
    "priority": 3
  },
  
  // Party table - Priority 4 (lowest, for large groups)
  {
    "name": "Party Tafel",
    "capacity": 8,
    "calendarId": "f4e182c05edf935f743ddbc2f1359de6a1cd2fd71eeaa3126debea6a1c15bc12@group.calendar.google.com",
    "type": "party",
    "priority": 4
  }
];

// Enhanced table selection logic endpoint
app.post('/select-table', (req, res) => {
  try {
    const { partySize, tablePreference, actionType } = req.body;
    
    // Handle cancellations and rescheduling - return all calendars for searching
    if (actionType === 'annuleren' || actionType === 'cancel' || actionType === 'verzetten') {
      return res.json({
        success: true,
        actionType: actionType === 'verzetten' ? 'reschedule' : 'cancellation',
        allCalendars: tableMapping.map(table => ({
          name: table.name,
          calendarId: table.calendarId,
          type: table.type
        })),
        message: `All calendars returned for event search and ${actionType === 'verzetten' ? 'rescheduling' : 'deletion'}`
      });
    }

    if (!partySize) {
      return res.status(400).json({ error: 'partySize is required' });
    }

    const requestedSize = parseInt(partySize);

    // Filter tables that can accommodate the party size
    let suitableTables = tableMapping.filter(table => table.capacity >= requestedSize);

    // Find exact match first
    let selectedTable = suitableTables.find(table => table.name === tablePreference);

    // If no exact match, find by type preference with priority
    if (!selectedTable) {
      if (tablePreference && (
          tablePreference.toLowerCase().includes('terras') || 
          tablePreference.toLowerCase().includes('buiten') ||
          tablePreference.toLowerCase().includes('outside')
        )) {
        // Prefer terrace tables, smallest suitable first
        selectedTable = suitableTables
          .filter(table => table.type === 'outside')
          .sort((a, b) => a.capacity - b.capacity)[0];
      } else if (tablePreference && (
          tablePreference.toLowerCase().includes('raam') ||
          tablePreference.toLowerCase().includes('window')
        )) {
        // Prefer window tables, smallest suitable first
        selectedTable = suitableTables
          .filter(table => table.type === 'window')
          .sort((a, b) => a.capacity - b.capacity)[0];
      } else if (tablePreference && (
          tablePreference.toLowerCase().includes('binnen') ||
          tablePreference.toLowerCase().includes('inside')
        )) {
        // Prefer inside tables, smallest suitable first
        selectedTable = suitableTables
          .filter(table => table.type === 'inside')
          .sort((a, b) => a.capacity - b.capacity)[0];
      } else if (tablePreference && (
          tablePreference.toLowerCase().includes('party') ||
          requestedSize >= 6
        )) {
        // For large groups or party requests
        selectedTable = suitableTables
          .filter(table => table.type === 'party')
          .sort((a, b) => a.capacity - b.capacity)[0];
      } else {
        // Default selection: inside first, then window, then outside, smallest suitable first
        selectedTable = suitableTables
          .filter(table => table.type === 'inside')
          .sort((a, b) => a.capacity - b.capacity)[0];
        
        if (!selectedTable) {
          selectedTable = suitableTables
            .filter(table => table.type === 'window')
            .sort((a, b) => a.capacity - b.capacity)[0];
        }
        
        if (!selectedTable) {
          selectedTable = suitableTables
            .filter(table => table.type === 'outside')
            .sort((a, b) => a.capacity - b.capacity)[0];
        }
      }
    }

    // Final fallback: pick any suitable table by priority, then capacity
    if (!selectedTable && suitableTables.length > 0) {
      selectedTable = suitableTables.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.capacity - b.capacity;
      })[0];
    }

    if (!selectedTable) {
      return res.status(404).json({ 
        error: 'No suitable table found',
        partySize: partySize,
        tablePreference: tablePreference,
        message: `Geen tafel beschikbaar voor ${partySize} personen`,
        availableTables: tableMapping.map(t => ({ name: t.name, capacity: t.capacity, type: t.type }))
      });
    }

    res.json({
      success: true,
      selectedTable: selectedTable,
      reasoning: {
        partySize: partySize,
        requestedTable: tablePreference,
        selectionMethod: selectedTable.name === tablePreference ? 'exact_match' : 'smart_selection',
        tableType: selectedTable.type,
        capacity: selectedTable.capacity
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get all tables endpoint with filtering options
app.get('/tables', (req, res) => {
  const { type, minCapacity, maxCapacity } = req.query;
  
  let filteredTables = tableMapping;
  
  if (type) {
    filteredTables = filteredTables.filter(table => table.type === type);
  }
  
  if (minCapacity) {
    filteredTables = filteredTables.filter(table => table.capacity >= parseInt(minCapacity));
  }
  
  if (maxCapacity) {
    filteredTables = filteredTables.filter(table => table.capacity <= parseInt(maxCapacity));
  }
  
  res.json({
    success: true,
    tables: filteredTables,
    total_tables: filteredTables.length,
    summary: {
      inside: tableMapping.filter(t => t.type === 'inside').length,
      window: tableMapping.filter(t => t.type === 'window').length,
      outside: tableMapping.filter(t => t.type === 'outside').length,
      party: tableMapping.filter(t => t.type === 'party').length,
      total: tableMapping.length
    }
  });
});

// Get table by calendar ID
app.get('/table/:calendarId', (req, res) => {
  const { calendarId } = req.params;
  const table = tableMapping.find(t => t.calendarId === calendarId);
  
  if (!table) {
    return res.status(404).json({
      error: 'Table not found',
      calendarId: calendarId
    });
  }
  
  res.json({
    success: true,
    table: table
  });
});

// Health check with updated info
app.get('/', (req, res) => {
  res.json({ 
    status: 'AI Pilots Table Mapping API is running',
    version: '2.0.0',
    lastUpdated: '2025-01-27',
    tableCount: tableMapping.length,
    tableTypes: {
      inside: tableMapping.filter(t => t.type === 'inside').length,
      window: tableMapping.filter(t => t.type === 'window').length,
      outside: tableMapping.filter(t => t.type === 'outside').length,
      party: tableMapping.filter(t => t.type === 'party').length
    },
    endpoints: {
      'POST /select-table': 'Select best table based on party size and preference',
      'GET /tables': 'Get all available tables (with optional filters: ?type=inside&minCapacity=2)',
      'GET /table/:calendarId': 'Get specific table by calendar ID',
      'GET /': 'Health check and API info'
    },
    example_requests: [
      {
        url: '/select-table',
        method: 'POST',
        body: {
          partySize: 4,
          tablePreference: 'Tafel Raam'
        }
      },
      {
        url: '/select-table',
        method: 'POST', 
        body: {
          actionType: 'annuleren',
          partySize: '',
          tablePreference: ''
        }
      },
      {
        url: '/select-table',
        method: 'POST', 
        body: {
          actionType: 'verzetten',
          partySize: '',
          tablePreference: ''
        }
      },
      {
        url: '/tables?type=inside&minCapacity=3',
        method: 'GET'
      }
    ]
  });
});

app.listen(port, () => {
  console.log(`AI Pilots Table Mapping API v2.0 running on port ${port}`);
  console.log(`Managing ${tableMapping.length} tables:`);
  console.log(`- Inside tables: ${tableMapping.filter(t => t.type === 'inside').length}`);
  console.log(`- Window tables: ${tableMapping.filter(t => t.type === 'window').length}`);
  console.log(`- Outside tables: ${tableMapping.filter(t => t.type === 'outside').length}`);
  console.log(`- Party tables: ${tableMapping.filter(t => t.type === 'party').length}`);
});
