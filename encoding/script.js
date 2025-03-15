// Encoding/Decoding handlers
const encoders = {
    base64: {
        encode: async (input) => {
            if (input instanceof File) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64String = reader.result.split(',')[1];
                        resolve(base64String);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(input);
                });
            }
            return btoa(input);
        },
        decode: (text) => atob(text)
    },
    url: {
        encode: (text) => {
            // Encode the text, preserving spaces as %20 instead of +
            return encodeURIComponent(text).replace(/%20/g, ' ');
        },
        decode: (text) => {
            try {
                // Replace spaces with %20 before decoding to handle spaces correctly
                return decodeURIComponent(text.replace(/ /g, '%20'));
            } catch (error) {
                throw new Error('Invalid URL encoded text');
            }
        }
    },
    xml: {
        encode: (text) => {
            // XML entity encoding map with more special characters
            const xmlEntities = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&apos;',
                '©': '&copy;',
                '®': '&reg;',
                '™': '&trade;',
                '€': '&euro;',
                '£': '&pound;',
                '¢': '&cent;',
                '¥': '&yen;',
                '§': '&sect;',
                '¶': '&para;',
                '†': '&dagger;',
                '‡': '&Dagger;',
                '•': '&bull;',
                '…': '&hellip;',
                '–': '&ndash;',
                '—': '&mdash;',
                '′': '&prime;',
                '″': '&Prime;',
                '‹': '&lsaquo;',
                '›': '&rsaquo;',
                '«': '&laquo;',
                '»': '&raquo;',
                '←': '&larr;',
                '→': '&rarr;',
                '↑': '&uarr;',
                '↓': '&darr;',
                '↔': '&harr;',
                '↵': '&crarr;',
                '⌈': '&lceil;',
                '⌉': '&rceil;',
                '⌊': '&lfloor;',
                '⌋': '&rfloor;',
                '◊': '&loz;',
                '♠': '&spades;',
                '♣': '&clubs;',
                '♥': '&hearts;',
                '♦': '&diams;',
                'α': '&alpha;',
                'β': '&beta;',
                'γ': '&gamma;',
                'δ': '&delta;',
                'ε': '&epsilon;',
                'ζ': '&zeta;',
                'η': '&eta;',
                'θ': '&theta;',
                'ι': '&iota;',
                'κ': '&kappa;',
                'λ': '&lambda;',
                'μ': '&mu;',
                'ν': '&nu;',
                'ξ': '&xi;',
                'ο': '&omicron;',
                'π': '&pi;',
                'ρ': '&rho;',
                'ς': '&sigmaf;',
                'σ': '&sigma;',
                'τ': '&tau;',
                'υ': '&upsilon;',
                'φ': '&phi;',
                'χ': '&chi;',
                'ψ': '&psi;',
                'ω': '&omega;',
                'ϑ': '&thetasym;',
                'ϒ': '&upsih;',
                'ϖ': '&piv;',
                '•': '&bull;',
                '…': '&hellip;',
                '′': '&prime;',
                '″': '&Prime;',
                '‾': '&oline;',
                '⁄': '&frasl;',
                '℘': '&weierp;',
                'ℑ': '&image;',
                'ℜ': '&real;',
                '™': '&trade;',
                'ℵ': '&alefsym;',
                '&larr;': '←',
                '&rarr;': '→',
                '&uarr;': '↑',
                '&darr;': '↓',
                '&harr;': '↔',
                '&crarr;': '↵',
                '&lceil;': '⌈',
                '&rceil;': '⌉',
                '&lfloor;': '⌊',
                '&rfloor;': '⌋',
                '&loz;': '◊',
                '&spades;': '♠',
                '&clubs;': '♣',
                '&hearts;': '♥',
                '&diams;': '♦'
            };

            // Replace special characters with their XML entities
            return text.replace(/[&<>"']|[^\x20-\x7E]/g, char => {
                if (char === "'") return '&apos;';
                return xmlEntities[char] || `&#${char.charCodeAt(0)};`;
            });
        },
        decode: (text) => {
            // XML entity decoding map with more special characters
            const xmlEntities = {
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&quot;': '"',
                '&apos;': "'",
                '&copy;': '©',
                '&reg;': '®',
                '&trade;': '™',
                '&euro;': '€',
                '&pound;': '£',
                '&cent;': '¢',
                '&yen;': '¥',
                '&sect;': '§',
                '&para;': '¶',
                '&dagger;': '†',
                '&Dagger;': '‡',
                '&bull;': '•',
                '&hellip;': '…',
                '&ndash;': '–',
                '&mdash;': '—',
                '&prime;': '′',
                '&Prime;': '″',
                '&lsaquo;': '‹',
                '&rsaquo;': '›',
                '&laquo;': '«',
                '&raquo;': '»',
                '&larr;': '←',
                '&rarr;': '→',
                '&uarr;': '↑',
                '&darr;': '↓',
                '&harr;': '↔',
                '&crarr;': '↵',
                '&lceil;': '⌈',
                '&rceil;': '⌉',
                '&lfloor;': '⌊',
                '&rfloor;': '⌋',
                '&loz;': '◊',
                '&spades;': '♠',
                '&clubs;': '♣',
                '&hearts;': '♥',
                '&diams;': '♦',
                '&alpha;': 'α',
                '&beta;': 'β',
                '&gamma;': 'γ',
                '&delta;': 'δ',
                '&epsilon;': 'ε',
                '&zeta;': 'ζ',
                '&eta;': 'η',
                '&theta;': 'θ',
                '&iota;': 'ι',
                '&kappa;': 'κ',
                '&lambda;': 'λ',
                '&mu;': 'μ',
                '&nu;': 'ν',
                '&xi;': 'ξ',
                '&omicron;': 'ο',
                '&pi;': 'π',
                '&rho;': 'ρ',
                '&sigmaf;': 'ς',
                '&sigma;': 'σ',
                '&tau;': 'τ',
                '&upsilon;': 'υ',
                '&phi;': 'φ',
                '&chi;': 'χ',
                '&psi;': 'ψ',
                '&omega;': 'ω',
                '&thetasym;': 'ϑ',
                '&upsih;': 'ϒ',
                '&piv;': 'ϖ',
                '&bull;': '•',
                '&hellip;': '…',
                '&prime;': '′',
                '&Prime;': '″',
                '&oline;': '‾',
                '&frasl;': '⁄',
                '&weierp;': '℘',
                '&image;': 'ℑ',
                '&real;': 'ℜ',
                '&trade;': '™',
                '&alefsym;': 'ℵ',
                '&larr;': '←',
                '&rarr;': '→',
                '&uarr;': '↑',
                '&darr;': '↓',
                '&harr;': '↔',
                '&crarr;': '↵',
                '&lceil;': '⌈',
                '&rceil;': '⌉',
                '&lfloor;': '⌊',
                '&rfloor;': '⌋',
                '&loz;': '◊',
                '&spades;': '♠',
                '&clubs;': '♣',
                '&hearts;': '♥',
                '&diams;': '♦'
            };

            // First replace named entities
            let decoded = text.replace(/&(amp|lt|gt|quot|apos|[a-zA-Z]+);/g, entity => xmlEntities[entity] || entity);
            
            // Then replace numeric entities
            return decoded.replace(/&#(\d+);/g, (match, dec) => xmlEntities[match] || String.fromCharCode(dec));
        }
    }
};

