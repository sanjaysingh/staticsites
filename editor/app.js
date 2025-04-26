let editor;

// Centralized language configuration
const supportedLanguages = {
    plaintext: { displayName: 'Plain Text' },
    cpp: { displayName: 'C++' },
    csharp: { displayName: 'C#' },
    css: { displayName: 'CSS' },
    go: { displayName: 'Go' },
    html: { displayName: 'HTML' },
    java: { displayName: 'Java' },
    javascript: { displayName: 'JavaScript' },
    json: { displayName: 'JSON' },
    markdown: { displayName: 'Markdown' },
    php: { displayName: 'PHP' },
    powershell: { displayName: 'PowerShell' },
    python: { displayName: 'Python' },
    ruby: { displayName: 'Ruby' },
    sql: { displayName: 'SQL' },
    typescript: { displayName: 'TypeScript' },
    xml: { displayName: 'XML' },
    yaml: { displayName: 'YAML' },
    // Add new languages here
    // example: rust: { displayName: 'Rust' }
};

// Editor themes
const editorThemes = {
    'vs-dark': 'Dark',
    'vs': 'Light',
    'hc-black': 'High Contrast Dark',
    'hc-light': 'High Contrast Light'
};

// Editor settings
const editorSettings = {
    theme: 'vs-dark',
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: false,
    lineNumbers: true,
    formatOnPaste: true,
    formatOnType: false,
    autoIndent: 'advanced',
    useTabStops: true
};

// Security measures - block network requests
window.addEventListener('load', () => {
    // Block various network request methods
    window.fetch = () => Promise.reject(new Error('Network requests are disabled'));
    window.XMLHttpRequest = function() { throw new Error('Network requests are disabled'); };
    window.WebSocket = function() { throw new Error('Network requests are disabled'); };

    // Block dynamic script loading
    const originalCreateElement = document.createElement;
    document.createElement = function(tag) {
        const element = originalCreateElement.call(document, tag);
        if (tag.toLowerCase() === 'script') {
            Object.defineProperty(element, 'src', {
                set: () => { throw new Error('Dynamic script loading is disabled'); }
            });
        }
        return element;
    };
    
    // Populate dropdowns
    populateLanguageDropdown();
    populateThemeDropdown();
});

// Populate language dropdown from the supportedLanguages object
function populateLanguageDropdown() {
    const selectElement = document.getElementById('language-select');
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Create and append options based on the configured languages
    Object.entries(supportedLanguages).forEach(([langId, langInfo]) => {
        const option = document.createElement('option');
        option.value = langId;
        option.textContent = langInfo.displayName;
        selectElement.appendChild(option);
    });
}

// Populate theme dropdown
function populateThemeDropdown() {
    // Only create theme dropdown if it exists in the HTML
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) return;
    
    // Clear existing options
    themeSelect.innerHTML = '';
    
    // Create and append options based on available themes
    Object.entries(editorThemes).forEach(([themeId, themeName]) => {
        const option = document.createElement('option');
        option.value = themeId;
        option.textContent = themeName;
        if (themeId === editorSettings.theme) {
            option.selected = true;
        }
        themeSelect.appendChild(option);
    });
}

// Initialize Monaco Editor
const loadMonaco = () => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.js';
    script.onload = () => {
        require.config({
            paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' }
        });
        require(['vs/editor/editor.main'], initializeEditor);
    };
    document.body.appendChild(script);
};

