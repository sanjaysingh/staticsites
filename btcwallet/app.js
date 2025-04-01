const { createApp } = Vue;

createApp({
    data() {
        return {
            // Configuration (non-reactive might be fine, but keeping for simplicity)
            DEFAULT_MAINNET_RPC_ENDPOINT: 'https://blockstream.info/api/',
            DEFAULT_TESTNET_RPC_ENDPOINT: 'https://blockstream.info/testnet/api/',
            MIN_CONFIRMATIONS: 1,

            // RPC Options for dropdown
            rpcOptions: [
                {
                    value: 'DEFAULT_TESTNET',
                    text: 'https://blockstream.info/testnet/api/' // Use the URL directly
                },
                {
                    value: 'DEFAULT_MAINNET',
                    text: 'https://blockstream.info/api/' // Use the URL directly
                },
                {
                    value: 'CUSTOM',
                    text: 'Other...'
                }
            ],

            // State
            network: null, // bitcoinjs-lib network object
            keyPair: null, // bitcoinjs-lib keyPair object
            currentRpcEndpoint: '',
            qrCodeInstance: null,
            isTestnet: true,
            currentWif: '',
            isPkVisible: false,
            walletAddress: 'Not loaded',
            walletBalance: 'N/A',
            balanceUnit: 'BTC',
            isLoading: false,
            alerts: [], // Array to hold alert messages { message, type, id }

            // Input Models
            privateKeyInput: '',
            pkInputType: 'password', // Added for import field visibility
            rpcEndpointSelectValue: 'DEFAULT_TESTNET',
            rpcEndpointCustomInput: '',
            recipientAddressInput: '',
            sendAmountInput: '',
            feeRateInput: 10, 

            // Transaction Info
            txStatus: '',
            txId: '',
            txLink: '#',
            showTxInfo: false,

            // UI State
            showWalletManagement: true,
            showLoadedWalletDetails: false,
            showCustomRpcInput: false,
            currentTheme: 'light', // Added for theme toggling

            // Network Status Display (Refactored)
            networkStatusText: '',
            networkStatusClass: '',

            // DOM Element Refs (alternative to getElementById)
            // We'll primarily use data binding, but might need refs for things like QR code canvas
        };
    },
    computed: {
        maskedWif() {
            if (!this.currentWif || this.currentWif.length < 10) return '***';
            return `${this.currentWif.substring(0, 6)}...${this.currentWif.substring(this.currentWif.length - 6)}`;
        },
        currentPrivateKeyDisplay() {
             return this.isPkVisible ? this.currentWif : this.maskedWif;
        },
        isWalletLoaded() {
            return this.keyPair !== null;
        },
        networkName() {
            return this.isTestnet ? 'Testnet' : 'Mainnet';
        },
        blockExplorerUrlBase() {
            return this.isTestnet ? 'https://mempool.space/testnet/' : 'https://mempool.space/';
        },
        // Computed property to disable RPC update if selection hasn't changed
        isRpcUpdateDisabled() {
            let selectedRpc = '';
            if (this.rpcEndpointSelectValue === 'DEFAULT_TESTNET') {
                selectedRpc = this.DEFAULT_TESTNET_RPC_ENDPOINT;
            } else if (this.rpcEndpointSelectValue === 'DEFAULT_MAINNET') {
                selectedRpc = this.DEFAULT_MAINNET_RPC_ENDPOINT;
            } else if (this.rpcEndpointSelectValue === 'CUSTOM') {
                selectedRpc = this.rpcEndpointCustomInput.trim();
                // Normalize custom input for comparison (add trailing slash if missing)
                if (selectedRpc && !selectedRpc.endsWith('/')) {
                     selectedRpc += '/';
                }
            } 
            return selectedRpc === this.currentRpcEndpoint;
        },
        // Optional: Computed property for theme icon class
        themeIconClass() {
            return this.currentTheme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill';
        }
    },
    methods: {
        // --- Helper Functions ---
        showLoading(show = true) {
            this.isLoading = show;
        },
        showAlert(message, type = 'info') {
            const id = Date.now(); // Simple unique ID for keying
            const newAlert = { message, type, id }; // Re-added id
            
            // Clear existing alerts before adding the new one
            this.alerts = []; 
            
            this.alerts.push(newAlert);

            setTimeout(() => {
                this.dismissAlert();
            }, 4000);
        },
        dismissAlert() {
             this.alerts = [];
        },
        satoshisToBtc(satoshis) {
            return satoshis / 100_000_000;
        },
        btcToSatoshis(btc) {
            return Math.round(btc * 100_000_000);
        },
        isValidWif(wif) {
            try {
                bitcoin.ECPair.fromWIF(wif, this.network);
                return true;
            } catch (e) {
                return false;
            }
        },
        getAddress(node) {
            if (!node) return null;
            return bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network: this.network }).address;
        },
        updateRpcSelection() {
             if (this.rpcEndpointSelectValue === 'CUSTOM') {
                this.showCustomRpcInput = true;
            } else {
                this.showCustomRpcInput = false;
            }
        },
        async copyToClipboard(text, successMessage) {
             if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                this.showAlert(successMessage, "success");
            } catch (err) {
                console.error('Failed to copy:', err);
                this.showAlert("Failed to copy to clipboard.", "warning");
            }
        },
        toggleCurrentPkVisibility() {
            this.isPkVisible = !this.isPkVisible;
        },
        // Added method for import PK field visibility
        togglePkInputVisibility() {
            this.pkInputType = this.pkInputType === 'password' ? 'text' : 'password';
        },

        // --- UI Update Logic (Integrated into Vue's reactivity) ---
        // No explicit updateUI needed. Computed properties and data binding handle most updates.
        // Specific updates like QR code generation happen in relevant methods.

        generateQrCode() {
            this.$nextTick(() => {
                 const qrCodeElement = this.$refs.qrCodeDiv;
                 if (!qrCodeElement) {
                     return; 
                 }
                 qrCodeElement.innerHTML = ''; // Clear previous QR code
                if (this.walletAddress && this.walletAddress !== 'Not loaded') {
                    try {
                        // Ensure QRCode library is available globally when called
                         if (typeof QRCode === 'undefined') {
                            console.error("QRCode library not loaded when trying to generate.");
                             qrCodeElement.textContent = 'Error: QR Code library not loaded.';
                            return;
                        }
                        this.qrCodeInstance = new QRCode(qrCodeElement, {
                            text: 'bitcoin:' + this.walletAddress,
                            width: 256,
                            height: 256,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    } catch (e) {
                        console.error("Error generating QR code:", e);
                        qrCodeElement.textContent = 'Error generating QR code.';
                    }
                } else {
                    // Clear if no address (e.g., wallet cleared while tab is open)
                     qrCodeElement.innerHTML = ''; 
                 }
             });
        },
        updateWalletStateUI() {
            // This replaces parts of the old updateUI
            this.showWalletManagement = !this.isWalletLoaded;
            this.showLoadedWalletDetails = this.isWalletLoaded;
            if (this.isWalletLoaded) {
                this.walletAddress = this.getAddress(this.keyPair);
                this.fetchBalance(); 
            } else {
                 this.walletAddress = 'Not loaded';
                 this.walletBalance = 'N/A';
                 this.currentWif = '';
                 this.isPkVisible = false;
                 this.privateKeyInput = ''; // Clear import input
                 this.showTxInfo = false;
                 // Clear QR code if wallet is cleared and receive tab might be open
                 if (this.$refs.qrCodeDiv) { 
                     this.generateQrCode(); 
                 }
            }
        },

        // --- Core Wallet Logic ---
        createWallet() {
            try {
                this.keyPair = bitcoin.ECPair.makeRandom({ network: this.network });
                this.currentWif = this.keyPair.toWIF();
                this.isPkVisible = false; // Hide the new key by default
                this.updateWalletStateUI();
                this.showAlert(`New ${this.networkName} wallet created! Ensure you copy the Private Key shown below.`, "success");
            } catch (error) {
                console.error("Error creating wallet:", error);
                this.showAlert("Failed to create wallet. Please try again.", "danger");
                this.clearSession();
            }
        },
        importWallet() {
             const wif = this.privateKeyInput.trim();
             if (!wif) {
                 this.showAlert("Please enter a Private Key (WIF) to import.", "warning");
                 return;
             }
             if (!this.isValidWif(wif)) {
                this.showAlert("Invalid Private Key format (WIF expected).", "danger");
                return;
            }
            try {
                this.keyPair = bitcoin.ECPair.fromWIF(wif, this.network);
                this.currentWif = wif;
                this.isPkVisible = false; 
                this.showAlert("Wallet imported successfully for this session!", "success");
                this.privateKeyInput = ''; // Clear input model
                this.updateWalletStateUI();
            } catch (e) {
                console.error("Error importing WIF:", e);
                this.showAlert("Failed to import private key. Please check the format and try again.", "danger");
                this.keyPair = null; // Ensure keyPair is null on failure
                this.updateWalletStateUI(); // Reset UI
            }
        },
        clearSession() {
            this.keyPair = null;
            this.updateWalletStateUI(); 
            this.showAlert('Wallet session cleared.', 'info');
        },

        // --- Bitcoin Network Interaction ---
        async getUtxos() {
             if (!this.walletAddress || this.walletAddress === 'Not loaded') return [];
            this.showLoading(true);
            try {
                const url = `${this.currentRpcEndpoint}address/${this.walletAddress}/utxo`;
                const response = await axios.get(url, { timeout: 10000 });
                return response.data;
            } catch (error) {
                console.error(`Error fetching UTXOs for ${this.walletAddress}:`, error.response ? error.response.data : error.message);
                this.showAlert(`Failed to fetch UTXOs. Check RPC endpoint and network connection. Error: ${error.message}`, "danger");
                return [];
            } finally {
                this.showLoading(false);
            }
        },
        async fetchBalance() {
             if (!this.isWalletLoaded) return;
            this.walletBalance = 'Loading...';
            const utxos = await this.getUtxos();
            if (utxos) {
                const confirmedBalance = utxos
                    .filter(utxo => utxo.status.confirmed)
                    .reduce((sum, utxo) => sum + utxo.value, 0);
                this.walletBalance = this.satoshisToBtc(confirmedBalance).toFixed(8);
            } else {
                this.walletBalance = 'Error';
            }
        },
        async broadcastTransaction(txHex) {
            this.showLoading(true);
            this.txStatus = "Broadcasting...";
            this.txId = "";
            this.txLink = "#";
            this.showTxInfo = true;
            try {
                const url = `${this.currentRpcEndpoint}tx`;
                const response = await axios.post(url, txHex, {
                    headers: { 'Content-Type': 'text/plain' },
                    timeout: 10000
                });
                const txid = response.data;
                this.txStatus = "Success!";
                this.txId = txid;
                this.txLink = `${this.blockExplorerUrlBase}tx/${txid}`;
                this.showAlert(`Transaction broadcast successfully! TXID: ${txid}`, "success");
                this.fetchBalance(); // Refresh balance
                return txid;
            } catch (error) {
                const errorMessage = error.response ? await error.response.data : error.message;
                console.error("Error broadcasting transaction:", errorMessage);
                this.txStatus = "Failed";
                this.txId = `Error: ${errorMessage}`;
                this.showAlert(`Transaction broadcast failed: ${errorMessage}`, "danger");
                return null;
            } finally {
                this.showLoading(false);
            }
        },

        // --- Transaction Building ---
        async sendTransaction() {
            if (!this.isWalletLoaded) {
                this.showAlert("No wallet loaded.", "warning");
                return;
            }
            
            const recipient = this.recipientAddressInput.trim();
            const amount = parseFloat(this.sendAmountInput);
            const feeRate = parseInt(this.feeRateInput, 10);

             // Basic validation
             if (!recipient || isNaN(amount) || amount <= 0 || isNaN(feeRate) || feeRate <= 0) {
                 this.showAlert("Please fill in all fields correctly (Recipient Address, positive Amount, positive Fee Rate).", "warning");
                 return;
             }
             try {
                bitcoin.address.toOutputScript(recipient, this.network); // Basic address validation
             } catch (e) {
                 this.showAlert("Invalid recipient Bitcoin address.", "warning");
                 return;
             }
             if (!this.isTestnet) {
                 if (!confirm(`You are about to send ${amount} BTC on MAINNET to ${recipient}.\n\nTHIS IS REAL BITCOIN. Are you absolutely sure?`)) {
                    this.showAlert("Mainnet transaction cancelled.", "info");
                    return;
                 }
             }

            this.showLoading(true);
            this.txStatus = "Preparing Transaction...";
            this.txId = "";
            this.txLink = "#";
            this.showTxInfo = true;

            const amountSatoshis = this.btcToSatoshis(amount);

            try {
                const utxos = await this.getUtxos();
                const spendableUtxos = utxos.filter(utxo => utxo.status.confirmed);

                if (spendableUtxos.length === 0) {
                    this.showAlert("No spendable confirmed UTXOs found.", "warning");
                    this.showLoading(false);
                    return;
                }

                const psbt = new bitcoin.Psbt({ network: this.network });
                let totalInputSatoshis = 0;
                let inputCount = 0;

                const utxoPromises = spendableUtxos.map(async (utxo) => ({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(bitcoin.address.toOutputScript(this.walletAddress, this.network)),
                        value: utxo.value,
                    },
                }));
                const processedUtxos = await Promise.all(utxoPromises);

                const selectedUtxos = [];
                let estimatedTxBytes = 10 + (inputCount * 68) + (2 * 31); // Initial estimate for 0 inputs
                let estimatedFee = Math.ceil(estimatedTxBytes * feeRate);

                for (const utxo of processedUtxos) {
                    if (totalInputSatoshis < amountSatoshis + estimatedFee) {
                        selectedUtxos.push(utxo);
                        totalInputSatoshis += utxo.witnessUtxo.value;
                        inputCount++;
                        estimatedTxBytes = 10 + (inputCount * 68) + (2 * 31); // P2WPKH estimate
                        estimatedFee = Math.ceil(estimatedTxBytes * feeRate);
                    } else {
                        break;
                    }
                }

                if (totalInputSatoshis < amountSatoshis + estimatedFee) {
                    this.showAlert(`Insufficient funds. Need ${this.satoshisToBtc(amountSatoshis + estimatedFee).toFixed(8)} BTC (amount + estimated fee), but only have ${this.satoshisToBtc(totalInputSatoshis).toFixed(8)} BTC available in confirmed UTXOs.`, "warning");
                    this.showLoading(false);
                    return;
                }

                selectedUtxos.forEach(utxo => psbt.addInput(utxo));
                psbt.addOutput({
                    address: recipient,
                    value: amountSatoshis,
                });

                const changeAmount = totalInputSatoshis - amountSatoshis - estimatedFee;

                const DUST_THRESHOLD = 546;
                if (changeAmount >= DUST_THRESHOLD) {
                    psbt.addOutput({
                        address: this.walletAddress,
                        value: changeAmount,
                    });
                }

                for (let i = 0; i < inputCount; i++) {
                    psbt.signInput(i, this.keyPair);
                }
                psbt.finalizeAllInputs();

                const txHex = psbt.extractTransaction().toHex();
                this.txStatus = "Signed. Broadcasting...";

                await this.broadcastTransaction(txHex);

            } catch (error) {
                console.error("Error creating or sending transaction:", error);
                this.showAlert(`Transaction failed: ${error.message}`, "danger");
                this.txStatus = "Error";
                this.txId = error.message;
            } finally {
                this.showLoading(false);
            }
        },
        // Theme Toggle Method - Updated
        toggleTheme() {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', this.currentTheme);
        },
        // Update RPC & Network Detection
        async updateRpcAndNetwork() {
             let targetRpc = '';
            if (this.rpcEndpointSelectValue === 'DEFAULT_TESTNET') {
                targetRpc = this.DEFAULT_TESTNET_RPC_ENDPOINT;
            } else if (this.rpcEndpointSelectValue === 'DEFAULT_MAINNET') {
                targetRpc = this.DEFAULT_MAINNET_RPC_ENDPOINT;
            } else if (this.rpcEndpointSelectValue === 'CUSTOM') {
                targetRpc = this.rpcEndpointCustomInput.trim();
            } else {
                this.showAlert("Invalid RPC selection.", "warning");
                return;
            }

            if (!targetRpc) {
                 this.showAlert("RPC Endpoint URL cannot be empty.", "warning");
                 return;
            }
            if (!targetRpc.startsWith('http://') && !targetRpc.startsWith('https://')) {
                 this.showAlert("Invalid RPC URL. Must start with http:// or https://", "warning");
                 return;
            }
            if (!targetRpc.endsWith('/')) {
                targetRpc += '/';
            }

             this.networkStatusText = 'Selected Network: Detecting...';
             this.networkStatusClass = 'form-text text-muted d-block mt-2'; // Default class while detecting
            this.showLoading(true);

            try {
                const blockHeightUrl = `${targetRpc}blocks/tip/height`;
                const response = await axios.get(blockHeightUrl, { timeout: 10000 });
                const blockHeight = parseInt(response.data, 10);

                if (isNaN(blockHeight)) {
                    throw new Error('Invalid block height received.');
                }

                const detectedNetworkIsTestnet = blockHeight > 1_500_000; 
                const previousNetworkIsTestnet = this.isTestnet;

                // If network changed and wallet exists, clear session WITHOUT confirmation
                if (this.isWalletLoaded && detectedNetworkIsTestnet !== previousNetworkIsTestnet) {
                     this.clearSession(); // Clears wallet state - This will trigger reactive UI updates
                }

                // Update state regardless of whether session was cleared
                this.isTestnet = detectedNetworkIsTestnet;
                this.network = this.isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
                this.currentRpcEndpoint = targetRpc;

                this.showAlert(`RPC Endpoint updated. Detected Network: ${this.networkName}`, "success");
                 this.networkStatusText = `Selected Network: ${this.networkName} (Detected)`;
                 this.networkStatusClass = `form-text d-block mt-2 ${this.isTestnet ? 'text-info' : 'text-primary'}`; 

                // Refresh balance if wallet is STILL loaded (i.e., wasn't cleared)
                if (this.isWalletLoaded) { 
                     this.fetchBalance();
                }
                
            } catch (error) {
                console.error("Error detecting network or updating RPC:", error);
                this.showAlert(`Failed to connect or detect network for ${targetRpc}. Please check the URL and try again. Error: ${error.message}`, "danger");
                 this.networkStatusText = `Selected Network: Detection Failed`;
                 this.networkStatusClass = 'form-text text-danger d-block mt-2';
            } finally {
                 this.showLoading(false);
            }
        },
    },
    // Adding the mounted hook back
    mounted() {
        // Check if libraries are loaded
        if (typeof bitcoin === 'undefined' || typeof axios === 'undefined' || typeof QRCode === 'undefined') {
             console.error("One or more required libraries (BitcoinJS, Axios, QRCode) not loaded!");
            this.showAlert("Critical Error: Required libraries failed to load. Wallet cannot function.", "danger"); 
            return;
        }

        // Initialize state
        this.isTestnet = true; 
        this.network = bitcoin.networks.testnet;
        this.currentRpcEndpoint = this.DEFAULT_TESTNET_RPC_ENDPOINT;
        this.rpcEndpointSelectValue = 'DEFAULT_TESTNET'; 
        this.showCustomRpcInput = false;
        // Initialize theme based on data
        this.currentTheme = 'light'; // Or detect preference
        document.documentElement.setAttribute('data-bs-theme', this.currentTheme);

        // Set initial UI state (replaces updateUI call)
         this.updateWalletStateUI();

         // Set initial network status text
         this.networkStatusText = `Selected Network: ${this.networkName} (Default)`;
         this.networkStatusClass = `form-text d-block mt-2 ${this.isTestnet ? 'text-info' : 'text-primary'}`;

        // Listen for Receive tab being shown to generate QR code
         const receiveTabTrigger = document.getElementById('receive-tab'); // Get the button that triggers the tab
         if (receiveTabTrigger) {
             receiveTabTrigger.addEventListener('shown.bs.tab', event => {
                 if (this.isWalletLoaded) { // Only generate if wallet is loaded
                    this.generateQrCode();
                 }
             });
         } else {
             console.error("Could not find the receive tab trigger element (#receive-tab).");
         }
    }
}).mount('#app');