// Helper function to format XML with proper indentation
function formatXML(node, level = 0) {
    const indent = '  '.repeat(level);
    let formatted = '';
    
    if (node.nodeType === Node.ELEMENT_NODE) {
        formatted += indent + '<' + node.tagName;
        
        // Add attributes
        for (const attr of node.attributes) {
            formatted += ' ' + attr.name + '="' + attr.value + '"';
        }
        
        if (node.childNodes.length === 0) {
            formatted += '/>\n';
        } else {
            formatted += '>\n';
            
            // Process child nodes
            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                    formatted += indent + '  ' + child.textContent.trim() + '\n';
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    formatted += formatXML(child, level + 1);
                }
            }
            
            formatted += indent + '</' + node.tagName + '>\n';
        }
    }
    
    return formatted;
}

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const textTab = document.getElementById('textTab');
const fileTab = document.getElementById('fileTab');
const textInputContainer = document.getElementById('textInputContainer');
const fileInputContainer = document.getElementById('fileInputContainer');
const inputText = document.getElementById('inputText');
const inputFile = document.getElementById('inputFile');
const outputText = document.getElementById('outputText');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const encodingType = document.getElementById('encodingType');
const encodeRadio = document.getElementById('encodeRadio');
const decodeRadio = document.getElementById('decodeRadio');
const notification = document.getElementById('notification');

