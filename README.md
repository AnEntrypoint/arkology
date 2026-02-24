# 📊 Beautiful Spreadsheet Editor

A live, fully-functional Python web application that provides a beautifully sugared spreadsheet interface. Edit, organize, and manage data with real-time persistence.

## ✨ Features

- **Beautiful UI**: Modern gradient design with smooth interactions
- **Live Editing**: Edit cells inline with instant visual feedback
- **Row Management**: Add and delete rows seamlessly
- **Column Management**: Add new columns dynamically
- **Data Persistence**: Automatic JSON-based storage
- **Import/Export**: Save spreadsheets as JSON files
- **Responsive**: Clean, intuitive interface

## 🚀 Getting Started

### Start the Server
```bash
python3 app.py
```

The application will be available at `http://localhost:8000`

### Features in Action

1. **Edit Cells**: Click any cell to edit its content
2. **Add Rows**: Click "+ Row" button to add a new row
3. **Add Columns**: Enter a column name and click "+ Column"
4. **Delete Rows**: Click "Delete" button in any row
5. **Update Column Names**: Click column header to rename
6. **Export Data**: Download spreadsheet as JSON
7. **Import Data**: Load JSON file into spreadsheet

## 🏗️ Architecture

### Backend
- **Pure Python**: Uses only standard library (http.server, json)
- **No external dependencies**: Zero setup required
- **RESTful API**: Simple HTTP endpoints for data operations
- **JSON Storage**: Persistent data in `data/spreadsheet.json`

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **HTML/CSS**: Clean, modern styling
- **Real-time Updates**: Auto-save with status feedback
- **Responsive Design**: Works on desktop and tablet

## 📡 API Endpoints

- `GET /api/data` - Fetch current spreadsheet data
- `POST /api/data` - Save entire spreadsheet
- `DELETE /api/rows/{id}` - Delete a row by ID

## 📁 Project Structure

```
├── app.py                 # Main Python server
├── public/
│   └── index.html        # Beautiful web interface
├── data/
│   └── spreadsheet.json  # Data persistence
└── README.md             # This file
```

## 🎨 UI Highlights

- **Purple Gradient Header**: Eye-catching design
- **Editable Table**: Click to edit any cell
- **Control Panel**: Intuitive buttons for actions
- **Status Messages**: Real-time feedback (save confirmations)
- **Responsive Layout**: Smooth scaling and scrolling

## 💾 Data Format

Spreadsheets are stored as JSON:
```json
{
  "columns": ["Name", "Email", "Phone", "Status"],
  "rows": [
    {
      "id": 1,
      "data": {
        "Name": "John Doe",
        "Email": "john@example.com",
        "Phone": "555-0101",
        "Status": "Active"
      }
    }
  ]
}
```

## 🔄 Loading Your Google Sheet Data

To use your actual Google Sheet data:

1. Export your Google Sheet as JSON or CSV
2. Convert to the format above
3. Place in `data/spreadsheet.json`
4. Refresh the browser

Or use the Import button in the app to upload a JSON file directly.

## 📝 Notes

- Data is automatically saved to JSON on every change
- No database required - files stored locally
- Server runs forever by design (restart-safe)
- All data accessible via REST API