// Language detection utility
const languageDetector = {
    // Extension to language mapping
    extensionMap: {
        'js': 'javascript',
        'ts': 'typescript',
        'html': 'html',
        'xml': 'xml',
        'css': 'css',
        'py': 'python',
        'java': 'java',
        'cs': 'csharp',
        'cpp': 'cpp',
        'rb': 'ruby',
        'go': 'go',
        'php': 'php',
        'sql': 'sql',
        'md': 'markdown',
        'json': 'json',
        'ps1': 'powershell',
        'psm1': 'powershell',
        'psd1': 'powershell',
        'txt': 'plaintext',
        'yaml': 'yaml',
        'yml': 'yaml'
        // Add new extensions here as needed
    },
    
    // Language signatures for content-based detection
    signatures: {
        javascript: {
            keywords: ['const', 'let', 'var', 'function', '=>', 'console.log', 'require', 'module.exports', 'async', 'await', 'export', 'import', 'this.', 'prototype'],
            patterns: [/^[\s\n]*(?:const|let|var)\s+\w+\s*=/, /\bfunction\s*\w*\s*\(.*\)\s*{/, /=>\s*{/, /require\(['"]\w+['"]\)/, /export\s+(?:const|let|var|function|class)/, /import\s+.*from\s+['"]/]
        },
        typescript: {
            keywords: ['interface', 'type', 'namespace', 'readonly', 'private', 'public', 'protected', 'enum', 'declare', 'implements', 'extends', 'abstract', 'as', 'unknown'],
            patterns: [/:\s*(?:string|number|boolean|any|void|unknown|never)\b/, /interface\s+\w+\s*{/, /:\s*(?:private|public|protected)\s+\w+\s*:/, /type\s+\w+\s*=/, /declare\s+(?:class|interface|type|namespace)/]
        },
        css: {
            keywords: ['margin:', 'padding:', 'border:', 'background-color:', '@media', 'color:', 'font-size:', 'display:', '@keyframes', '@import', '@font-face', 'position:', 'z-index:'],
            patterns: [/[.#][\w-]+\s*{/, /@media\s*[({]/, /:\s*(?:hover|active|focus|nth-child)\s*{/, /@keyframes\s+\w+\s*{/, /@import\s+url\(/, /@font-face\s*{/]
        },
        python: {
            keywords: ['def', 'class', 'import', 'from', 'if __name__', 'print(', 'elif', 'else:', 'try:', 'except:', 'with', 'yield', 'async', 'await', 'lambda', 'self.', 'super()'],
            patterns: [/def\s+\w+\s*\(.*\):/, /class\s+\w+[:(]/, /\bimport\s+\w+/, /\bfrom\s+\w+\s+import/, /if\s+__name__\s*==\s*['"]__main__['"]:/, /@\w+\s*def/]
        },
        csharp: {
            keywords: ['namespace', 'using', 'class', 'public', 'static', 'void', 'string', 'int', 'bool', 'var', 'get', 'set', 'private', 'protected', 'internal', 'new', 'return', 'this.', 'base.', 'override'],
            patterns: [/namespace\s+[\w.]+\s*{/, /using\s+System;/, /public\s+static\s+void\s+Main\s*\(String(\[\]|\.\.\.)\s+\w+\)/, /class\s+\w+\s*{/, /\b(?:get|set);/, /\[\w+\]/, /:\s*I[A-Z]\w+\b/]
        },
        java: {
            keywords: ['public class', 'private', 'protected', 'void', 'static', 'import', 'package', 'System.out.println', 'ArrayList', 'String', 'new', 'return', 'final', 'extends', 'implements', 'this.', 'super()'],
            patterns: [/public\s+class\s+\w+/, /public\s+static\s+void\s+main\s*\(String(\[\]|\.\.\.)\s+\w+\)/, /import\s+java\.[\w.]+;/ , /package\s+[\w.]+;/, /@Override\s+public/, /implements\s+\w+/]
        },
        go: {
            keywords: ['package', 'import', 'func', 'fmt.Println', 'var', ':=', 'range', 'type', 'struct', 'map', 'chan', 'go', 'defer', 'interface{}', 'make(', 'append('],
            patterns: [/^package\s+main/m, /import\s+"\w+"/, /import\s+\(.*\)/, /func\s+main\s*\(\)/, /func\s+\w+\s*\(.*\)/, /\w+\s+:=\s+/, /type\s+\w+\s+struct\s*{/]
        },
        json: {
            patterns: [/^[\s\n]*[{\[][\s\n]*"[^"]+"\s*:/, /^[\s\n]*\[[\s\n]*(?:{|"[^"]*")/, /"[\w-]+"\s*:\s*(?:null|true|false|"[^"]*"|\d+)/]
        },
        sql: {
            keywords: ['SELECT', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'WHERE', 'JOIN', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'GROUP BY', 'ORDER BY', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'UNION', 'HAVING'],
            patterns: [/SELECT\s+[\w\s,*]+\s+FROM/i, /INSERT\s+INTO\s+\w+/i, /CREATE\s+TABLE/i, /UPDATE\s+\w+\s+SET/i, /JOIN\s+\w+\s+ON/i, /GROUP\s+BY\s+[\w\s,]+/i]
        },
        powershell: {
            keywords: ['function', 'param', '$PSScriptRoot', 'Write-Host', 'Get-Process', 'Set-Location', 'if', 'else', 'foreach', 'while', 'try', 'catch', 'finally', '$true', '$false', '$null', 'param(', 'begin {', 'process {', 'end {'],
            patterns: [/$\w+/, /function\s+\w+-\w+/, /\[Parameter\(.*\)\]/, /\[CmdletBinding\(\)\]/, /Write-(?:Host|Output|Warning|Error)/, /begin\s*{/, /process\s*{/, /end\s*{/]
        },
        yaml: {
            patterns: [/^\s*- /m, /^\s*\w+:\s/m, /^---[ \t]*$/m, /^\s*-\s*name:/m, /^\s*-\s*hosts:/m]
        }
        // Add new language signatures here as needed
    },

    // Detect language from content
    fromContent(content) {
        // Check for HTML first (most distinctive pattern)
        if (/<!DOCTYPE\s+html>|<html[\s>]/i.test(content)) {
            return 'html';
        }

        // Helper functions
        const countMatches = (text, items) => items.filter(item => text.includes(item)).length;
        const matchesPatterns = (text, patterns) => patterns.some(pattern => pattern.test(text));
        
        // Score each language based on signatures
        let maxScore = 0;
        let detectedLang = '';
        const contentLines = content.split('\n').slice(0, 20); // Only check first 20 lines for better performance

        for (const [lang, tests] of Object.entries(this.signatures)) {
            let score = 0;
            
            // Check keywords in the first 20 lines
            if (tests.keywords) {
                score += countMatches(contentLines.join('\n'), tests.keywords) * 2;
            }
            
            // Check patterns in the entire content
            if (tests.patterns) {
                const patternMatches = tests.patterns.filter(pattern => pattern.test(content)).length;
                score += patternMatches * 5; // Give pattern matches higher weight
            }
            
            // Special case for JSON - must be valid JSON
            if (lang === 'json') {
                try {
                    JSON.parse(content);
                    score += 10; // Give JSON a big boost if it's valid
                } catch (e) {
                    score = 0; // If not valid JSON, don't consider it
                }
            }
            
            if (score > maxScore) {
                maxScore = score;
                detectedLang = lang;
            }
        }
        
        // If a language was detected with a decent score, return it
        if (maxScore >= 5) { 
            return detectedLang;
        }

        // Fallback: Check for generic XML pattern *after* specific signatures
        if (/<[^>]+>/.test(content)) {
            return 'xml';
        }
        
        // Default to plaintext if nothing else matches
        return 'plaintext';
    },
    
    // Get language from file
    fromFile(file, content) {
        const extension = file.name.split('.').pop().toLowerCase();
        let language = this.extensionMap[extension] || 'plaintext';
        
        // If extension doesn't provide a specific language, try to detect from content
        if (language === 'plaintext') {
            language = this.fromContent(content) || 'plaintext';
        }
        
        // Ensure the detected language is in our supported list
        return supportedLanguages[language] ? language : 'plaintext';
    }
};

// File handling
async function handleFile(file) {
    try {
        const text = await file.text();
        editor.setValue(text);

        // Detect language and update UI
        const language = languageDetector.fromFile(file, text);
        document.getElementById('language-select').value = language;
        monaco.editor.setModelLanguage(editor.getModel(), language);

        // Update file info in UI
        document.getElementById('file-path').textContent = file.name;
        document.title = `${file.name} - Offline Code Editor`;
        
        // Format code after opening
        setTimeout(() => formatCode(), 100);
    } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
    }
}

// Format code in editor
async function formatCode() {
    try {
        await editor.getAction('editor.action.formatDocument').run();
    } catch (error) {
        console.error('Formatting failed:', error);
        const currentModel = editor.getModel();
        if (currentModel) {
            const edits = await monaco.languages.getFormattingEditsForDocument(currentModel, {
                insertSpaces: true,
                tabSize: editorSettings.tabSize
            });
            if (edits) {
                currentModel.pushEditOperations([], edits, null);
            }
        }
    }
}

// Register additional language formatters
function registerFormatters() {
    // HTML formatter
    monaco.languages.registerDocumentFormattingEditProvider('html', {
        provideDocumentFormattingEdits: function(model) {
            const text = model.getValue();
            let formatted = '';
            let indent = 0;
            const lines = text.split(/[\r\n]+/);

            lines.forEach(line => {
                line = line.trim();
                if (line.endsWith('/>')) {
                    formatted += '  '.repeat(indent) + line + '\n';
                }
                else if (line.match(/<\/[^>]+>/)) {
                    if (!line.match(/<[^/][^>]*>/)) {
                        indent--;
                    }
                    formatted += '  '.repeat(Math.max(0, indent)) + line + '\n';
                }
                else if (line.match(/<[^/][^>]*>/)) {
                    formatted += '  '.repeat(indent) + line + '\n';
                    if (!line.match(/<\/[^>]+>/) && !line.endsWith('/>')) {
                        indent++;
                    }
                }
                else {
                    formatted += '  '.repeat(indent) + line + '\n';
                }
            });

            return [{
                range: model.getFullModelRange(),
                text: formatted.trim()
            }];
        }
    });
    
    // XML formatter
    monaco.languages.registerDocumentFormattingEditProvider('xml', {
        provideDocumentFormattingEdits: function(model) {
            const text = model.getValue();
            let formatted = '';
            let indent = 0;
            const lines = text.split(/[\r\n]+/);

            lines.forEach(line => {
                line = line.trim();
                if (line.endsWith('/>')) {
                    formatted += '  '.repeat(indent) + line + '\n';
                }
                else if (line.startsWith('</')) {
                    indent--;
                    formatted += '  '.repeat(Math.max(0, indent)) + line + '\n';
                }
                else if (line.startsWith('<') && !line.startsWith('<?')) {
                    formatted += '  '.repeat(indent) + line + '\n';
                    if (!line.includes('</')) {
                        indent++;
                    }
                }
                else {
                    formatted += '  '.repeat(indent) + line + '\n';
                }
            });

            return [{
                range: model.getFullModelRange(),
                text: formatted.trim()
            }];
        }
    });
    
    // JSON formatter is built-in, no need to register
}

// Register keyboard shortcuts and commands
function registerCommands() {
    // Save shortcut (Ctrl+S) - shows save dialog since we can't actually save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
        const content = editor.getValue();
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = document.getElementById('file-path').textContent || 'untitled.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
    
    // Format code shortcut (Alt+Shift+F)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, formatCode);
    
    // Toggle comment (Ctrl+/)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, function() {
        editor.getAction('editor.action.commentLine').run();
    });
    
    // Find (Ctrl+F)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, function() {
        editor.getAction('actions.find').run();
    });
    
    // Replace (Ctrl+H)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, function() {
        editor.getAction('editor.action.startFindReplaceAction').run();
    });
    
    // Go to line (Ctrl+G)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, function() {
        editor.getAction('editor.action.gotoLine').run();
    });
}

// Change editor theme
function changeTheme(theme) {
    monaco.editor.setTheme(theme);
    editorSettings.theme = theme;
}

// Initialize editor
function initializeEditor() {
    // Register language formatters
    registerFormatters();
    
    // Create editor instance with improved settings
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '',
        language: 'plaintext',
        theme: editorSettings.theme,
        minimap: { enabled: editorSettings.minimap },
        automaticLayout: true,
        fontSize: editorSettings.fontSize,
        tabSize: editorSettings.tabSize,
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false,
        lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
        folding: true,
        renderIndentGuides: true,
        contextmenu: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: editorSettings.formatOnPaste,
        formatOnType: editorSettings.formatOnType,
        autoIndent: editorSettings.autoIndent,
        wordWrap: editorSettings.wordWrap,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
        fixedOverflowWidgets: true,
        suggest: {
            snippetsPreventQuickSuggestions: false,
            showWords: true,
            showClasses: true,
            showFunctions: true
        },
        quickSuggestions: {
            other: true,
            comments: true,
            strings: true
        },
        parameterHints: { enabled: true },
        smartSelect: { selectSubwords: true },
        bracketPairColorization: { enabled: true },
        find: { autoFindInSelection: 'multiline' },
        accessibilitySupport: 'on',
        cursorBlinking: 'smooth',
        mouseWheelZoom: true,
        guides: {
            indentation: true,
            bracketPairs: true
        },
        renderControlCharacters: true
    });
    
    // Register keyboard shortcuts and commands
    registerCommands();

    // Set up event listeners
    setupEventListeners();
    
    // Create a status bar with information
    createStatusBar();
    
    // Mobile optimization
    if ('ontouchstart' in window) {
        editor.updateOptions({
            fontSize: 16,
            lineHeight: 24,
            padding: { top: 10, bottom: 10 }
        });
    }
}

// Create a status bar with additional information
function createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.id = 'status-bar';
    statusBar.className = 'status-bar';
    
    const positionInfo = document.createElement('div');
    positionInfo.id = 'position-info';
    positionInfo.className = 'status-item';
    positionInfo.textContent = 'Ln 1, Col 1';
    
    const languageInfo = document.createElement('div');
    languageInfo.id = 'language-info';
    languageInfo.className = 'status-item';
    languageInfo.textContent = 'plaintext';
    
    statusBar.appendChild(positionInfo);
    statusBar.appendChild(languageInfo);
    
    document.body.appendChild(statusBar);
    
    // Update position and language info when cursor position changes
    editor.onDidChangeCursorPosition((e) => {
        const position = editor.getPosition();
        positionInfo.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
    });
    
    // Update language info when language changes
    editor.onDidChangeModelLanguage((e) => {
        languageInfo.textContent = e.newLanguage;
    });
}

// Set up all event listeners
function setupEventListeners() {
    const dropZone = document.getElementById('drop-zone');

    // Drag and drop handling
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (e.target === dropZone) {
            dropZone.classList.remove('active');
        }
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        const file = e.dataTransfer.files[0];
        if (file) {
            await handleFile(file);
        }
    });

    // File input handling
    document.getElementById('file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFile(file);
        }
        e.target.value = '';
    });

    // Window resize handling
    window.addEventListener('resize', () => editor.layout());

    // Editor paste handling
    editor.onDidPaste(() => {
        setTimeout(() => {
            const content = editor.getValue();
            const detectedLanguage = languageDetector.fromContent(content);
            if (detectedLanguage) {
                document.getElementById('language-select').value = detectedLanguage;
                monaco.editor.setModelLanguage(editor.getModel(), detectedLanguage);
            }
        }, 100);
    });

    // Editor content change handling
    editor.onDidChangeModelContent((e) => {
        if (e.isFlush) {
            const content = editor.getValue();
            const detectedLanguage = languageDetector.fromContent(content);
            if (detectedLanguage) {
                document.getElementById('language-select').value = detectedLanguage;
                monaco.editor.setModelLanguage(editor.getModel(), detectedLanguage);
            }
        }
    });

    // Language selection handling
    document.getElementById('language-select').addEventListener('change', (e) => {
        if (e.target.value) {
            monaco.editor.setModelLanguage(editor.getModel(), e.target.value);
        }
    });
    
    // Theme selection handling if exists in HTML
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                changeTheme(e.target.value);
            }
        });
    }
    
    // Add custom keyboard shortcut handling
    document.addEventListener('keydown', (e) => {
        // Ctrl+S to trigger save dialog
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            editor.getAction('editor.action.formatDocument').run().then(() => {
                const content = editor.getValue();
                const blob = new Blob([content], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = document.getElementById('file-path').textContent || 'untitled.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        }
    });
}

// Initialize the application
loadMonaco(); 