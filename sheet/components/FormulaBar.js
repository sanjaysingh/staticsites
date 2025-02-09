Vue.component('formula-bar', {
    props: {
        activeCell: String,
        formula: String
    },
    template: `
        <div class="bg-white shadow mb-4 p-4 flex items-center">
            <div class="cell-reference mr-2">
                {{ activeCell || '' }}
            </div>
            <input type="text" 
                   v-model="localFormula"
                   @input="updateFormula"
                   class="formula-input"
                   placeholder="Enter formula or value">
        </div>
    `,
    data() {
        return {
            localFormula: ''
        };
    },
    watch: {
        formula: {
            immediate: true,
            handler(newVal) {
                this.localFormula = newVal;
            }
        }
    },
    methods: {
        updateFormula() {
            this.$emit('formula-change', this.localFormula);
        }
    }
});
