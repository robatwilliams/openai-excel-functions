# OpenAI API Formulas for Excel

## Usage instructions

1. Add the plugin to Excel by following the [sideloading instructions for your platform](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/test-debug-office-add-ins#sideload-an-office-add-in-for-testing).
2. Start typing the following in a formula bar `OAI.` and you should see the formulas associated with this plugin.
3. For a full description of each function, see `src/functions.json`.

## File descriptions

| Path | Description |
| --- | --- |
| assets/\*.png | Icons of various sizes |
| src/functions/functions.js | The JavaScript functions which implement the formulas. |
| src/functions/functions.json | The metadata which details each formula and references its implementation. |
| index.html | Root page loaded in the background during plugin startup. |
| manifest-local.xml | A version of manifest.xml which references https://localhost:3000/ for plugin development use. |
| manifest.xml | Configures where the plugin should be loaded from and what features it will make use of. |
| package[-lock].json | Lists NPM dependencies. Used only during plugin development. |
| README.md | This file. |

## Plugin development

### Prerequisites

If you're on Windows, configure NPM to use a sh-compatible shell, e.g:

```bash
npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
```

Configure your IDE to adhere to the project code formatting. For VSCode, these will be loaded from the workspace settings in `.vscode/`; for other editors/IDEs you'll need to configure equivalently. You may need to unset/disable any personal settings or extensions that interfere.

### Install and run

1. Install the npm dependencies (`npm i`)
1. Generate and install certificates (`npm run install-certs`)
1. Run the local server (`npm start`).

### Open in Excel web

1. Open a spreadsheet in Excel on the web and append the following query string parameters

```
wdaddindevserverport=3000&wdaddinmanifestfile=manifest-localhost.xml&wdaddinmanifestguid=00aeeb98-f4d9-4db0-a1e6-cdc652c08e34
```

2. If you are prompted to enable Excel developer mode, do so.

You should now be able to use the formulas as normal. If you make a change to `index.html` or `src/*`, you will need to reload the browser window.

### Open in Excel desktop

```bash
npm run sideload:desktop
```
