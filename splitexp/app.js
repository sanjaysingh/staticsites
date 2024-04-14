Vue.component('people', {
    props: ['people'],
    template: `
    <div>
        <input v-model="newPerson" required
               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               placeholder="Enter person's name"
               @input="validationError = ''">
        <button @click="addPerson"
                class="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Add Person
        </button>
        <p v-if="validationError" class="text-red-500 text-xs italic mt-2">{{ validationError }}</p>
        <ul class="mt-4">
            <li v-for="(person, index) in people" :key="person"
                class="py-2 px-4 border-b border-gray-300 flex justify-between">
                {{ person }}
                <button @click="removePerson(index)"
                        class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                    Delete
                </button>
            </li>
        </ul>
    </div>
    `,
    data() {
        return {
            newPerson: '',
            validationError: ''
        };
    },
    methods: {
        addPerson() {
            if (!this.newPerson.trim()) {
                this.validationError = 'Please enter a name.';
                return;
            }
            this.$emit('update:people', [...this.people, this.newPerson.trim()]);
            this.newPerson = ''; // Clear the input field after adding the person
            this.validationError = ''; // Clear the error message
        },
        removePerson(index) {
            this.people.splice(index, 1);
            this.$emit('update:people', [...this.people]);
        }
    }
});

Vue.component('expenses', {
    props: ['expenses', 'people'],
    template: `
    <div>
        <h2 class="text-lg font-semibold">Add Expenses</h2>
        <select v-model="payer" required
                class="mt-2 block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
            <option disabled value="">Select payer</option>
            <option v-for="person in people" :value="person">{{ person }}</option>
        </select>
        <input v-model.number="amount" type="number" placeholder="Amount" required
               class="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <input v-model="description" type="text" placeholder="What for?" required
               class="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <h3 class="mt-4 text-lg font-semibold">Paid For</h3>
        <label class="flex items-center mt-4">
            <input type="checkbox" :checked="selectAll" 
                   @change="toggleSelectAll"
                   class="form-checkbox h-5 w-5 text-blue-600">
            <span class="ml-2 text-gray-700">{{ selectAll ? 'Deselect All' : 'Select All' }}</span>
        </label>
        <div class="mt-2 ml-6" v-for="person in people" :key="person">
            <label class="flex items-center">
                <input type="checkbox" :value="person" v-model="sharers"
                       class="form-checkbox h-5 w-5 text-blue-600">
                <span class="ml-2 text-gray-700">{{ person }}</span>
            </label>
        </div>
        <button @click="addExpense"
                class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Add Expense
        </button>
        <ul class="mt-4">
            <li v-for="(expense, index) in expenses" :key="expense.id"
                class="py-2 px-4 border-b border-gray-300 flex justify-between">
                {{ expense.payer }} paid {{ expense.amount }} for {{ expense.description }} among {{ expense.sharers.join(', ') }}
                <button @click="removeExpense(index)"
                        class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button>
            </li>
        </ul>
    </div>
    `,
    data() {
        return {
            amount: 0,
            payer: '',
            description: '',
            sharers: this.people.slice(), // initialize with all people selected
            selectAll: true
        };
    },
    watch: {
        people(newPeople) {
            this.sharers = newPeople.slice();
            this.selectAll = true;
        }
    },
    methods: {
        addExpense() {
            if (!this.payer || this.amount <= 0 || !this.description || this.sharers.length === 0) {
                alert('Please ensure all fields are correctly filled, and at least one person is selected to share the expense.');
                return;
            }
            const newExpense = {
                id: this.expenses.length + 1,
                payer: this.payer,
                amount: this.amount,
                description: this.description,
                sharers: this.sharers
            };
            this.$emit('update:expenses', [...this.expenses, newExpense]);
            this.resetInputs();
        },
        resetInputs() {
            this.amount = 0;
            this.payer = '';
            this.description = '';
            this.sharers = this.people.slice();
            this.selectAll = true;
        },
        toggleSelectAll() {
            this.selectAll = !this.selectAll; // toggle state
            this.sharers = this.selectAll ? this.people.slice() : [];
        }
    }
});


Vue.component('settlements', {
    props: ['expenses', 'people'],
    template: `
    <div>
        <h2 class="text-lg font-semibold">Settlements</h2>
        <ul>
            <li v-for="payment in payments" :key="payment.from + payment.to" class="py-2 px-4 border-b border-gray-300">
                {{ payment.from }} owes {{ payment.to }} {{ payment.amount.toFixed(2) }}
            </li>
        </ul>
    </div>
    `,
    computed: {
        balances() {
            const balanceMap = this.people.reduce((acc, person) => {
                acc[person] = 0;
                return acc;
            }, {});

            this.expenses.forEach(expense => {
                const amountPerPerson = expense.amount / expense.sharers.length;
                expense.sharers.forEach(person => {
                    balanceMap[person] -= amountPerPerson;
                });
                balanceMap[expense.payer] += expense.amount;
            });

            return balanceMap;
        },
        payments() {
            let debtors = Object.keys(this.balances)
                .filter(person => this.balances[person] < 0)
                .map(person => ({ name: person, amount: -this.balances[person] }));

            let creditors = Object.keys(this.balances)
                .filter(person => this.balances[person] > 0)
                .map(person => ({ name: person, amount: this.balances[person] }));

            return this.settleDebts(debtors, creditors);
        }
    },
    methods: {
        settleDebts(debtors, creditors) {
            const transactions = [];
            debtors.sort((a, b) => a.amount - b.amount);
            creditors.sort((a, b) => a.amount - b.amount);

            while (debtors.length && creditors.length) {
                const debtor = debtors[0];
                const creditor = creditors[0];
                const amount = Math.min(debtor.amount, creditor.amount);

                transactions.push({ from: debtor.name, to: creditor.name, amount: amount });

                debtor.amount -= amount;
                creditor.amount -= amount;

                if (debtor.amount === 0) debtors.shift();
                if (creditor.amount === 0) creditors.shift();
            }

            return transactions;
        }
    }
});


new Vue({
    el: '#app',
    data: {
        currentTab: 'People',
        tabs: ['People', 'Expenses', 'Settlements'],
        people: [],
        expenses: [],
    },
    computed: {
        currentTabComponent() {
            return this.currentTab.toLowerCase();
        }
    },
    methods: {
        updatePeople(people) {
            this.people = people;
            this.updateUrl();
        },
        updateExpenses(expenses) {
            this.expenses = expenses;
            this.updateUrl();
        },
        updateUrl() {
            const state = {
                people: this.people,
                expenses: this.expenses
            };
            const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(state));
            window.location.hash = compressed;
        },
        
        loadState() {
            if (window.location.hash) {
                const compressed = window.location.hash.substr(1);
                const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
                const state = JSON.parse(decompressed);
                this.people = state.people || [];
                this.expenses = state.expenses || [];
            }
        }
        
    },
    created() {
        this.loadState();
    }
});