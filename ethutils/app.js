loadEthUtilsToGlobalScope();
const app = new Vue({
    el: '#app',
    data: {
        provider: null,
        signer: null,
        showMessagePanel: false,
        messagePanelText: "",
        messagePanelClass: "",
        statement:"",
        result:"",
        selectedTemplate:"",
        templateStatements: [
            { label: 'Convert to Byte32', value: 'formatBytes32String("Hello")' },
            { label: 'Parse Byte32', value: 'parseBytes32String("0x48656c6c6f000000000000000000000000000000000000000000000000000000")' },
            { label: 'Keccack256', value: 'keccak256(toUtf8Bytes("Hello"))' },
          ],
    },
    watch: {
        selectedTemplate(newVal) {
            this.statement = newVal;
        }
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
    methods: {
        init() {
            if (typeof window.ethereum !== 'undefined') {
                window.ethereum.on('accountsChanged', async (newAccounts) => {
                    await this.connectInternal();
                });
                window.ethereum.on('chainChanged', async (newAccounts) => {
                    await this.connectInternal();
                });
            }
            document.getElementById('connect-button').addEventListener('click', async () => {
                await this.connectToMetamask();
            });
            this.selectedTemplate = 'formatBytes32String("Hello")';
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
                    }
                } else {
                    this.userAddress = accounts[0];
                }
            } else {
                this.showErrorMessage('Please install an Ethereum wallet like Metamask!');
            }
        },
        async connectToMetamask() {
            await this.connectInternal();
        },

        async execute() {
            try {
                this.result = eval(this.statement);
            } catch (error) {
                this.showErrorMessage(this.buildErrorMessage(error));
            }
        },
        async signData() {
            try {
                this.dataSignature = await this.signer.signMessage(ethers.utils.arrayify(this.dataToSign));
            } catch (error) {
                this.showErrorMessage(this.buildErrorMessage(error));
            }
        }
    }
});

function loadEthUtilsToGlobalScope() {
    for (const methodName in ethers.utils) {
        if (typeof ethers.utils[methodName] === 'function') {
            window[methodName] = ethers.utils[methodName];
        }
    }
}

