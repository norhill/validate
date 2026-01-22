/**
 * Validation Types Index Page
 * Displays available validation types and allows navigation to each type
 */

class ValidationIndex {
    constructor() {
        this.validationTypes = [];
        this.init();
    }

    /**
     * Initialize the index page
     */
    async init() {
        try {
            await this.loadValidationTypes();
            this.renderValidationTypes();
        } catch (error) {
            console.error('Error initializing validation index:', error);
            this.showError('Failed to load validation types', error.message);
        }
    }
    
    /**
     * Load validation types from JSON file
     */
    async loadValidationTypes() {
        try {
            // Try to load validation-types.json
            let jsonPath = 'validation-types.json';
            const pathname = window.location.pathname;
            
            // Calculate base path from current page location
            if (pathname && pathname.includes('/')) {
                const lastSlashIndex = pathname.lastIndexOf('/');
                if (lastSlashIndex >= 0) {
                    const basePath = pathname.substring(0, lastSlashIndex + 1);
                    jsonPath = basePath + 'validation-types.json';
                }
            }
            
            const response = await fetch(jsonPath);
            if (!response.ok) {
                // If validation-types.json doesn't exist, try to discover subfolders
                if (response.status === 404) {
                    console.log('validation-types.json not found, attempting to discover validation types...');
                    await this.discoverValidationTypes();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const jsonData = await response.json();
            
            // Validate JSON structure
            if (!Array.isArray(jsonData)) {
                throw new Error('Invalid JSON format: validation-types.json must be an array');
            }
            
            this.validationTypes = jsonData;
        } catch (error) {
            console.error('Error loading validation types:', error);
            // Try to discover validation types as fallback
            if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
                await this.discoverValidationTypes();
            } else {
                throw error;
            }
        }
    }

    /**
     * Discover validation types by checking for known subfolders
     */
    async discoverValidationTypes() {
        const knownTypes = ['document']; // Known validation type folders
        
        const discoveredTypes = [];
        
        for (const typeId of knownTypes) {
            try {
                // Try to access the index.html or a known file in the subfolder
                const testPath = `${typeId}/index.html`;
                const response = await fetch(testPath, { method: 'HEAD' });
                
                if (response.ok) {
                    // Folder exists, add it to discovered types
                    discoveredTypes.push({
                        id: typeId,
                        name: this.formatTypeName(typeId),
                        description: `Validate ${typeId}s by their validation ID.`,
                        path: typeId,
                        icon: this.getIconForType(typeId),
                        exampleId: null
                    });
                }
            } catch (error) {
                // Folder doesn't exist or not accessible, skip it
                console.log(`Validation type '${typeId}' not found or not accessible`);
            }
        }
        
        if (discoveredTypes.length > 0) {
            this.validationTypes = discoveredTypes;
        } else {
            throw new Error('No validation types found');
        }
    }

    /**
     * Format type ID into a readable name
     */
    formatTypeName(typeId) {
        return typeId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') + ' Validation';
    }

    /**
     * Get icon for validation type
     */
    getIconForType(typeId) {
        const iconMap = {
            'document': '📄',
            'certificate': '📜',
            'contract': '📋',
            'license': '🔐',
            'default': '✓'
        };
        return iconMap[typeId] || iconMap['default'];
    }

    /**
     * Render validation types to the page
     */
    renderValidationTypes() {
        const container = document.getElementById('validationTypes');
        
        if (this.validationTypes.length === 0) {
            container.innerHTML = `
                <div class="error">
                    <div class="error-title">No Validation Types Available</div>
                    <div class="error-message">No validation types were found. Please ensure validation-types.json exists or validation type folders are present.</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.validationTypes.map(type => `
            <a href="${type.path}/index.html" class="validation-type-card">
                <div class="type-header">
                    <div class="type-icon">${this.escapeHtml(type.icon || '✓')}</div>
                    <div class="type-name">${this.escapeHtml(type.name)}</div>
                </div>
                <div class="type-description">${this.escapeHtml(type.description)}</div>
                ${type.exampleId ? `
                    <div class="type-example-container">
                        <div class="type-example-label">Example Validation ID</div>
                        <div class="type-example">${this.escapeHtml(type.exampleId)}</div>
                    </div>
                ` : ''}
            </a>
        `).join('');
    }

    /**
     * Show error state
     */
    showError(title, message) {
        const container = document.getElementById('validationTypes');
        container.innerHTML = `
            <div class="error">
                <div class="error-title">${this.escapeHtml(title)}</div>
                <div class="error-message">${this.escapeHtml(message)}</div>
            </div>
        `;
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

// Initialize index page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ValidationIndex();
    });
} else {
    new ValidationIndex();
}

