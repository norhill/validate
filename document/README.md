# Document Validation System

## Overview

This static web page validates documents based on validation IDs provided via URL query parameters. The system checks if a document exists, is valid, and whether it's the latest version.

## URL Format

The validation page is accessed via:
```
validate.norhill.se/document?id={validationId}
```

Example:
```
validate.norhill.se/document?id=CNLA78
```

## Features

- **Document Validation**: Validates documents against a JSON database
- **Version Checking**: Determines if a document is the latest version
- **Visual Status Indicators**: 
  - ✅ Green: Document is valid and latest version
  - ⚠️ Red: Document is valid but not the latest version (shows latest version info)
  - ❓ Gray: No validation ID provided or document not found
- **Responsive Design**: Works on desktop and mobile devices

## File Structure

```
validate/
├── index.html          # Main HTML page
├── styles.css          # Styling for all states
├── validation.js       # Validation logic and UI updates
├── documents.json      # Document database
└── README.md          # This file
```

## Document JSON Structure

The `documents.json` file contains an array of document objects with the following structure:

```json
{
  "documentId": "string (required, unique document identifier)",
  "validationId": "string (required, unique validation identifier)",
  "version": "string (required, semantic versioning, e.g., '1.0.0')",
  "date": "string (required, ISO 8601 date string)",
  "documentName": "string (required, human-readable document name)",
  "url": "string (optional, path or URL to the document)"
}
```

### Example Document Entry

```json
{
  "documentId": "DOC-001",
  "validationId": "CNLA78",
  "version": "1.0.0",
  "date": "2024-01-15T10:00:00Z",
  "documentName": "Service Agreement Template",
  "url": "/documents/contracts/templates/customer/service-agreement-v1.pdf"
}
```

## Validation Logic

1. **Extract Validation ID**: Reads the `id` parameter from the URL query string
2. **Load Documents**: Fetches the `documents.json` file
3. **Find Document**: Searches for a document matching the validation ID
4. **Check Version**: 
   - Groups documents by `documentId`
   - Sorts by version (semantic versioning) and date
   - Determines if the found document is the latest version
5. **Display Result**: Shows appropriate status based on validation result

## Status States

### Valid (Green)
- Document found and is the latest version
- Shows document details and link to view document

### Invalid - Not Latest (Red)
- Document found but is not the latest version
- Shows current document details
- Displays information about the latest version (validation ID, version, date)

### Not Found / No ID (Gray)
- No validation ID provided in URL
- OR validation ID not found in database
- Shows appropriate error message

## Adding New Documents

To add a new document to the validation system:

1. Open `documents.json`
2. Add a new document object to the array
3. Ensure all required fields are present
4. Use semantic versioning for the `version` field
5. Use ISO 8601 format for the `date` field

## Deployment

This is a static website that can be deployed to any web server:

1. Upload all files to your web server
2. Ensure `documents.json` is accessible (same origin or CORS configured)
3. Configure your web server to serve `index.html` for the `/document` route
4. Set up DNS for `validate.norhill.se` to point to your server

### Server Configuration Example (Nginx)

```nginx
server {
    server_name validate.norhill.se;
    
    location /document {
        try_files $uri $uri/ /index.html;
    }
    
    location / {
        root /path/to/validate;
        index index.html;
    }
}
```

## Security Considerations

- The validation system only displays document information, it does not expose sensitive data
- Document URLs should be protected if they contain sensitive content
- Consider implementing rate limiting for production use
- The `documents.json` file should be kept up-to-date and secure

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses Fetch API (polyfill may be needed for older browsers)

## Maintenance

- Regularly update `documents.json` when new documents are created
- Remove deprecated documents or mark them with appropriate status
- Monitor for broken document URLs
- Keep version numbers consistent and follow semantic versioning

