Vue.component('spreadsheet-grid', {
    props: {
        data: {
            type: Object,
            required: true
        },
        activeCell: {
            type: String,
            default: null
        }
    },
    template: `
        <div class="overflow-x-auto" 
             tabindex="0" 
             @keydown="handleKeyDown"
             ref="grid">
            <table class="spreadsheet-grid">
                <thead>
                    <tr>
                        <th class="corner-header"></th>
                        <th v-for="col in columns" :key="col" class="column-header">
                            {{ col }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in 100" :key="row">
                        <td class="row-header">{{ row }}</td>
                        <td v-for="col in columns" 
                            :key="col + row"
                            :class="getCellClasses(col + row)"
                            @click="selectCell(col + row)"
                            @dblclick="editCell(col + row)">
                            <input v-if="isEditing(col + row)"
                                   :value="getCellEditValue(col + row)"
                                   @input="e => editValue = e.target.value"
                                   @blur="finishEdit"
                                   @keydown.enter.prevent="finishEdit"
                                   @keydown.tab="handleTab"
                                   @keydown.esc="cancelEdit"
                                   ref="cellInput"
                                   class="cell-input">
                            <span v-else>{{ getCellDisplayValue(col + row) }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    data() {
        return {
            columns: Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)),
            editingCell: null,
            editValue: '',
            previousValue: ''
        };
    },
    mounted() {
        // Remove automatic focus
        // The grid will be focused when user clicks or tabs to it
    },
    methods: {
        getCellClasses(cellId) {
            return {
                'cell': true,
                'active': cellId === this.activeCell,
                'editing': cellId === this.editingCell,
                'formula': this.isFormulaCell(cellId)
            };
        },
        isFormulaCell(cellId) {
            const cell = this.data[cellId];
            return cell && cell.formula && cell.formula.startsWith('=');
        },
        selectCell(cellId) {
            this.$emit('cell-selected', cellId);
        },
        editCell(cellId) {
            this.editingCell = cellId;
            const cell = this.data[cellId] || { value: '', formula: '' };
            // Show formula when editing if it exists
            this.editValue = cell.formula || cell.value;
            this.previousValue = this.editValue;

            this.$nextTick(() => {
                if (this.$refs.cellInput) {
                    this.$refs.cellInput[0].focus();
                    this.$refs.cellInput[0].select();
                }
            });
        },
        getCellEditValue(cellId) {
            const cell = this.data[cellId];
            return cell ? (cell.formula || cell.value) : '';
        },
        getCellDisplayValue(cellId) {
            const cell = this.data[cellId];
            if (!cell) return '';
            // Always show the calculated value unless editing
            return cell.value;
        },
        finishEdit() {
            if (this.editingCell) {
                this.$emit('cell-updated', this.editingCell, this.editValue);
                this.editingCell = null;
                this.editValue = '';
            }
        },
        cancelEdit() {
            if (this.editingCell) {
                this.editValue = this.previousValue;
                this.editingCell = null;
            }
        },
        handleTab(event) {
            this.finishEdit();
            event.preventDefault();

            const currentCol = this.editingCell.match(/[A-Z]+/)[0];
            const currentRow = parseInt(this.editingCell.match(/\d+/)[0]);

            let nextCell;
            if (event.shiftKey) {
                const colIndex = this.columns.indexOf(currentCol);
                if (colIndex > 0) {
                    nextCell = `${this.columns[colIndex - 1]}${currentRow}`;
                } else if (currentRow > 1) {
                    nextCell = `${this.columns[this.columns.length - 1]}${currentRow - 1}`;
                }
            } else {
                const colIndex = this.columns.indexOf(currentCol);
                if (colIndex < this.columns.length - 1) {
                    nextCell = `${this.columns[colIndex + 1]}${currentRow}`;
                } else if (currentRow < 100) {
                    nextCell = `${this.columns[0]}${currentRow + 1}`;
                }
            }

            if (nextCell) {
                this.selectCell(nextCell);
                this.editCell(nextCell);
            }
        },
        isEditing(cellId) {
            return this.editingCell === cellId;
        },
        handleKeyDown(event) {
            if (this.editingCell) return; // Don't handle navigation when editing

            if (event.ctrlKey || event.metaKey) {
                switch (event.key.toLowerCase()) {
                    case 'n':
                        event.preventDefault();
                        this.$emit('new-sheet');
                        break;
                    case 's':
                        event.preventDefault();
                        this.$emit('save-sheet');
                        break;
                }
                return;
            }

            if (!this.activeCell) {
                this.selectCell('A1');
                return;
            }

            const currentCol = this.activeCell.match(/[A-Z]+/)[0];
            const currentRow = parseInt(this.activeCell.match(/\d+/)[0]);
            const colIndex = this.columns.indexOf(currentCol);

            let nextCell;
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    if (currentRow > 1) {
                        nextCell = `${currentCol}${currentRow - 1}`;
                    }
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    if (currentRow < 100) {
                        nextCell = `${currentCol}${currentRow + 1}`;
                    }
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    if (colIndex > 0) {
                        nextCell = `${this.columns[colIndex - 1]}${currentRow}`;
                    }
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (colIndex < this.columns.length - 1) {
                        nextCell = `${this.columns[colIndex + 1]}${currentRow}`;
                    }
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.editCell(this.activeCell);
                    break;
            }

            if (nextCell) {
                this.selectCell(nextCell);
            }
        }
    }
});