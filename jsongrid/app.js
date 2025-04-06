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

            // Quick check: If input string hasn't changed from current data, do nothing.
            try {
                if (this.jsonData !== null && JSON.stringify(this.jsonData, null, 2) === this.jsonInput) {
                     console.log("Skipping processing: jsonInput matches current jsonData.");
                     return; // Exit early
                }
            } catch (e) { 
                console.warn("Error comparing existing jsonData, proceeding with parse.");
            }

            this.loading = true;
            this.isUpdatingFromInput = true;

            try {
                // Parse and get both parts
                const { dataArray: newDataArray, originalStructure: newOriginalStructure } = this.parseAndValidate(this.jsonInput);

                // Deep comparison: Only update if the parsed data is different from current
                if (this.jsonData === null || !this.areDeeplyEqual(this.jsonData, newOriginalStructure)) {
                    console.log("Data has changed, applying delta update.");
                    
                    if (this.jsonData === null) {
                        // Initial load: Just display the data directly
                         console.log("Initial data load.");
                         this.jsonData = newOriginalStructure;
                         this.clearGridAndError();
                         this.filterText = '';
                         this.sortKey = '';
                         this.displayData(newDataArray);
                    } else {
                        // Delta update logic
                        const currentRowsMap = new Map(this.rows.map(row => [row.id, row]));
                        const newRowsMap = new Map(newDataArray.map(row => [row.id, row]));
                        const updatedIds = new Set();
                        let requiresHeaderUpdate = false;

                        // 1. Handle Updates and Additions
                        for (const [id, newRow] of newRowsMap.entries()) {
                            if (currentRowsMap.has(id)) {
                                // Update existing row if changed
                                const currentRow = currentRowsMap.get(id);
                                if (!this.areDeeplyEqual(currentRow, newRow)) {
                                    // Update properties of the existing object in this.rows
                                    Object.assign(currentRow, newRow);
                                    console.log(`Updated row ID: ${id}`);
                                }
                                updatedIds.add(id); // Mark as processed
                            } else {
                                // Add new row
                                this.rows.push(newRow);
                                console.log(`Added row ID: ${id}`);
                                if (this.rows.length === 1) requiresHeaderUpdate = true; // Headers needed if first row added
                            }
                        }

                        // 2. Handle Deletions
                        let i = this.rows.length;
                        while (i--) { // Iterate backwards for safe removal
                            const currentRow = this.rows[i];
                            if (!newRowsMap.has(currentRow.id)) {
                                this.rows.splice(i, 1);
                                console.log(`Removed row ID: ${currentRow.id}`);
                                 if (this.rows.length === 0) requiresHeaderUpdate = true; // Headers changed if last row removed
                            }
                        }

                        // 3. Update Headers if needed
                        const newHeaders = newDataArray.length > 0 ? Object.keys(newDataArray[0]) : [];
                        if (requiresHeaderUpdate || !this.areDeeplyEqual(this.headers, newHeaders)) {
                            console.log("Updating headers.");
                            this.headers = newHeaders;
                        }

                        // 4. Update canonical jsonData
                        this.jsonData = newOriginalStructure;
                        
                        // 5. Conditionally reset sortKey and clear errors
                        this.clearGridAndError(); // Clear errors
                        // Remove filter reset: this.filterText = '';     
                        // Only reset sortKey if it's no longer a valid header
                        if (this.sortKey && !newHeaders.includes(this.sortKey)) {
                            console.log(`Resetting sortKey because '${this.sortKey}' is no longer a valid header.`);
                            this.sortKey = '';   
                        }
                    }
                } else {
                     console.log("Parsed data is identical to existing data. Skipping grid update.");
                     this.error = null; // Ensure error is cleared
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
            
            // No longer set this.jsonData here
            // this.jsonData = originalStructure; 
            
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

                // Update rows array reference AFTER modifying the row
                // This line might not even be strictly necessary if Vue detects the deep change, 
                // but it's safer for reactivity across versions/scenarios.
                // We might test removing this later if performance is critical.
                this.rows = [...this.rows]; 

                // --- New Code: Update jsonInput directly ---
                try {
                    // Check if the original data was wrapped in an object
                    if (this.jsonData && !Array.isArray(this.jsonData)) {
                         const key = Object.keys(this.jsonData)[0];
                         // Update the array within the wrapper object
                         // Note: This assumes this.rows IS the array inside jsonData[key]
                         // If parseAndValidate cloned it, this needs adjustment.
                         // Let's assume for now they are the same reference or Vue handles it.
                         this.jsonData[key] = this.rows; 
                         this.jsonInput = JSON.stringify(this.jsonData, null, 2);
                    } else {
                         // Original data was just an array
                         // Update jsonData to match the potentially modified rows array
                         this.jsonData = this.rows; 
                         this.jsonInput = JSON.stringify(this.rows, null, 2);
                    }
                    console.log("jsonInput updated after cell edit.");
                } catch (e) {
                     console.error("Error updating jsonInput after cell edit:", e);
                     // Optionally set an error message for the user
                     // this.setError("Failed to update JSON input after edit.");
                }
                // --- End New Code ---

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
        // // Watch for deep changes in jsonData to update jsonInput
        // jsonData: {
        //     handler(newValue, oldValue) {
        //         // Avoid updating jsonInput if the change originated from the textarea itself
        //          if (this.isUpdatingFromInput) {
        //             console.log("Watcher skipped: Update initiated from input.");
        //             return;
        //          }
                 
        //         // Avoid unnecessary updates if data hasn't actually changed meaningfully
        //         // Stringify both to compare content, not just reference
        //          const newJsonString = JSON.stringify(newValue, null, 2);
        //          // console.log("Watcher trying to update jsonInput. Current:", this.jsonInput, "New String:", newJsonString)

        //          // Check if the stringified versions are different before updating
        //          if (newJsonString !== this.jsonInput) {
        //               console.log("Watcher updating jsonInput because stringified values differ.");
        //              this.jsonInput = newJsonString;
        //          } else {
        //               console.log("Watcher skipped: Stringified values are the same.");
        //          }

        //     },
        //     deep: true // Watch for nested changes within the jsonData object/array
        // },
        // Watch for screen size changes
        isLargeScreen(newValue) {
            // Adjust view mode if screen size changes and only one view is visible
            if (!newValue && (this.viewMode === 'jsonOnly' || this.viewMode === 'gridOnly')) {
                this.viewMode = 'both'; // Force both views on smaller screens if one was hidden
            }
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