// URL Parameter handling
function updateURL() {
    const params = new URLSearchParams(window.location.search);
    params.set('type', encodingType.value);
    params.set('mode', encodeRadio.checked ? 'encode' : 'decode');
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const mode = params.get('mode');
    
    if (type && encoders[type]) {
        encodingType.value = type;
    }
    
    if (mode === 'decode') {
        decodeRadio.checked = true;
        encodeRadio.checked = false;
    }
}

// Initialize from URL parameters
loadFromURL();

// Add event listeners for URL updates
encodingType.addEventListener('change', updateURL);
encodeRadio.addEventListener('change', updateURL);
decodeRadio.addEventListener('change', updateURL);

// Notification system
function showNotification(message, type = 'error') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// Theme handling
function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme === 'dark');

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(!isDark);
});

// Tab switching
function switchTab(tab) {
    textTab.classList.remove('active');
    fileTab.classList.remove('active');
    tab.classList.add('active');
    
    // Reset both input and output fields
    inputText.value = '';
    inputFile.value = '';
    outputText.value = '';
    
    if (tab === textTab) {
        textInputContainer.style.display = 'block';
        fileInputContainer.style.display = 'none';
    } else {
        textInputContainer.style.display = 'none';
        fileInputContainer.style.display = 'block';
    }
}

textTab.addEventListener('click', () => switchTab(textTab));
fileTab.addEventListener('click', () => switchTab(fileTab));

// File handling
inputFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const text = await file.text();
            inputText.value = text;
            processInput(); // Process the file content immediately
        } catch (error) {
            outputText.value = `Error reading file: ${error.message}`;
        }
    }
});

// Process handlers
async function processInput() {
    let input;
    const hasFile = inputFile.files && inputFile.files.length > 0;
    const operation = encodeRadio.checked ? 'encode' : 'decode';
    
    if (hasFile) {
        input = inputFile.files[0];
    } else {
        input = inputText.value;
    }

    if (!input) {
        outputText.value = 'Please enter some text or upload a file';
        return;
    }

    const encoder = encoders[encodingType.value];
    if (!encoder) {
        outputText.value = 'Unsupported encoding type';
        return;
    }

    try {
        let result;
        if (operation === 'encode' && hasFile && encodingType.value === 'base64') {
            result = await encoder.encode(input);
        } else {
            result = operation === 'encode' 
                ? await encoder.encode(input)
                : await encoder.decode(input);
        }
        outputText.value = result;
    } catch (error) {
        outputText.value = `Error processing text: ${error.message}`;
    }
}

// Add event listeners for real-time processing
inputText.addEventListener('input', processInput);
encodeRadio.addEventListener('change', processInput);
decodeRadio.addEventListener('change', processInput);
encodingType.addEventListener('change', processInput);

// Copy button handler
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputText.value);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="bi bi-check"></i>';
    copyBtn.classList.add('success');
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove('success');
    }, 2000);
});

// Download button handler
downloadBtn.addEventListener('click', () => {
    const output = outputText.value;
    if (!output) {
        outputText.value = 'No output to download';
        return;
    }

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encoded_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}); 