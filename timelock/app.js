const TimedLockerV4ABI = [{ "inputs": [{ "internalType": "address", "name": "locker", "type": "address" }], "name": "addDesignatedLocker", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "beneficiary", "type": "address" }, { "internalType": "uint256", "name": "unlockTimestamp", "type": "uint256" }], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "locker", "type": "address" }], "name": "getLockedValuesByLocker", "outputs": [{ "components": [{ "internalType": "address", "name": "locker", "type": "address" }, { "internalType": "address", "name": "beneficiary", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "unlockTimestamp", "type": "uint256" }], "internalType": "struct TimedLockerV4.Lock[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "beneficiary", "type": "address" }], "name": "getLockedValuesForBeneficiary", "outputs": [{ "components": [{ "internalType": "address", "name": "locker", "type": "address" }, { "internalType": "address", "name": "beneficiary", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "unlockTimestamp", "type": "uint256" }], "internalType": "struct TimedLockerV4.Lock[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "locker", "type": "address" }], "name": "removeDesignatedLocker", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];
const TimedLockerV4Address = "0x17217838A687F4d980D6Bc4b2Ea112cCB79D7fE6";

const app = new Vue({
    el: '#app',
    data: {
        provider: null,
        signer: null,
        contract: null,
        userAddress: "",
        locker: '',
        beneficiary: '',
        unlockTimestamp: '',
        depositAmount: '',
        showMessagePanel: false,
        messagePanelText: "",
        messagePanelClass: "",
        lockedFundsByBeneficiary: [],
        isAnyEligibleFundsToWithdraw: false
    },
    computed: {
        connectButtonText() {
            if (this.userAddress) {
                return this.userAddress.slice(0, 6) + '...' + this.userAddress.slice(-6);
            } else {
                return 'Connect';
            }
        }
    },
    created() {
        const nextYearDate = moment().add(1, 'years');
        this.localUnlockTimestamp = nextYearDate.format('YYYY-MM-DDTHH:mm');
    },
    mounted() {
        this.$nextTick(() => {
            this.init();
        });
    },
    methods: {
        init() {
            if (typeof window.ethereum !== 'undefined') {
                window.ethereum.on('accountsChanged', async (newAccounts) => {
                    await this.connectInternal();
                });
                window.ethereum.on('chainChanged', async (newAccounts) => {
                    await this.connectInternal();
                });
                setInterval(async () => {
                    await this.refreshLockedValuesForBeneficiary();
                }, 10000);
            }
            document.getElementById('connect-button').addEventListener('click', async () => {
                await this.connectToMetamask();
            });

            $('.menu .item').tab();
        },
        formatValue(value) {
            return ethers.utils.formatEther(value);
        },
        buildErrorMessage(error) {
            var errorMessage = "";
            if(error.error && error.error.message) {
                errorMessage = error.error.message;
            }
            else if (error.data && error.data.message) {
                errorMessage = error.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                errorMessage = JSON.stringify(error);
            }

            return "Error: " + errorMessage;
        },
        showSuccessMessage(message) {
            this.showMessage(message, "success");
        },
        showErrorMessage(message) {
            this.showMessage(message, "error");
        },
        showMessage(message, type, timeout = 5000) {
            this.messagePanelText = message;
            this.messagePanelClass = type;
            this.showMessagePanel = true;
            setTimeout(() => {
                this.showMessagePanel = false;
            }, timeout);
        },
        async connectInternal() {
            if (typeof window.ethereum !== 'undefined') {
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = this.provider.getSigner();
                const accounts = await this.provider.send('eth_accounts', []);

                if (accounts.length === 0) {
                    const requestedAccounts = await this.provider.send('eth_requestAccounts', []);
                    if (requestedAccounts.length > 0) {
                        this.userAddress = requestedAccounts[0];
                        this.contract = new ethers.Contract(TimedLockerV4Address, TimedLockerV4ABI, this.signer);
                        this.refreshLockedValuesForBeneficiary();
                    }
                } else {
                    this.userAddress = accounts[0];
                    this.contract = new ethers.Contract(TimedLockerV4Address, TimedLockerV4ABI, this.signer);
                    this.refreshLockedValuesForBeneficiary();
                }

                if (!this.beneficiary) {
                    this.beneficiary = this.userAddress;
                }
            } else {
                this.showErrorMessage('Please install an Ethereum wallet like Metamask!');
            }
        },
        async connectToMetamask() {
            await this.connectInternal();
        },

        async addDesignatedLocker() {
            if (!this.signer) {
                this.showErrorMessage('Please connect your wallet first.');
                return;
            }

            if (!ethers.utils.isAddress(this.locker)) {
                this.showErrorMessage('Invalid address. Please enter a valid Ethereum address.');
                return;
            }

            try {
                const tx = await this.contract.addDesignatedLocker(this.locker);
                await tx.wait();
                this.showSuccessMessage('Locker added successfully');
            } catch (error) {
                this.showErrorMessage(this.buildErrorMessage(error));
            }
        },
        async removeDesignatedLocker() {
            if (!this.signer) {
                this.showErrorMessage('Please connect your wallet first.');
                return;
            }

            if (!ethers.utils.isAddress(this.locker)) {
                this.showErrorMessage('Invalid address. Please enter a valid Ethereum address.');
                return;
            }
            try {
                const tx = await this.contract.removeDesignatedLocker(this.locker);
                await tx.wait();
                this.showSuccessMessage('Locker removed successfully');
            } catch (error) {
                this.showErrorMessage(this.buildErrorMessage(error));
            }
        },
        async deposit() {
            if (!this.signer) {
                this.showErrorMessage('Please connect your wallet first.');
                return;
            }

            // Check if the input address is valid
            if (!ethers.utils.isAddress(this.beneficiary)) {
                this.showErrorMessage('Invalid beneficiary address. Please enter a valid Ethereum address.');
                return;
            }

            // Check if the timestamp is in the future
            if (this.localUnlockTimestamp <= Date.now()) {
                this.showErrorMessage('Invalid timestamp. Please select a future date and time.');
                return;
            }

            // Check if the deposit amount is greater than 0
            const depositAmount = parseFloat(this.depositAmount);
            if (isNaN(depositAmount) || depositAmount <= 0) {
                this.showErrorMessage('Invalid deposit amount. Please enter an amount greater than 0.');
                return;
            }

            try {
                const utcDate = moment(this.localUnlockTimestamp).unix();
                const tx = await this.contract.deposit(this.beneficiary, utcDate, { value: ethers.utils.parseEther(this.depositAmount) });
                await tx.wait();
                this.showSuccessMessage('Deposit successful');
            } catch (error) {
                this.showErrorMessage(this.buildErrorMessage(error));
            }
        },
        async withdraw() {
            if (!this.signer) {
                this.showErrorMessage('Please connect your wallet first.');
                return;
            }

            if (!this.isAnyEligibleFundsToWithdraw) {
                this.showErrorMessage('You have no eligible funds to withdraw currently.');
                return;
            }

            try {
                const tx = await this.contract.withdraw();
                await tx.wait();
                this.showSuccessMessage('Withdrawal successful');
            } catch (error) {
                this.showErrorMessage(this.buildErrorMessage(error));
            }
        },
        async refreshLockedValuesForBeneficiary() {
            if (this.userAddress) {
                this.lockedFundsByBeneficiary = await this.contract.getLockedValuesForBeneficiary(this.userAddress);
                this.isAnyEligibleFundsToWithdraw = this.lockedFundsByBeneficiary.filter(lock => lock.unlockTimestamp <= Date.now() / 1000).length > 0;
            }
        }
    },
});

