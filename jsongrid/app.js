const { createApp } = Vue;

// Sample data
const sampleJsonData = [
  { "id": 1, "productName": "Wireless Mouse", "category": "Electronics", "price": 25.99, "inStock": true },
  { "id": 2, "productName": "Bluetooth Keyboard", "category": "Electronics", "price": 49.50, "inStock": false },
  { "id": 3, "productName": "Laptop Stand", "category": "Accessories", "price": 19.00, "inStock": true },
  { "id": 4, "productName": "USB-C Hub", "category": "Accessories", "price": 35.20, "inStock": true },
  { "id": 5, "productName": "Monitor 27\"", "category": "Electronics", "price": 299.99, "inStock": true }
];

const sampleJsonString = JSON.stringify(sampleJsonData, null, 2);

createApp({
    data() {
        return {
            jsonInput: sampleJsonString,
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
            viewMode: 'both',
            isLargeScreen: window.innerWidth >= 992,
            lastValidJson: sampleJsonString,
            isEditorInitialized: false
        };
    },
    methods: {
        initializeEditor() {
            const jsonEditor = document.getElementById('jsonEditor');
            if (!jsonEditor || this.isEditorInitialized) return;
            
            const formattedJson = JSON.stringify(sampleJsonData, null, 2);
            this.jsonInput = formattedJson;
            
            jsonEditor.innerHTML = '';
            
            try {
                const container = document.createElement('div');
                container.className = 'editor-container';
                
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-number-container';
                lineNumbers.setAttribute('contenteditable', 'false');
                
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                codeContent.setAttribute('contenteditable', 'true');
                
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
                
                jsonEditor.appendChild(container);
            } catch (err) {
                jsonEditor.textContent = formattedJson;
            }
            
            this.isEditorInitialized = true;
        },
        
        updateEditorContent(jsonString) {
            const jsonEditor = document.getElementById('jsonEditor');
            if (!jsonEditor) return;
            
            try {
                // Save selection state before any DOM changes
                const selection = window.getSelection();
                const selectionState = this.saveSelectionState(selection);
                
                const formattedJson = this.formatJson(jsonString);
                
                // Don't update if content hasn't changed
                const currentContent = this.getEditorTextContent(jsonEditor);
                if (currentContent === formattedJson) {
                    return;
                }
                
                this.isUpdatingFromInput = true;
                
                // Apply syntax highlighting
                this.applySyntaxHighlighting(jsonEditor);
                
                // Update input
                this.jsonInput = formattedJson;
                
                // Restore selection state after DOM update
                if (selectionState) {
                    setTimeout(() => {
                        this.restoreSelectionState(jsonEditor, selectionState);
                    }, 0);
                }
                
                this.isUpdatingFromInput = false;
            } catch (err) {
                jsonEditor.textContent = jsonString;
            }
        },
        
        applySyntaxHighlighting(editor) {
            try {
                let content = '';
                if (editor.textContent && editor.textContent.trim() !== '') {
                    content = editor.textContent;
                } else if (this.jsonInput && this.jsonInput.trim() !== '') {
                    content = this.jsonInput;
                } else {
                    content = JSON.stringify(sampleJsonData, null, 2);
                    this.jsonInput = content;
                }
                
                if (!content || content.trim() === '') {
                    return;
                }
                
                let cleanContent = content;
                if (content.includes('[') && content.includes(']')) {
                    cleanContent = content.replace(/,(\s*\])/g, '$1');
                }
                if (content.includes('{') && content.includes('}')) {
                    cleanContent = cleanContent.replace(/,(\s*\})/g, '$1');
                }
                
                try {
                    const parsedJson = JSON.parse(cleanContent);
                    content = JSON.stringify(parsedJson, null, 2);
                } catch (parseErr) {
                    // Preserve original formatting
                }
                
                const container = document.createElement('div');
                container.className = 'editor-container';
                
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-number-container';
                lineNumbers.setAttribute('contenteditable', 'false');
                
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                codeContent.setAttribute('contenteditable', 'true');
                
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const lineNumber = document.createElement('div');
                    lineNumber.className = 'line-number';
                    lineNumber.textContent = (i + 1).toString();
                    lineNumbers.appendChild(lineNumber);
                    
                    const codeLine = document.createElement('div');
                    codeLine.className = 'code-line';
                    
                    codeLine.textContent = lines[i];
                    
                    try {
                        const line = lines[i];
                        if (line.trim()) {
                            codeLine.textContent = '';
                            
                            const grammar = Prism.languages.json;
                            const tokens = Prism.tokenize(line, grammar);
                            this.renderTokensToElement(tokens, codeLine);
                        }
                    } catch (err) {
                        // Text fallback already in place
                    }
                    
                    codeContent.appendChild(codeLine);
                }
                
                container.appendChild(lineNumbers);
                container.appendChild(codeContent);
                
                editor.innerHTML = '';
                editor.appendChild(container);
            } catch (err) {
                if (!editor.textContent || editor.textContent.trim() === '') {
                    const content = this.jsonInput || sampleJsonString;
                    const lines = content.split('\n');
                    
                    const container = document.createElement('div');
                    container.className = 'editor-container';
                    
                    const lineNumbers = document.createElement('div');
                    lineNumbers.className = 'line-number-container';
                    lineNumbers.setAttribute('contenteditable', 'false');
                    
                    const codeContent = document.createElement('div');
                    codeContent.className = 'code-content';
                    codeContent.setAttribute('contenteditable', 'true');
                    
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
        
        handleEditorInput(event) {
            if (this.isUpdatingFromInput) return;
            
            // Make sure we're only handling input in the code-content area
            const codeContent = event.target.closest('.code-content');
            if (!codeContent) return;
            
            // Get the raw content from the code content area
            const rawContent = this.getEditorTextContent(event.target.closest('#jsonEditor'));
            this.jsonInput = rawContent;
            
            // Save current selection state
            const selection = window.getSelection();
            const selectionState = this.saveSelectionState(selection);
            
            clearTimeout(this._highlightTimeout);
            this._highlightTimeout = setTimeout(() => {
                try {
                    const parsedJson = JSON.parse(rawContent);
                    this.lastValidJson = rawContent;
                    this.processJsonInput();
                } catch (err) {
                    this.isUpdatingFromInput = true;
                    
                    const editor = event.target.closest('#jsonEditor');
                    const lines = rawContent.split('\n');
                    
                    const container = document.createElement('div');
                    container.className = 'editor-container';
                    
                    const lineNumbers = document.createElement('div');
                    lineNumbers.className = 'line-number-container';
                    lineNumbers.setAttribute('contenteditable', 'false');
                    
                    const codeContent = document.createElement('div');
                    codeContent.className = 'code-content';
                    codeContent.setAttribute('contenteditable', 'true');
                    
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
                    
                    if (selectionState) {
                        setTimeout(() => {
                            this.restoreSelectionState(editor, selectionState);
                        }, 0);
                    }
                }
            }, 300);
        },
        
        getEditorTextContent(editor) {
            const codeContent = editor.querySelector('.code-content');
            if (codeContent) {
                const lines = codeContent.querySelectorAll('.code-line');
                if (lines && lines.length > 0) {
                    return Array.from(lines).map(line => line.textContent).join('\n');
                }
            }
            
            if (editor.textContent && editor.textContent.trim() !== '') {
                return editor.textContent;
            }
            
            if (this.jsonInput && this.jsonInput.trim() !== '') {
                return this.jsonInput;
            }
            
            return sampleJsonString;
        },
        
        saveSelectionState(selection) {
            if (selection.rangeCount === 0) return null;
            
            const range = selection.getRangeAt(0);
            
            // Find line index for better position restoration
            let lineIndex = -1;
            const startNode = range.startContainer;
            
            // Find the parent code-line element
            let parentLine = startNode;
            while (parentLine && !parentLine.classList?.contains('code-line')) {
                parentLine = parentLine.parentNode;
            }
            
            // If we found the parent line, determine its index
            if (parentLine) {
                const parentContent = parentLine.parentNode;
                if (parentContent && parentContent.children) {
                    for (let i = 0; i < parentContent.children.length; i++) {
                        if (parentContent.children[i] === parentLine) {
                            lineIndex = i;
                            break;
                        }
                    }
                }
            }
            
            return {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                collapsed: range.collapsed,
                lineIndex: lineIndex
            };
        },
        
        restoreSelectionState(editor, state) {
            if (!state) return;
            
            try {
                const selection = window.getSelection();
                const range = document.createRange();
                
                const codeContent = editor.querySelector('.code-content');
                if (!codeContent) return;
                
                // Find all text nodes in the code content area only (not line numbers)
                const allTextNodes = this.getAllTextNodes(codeContent);
                
                if (allTextNodes.length === 0) {
                    // If no text nodes found, select the first code line
                    const firstCodeLine = codeContent.querySelector('.code-line');
                    if (firstCodeLine) {
                        range.selectNodeContents(firstCodeLine);
                        range.collapse(true);
                    } else {
                        range.selectNodeContents(codeContent);
                        range.collapse(true);
                    }
                } else {
                    // Try to find the exact node that was previously selected
                    let targetNode = allTextNodes[0];
                    let targetOffset = 0;
                    let nodeFound = false;
                    
                    for (const node of allTextNodes) {
                        if (node === state.startContainer || 
                            (node.textContent && state.startContainer && 
                             node.textContent === state.startContainer.textContent)) {
                            targetNode = node;
                            targetOffset = Math.min(state.startOffset, node.textContent.length);
                            nodeFound = true;
                            break;
                        }
                    }
                    
                    // If we couldn't find the exact node, try to maintain relative position
                    if (!nodeFound && state.lineIndex !== undefined && state.lineIndex < codeContent.children.length) {
                        const targetLine = codeContent.children[state.lineIndex];
                        if (targetLine) {
                            const lineTextNodes = this.getAllTextNodes(targetLine);
                            if (lineTextNodes.length > 0) {
                                targetNode = lineTextNodes[0];
                                targetOffset = Math.min(state.startOffset, targetNode.textContent.length);
                            }
                        }
                    }
                    
                    range.setStart(targetNode, targetOffset);
                    range.collapse(true);
                }
                
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (err) {
                // Selection state couldn't be restored
            }
        },
        
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
        
        validateJson(event) {
            try {
                const jsonString = this.getEditorTextContent(event.target);
                
                let fixedJsonString = jsonString;
                if (jsonString.includes('[') && jsonString.includes(']')) {
                    fixedJsonString = jsonString.replace(/,(\s*\])/g, '$1');
                }
                
                try {
                    const parsedJson = JSON.parse(fixedJsonString);
                    const formattedJson = JSON.stringify(parsedJson, null, 2);
                    
                    if (formattedJson !== jsonString) {
                        this.updateEditorContent(formattedJson);
                        this.jsonInput = formattedJson;
                        this.lastValidJson = formattedJson;
                    }
                    
                    this.error = null;
                    this.processJsonInput();
                } catch (firstErr) {
                    const parsedJson = JSON.parse(jsonString);
                    const formattedJson = JSON.stringify(parsedJson, null, 2);
                    
                    if (formattedJson !== jsonString) {
                        this.updateEditorContent(formattedJson);
                    }
                    
                    this.error = null;
                    this.processJsonInput();
                }
            } catch (err) {
                this.setError(`Invalid JSON: ${err.message}`);
                
                const currentContent = this.getEditorTextContent(event.target);
                const simpleValidation = currentContent.trim().startsWith('[') || 
                                         currentContent.trim().startsWith('{');
                
                if (!simpleValidation && this.lastValidJson) {
                    this.updateEditorContent(this.lastValidJson);
                } else {
                    this.isUpdatingFromInput = true;
                    
                    const lines = currentContent.split('\n');
                    const editor = event.target;
                    
                    const container = document.createElement('div');
                    container.className = 'editor-container';
                    
                    const lineNumbers = document.createElement('div');
                    lineNumbers.className = 'line-number-container';
                    lineNumbers.setAttribute('contenteditable', 'false');
                    
                    const codeContent = document.createElement('div');
                    codeContent.className = 'code-content';
                    codeContent.setAttribute('contenteditable', 'true');
                    
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
        
        formatJson(jsonString) {
            if (!jsonString || !jsonString.trim()) return '';
            
            try {
                const obj = JSON.parse(jsonString);
                return JSON.stringify(obj, null, 2);
            } catch (err) {
                return jsonString;
            }
        },
        
        processJsonInput() {
            const jsonEditor = document.getElementById('jsonEditor');
            if (jsonEditor) {
                const editorContent = this.getEditorTextContent(jsonEditor);
                if (editorContent && editorContent.trim() !== '') {
                    this.jsonInput = editorContent;
                }
            }
            
            if (!this.jsonInput || !this.jsonInput.trim()) {
                this.setError('JSON input cannot be empty.');
                return;
            }

            let cleanedInput = this.jsonInput;
            if (this.jsonInput.includes('[') && this.jsonInput.includes(']')) {
                cleanedInput = this.jsonInput.replace(/,(\s*\])/g, '$1');
            }
            if (this.jsonInput.includes('{') && this.jsonInput.includes('}')) {
                cleanedInput = cleanedInput.replace(/,(\s*\})/g, '$1');
            }

            let parsedJson;
            try {
                parsedJson = JSON.parse(cleanedInput);
                this.jsonInput = cleanedInput;
            } catch (parseErr) {
                try {
                    parsedJson = JSON.parse(this.jsonInput);
                } catch (originalErr) {
                    this.setError(`Invalid JSON: ${originalErr.message}`);
                    return;
                }
            }

            this.loading = true;
            this.isUpdatingFromInput = true;

            try {
                const formattedJson = JSON.stringify(parsedJson, null, 2);
                this.jsonInput = formattedJson;
                this.lastValidJson = formattedJson;

                const { dataArray: newDataArray, originalStructure: newOriginalStructure } = this.parseAndValidate(formattedJson);
                
                this.jsonData = newOriginalStructure;
                this.clearGridAndError();
                if (this.sortKey && !Object.keys(newDataArray[0] || {}).includes(this.sortKey)) {
                    this.sortKey = '';
                }
                this.displayData(newDataArray);
                
                // Update the editor with direct rendering
                if (jsonEditor) {
                    // Clear the editor
                    jsonEditor.innerHTML = '';
                    
                    // Build container for editor
                    const container = document.createElement('div');
                    container.className = 'editor-container';
                    
                    const lineNumbers = document.createElement('div');
                    lineNumbers.className = 'line-number-container';
                    lineNumbers.setAttribute('contenteditable', 'false');
                    
                    const codeContent = document.createElement('div');
                    codeContent.className = 'code-content';
                    codeContent.setAttribute('contenteditable', 'true');
                    
                    // Process each line separately
                    const lines = formattedJson.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        // Create line number element
                        const lineNumber = document.createElement('div');
                        lineNumber.className = 'line-number';
                        lineNumber.textContent = (i + 1).toString();
                        lineNumbers.appendChild(lineNumber);
                        
                        // Create code line element
                        const codeLine = document.createElement('div');
                        codeLine.className = 'code-line';
                        
                        // Apply syntax highlighting if possible
                        try {
                            const line = lines[i];
                            codeLine.textContent = line; // Fallback content
                            
                            if (line.trim()) {
                                codeLine.textContent = '';
                                const grammar = Prism.languages.json;
                                const tokens = Prism.tokenize(line, grammar);
                                this.renderTokensToElement(tokens, codeLine);
                            }
                        } catch (err) {
                            // Fallback already in place
                        }
                        
                        codeContent.appendChild(codeLine);
                    }
                    
                    // Assemble and update the editor
                    container.appendChild(lineNumbers);
                    container.appendChild(codeContent);
                    jsonEditor.appendChild(container);
                }
            } catch (e) {
                this.setError(`Invalid JSON or structure: ${e.message}`);
            } finally {
                this.loading = false;
                this.isUpdatingFromInput = false;
            }
        },
        
        handleFileUpload(event) {
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
                    
                    try {
                        const parsedJson = JSON.parse(fileContent);
                        const formattedJson = JSON.stringify(parsedJson, null, 2);
                        
                        this.jsonInput = formattedJson;
                        this.lastValidJson = formattedJson;
                        
                        // Update the editor with direct rendering
                        const jsonEditor = document.getElementById('jsonEditor');
                        if (jsonEditor) {
                            // Clear the editor
                            jsonEditor.innerHTML = '';
                            
                            // Build container for editor
                            const container = document.createElement('div');
                            container.className = 'editor-container';
                            
                            const lineNumbers = document.createElement('div');
                            lineNumbers.className = 'line-number-container';
                            lineNumbers.setAttribute('contenteditable', 'false');
                            
                            const codeContent = document.createElement('div');
                            codeContent.className = 'code-content';
                            codeContent.setAttribute('contenteditable', 'true');
                            
                            // Process each line separately
                            const lines = formattedJson.split('\n');
                            for (let i = 0; i < lines.length; i++) {
                                // Create line number element
                                const lineNumber = document.createElement('div');
                                lineNumber.className = 'line-number';
                                lineNumber.textContent = (i + 1).toString();
                                lineNumbers.appendChild(lineNumber);
                                
                                // Create code line element
                                const codeLine = document.createElement('div');
                                codeLine.className = 'code-line';
                                
                                // Apply syntax highlighting if possible
                                try {
                                    const line = lines[i];
                                    codeLine.textContent = line; // Fallback content
                                    
                                    if (line.trim()) {
                                        codeLine.textContent = '';
                                        const grammar = Prism.languages.json;
                                        const tokens = Prism.tokenize(line, grammar);
                                        this.renderTokensToElement(tokens, codeLine);
                                    }
                                } catch (err) {
                                    // Fallback already in place
                                }
                                
                                codeContent.appendChild(codeLine);
                            }
                            
                            // Assemble and update the editor
                            container.appendChild(lineNumbers);
                            container.appendChild(codeContent);
                            jsonEditor.appendChild(container);
                        }
                        
                        const parsedData = this.parseAndValidate(formattedJson);
                        this.jsonData = parsedData.originalStructure;
                        this.displayData(parsedData.dataArray);
                    } catch (parseErr) {
                        this.setError(`Invalid JSON in file: ${parseErr.message}`);
                    }
                } catch (err) {
                    this.setError(`Error reading file: ${err.message}`);
                } finally {
                    this.loading = false;
                    this.isUpdatingFromInput = false;
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
            let originalStructure = data;

            if (Array.isArray(data)) {
                if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                    if (data.every(item => typeof item === 'object' && item !== null)) {
                        dataArray = data;
                    } else {
                         throw new Error('Invalid structure: All items in the array must be objects.');
                    }
                }
                 else if (data.length === 0) {
                    dataArray = [];
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
                                dataArray = potentialArray;
                            } else {
                                throw new Error(`Invalid structure: All items in the array property '${key}' must be objects.`);
                            }
                         }
                         else if (potentialArray.length === 0) {
                             dataArray = [];
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
            
            return { dataArray, originalStructure }; 
        },
        displayData(dataArray) {
            if (!dataArray) {
                this.setError('Validation Error: Unexpected null data received.');
                return;
            }

            this.error = null; 

            if (dataArray.length === 0) {
                this.headers = [];
                this.rows = [];
                this.error = "Info: JSON data is valid but resulted in an empty grid."; 
            } else {
                this.headers = Object.keys(dataArray[0]);
                this.rows = dataArray;
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
            this.viewMode = 'both';
            this.lastValidJson = '';
            
            const jsonEditor = document.getElementById('jsonEditor');
            if (jsonEditor) {
                jsonEditor.innerHTML = '';
                
                const container = document.createElement('div');
                container.className = 'editor-container';
                
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-number-container';
                lineNumbers.setAttribute('contenteditable', 'false');
                
                const lineNum = document.createElement('div');
                lineNum.className = 'line-number';
                lineNum.textContent = '1';
                lineNumbers.appendChild(lineNum);
                
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                codeContent.setAttribute('contenteditable', 'true');
                
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

            if (newValue !== String(oldValue)) {
                console.log(`Updating ${header} from '${oldValue}' to '${newValue}'`);
                
                let typedValue = newValue;
                if (!isNaN(newValue) && newValue.trim() !== '') {
                    typedValue = Number(newValue);
                } else if (newValue.toLowerCase() === 'true') {
                    typedValue = true;
                } else if (newValue.toLowerCase() === 'false') {
                    typedValue = false;
                }
                
                row[header] = typedValue;
                this.rows = [...this.rows];

                try {
                    // Format the JSON properly with indentation
                    let formattedJson = '';
                    if (this.jsonData && !Array.isArray(this.jsonData)) {
                        const key = Object.keys(this.jsonData)[0];
                        this.jsonData[key] = this.rows; 
                        formattedJson = JSON.stringify(this.jsonData, null, 2);
                    } else {
                        this.jsonData = this.rows; 
                        formattedJson = JSON.stringify(this.rows, null, 2);
                    }
                    
                    // Update the input values
                    this.jsonInput = formattedJson;
                    this.lastValidJson = formattedJson;
                    
                    // Manually rebuild the editor to ensure proper formatting
                    const jsonEditor = document.getElementById('jsonEditor');
                    if (jsonEditor) {
                        // Clear the editor
                        jsonEditor.innerHTML = '';
                        
                        // Build the container structure
                        const container = document.createElement('div');
                        container.className = 'editor-container';
                        
                        const lineNumbers = document.createElement('div');
                        lineNumbers.className = 'line-number-container';
                        lineNumbers.setAttribute('contenteditable', 'false');
                        
                        const codeContent = document.createElement('div');
                        codeContent.className = 'code-content';
                        codeContent.setAttribute('contenteditable', 'true');
                        
                        // Process each line separately to maintain formatting
                        const lines = formattedJson.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            // Create line number element
                            const lineNumber = document.createElement('div');
                            lineNumber.className = 'line-number';
                            lineNumber.textContent = (i + 1).toString();
                            lineNumbers.appendChild(lineNumber);
                            
                            // Create code line element
                            const codeLine = document.createElement('div');
                            codeLine.className = 'code-line';
                            
                            // Apply syntax highlighting if possible
                            try {
                                const line = lines[i];
                                codeLine.textContent = line; // Fallback content
                                
                                if (line.trim()) {
                                    codeLine.textContent = '';
                                    const grammar = Prism.languages.json;
                                    const tokens = Prism.tokenize(line, grammar);
                                    this.renderTokensToElement(tokens, codeLine);
                                }
                            } catch (highlightErr) {
                                // Fallback already in place with plain text
                            }
                            
                            codeContent.appendChild(codeLine);
                        }
                        
                        // Assemble and update the editor
                        container.appendChild(lineNumbers);
                        container.appendChild(codeContent);
                        jsonEditor.appendChild(container);
                    }
                    
                    console.log("JSON editor updated after cell edit with proper formatting.");
                } catch (e) {
                    console.error("Error updating JSON after cell edit:", e);
                }
            } else {
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
            } else {
                this.viewMode = 'both';
            }
        },
        toggleGridView() {
            console.log(`Toggling grid view from ${this.viewMode}`);
            if (this.viewMode === 'gridOnly') {
                this.viewMode = 'both';
            } else if (this.viewMode === 'both') {
                this.viewMode = 'jsonOnly';
            } else {
                this.viewMode = 'both';
            }
        },
        checkScreenSize() {
            this.isLargeScreen = window.innerWidth >= 992;
        },
        
        loadSampleData() {
            console.log("Loading sample data");
            
            this.jsonInput = sampleJsonString;
            this.lastValidJson = sampleJsonString;
            this.fileName = '';
            
            const jsonEditor = document.getElementById('jsonEditor');
            if (jsonEditor) {
                // Clear the editor
                jsonEditor.innerHTML = '';
                
                // Build container for editor
                const container = document.createElement('div');
                container.className = 'editor-container';
                
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-number-container';
                lineNumbers.setAttribute('contenteditable', 'false');
                
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                codeContent.setAttribute('contenteditable', 'true');
                
                // Process each line separately
                const lines = sampleJsonString.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    // Create line number element
                    const lineNumber = document.createElement('div');
                    lineNumber.className = 'line-number';
                    lineNumber.textContent = (i + 1).toString();
                    lineNumbers.appendChild(lineNumber);
                    
                    // Create code line element
                    const codeLine = document.createElement('div');
                    codeLine.className = 'code-line';
                    
                    // Apply syntax highlighting if possible
                    try {
                        const line = lines[i];
                        codeLine.textContent = line; // Fallback content
                        
                        if (line.trim()) {
                            codeLine.textContent = '';
                            const grammar = Prism.languages.json;
                            const tokens = Prism.tokenize(line, grammar);
                            this.renderTokensToElement(tokens, codeLine);
                        }
                    } catch (err) {
                        // Fallback already in place
                    }
                    
                    codeContent.appendChild(codeLine);
                }
                
                // Assemble and update the editor
                container.appendChild(lineNumbers);
                container.appendChild(codeContent);
                jsonEditor.appendChild(container);
            }
            
            this.processJsonInput();
        }
    },
    computed: {
        filteredAndSortedRows() {
            let result = [...this.rows];

            if (this.filterText) {
                const lowerFilter = this.filterText.toLowerCase();
                result = result.filter(row => {
                    return this.headers.some(header => {
                        const value = row[header];
                        return value !== null && value !== undefined && String(value).toLowerCase().includes(lowerFilter);
                    });
                });
            }

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

            return result;
        },
        jsonColumnClass() {
            switch (this.viewMode) {
                case 'jsonOnly': return 'col-12';
                case 'gridOnly': return 'd-none';
                default:         return 'col-12 col-lg-4';
            }
        },
        gridColumnClass() {
            switch (this.viewMode) {
                case 'jsonOnly': return 'd-none';
                case 'gridOnly': return 'col-12';
                default:         return 'col-12 col-lg-8';
            }
        },
        jsonCollapseIcon() {
            if (this.viewMode === 'jsonOnly') return 'bi bi-arrows-angle-contract';
            if (this.viewMode === 'gridOnly') return 'bi bi-arrows-angle-expand';
            return this.isLargeScreen ? 'bi bi-chevron-double-left' : 'bi bi-chevron-double-up'; 
        },
        gridCollapseIcon() {
            if (this.viewMode === 'gridOnly') return 'bi bi-arrows-angle-contract';
            if (this.viewMode === 'jsonOnly') return 'bi bi-arrows-angle-expand';
            return this.isLargeScreen ? 'bi bi-chevron-double-right' : 'bi bi-chevron-double-down';
        },
        jsonCollapseTitle() {
            if (this.viewMode === 'jsonOnly') return 'Show Both Sections'; 
            if (this.viewMode === 'gridOnly') return 'Show JSON Section';
            return this.isLargeScreen ? 'Collapse JSON Section (Show Grid Only)' : 'Collapse JSON Section Up (Show Grid Only)';
        },
         gridCollapseTitle() {
            if (this.viewMode === 'gridOnly') return 'Show Both Sections';
            if (this.viewMode === 'jsonOnly') return 'Show Grid Section';
            return this.isLargeScreen ? 'Collapse Grid Section (Show JSON Only)' : 'Collapse Grid Section Down (Show JSON Only)';
        }
    },
    watch: {
        isLargeScreen(newValue) {
            if (!newValue && (this.viewMode === 'jsonOnly' || this.viewMode === 'gridOnly')) {
                this.viewMode = 'both';
            }
        }
    },
    mounted() {
        this.initializeEditor();
        
        setTimeout(() => {
            this.processJsonInput();
        }, 100);
        
        this.checkScreenSize();
        
        window.addEventListener('resize', this.checkScreenSize);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.checkScreenSize);
    }
}).mount('#app'); 