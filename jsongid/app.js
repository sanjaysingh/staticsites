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
            jsonInput: sampleJsonString, // Initialize with sample data
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
            isLargeScreen: window.innerWidth >= 992 // Check initial screen size
        };
    },
    methods: {
        processJsonInput() {
            if (!this.jsonInput.trim()) {
                this.setError('JSON input cannot be empty.');
                return;
            }
            this.loading = true;
            this.isUpdatingFromInput = true;
            this.clearGridAndError();
            setTimeout(() => { // Simulate processing time and allow UI update
                try {
                    const parsedData = this.parseAndValidate(this.jsonInput);
                    this.filterText = '';
                    this.sortKey = '';
                    this.displayData(parsedData);
                } catch (e) {
                    this.setError(`Invalid JSON or structure: ${e.message}`);
                } finally {
                    this.loading = false;
                    this.isUpdatingFromInput = false;
                }
            }, 50); // Small delay
        },
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            this.loading = true;
            this.isUpdatingFromInput = true;
            this.fileName = file.name;
            this.clearAll(); // Clear previous state including text input
            this.clearGridAndError();

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsedData = this.parseAndValidate(e.target.result);
                    this.jsonInput = e.target.result; // Show loaded JSON in textarea
                    this.filterText = '';
                    this.sortKey = '';
                    this.displayData(parsedData);
                } catch (err) {
                    this.setError(`Error reading file or invalid JSON/structure: ${err.message}`);
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
            
            // Store the original parsed structure separately
            this.jsonData = originalStructure; 
            
            // Return only the array part for the table
            return dataArray; 
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
             // Ensure grid data (headers, rows) is NOT cleared when an error occurs
             // Grid clearing should only happen on successful load of new (potentially empty) data
             // or via clearAll().
             // this.clearGrid(); 
        },
        clearGrid() {
             this.headers = [];
             this.rows = [];
             // Don't clear jsonData here, parseAndValidate sets it.
             // this.jsonData = null; 
        },
        clearGridAndError(){
            this.error = null;
            // Remove the call to clearGrid() to prevent flicker
            // this.clearGrid();
        },
        clearAll() {
            this.jsonInput = '';
            this.jsonData = null;
            this.headers = [];
            this.rows = [];
            this.error = null;
            this.fileName = '';
            this.filterText = '';
            this.sortKey = '';
            this.viewMode = 'both'; // Reset view on clear
            const fileInput = this.$refs.fileInput;
            if(fileInput) fileInput.value = null;
        },
        cellEdited(event, row, header) {
            const newValue = event.target.value;
            const oldValue = row[header];

            // console.log(`Cell edit triggered: Row ${this.rows.indexOf(row)}, Header ${header}, Old: ${oldValue}, New: ${newValue}`);

            // Update only if the value has actually changed
            if (newValue !== String(oldValue)) { // Compare as strings for simplicity, could add type checking
                 console.log(`Updating ${header} from '${oldValue}' to '${newValue}'`);
                row[header] = newValue;

                // Important: Trigger reactivity by creating a new array reference.
                // This ensures the watcher detects the change in the nested object.
                this.rows = [...this.rows]; 
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
            if (this.viewMode === 'jsonOnly') {
                this.viewMode = 'both';
            } else if (this.viewMode === 'both') {
                this.viewMode = 'gridOnly';
            } else { // gridOnly
                this.viewMode = 'both';
            }
        },
        toggleGridView() {
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
            // console.log("Screen size large:", this.isLargeScreen);
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
        rows: {
            handler(newRows) {
                if (this.isUpdatingFromInput) {
                    return; 
                }
                try {
                    let dataToOutput = newRows;
                    // Reconstruct object wrapper if necessary, using the stored jsonData
                    if(this.jsonData && typeof this.jsonData === 'object' && !Array.isArray(this.jsonData)){
                         const keys = Object.keys(this.jsonData);
                         if(keys.length === 1 && Array.isArray(this.jsonData[keys[0]])){
                             dataToOutput = { [keys[0]]: newRows };
                         }
                    }

                    const newJsonString = JSON.stringify(dataToOutput, null, 2);
                    
                    // Simplified update: If string differs, update input.
                    if (newJsonString !== this.jsonInput) {
                        this.jsonInput = newJsonString;
                    } 
                } catch (e) {
                    console.error("Error stringifying edited data:", e);
                    // Potentially set an error message here if stringify fails
                    // this.setError("Error preparing JSON text from grid changes.");
                }
            },
            deep: true
        }
    },
    mounted() {
        // Process the initial sample JSON data when the app is mounted
        console.log("App mounted, processing initial JSON...");
        this.processJsonInput();
        // Add resize listener
        this.checkScreenSize(); // Initial check
        window.addEventListener('resize', this.checkScreenSize);
    },
    beforeUnmount() {
        // Clean up listener
        window.removeEventListener('resize', this.checkScreenSize);
    }
}).mount('#app'); 