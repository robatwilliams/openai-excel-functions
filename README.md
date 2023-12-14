# OpenAI API Formulas for Excel

## Usage instructions

1. Add the plugin to Excel by following the [sideloading instructions for your platform](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/test-debug-office-add-ins#sideload-an-office-add-in-for-testing).
2. Start typing the following in a formula bar `OAI.` and you should see the formulas associated with this plugin.
3. For a full description of each function, see `src/functions.json`.

## File descriptions

| Path | Description |
| ---- | ----------- |
| assets/*.png | Icons of various sizes |
| src/functions/functions.js | The JavaScript functions which implement the formulas. |
| src/functions/functions.json | The metadata which details each formula and references its implementation. |
| index.html | Root page loaded in the background during plugin startup. |
| manifest-local.xml | A version of manifest.xml which references https://localhost:3000/ for plugin development use. |
| manifest.xml | Configures where the plugin should be loaded from and what features it will make use of. |
| package[-lock].json | Lists NPM dependencies. Used only during plugin development. |
| README.md | This file. |

## Plugin development

1. Install the npm dependencies (`npm i`)
2. Follow these instructions to [generate an cert-key pair](https://github.com/http-party/http-server#tlsssl).
3. Run the local server (`npm start`).
4. Navigate to the [root](https://localhost:3000/) in your browser and temporarily trust the newly created cert-key pair.
4. Open a spreadsheet in Excel on the web and append the following query string parameters
```
wdaddindevserverport=3000&wdaddinmanifestfile=manifest-localhost.xml&wdaddinmanifestguid=00aeeb98-f4d9-4db0-a1e6-cdc652c08e34
```
5. If you are prompted to enable Excel developer mode, do so.

You should now be able to use the formulas as normal. If you make a change to `index.html` or `src/*`, you will need to reload the browser window.
