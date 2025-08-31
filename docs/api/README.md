# API Documentation

## Search API

### Endpoints
- **GET** `/data/search-index.json` - Search index data
- **GET** `/data/latest.json` - Latest notes
- **GET** `/data/index.json` - All notes index

### Search Parameters
- `q` - Search query string
- `category` - Filter by category (cigars, pipe, etc.)
- `rating` - Filter by rating (high, medium, low)
- `date` - Filter by date range (week, month, year)

### Response Format
```json
{
  "title": "Note Title",
  "category": "cigars",
  "date": "2024-08-31",
  "rating": "4/5",
  "author": "username",
  "path": "notes/cigars/2024-08-31-note.md",
  "tags": ["tag1", "tag2"],
  "search_text": "searchable content"
}
```

## Validation API

### Content Validation
- Validates note metadata and format
- Checks required fields and structure
- Validates links and references

### Performance Validation
- Monitors Web Vitals (LCP, FID, CLS)
- Validates resource sizes and loading times
- Generates optimization recommendations

### Accessibility Validation
- WCAG 2.1 compliance checking
- Keyboard navigation testing
- Screen reader compatibility validation
