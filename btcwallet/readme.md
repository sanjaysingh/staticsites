# bitcoinjs-lib and Buffer Browser Bundles

This project provides scripts to generate standalone browser bundles for `bitcoinjs-lib` and its dependency `buffer`.

## Setup

1.  **Clone or download this project.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
    This will install `bitcoinjs-lib`, `buffer`, and `browserify` based on the versions specified in `package.json`.

## Regenerating Bundles (Using Current Versions)

If you need to regenerate the browser bundles using the currently installed versions of the libraries, run the following commands:

*   **Generate `buffer-<version>.js`:**
    ```bash
    npm run build:buffer
    ```
    This uses `buffer-shim.js` and the `build:buffer` script in `package.json`.

*   **Generate `bitcoinjs-lib-<version>.js`:**
    ```bash
    npm run build:bitcoin
    ```
    This uses the `build:bitcoin` script in `package.json`.

The generated files (`buffer-6.0.3.js` and `bitcoinjs-lib-5.2.0.js` by default) can be included directly in your HTML via `<script>` tags. Make sure to include the buffer bundle *before* the bitcoinjs-lib bundle.

```html
<script src="buffer-6.0.3.js"></script>
<script src="bitcoinjs-lib-5.2.0.js"></script>
<script>
  // Buffer is globally available
  // bitcoinjs-lib is globally available via the 'bitcoin' object
  console.log(Buffer.from('hello').toString('hex'));
  console.log(bitcoin.networks.bitcoin);
</script>
```

## Upgrading Dependencies

To upgrade `buffer` and `bitcoinjs-lib` to their latest versions and generate new bundles:

1.  **Update dependencies:**
    ```bash
    # Update buffer to latest
    npm install buffer@latest --save-dev

    # Update bitcoinjs-lib to latest
    npm install bitcoinjs-lib@latest --save-dev
    ```
    *(Note: Check the releases/changelogs for both libraries for any potential breaking changes before upgrading.)*

2.  **Update build scripts in `package.json`:**
    Manually edit the `scripts` section in `package.json` to reflect the new version numbers in the output filenames (e.g., change `buffer-6.0.3.js` to `buffer-<new_version>.js`).

    *Example (assuming buffer updated to 7.0.0 and bitcoinjs-lib to 6.0.0):*
    ```json
    // package.json
    "scripts": {
      "build:buffer": "browserify ./buffer-shim.js -s Buffer -o buffer-7.0.0.js",
      "build:bitcoin": "browserify -r bitcoinjs-lib -s bitcoin -o bitcoinjs-lib-6.0.0.js"
    },
    ```

3.  **Regenerate bundles:**
    Run the build commands again:
    ```bash
    npm run build:buffer
    npm run build:bitcoin
    ```

4.  **Update your HTML:**
    Change the `<script>` tags in your HTML files to point to the newly generated bundle files with the updated version numbers.
