new Vue({
    el: '#app',
    data: {
        sheetData: {},
        activeCell: null,
        activeFormula: ''
    },
    created() {
        this.loadFromStorage();
    },
    methods: {
        loadFromStorage() {
            const saved = localStorage.getItem('spreadsheet-data');
            if (saved) {
                this.sheetData = JSON.parse(saved);
            } else {
                this.newSheet();
            }
        },

        newSheet() {
            const data = {};
            for (let row = 1; row <= 100; row++) {
                for (let col = 0; col < 26; col++) {
                    const cellId = `${String.fromCharCode(65 + col)}${row}`;
                    data[cellId] = {
                        value: '',
                        formula: '',
                    };
                }
            }
            this.sheetData = data;
            this.saveToStorage();
        },

        exportSheet() {
            const wb = XLSX.utils.book_new();
            const data = [];

            // Start directly with cell data, skip headers
            for (let row = 1; row <= 100; row++) {
                const dataRow = [];
                for (let col = 0; col < 26; col++) {
                    const cellId = `${String.fromCharCode(65 + col)}${row}`;
                    const cell = this.sheetData[cellId] || { value: '' };
                    // If cell has a formula, use it; otherwise use the value
                    dataRow.push(cell.formula || cell.value);
                }
                data.push(dataRow);
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, "spreadsheet.xlsx");
        },

        saveToStorage() {
            localStorage.setItem('spreadsheet-data', JSON.stringify(this.sheetData));
        },

        selectCell(cellId) {
            this.activeCell = cellId;
            const cell = this.sheetData[cellId] || { value: '', formula: '' };
            this.activeFormula = cell.formula || cell.value;
        },

        updateCell(cellId, value) {
            if (!this.sheetData[cellId]) {
                this.$set(this.sheetData, cellId, {
                    value: '',
                    formula: '',
                });
            }

            if (value.startsWith('=')) {
                this.sheetData[cellId].formula = value;
                const result = this.evaluateFormula(value);
                this.sheetData[cellId].value = result;
            } else {
                this.sheetData[cellId].formula = '';
                this.sheetData[cellId].value = value;
            }

            this.saveToStorage();
            this.recalculateFormulas();
        },

        updateFormula(formula) {
            if (!this.activeCell) return;

            this.sheetData[this.activeCell].formula = formula;
            if (formula.startsWith('=')) {
                const result = this.evaluateFormula(formula);
                this.sheetData[this.activeCell].value = result;
            } else {
                this.sheetData[this.activeCell].value = formula;
            }
            this.saveToStorage();
            this.recalculateFormulas();
        },

        evaluateFormula(formula) {
            if (!formula.startsWith('=')) return formula;

            try {
                formula = formula.substring(1);
                formula = formula.replace(/[A-Z]+[0-9]+/g, (match) => {
                    if (!this.sheetData[match]) return '0';
                    const value = this.sheetData[match].value;
                    return !isNaN(value) ? value : `"${value}"`;
                });

                const result = Function('"use strict";return (' + formula + ')')();
                return typeof result === 'number' ? result.toString() : result;
            } catch (e) {
                console.error('Formula evaluation error:', e);
                return '#ERROR!';
            }
        },

        recalculateFormulas() {
            Object.keys(this.sheetData).forEach(cellId => {
                const cell = this.sheetData[cellId];
                if (cell.formula && cell.formula.startsWith('=')) {
                    cell.value = this.evaluateFormula(cell.formula);
                }
            });
        }
    }
});