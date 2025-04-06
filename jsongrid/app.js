const { createApp } = Vue;

// Sample data
const sampleJsonData = [
  { "id": 1, "productName": "Wireless Mouse", "category": "Electronics", "price": 25.99, "inStock": true },
  { "id": 2, "productName": "Bluetooth Keyboard", "category": "Electronics", "price": 49.50, "inStock": false },
  { "id": 3, "productName": "Laptop Stand", "category": "Accessories", "price": 19.00, "inStock": true },
  { "id": 4, "productName": "USB-C Hub", "category": "Accessories", "price": 35.20, "inStock": true },
  { "id": 5, "productName": "Monitor 27\"", "category": "Electronics", "price": 299.99, "inStock": true },
  { "id": 6, "productName": "Webcam HD", "category": "Electronics", "price": 55.00, "inStock": false },
  { "id": 7, "productName": "Ergonomic Chair", "category": "Furniture", "price": 240.00, "inStock": true },
  { "id": 8, "productName": "Desk Lamp", "category": "Furniture", "price": 32.80, "inStock": true },
  { "id": 9, "productName": "Notebook", "category": "Stationery", "price": 5.99, "inStock": true },
  { "id": 10, "productName": "Pen Set", "category": "Stationery", "price": 12.50, "inStock": true }
];

const sampleJsonString = JSON.stringify(sampleJsonData, null, 2); // Pretty print

