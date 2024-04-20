const store = {
    state: {
        people: [],
        expenses: [],
        currentTab: 'People'
    },
    addPerson(name) {
        this.state.people.push(name);
        this.saveState();
    },
    removePerson(index) {
        const person = this.state.people[index];
        this.state.expenses = this.state.expenses.filter(exp => exp.payer !== person && !exp.sharers.includes(person));
        this.state.people.splice(index, 1);
        this.saveState();
    },
    addExpense(expense) {
        this.state.expenses.push(expense);
        this.saveState();
    },
    removeExpense(index) {
        this.state.expenses.splice(index, 1);
        this.saveState();
    },
    getCurrentTab() {
        return this.state.currentTab;
    },
    setCurrentTab(tab) {
        this.state.currentTab = tab;
        this.saveState();
    },
    saveState() {
        const peopleString = this.state.people.join('|');
        const expenseString = this.state.expenses.map(exp => [
            this.state.people.indexOf(exp.payer),
            exp.amount,
            exp.description,
            exp.sharers.map(sharer => this.state.people.indexOf(sharer)).join(',')
        ].join(':')).join('|');
        const stateString = `${peopleString}#${expenseString}#${this.state.currentTab}`;
        const compressed = LZString.compressToEncodedURIComponent(stateString);
        window.location.hash = compressed;
    },
    loadState() {
        if (window.location.hash) {
            const compressed = window.location.hash.substr(1);
            const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
            const [peoplePart, expensePart, currentTab] = decompressed.split('#');
            const people = peoplePart.split('|');
            const expenses = expensePart.split('|').map(exp => {
                const [payerIndex, amount, description, sharers] = exp.split(':');
                return {
                    payer: people[parseInt(payerIndex)],
                    amount: parseFloat(amount),
                    description,
                    sharers: sharers.split(',').map(index => people[parseInt(index)])
                };
            });

            this.state.people = people;
            this.state.expenses = expenses;
            this.state.currentTab = currentTab || 'People';
        }
    }
};

// Vue Components
Vue.component('people', {
    template: `
    <div>
        <input v-model="newPerson" required
               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               placeholder="Enter person's name"
               @keyup.enter="addPerson"> <!-- Added @keyup.enter here -->
        <button @click="addPerson"
                class="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Add Person
        </button>
        <ul class="mt-4">
            <li v-for="(person, index) in store.state.people" :key="person"
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
            store
        };
    },
    methods: {
        addPerson() {
            if (!this.newPerson.trim()) {
                alert('Please enter a name.');
                return;
            }
            this.store.addPerson(this.newPerson.trim());
            this.newPerson = ''; // Clear the input after adding the person
        },
        removePerson(index) {
            this.store.removePerson(index);
        }
    }
});


Vue.component('expenses', {
    template: `
    <div>
        <h2 class="text-lg font-semibold">Add Expenses</h2>
        <select v-model="payer" required
                class="mt-2 block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
            <option disabled value="">Select payer</option>
            <option v-for="person in store.state.people" :value="person">{{ person }}</option>
        </select>
        <input v-model.number="amount" type="number" placeholder="Amount" required
               class="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <input v-model="description" type="text" placeholder="What for?" required
               class="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <h3 class="mt-4 text-lg font-semibold">Paid For</h3>
        <label class="flex items-center mt-4">
            <input type="checkbox" v-model="selectAll"
                @change="toggleSelectAll($event)"
                class="form-checkbox h-5 w-5 text-blue-600">
            <span class="ml-2 text-gray-700">{{ selectAll ? 'Deselect All' : 'Select All' }}</span>
        </label>
        <div class="mt-2 ml-6" v-for="person in store.state.people" :key="person">
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
            <li v-for="(expense, index) in store.state.expenses" :key="expense.id"
                class="py-2 px-4 border-b border-gray-300 flex justify-between">
                {{ expense.payer }} paid {{ expense.amount }} for {{ expense.description }} among {{ expense.sharers.join(', ') }}
                <button @click="removeExpense(index)"
                        class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                    Delete
                </button>
            </li>
        </ul>
    </div>
    `,
    data() {
        return {
            amount: 0,
            payer: '',
            description: '',
            sharers: [],
            selectAll: true,
            store
        };
    },
    mounted() {
        this.selectAllSharers(); 
        this.resetInputs();
    },
    methods: {
        addExpense() {
            if (!this.payer || this.amount <= 0 || !this.description || this.sharers.length === 0) {
                alert('Please ensure all fields are correctly filled, and at least one person is selected to share the expense.');
                return;
            }
            const newExpense = {
                id: store.state.expenses.length + 1,
                payer: this.payer,
                amount: this.amount,
                description: this.description,
                sharers: this.sharers
            };
            this.store.addExpense(newExpense);
            this.resetInputs();
        },
        removeExpense(index) {
            this.store.removeExpense(index);
        },
        selectAllSharers() {
            this.selectAll = true;
            this.sharers = this.store.state.people.slice();
        },
        resetInputs() {
            if(this.payer == '' && store.state.people.length > 0) {
                this.payer = store.state.people[0];
            }

            this.amount = 0;
            this.description = '';
        },
        toggleSelectAll(event) {
            this.selectAll = event.target.checked;  // Directly bind the checkbox's state
            this.sharers = this.selectAll ? store.state.people.slice() : [];
        }
    }
});

Vue.component('settlements', {
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
        payments() {
            const balances = {};
            store.state.people.forEach(person => {
                balances[person] = 0;
            });
            store.state.expenses.forEach(expense => {
                const amountPerPerson = expense.amount / expense.sharers.length;
                expense.sharers.forEach(person => {
                    balances[person] -= amountPerPerson;
                });
                balances[expense.payer] += expense.amount;
            });

            const debtors = Object.keys(balances)
                .filter(person => balances[person] < 0)
                .map(person => ({ name: person, amount: -balances[person] }));
            const creditors = Object.keys(balances)
                .filter(person => balances[person] > 0)
                .map(person => ({ name: person, amount: balances[person] }));

            let transactions = [];
            while (debtors.length && creditors.length) {
                let debtor = debtors[0];
                let creditor = creditors[0];
                let amount = Math.min(debtor.amount, creditor.amount);

                transactions.push({ from: debtor.name, to: creditor.name, amount });
                debtor.amount -= amount;
                creditor.amount -= amount;

                if (debtor.amount === 0) debtors.shift();
                if (creditor.amount === 0) creditors.shift();
            }

            return transactions;
        }
    }
});

// Vue instance
new Vue({
    el: '#app',
    data: {
        tabs: ['People', 'Expenses', 'Settlements'],
        store
    },
    computed: {
        currentTabComponent() {
            return this.store.getCurrentTab().toLowerCase();
        },
        currentTab() {
            return this.store.getCurrentTab();
        }
    },
    methods: {
        setCurrentTab(tab) {
            this.store.setCurrentTab(tab);
        }
    },
    created() {
        this.store.loadState();
    }
});
