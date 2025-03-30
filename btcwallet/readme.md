# Creating Bitcoinjs-lib locally
``` bash
npm init -y
npm install bitcoinjs-lib@5.2.0 browserify --save-dev
npx browserify --standalone bitcoin -o bitcoinjs-lib-5.2.0.js -r bitcoinjs-lib
```