createApp({
    data() {
        return {
            jsonInput: sampleJsonString, // Store the raw JSON input as string
            jsonData: null,
            headers: [],
            rows: [],
            error: null,
            fileName: '',
            loading: false,
            filterText: '',
            sortKey: '',
            sortAsc: true,
            isUpdatingFromInput: false,
            viewMode: 'both', // 'both', 'jsonOnly', 'gridOnly'
            isLargeScreen: window.innerWidth >= 992, // Check initial screen size
            lastValidJson: sampleJsonString, // Track the last valid JSON string
            isEditorInitialized: false
        };
    },
    methods: {
        // Initialize the editor with syntax highlighting
        initializeEditor() {
            const jsonEditor = document.getElementById('jsonEditor');
            if (!jsonEditor || this.isEditorInitialized) return;
            
            // Force direct content setting with the sample data without using complex methods
            // This is the most direct way to ensure content is visible
            const formattedJson = JSON.stringify(sampleJsonData, null, 2);
            this.jsonInput = formattedJson;
            
            // Directly set content first
            jsonEditor.textContent = formattedJson;
            
            // Apply basic syntax highlighting
            try {
                const container = document.createElement('div');
                container.className = 'editor-container';
                
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-number-container';
                
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                
                const lines = formattedJson.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const lineNumber = document.createElement('div');
                    lineNumber.className = 'line-number';
                    lineNumber.textContent = (i + 1).toString();
                    lineNumbers.appendChild(lineNumber);
                    
                    const codeLine = document.createElement('div');
                    codeLine.className = 'code-line';
                    codeLine.textContent = lines[i];
                    codeContent.appendChild(codeLine);
                }
                
                container.appendChild(lineNumbers);
                container.appendChild(codeContent);
                
                // Clear and set new content
                jsonEditor.innerHTML = '';
                jsonEditor.appendChild(container);
                
                console.log("JSON Editor initialized using direct method");
            } catch (err) {
                // Fallback to plain text
                jsonEditor.textContent = formattedJson;
                console.error("Error in basic editor initialization:", err);
            }
            
            this.isEditorInitialized = true;
        },
        
        // Update editor content with syntax highlighting
        updateEditorContent(jsonString) {
            const jsonEditor = document.getElementById('jsonEditor');
            if (!jsonEditor) return;
            
            try {
                // Try to format the JSON before displaying
                const formattedJson = this.formatJson(jsonString);
                
                // Update the editor content with the raw text first
                jsonEditor.textContent = formattedJson;
                
                // Apply syntax highlighting
                this.applySyntaxHighlighting(jsonEditor);
                
                // Update our model with the formatted JSON
                this.jsonInput = formattedJson;
                
                console.log("Editor content updated successfully");
            } catch (err) {
                // If parsing fails, just set the raw text
                jsonEditor.textContent = jsonString;
                console.warn("Error formatting JSON:", err);
            }
        },
        
        // Apply syntax highlighting to the editor content
        applySyntaxHighlighting(editor) {
            try {
                // Get the current content
                let content = '';
                if (editor.textContent && editor.textContent.trim() !== '') {
                    content = editor.textContent;
                } else if (this.jsonInput && this.jsonInput.trim() !== '') {
                    content = this.jsonInput;
                } else {
                    // Fallback to sample data
                    content = JSON.stringify(sampleJsonData, null, 2);
                    this.jsonInput = content;
                }
                
                // Skip if content is empty
                if (!content || content.trim() === '') {
                    console.warn('No content to highlight');
                    return;
                }
                
                console.log('Applying syntax highlighting to content:', content.substring(0, 50) + '...');
                
                // Try to clean up common JSON errors
                let cleanContent = content;
                if (content.includes('[') && content.includes(']')) {
                    // Fix trailing commas in arrays
                    cleanContent = content.replace(/,(\s*\])/g, '$1');
                }
                if (content.includes('{') && content.includes('}')) {
                    // Fix trailing commas in objects
                    cleanContent = cleanContent.replace(/,(\s*\})/g, '$1');
                }
                
                try {
                    // Format JSON if possible using the cleaned content
                    const parsedJson = JSON.parse(cleanContent);
                    content = JSON.stringify(parsedJson, null, 2);
                } catch (parseErr) {
                    // If cleaning didn't help, still keep the original formatting
                    console.warn('Could not parse JSON for formatting:', parseErr);
                    
                    // Preserve original content with line breaks
                    // Don't try further JSON formatting
                }
                
                // Create simple DOM structure
                const container = document.createElement('div');
                container.className = 'editor-container';
                
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-number-container';
                
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                
                // Split into lines and add line numbers 
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    // Create line number
                    const lineNumber = document.createElement('div');
                    lineNumber.className = 'line-number';
                    lineNumber.textContent = (i + 1).toString();
                    lineNumbers.appendChild(lineNumber);
                    
                    // Create code line with basic highlighting
                    const codeLine = document.createElement('div');
                    codeLine.className = 'code-line';
                    
                    // Always set raw text as fallback
                    codeLine.textContent = lines[i];
                    
                    try {
                        // Only if we have valid JSON, attempt token highlighting
                        const line = lines[i];
                        if (line.trim()) {  // Skip empty lines for token handling
                            // Clear existing content
                            codeLine.textContent = '';
                            
                            // Apply Prism highlighting if available
                            const grammar = Prism.languages.json;
                            const tokens = Prism.tokenize(line, grammar);
                            this.renderTokensToElement(tokens, codeLine);
                        }
                    } catch (err) {
                        // Fallback is already in place with raw text
                        console.warn(`Skipping highlighting for line ${i+1}:`, err);
                    }
                    
                    codeContent.appendChild(codeLine);
                }
                
                // Assemble the structure
                container.appendChild(lineNumbers);
                container.appendChild(codeContent);
                
                // Clear and update the editor
                editor.innerHTML = '';
                editor.appendChild(container);
                
                console.log('Syntax highlighting applied successfully');
            } catch (err) {
                console.error('Error applying syntax highlighting:', err);
                
                // Preserve line breaks even if highlighting fails
                if (!editor.textContent || editor.textContent.trim() === '') {
                    // If editor is empty, use last input
                    const content = this.jsonInput || sampleJsonString;
                    const lines = content.split('\n');
                    
                    // Create a basic line structure
                    const container = document.createElement('div');
                    container.className = 'editor-container';
                    
                    const lineNumbers = document.createElement('div');
                    lineNumbers.className = 'line-number-container';
                    
                    const codeContent = document.createElement('div');
                    codeContent.className = 'code-content';
                    
                    // Add each line
                    for (let i = 0; i < lines.length; i++) {
                        const lineNumber = document.createElement('div');
                        lineNumber.className = 'line-number';
                        lineNumber.textContent = (i + 1).toString();
                        lineNumbers.appendChild(lineNumber);
                        
                        const codeLine = document.createElement('div');
                        codeLine.className = 'code-line';
                        codeLine.textContent = lines[i];
                        codeContent.appendChild(codeLine);
                    }
                    
                    container.appendChild(lineNumbers);
                    container.appendChild(codeContent);
                    
                    editor.innerHTML = '';
                    editor.appendChild(container);
                }
            }
        },
        
        // Helper method to render tokens to an element
        renderTokensToElement(tokens, element) {
            tokens.forEach(token => {
                if (typeof token === 'string') {
                    element.appendChild(document.createTextNode(token));
                } else {
                    const span = document.createElement('span');
                    span.className = `token ${token.type}`;
                    
                    if (typeof token.content === 'string') {
                        span.textContent = token.content;
                    } else if (Array.isArray(token.content)) {
                        this.renderTokensToElement(token.content, span);
                    } else if (token.content) {
                        this.renderTokensToElement([token.content], span);
                    }
                    
                    element.appendChild(span);
                }
            });
        },
        
        // Handle input in the editor
        handleEditorInput(event) {
            if (this.isUpdatingFromInput) return; // Prevent recursive updates
            
            // Get the raw text content - simpler approach
            const rawContent = this.getEditorTextContent(event.target);
            
            // Store the current input value
            this.jsonInput = rawContent;
            
            // Save selection state before any DOM changes
            const selection = window.getSelection();
            const selectionState = this.saveSelectionState(selection);
            
            // Debounce the highlighting to improve performance
            clearTimeout(this._highlightTimeout);
            this._highlightTimeout = setTimeout(() => {
                try {
                    // Try to parse it to validate
                    const parsedJson = JSON.parse(rawContent);
                    
                    // If valid, update the lastValidJson and process
                    this.lastValidJson = rawContent;
                    
                    // Always process valid JSON immediately without requiring button press
                    this.processJsonInput();
                    
                    console.log("JSON is valid - auto-processing grid");
                } catch (err) {
                    // Invalid JSON, don't update the grid but still preserve formatting
                    console.log("JSON is invalid - preserving format only");
                    
                    // Just reapply syntax highlighting without trying to reformat
                    this.isUpdatingFromInput = true;
                    
                    // Try to preserve formatting even when JSON is invalid
                    // Create a simple structure that maintains line breaks
                    const editor = event.target;
                    
                    // Keep original structure with line breaks
                    const lines = rawContent.split('\n');
                    
                    // Create container
                    const container = document.createElement('div');
                    container.className = 'editor-container';
                    
                    // Create line number column
                    const lineNumbers = document.createElement('div');
                    lineNumbers.className = 'line-number-container';
                    
                    // Create code content column
                    const codeContent = document.createElement('div');
                    codeContent.className = 'code-content';
                    
                    // Process each line
                    for (let i = 0; i < lines.length; i++) {
                        // Line number
                        const lineNumber = document.createElement('div');
                        lineNumber.className = 'line-number';
                        lineNumber.textContent = (i + 1).toString();
                        lineNumbers.appendChild(lineNumber);
                        
                        // Code line
                        const codeLine = document.createElement('div');
                        codeLine.className = 'code-line';
                        codeLine.textContent = lines[i];
                        codeContent.appendChild(codeLine);
                    }
                    
                    // Assemble structure
                    container.appendChild(lineNumbers);
                    container.appendChild(codeContent);
                    
                    // Update editor
                    editor.innerHTML = '';
                    editor.appendChild(container);
                    
                    this.isUpdatingFromInput = false;
                    
                    // Restore cursor position after highlighting
                    if (selectionState) {
                        this.restoreSelectionState(event.target, selectionState);
                    }
                }
            }, 300);
        },
        
        // Helper to get text content from the editor regardless of structure
        getEditorTextContent(editor) {
            // Try to extract from code-line elements first
            const codeContent = editor.querySelector('.code-content');
            if (codeContent) {
                const lines = codeContent.querySelectorAll('.code-line');
                if (lines && lines.length > 0) {
                    return Array.from(lines).map(line => line.textContent).join('\n');
                }
            }
            
            // If no structured content yet, or we're in the middle of editing,
            // get the direct text content
            if (editor.textContent && editor.textContent.trim() !== '') {
                return editor.textContent;
            }
            
            // Fallback - try to use the existing jsonInput
            if (this.jsonInput && this.jsonInput.trim() !== '') {
                return this.jsonInput;
            }
            
            // Ultimate fallback - use the sample data
            return sampleJsonString;
        },
        
        // Save selection state in a format that can be restored later
        saveSelectionState(selection) {
            if (selection.rangeCount === 0) return null;
            
            const range = selection.getRangeAt(0);
            return {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                collapsed: range.collapsed
            };
        },
        
        // Restore selection state
        restoreSelectionState(editor, state) {
            if (!state) return;
            
            try {
                const selection = window.getSelection();
                const range = document.createRange();
                
                // Find code content
                const codeContent = editor.querySelector('.code-content');
                if (!codeContent) return;
                
                // Get all text nodes in the editor
                const allTextNodes = this.getAllTextNodes(codeContent);
                if (allTextNodes.length === 0) {
                    // No text nodes, just put cursor at the start
                    range.selectNodeContents(codeContent.firstChild || codeContent);
                    range.collapse(true);
                } else {
                    // Find the best matching text node
                    let targetNode = allTextNodes[0];
                    let targetOffset = 0;
                    
                    // Try to find the original text node or something close
                    for (const node of allTextNodes) {
                        if (node === state.startContainer || 
                            (node.textContent && state.startContainer && 
                             node.textContent === state.startContainer.textContent)) {
                            targetNode = node;
                            targetOffset = Math.min(state.startOffset, node.textContent.length);
                            break;
                        }
                    }
                    
                    range.setStart(targetNode, targetOffset);
                    range.collapse(true);
                }
                
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (err) {
                console.error('Error restoring selection:', err);
            }
        },
        
        // Get all text nodes in an element
        getAllTextNodes(element) {
            const textNodes = [];
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            return textNodes;
        },
        
        // Validate JSON on blur
        validateJson(event) {
            try {
                // Get the raw text content
                const jsonString = this.getEditorTextContent(event.target);
                
                // Check if this is a potentially incomplete array with a trailing comma
                let fixedJsonString = jsonString;
                if (jsonString.includes('[') && jsonString.includes(']')) {
                    // Replace trailing commas before closing bracket which are invalid JSON
                    fixedJsonString = jsonString.replace(/,(\s*\])/g, '$1');
                }
                
                try {
                    // Try with fixed string first
                    const parsedJson = JSON.parse(fixedJsonString);
                    
                    // Update with properly formatted JSON
                    const formattedJson = JSON.stringify(parsedJson, null, 2);
                    
                    // Only update if it changed the formatting substantially
                    if (formattedJson !== jsonString) {
                        this.updateEditorContent(formattedJson);
                        this.jsonInput = formattedJson;
                        this.lastValidJson = formattedJson;
                    }
                    
                    // Clear any previous errors
                    this.error = null;
                    
                    // Always process valid JSON immediately
                    console.log("Processing valid JSON on blur");
                    this.processJsonInput();
                } catch (firstErr) {
                    // Try the original string as fallback
                    const parsedJson = JSON.parse(jsonString);
                    
                    // Update with properly formatted JSON
                    const formattedJson = JSON.stringify(parsedJson, null, 2);
                    
                    // Only update if it changed the formatting
                    if (formattedJson !== jsonString) {
                        this.updateEditorContent(formattedJson);
                    }
                    
                    // Clear any previous errors
                    this.error = null;
                    
                    // Always process valid JSON immediately
                    console.log("Processing valid JSON on blur (from original string)");
                    this.processJsonInput();
                }
            } catch (err) {
                // Show validation error
                this.setError(`Invalid JSON: ${err.message}`);
                
                // Don't revert to last valid JSON immediately, but preserve current content
                // Only if we lose focus on a completely invalid JSON, revert to last valid
                // This gives user a chance to fix it
                
                // Simple check for massively broken JSON vs. editing in progress
                const currentContent = this.getEditorTextContent(event.target);
                const simpleValidation = currentContent.trim().startsWith('[') || 
                                         currentContent.trim().startsWith('{');
                
                if (!simpleValidation && this.lastValidJson) {
                    // Only revert if severely malformed
                    this.updateEditorContent(this.lastValidJson);
                } else {
                    // Otherwise preserve formatting by manually rebuilding editor
                    this.isUpdatingFromInput = true;
                    
                    // Use the same approach as in handleEditorInput to preserve line breaks
                    const lines = currentContent.split('\n');
                    const editor = event.target;
                    
                    // Create structure
                    const container = document.createElement('div');
                    container.className = 'editor-container';
                    
                    const lineNumbers = document.createElement('div');
                    lineNumbers.className = 'line-number-container';
                    
                    const codeContent = document.createElement('div');
                    codeContent.className = 'code-content';
                    
                    // Add lines
                    for (let i = 0; i < lines.length; i++) {
                        const lineNumber = document.createElement('div');
                        lineNumber.className = 'line-number';
                        lineNumber.textContent = (i + 1).toString();
                        lineNumbers.appendChild(lineNumber);
                        
                        const codeLine = document.createElement('div');
                        codeLine.className = 'code-line';
                        codeLine.textContent = lines[i];
                        codeContent.appendChild(codeLine);
                    }
                    
                    container.appendChild(lineNumbers);
                    container.appendChild(codeContent);
                    
                    editor.innerHTML = '';
                    editor.appendChild(container);
                    
                    this.isUpdatingFromInput = false;
                }
            }
        },
        
        // Format JSON with indentation, but keep line breaks even with invalid JSON
        formatJson(jsonString) {
            if (!jsonString || !jsonString.trim()) return '';
            
            try {
                // Try to parse and format
                const obj = JSON.parse(jsonString);
                return JSON.stringify(obj, null, 2);
            } catch (err) {
                // For invalid JSON, at least preserve the line breaks
                // This ensures we don't collapse everything into one line
                return jsonString;
            }
        },
        
        processJsonInput() {
            console.log("Processing JSON input from button click or API call");
            
            // Make sure we have the latest content from the editor
            const jsonEditor = document.getElementById('jsonEditor');
            if (jsonEditor) {
                // Get the text content from the editor
                const editorContent = this.getEditorTextContent(jsonEditor);
                if (editorContent && editorContent.trim() !== '') {
                    this.jsonInput = editorContent;
                }
            }
            
            if (!this.jsonInput || !this.jsonInput.trim()) {
                this.setError('JSON input cannot be empty.');
                return;
            }

            // Try to clean up common JSON errors
            let cleanedInput = this.jsonInput;
            if (this.jsonInput.includes('[') && this.jsonInput.includes(']')) {
                // Fix trailing commas in arrays
                cleanedInput = this.jsonInput.replace(/,(\s*\])/g, '$1');
            }
            if (this.jsonInput.includes('{') && this.jsonInput.includes('}')) {
                // Fix trailing commas in objects
                cleanedInput = cleanedInput.replace(/,(\s*\})/g, '$1');
            }

            // Try to parse the cleaned version
            let parsedJson;
            try {
                parsedJson = JSON.parse(cleanedInput);
                // If successful, update the input to the cleaned version
                this.jsonInput = cleanedInput;
            } catch (parseErr) {
                try {
                    // Try original as fallback
                    parsedJson = JSON.parse(this.jsonInput);
                } catch (originalErr) {
                    this.setError(`Invalid JSON: ${originalErr.message}`);
                    return;
                }
            }

            this.loading = true;
            this.isUpdatingFromInput = true;

            try {
                // Format for display
                const formattedJson = JSON.stringify(parsedJson, null, 2);
                this.jsonInput = formattedJson;
                this.lastValidJson = formattedJson;

                // Parse and get both parts
                const { dataArray: newDataArray, originalStructure: newOriginalStructure } = this.parseAndValidate(formattedJson);
                
                // Always update the display on button click
                console.log("Updating display with parsed data");
                this.jsonData = newOriginalStructure;
                this.clearGridAndError();
                if (this.sortKey && !Object.keys(newDataArray[0] || {}).includes(this.sortKey)) {
                    this.sortKey = '';
                }
                this.displayData(newDataArray);
                
                // Update the editor with syntax highlighting if needed
                const jsonEditor = document.getElementById('jsonEditor');
                if (jsonEditor) {
                    this.isUpdatingFromInput = true;
                    this.updateEditorContent(formattedJson);
                    this.isUpdatingFromInput = false;
                }
            } catch (e) {
                console.error("Error during processing:", e);
                this.setError(`Invalid JSON or structure: ${e.message}`);
            } finally {
                this.loading = false;
                this.isUpdatingFromInput = false;
            }
        },
        
        handleFileUpload(event) {
            console.log("Handling file upload");
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            
            this.loading = true;
            this.isUpdatingFromInput = true;
            this.fileName = file.name;
            this.clearGridAndError();

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const fileContent = e.target.result;
                    
                    // Try to parse the content first to validate
                    let parsedJson;
                    try {
                        parsedJson = JSON.parse(fileContent);
                        // Format it properly
                        const formattedJson = JSON.stringify(parsedJson, null, 2);
                        
                        // Update jsonInput
                        this.jsonInput = formattedJson;
                        this.lastValidJson = formattedJson;
                        
                        // Update the editor
                        this.updateEditorContent(formattedJson);
                        
                        // Process the data
                        const parsedData = this.parseAndValidate(formattedJson);
                        this.jsonData = parsedData.originalStructure;
                        this.displayData(parsedData.dataArray);
                        
                        // Success message
                        console.log("File loaded successfully");
                    } catch (parseErr) {
                        this.setError(`Invalid JSON in file: ${parseErr.message}`);
                    }
                } catch (err) {
                    this.setError(`Error reading file: ${err.message}`);
                } finally {
                    this.loading = false;
                    this.isUpdatingFromInput = false;
                    // Reset file input to allow uploading the same file again
                    event.target.value = null;
                }
            };
            
            reader.onerror = (e) => {
                this.setError('Error reading file.');
                this.loading = false;
                this.isUpdatingFromInput = false;
                event.target.value = null;
            };
            
            reader.readAsText(file);
        },
        parseAndValidate(jsonString) {
            let data;
            try {
                data = JSON.parse(jsonString);
            } catch (e) {
                throw new Error('Could not parse JSON string.');
            }

            let dataArray;
            let originalStructure = data; // Keep the original structure

            if (Array.isArray(data)) {
                if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                    if (data.every(item => typeof item === 'object' && item !== null)) {
                        dataArray = data; // It's a valid array of objects
                    } else {
                         throw new Error('Invalid structure: All items in the array must be objects.');
                    }
                }
                 else if (data.length === 0) {
                    dataArray = []; // Empty array is valid
                 }
                 else {
                    throw new Error('Invalid structure: Array must contain objects or be empty.');
                 }
            }
            else if (typeof data === 'object' && data !== null) {
                const keys = Object.keys(data);
                if (keys.length === 1) {
                    const key = keys[0];
                    const potentialArray = data[key];
                    if (Array.isArray(potentialArray)) {
                         if (potentialArray.length > 0 && typeof potentialArray[0] === 'object' && potentialArray[0] !== null) {
                            if (potentialArray.every(item => typeof item === 'object' && item !== null)) {
                                dataArray = potentialArray; // It's an object with a single valid array property
                            } else {
                                throw new Error(`Invalid structure: All items in the array property '${key}' must be objects.`);
                            }
                         }
                         else if (potentialArray.length === 0) {
                             dataArray = []; // Empty array is valid
                         }
                         else {
                            throw new Error(`Invalid structure: Object's array property '${key}' must contain objects or be empty.`);
                         }
                    } else {
                         throw new Error(`Invalid structure: Object property '${key}' must be an array.`);
                    }
                } else {
                 throw new Error('Invalid structure: Object must have exactly one property which is an array of objects.');
                }
            } else {
                throw new Error('Unsupported JSON structure. Input must be an array of objects or an object with a single property that is an array of objects.');
            }
            
            // Return both the array part and the original structure
            return { dataArray, originalStructure }; 
        },
        displayData(dataArray) {
            if (!dataArray) { // Should not happen if parseAndValidate works correctly
                this.setError('Validation Error: Unexpected null data received.');
                return;
            }

            // Clear previous error FIRST
            this.error = null; 

            if (dataArray.length === 0) {
                this.headers = [];
                this.rows = [];
                 // Use a specific info message, not an error that clears the grid via setError
                 this.error = "Info: JSON data is valid but resulted in an empty grid."; 
            } else {
                // Valid, non-empty data
                this.headers = Object.keys(dataArray[0]);
                this.rows = dataArray;
                // jsonData is already set in parseAndValidate with the original structure
            }
        },
        setError(message) {
             this.error = message;
        },
        clearGrid() {
             this.headers = [];
             this.rows = [];
        },
        clearGridAndError(){
            this.error = null;
        },
        clearAll() {
            console.log("Clearing all data and resetting editor");
            this.jsonInput = '';
            this.jsonData = null;
            this.headers = [];
            this.rows = [];
            this.error = null;
            this.fileName = '';
            this.filterText = '';
            this.sortKey = '';
            this.viewMode = 'both'; // Reset view on clear
            this.lastValidJson = '';
            
            // Update the editor content with empty content
            const jsonEditor = document.getElementById('jsonEditor');
            if (jsonEditor) {
                // Clear the editor
                jsonEditor.innerHTML = '';
                
                // Create basic structure
                const container = document.createElement('div');
                container.className = 'editor-container';
                
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-number-container';
                
                const lineNum = document.createElement('div');
                lineNum.className = 'line-number';
                lineNum.textContent = '1';
                lineNumbers.appendChild(lineNum);
                
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                
                const codeLine = document.createElement('div');
                codeLine.className = 'code-line';
                codeLine.textContent = '';
                codeContent.appendChild(codeLine);
                
                container.appendChild(lineNumbers);
                container.appendChild(codeContent);
                
                jsonEditor.appendChild(container);
            }
            
            const fileInput = this.$refs.fileInput;
            if(fileInput) fileInput.value = null;
        },
        cellEdited(event, row, header) {
            const newValue = event.target.value;
            const oldValue = row[header];

            // Update only if the value has actually changed
            if (newValue !== String(oldValue)) { // Compare as strings for simplicity
                 console.log(`Updating ${header} from '${oldValue}' to '${newValue}'`);
                
                // Attempt to convert back to original type if possible (simple heuristic)
                let typedValue = newValue;
                if (!isNaN(newValue) && newValue.trim() !== '') {
                    typedValue = Number(newValue);
                } else if (newValue.toLowerCase() === 'true') {
                    typedValue = true;
                } else if (newValue.toLowerCase() === 'false') {
                    typedValue = false;
                }
                
                row[header] = typedValue; // Update the row data directly
                this.rows = [...this.rows]; // Update rows array reference for reactivity

                try {
                    // Check if the original data was wrapped in an object
                    if (this.jsonData && !Array.isArray(this.jsonData)) {
                         const key = Object.keys(this.jsonData)[0];
                         this.jsonData[key] = this.rows; 
                         this.jsonInput = JSON.stringify(this.jsonData, null, 2);
                    } else {
                         // Original data was just an array
                         this.jsonData = this.rows; 
                         this.jsonInput = JSON.stringify(this.rows, null, 2);
                    }
                    
                    // Update the editor with syntax highlighting if needed
                    this.updateEditorContent(this.jsonInput);
                    this.lastValidJson = this.jsonInput;
                    
                    console.log("jsonInput updated after cell edit.");
                } catch (e) {
                     console.error("Error updating jsonInput after cell edit:", e);
                }
            } else {
                 // Restore original value in input if no change occurred on blur
                 event.target.value = oldValue;
            }
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortAsc = !this.sortAsc;
            } else {
                this.sortKey = key;
                this.sortAsc = true;
            }
             console.log(`Sorting by ${this.sortKey}, ascending: ${this.sortAsc}`);
        },
        areDeeplyEqual(obj1, obj2) {
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        },
        toggleJsonView() {
            console.log(`Toggling JSON view from ${this.viewMode}`);
            if (this.viewMode === 'jsonOnly') {
                this.viewMode = 'both';
            } else if (this.viewMode === 'both') {
                this.viewMode = 'gridOnly';
            } else { // gridOnly
                this.viewMode = 'both';
            }
        },
        toggleGridView() {
            console.log(`Toggling grid view from ${this.viewMode}`);
            if (this.viewMode === 'gridOnly') {
                this.viewMode = 'both';
            } else if (this.viewMode === 'both') {
                this.viewMode = 'jsonOnly';
            } else { // jsonOnly
                this.viewMode = 'both';
            }
        },
        checkScreenSize() {
            this.isLargeScreen = window.innerWidth >= 992;
        }
    },
    computed: {
        filteredAndSortedRows() {
            // Create a shallow copy to avoid mutating the original 'rows' array
            let result = [...this.rows]; // Use spread syntax for shallow copy

            // Filtering (operates on the copy)
            if (this.filterText) {
                const lowerFilter = this.filterText.toLowerCase();
                result = result.filter(row => {
                    return this.headers.some(header => {
                        const value = row[header];
                        return value !== null && value !== undefined && String(value).toLowerCase().includes(lowerFilter);
                    });
                });
            }

            // Sorting (operates on the copy)
            if (this.sortKey) {
                 result.sort((a, b) => {
                    let valA = a[this.sortKey];
                    let valB = b[this.sortKey];

                    valA = valA === null || valA === undefined ? '' : valA;
                    valB = valB === null || valB === undefined ? '' : valB;

                    const numA = parseFloat(valA);
                    const numB = parseFloat(valB);
                    let comparison = 0;

                    if (!isNaN(numA) && !isNaN(numB)) {
                        comparison = numA - numB;
                    } else if (typeof valA === 'string' && typeof valB === 'string') {
                        comparison = valA.localeCompare(valB);
                    } else {
                         comparison = String(valA).localeCompare(String(valB));
                    }

                    return this.sortAsc ? comparison : -comparison;
                });
            }

            return result; // Return the filtered and sorted copy
        },
        jsonColumnClass() {
            switch (this.viewMode) {
                case 'jsonOnly': return 'col-12';
                case 'gridOnly': return 'd-none'; // Hide completely
                default:         return 'col-12 col-lg-4'; // Default split
            }
        },
        gridColumnClass() {
            switch (this.viewMode) {
                case 'jsonOnly': return 'd-none'; // Hide completely
                case 'gridOnly': return 'col-12';
                default:         return 'col-12 col-lg-8'; // Default split
            }
        },
        jsonCollapseIcon() {
            if (this.viewMode === 'jsonOnly') return 'bi bi-arrows-angle-contract'; // Or 'bi-chevron-double-down'
            if (this.viewMode === 'gridOnly') return 'bi bi-arrows-angle-expand'; // Or 'bi-chevron-double-right / down'
            // When both are visible, icon depends on screen size
            return this.isLargeScreen ? 'bi bi-chevron-double-left' : 'bi bi-chevron-double-up'; 
        },
        gridCollapseIcon() {
            if (this.viewMode === 'gridOnly') return 'bi bi-arrows-angle-contract'; // Or 'bi-chevron-double-down'
            if (this.viewMode === 'jsonOnly') return 'bi bi-arrows-angle-expand'; // Or 'bi-chevron-double-left / up'
            // When both are visible, icon depends on screen size
            return this.isLargeScreen ? 'bi bi-chevron-double-right' : 'bi bi-chevron-double-down';
        },
        jsonCollapseTitle() {
            if (this.viewMode === 'jsonOnly') return 'Show Both Sections'; 
            if (this.viewMode === 'gridOnly') return 'Show JSON Section';
            // When both are visible, title depends on screen size
            return this.isLargeScreen ? 'Collapse JSON Section (Show Grid Only)' : 'Collapse JSON Section Up (Show Grid Only)';
        },
         gridCollapseTitle() {
            if (this.viewMode === 'gridOnly') return 'Show Both Sections';
            if (this.viewMode === 'jsonOnly') return 'Show Grid Section';
            // When both are visible, title depends on screen size
            return this.isLargeScreen ? 'Collapse Grid Section (Show JSON Only)' : 'Collapse Grid Section Down (Show JSON Only)';
        }
    },
    watch: {
        isLargeScreen(newValue) {
            // Adjust view mode if screen size changes and only one view is visible
            if (!newValue && (this.viewMode === 'jsonOnly' || this.viewMode === 'gridOnly')) {
                this.viewMode = 'both'; // Force both views on smaller screens if one was hidden
            }
        }
    },
    mounted() {
        // Initialize the editor immediately when component is mounted
        this.initializeEditor();
        
        // Process the data after a short delay
        setTimeout(() => {
            this.processJsonInput();
        }, 100);
        
        // Check screen size
        this.checkScreenSize();
        
        // Add window resize listener
        window.addEventListener('resize', this.checkScreenSize);
    },
    beforeUnmount() {
        // Remove window resize listener
        window.removeEventListener('resize', this.checkScreenSize);
    }
}).mount('#app'); 