/**
 * Document Validation System
 * Validates documents based on validation ID from URL query parameter
 */

class DocumentValidator {
    constructor() {
        this.documents = [];
        this.validationId = null;
        this.currentDocument = null;
        this.init();
    }
    
    /**
     * Initialize the validator
     */
    async init() {
        try {
            // Get validation ID from URL
            this.validationId = this.getValidationIdFromUrl();
            
            // Load documents data
            await this.loadDocuments();
            
            // Validate document
            this.validateDocument();
        } catch (error) {
            console.error('Error initializing validator:', error);
            let errorMessage = 'Failed to load validation system';
            
            // Provide more specific error messages
            if (error.message.includes('HTTP error')) {
                errorMessage = `Failed to load documents database. HTTP Status: ${error.message}`;
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Unable to load documents database. Please ensure you are accessing this page through a web server (not file://).';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'Invalid documents database format. Please check documents.json syntax.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            this.showErrorState(errorMessage);
        }
    }

    /**
     * Extract validation ID from URL query parameter
     * @returns {string|null} Validation ID or null if not found
     */
    getValidationIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || null;
    }

    /**
     * Load documents from JSON file
     */
    async loadDocuments() {
        let jsonPath = 'documents.json'; // Declare outside try for error handling
        try {
            // Use relative path - documents.json is in the same directory as index.html
            // Calculate base path from current page location
            const pathname = window.location.pathname;
            let basePath = '';
            
            // If we have a pathname with slashes, extract the directory
            if (pathname && pathname.includes('/')) {
                const lastSlashIndex = pathname.lastIndexOf('/');
                if (lastSlashIndex >= 0) {
                    basePath = pathname.substring(0, lastSlashIndex + 1);
                }
            }
            
            jsonPath = basePath + 'documents.json';
            
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const jsonData = await response.json();
            
            // Validate JSON structure
            if (!Array.isArray(jsonData)) {
                throw new Error('Invalid JSON format: documents.json must be an array');
            }
            
            this.documents = jsonData;
        } catch (error) {
            console.error('Error loading documents:', error);
            console.error('Attempted path:', jsonPath);
            console.error('Current pathname:', window.location.pathname);
            // Re-throw with more context
            if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed'))) {
                const protocol = window.location.protocol;
                if (protocol === 'file:') {
                    throw new Error('Cannot load documents when opening file directly. Please use a web server (e.g., http://localhost:3033).');
                }
                throw new Error(`Failed to fetch documents.json from path: ${jsonPath}. Make sure the file exists and is accessible.`);
            }
            throw error;
        }
    }

    /**
     * Find document by validation ID
     * @param {string} validationId - The validation ID to search for
     * @returns {Object|null} Document object or null if not found
     */
    findDocumentByValidationId(validationId) {
        return this.documents.find(doc => doc.validationId === validationId) || null;
    }

    /**
     * Get latest version of a document by document ID
     * @param {string} documentId - The document ID
     * @returns {Object|null} Latest document version or null if not found
     */
    getLatestDocumentVersion(documentId) {
        const documentVersions = this.documents
            .filter(doc => doc.documentId === documentId)
            .sort((a, b) => {
                // First sort by version (semantic versioning)
                const versionCompare = this.compareVersions(a.version, b.version);
                if (versionCompare !== 0) {
                    return -versionCompare; // Descending order
                }
                // If versions are equal, sort by date (newest first)
                return new Date(b.date) - new Date(a.date);
            });
        
        return documentVersions.length > 0 ? documentVersions[0] : null;
    }

    /**
     * Compare two semantic versions
     * @param {string} version1 - First version
     * @param {string} version2 - Second version
     * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
     */
    compareVersions(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        
        const maxLength = Math.max(v1Parts.length, v2Parts.length);
        
        for (let i = 0; i < maxLength; i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            
            if (v1Part < v2Part) return -1;
            if (v1Part > v2Part) return 1;
        }
        
        return 0;
    }

    /**
     * Check if document is the latest version
     * @param {Object} document - Document to check
     * @returns {boolean} True if document is latest version
     */
    isLatestVersion(document) {
        const latest = this.getLatestDocumentVersion(document.documentId);
        if (!latest) return false;
        
        // Compare by version and date
        const versionCompare = this.compareVersions(document.version, latest.version);
        if (versionCompare !== 0) {
            return versionCompare > 0; // Current document has higher version
        }
        
        // If versions are equal, compare by date
        return new Date(document.date) >= new Date(latest.date);
    }

    /**
     * Validate the document and display results
     */
    validateDocument() {
        // No validation ID provided
        if (!this.validationId) {
            this.showGrayState('No validation ID provided', 'Please provide a validation ID in the URL query parameter (e.g., ?id=CNLA78)');
            return;
        }

        // Find document by validation ID
        this.currentDocument = this.findDocumentByValidationId(this.validationId);

        // Document not found
        if (!this.currentDocument) {
            this.showGrayState('Document not found', `The validation ID "${this.validationId}" could not be found in our records.`);
            return;
        }

        // Check if document is latest version
        const isLatest = this.isLatestVersion(this.currentDocument);
        
        if (isLatest) {
            this.showValidState();
        } else {
            const latestDocument = this.getLatestDocumentVersion(this.currentDocument.documentId);
            this.showInvalidState(latestDocument);
        }
    }

    /**
     * Display valid state
     */
    showValidState() {
        const container = document.getElementById('container');
        const statusSection = document.getElementById('statusSection');
        const documentInfo = document.getElementById('documentInfo');
        const logoSection = document.querySelector('.logo-section');

        container.className = 'container';
        statusSection.className = 'status-section status-valid';
        
        // Update logo section with valid state colors
        if (logoSection) {
            logoSection.className = 'logo-section logo-valid';
        }
        
        statusSection.innerHTML = `
            <div class="status-icon"></div>
            <h2 class="status-title">Document Valid</h2>
            <p class="status-message">This document is valid and is the latest version.</p>
        `;

        documentInfo.className = 'document-info';
        documentInfo.innerHTML = this.generateDocumentInfo(this.currentDocument);
    }

    /**
     * Display invalid state (not latest version)
     */
    showInvalidState(latestDocument) {
        const container = document.getElementById('container');
        const statusSection = document.getElementById('statusSection');
        const documentInfo = document.getElementById('documentInfo');
        const logoSection = document.querySelector('.logo-section');

        container.className = 'container';
        statusSection.className = 'status-section status-invalid';
        
        // Update logo section with invalid state colors (orange to red)
        if (logoSection) {
            logoSection.className = 'logo-section logo-invalid';
        }
        
        statusSection.innerHTML = `
            <div class="status-icon"></div>
            <h2 class="status-title">Document Not Latest</h2>
            <p class="status-message">This document is valid but not the latest version. Please use the latest version for reference.</p>
            <div class="latest-info">
                <div class="latest-info-title">Latest Version</div>
                <div class="latest-info-content">
                    Validation ID: <span class="latest-validation-id">${latestDocument.validationId}</span><br>
                    Version: ${latestDocument.version}<br>
                    Date: ${this.formatDate(latestDocument.date)}
                </div>
            </div>
        `;

        documentInfo.className = 'document-info';
        documentInfo.innerHTML = this.generateDocumentInfo(this.currentDocument, false);
    }

    /**
     * Display gray state (no ID or not found)
     */
    showGrayState(title, message) {
        const container = document.getElementById('container');
        const statusSection = document.getElementById('statusSection');
        const documentInfo = document.getElementById('documentInfo');
        const logoSection = document.querySelector('.logo-section');

        container.className = 'container';
        statusSection.className = 'status-section status-gray';
        
        // Update logo section with theme colors (default)
        if (logoSection) {
            logoSection.className = 'logo-section logo-theme';
        }
        
        statusSection.innerHTML = `
            <div class="status-icon"></div>
            <h2 class="status-title">${title}</h2>
            <p class="status-message">${message}</p>
        `;

        documentInfo.className = 'document-info hidden';
    }

    /**
     * Display error state
     */
    showErrorState(message) {
        this.showGrayState('Error', message);
    }

    /**
     * Generate document information HTML
     */
    generateDocumentInfo(document, showLink = true) {
        const html = `
            <div class="document-detail">
                <div class="document-detail-label">Document Name</div>
                <div class="document-detail-value">${this.escapeHtml(document.documentName)}</div>
            </div>
            <div class="document-detail">
                <div class="document-detail-label">Document ID</div>
                <div class="document-detail-value">${this.escapeHtml(document.documentId)}</div>
            </div>
            <div class="document-detail">
                <div class="document-detail-label">Validation ID</div>
                <div class="document-detail-value validation-id">${this.escapeHtml(document.validationId)}</div>
            </div>
            <div class="document-detail">
                <div class="document-detail-label">Version</div>
                <div class="document-detail-value">${this.escapeHtml(document.version)}</div>
            </div>
            <div class="document-detail">
                <div class="document-detail-label">Date</div>
                <div class="document-detail-value">${this.formatDate(document.date)}</div>
            </div>
            ${showLink ? (document.contact ? `
                <div class="contact-info">
                    <div class="contact-label">Contact</div>
                    <div class="contact-value">${this.linkifyText(document.contact)}</div>
                </div>
            ` : document.url ? `
                <a href="${this.escapeHtml(document.url)}" class="document-link" target="_blank">View Document</a>
            ` : '') : ''}
        `;
        return html;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Convert URLs in text to clickable links
     * @param {string} text - Text that may contain URLs
     * @returns {string} HTML with URLs converted to links
     */
    linkifyText(text) {
        if (!text) return '';
        
        // URL regex pattern - matches http://, https://, and www.
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
        
        // Split text by URLs and process each part
        const parts = text.split(urlPattern);
        
        return parts.map(part => {
            // Check if this part is a URL (create new regex instance to avoid lastIndex issues)
            const urlTest = /^(https?:\/\/|www\.)/i;
            if (urlTest.test(part)) {
                // Ensure URL has protocol
                let url = part;
                if (url.startsWith('www.')) {
                    url = 'https://' + url;
                }
                
                // Escape the URL for use in href attribute
                const escapedUrl = this.escapeHtml(url);
                const displayText = this.escapeHtml(part);
                
                return `<a href="${escapedUrl}" class="contact-link" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
            } else {
                // Escape non-URL text
                return this.escapeHtml(part);
            }
        }).join('');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (text === null || text === undefined) {
            return '';
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize validator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DocumentValidator();
    });
} else {
    new DocumentValidator();
}

