# DOSBox Express
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.txt)

DOSBox frontend built using [Tauri](https://tauri.app/).
## Key Features
- Quick and easy-to-use
- Multi-platform (Windows & Linux)
- Portable
- Different DOSBox flavors support
- Custom themes
## Motivation
DOSBox is a great piece of software that enables nostalgic gamers like me to keep going back to the good old days but it is cumbersome to use without some additional scripts or tools. While digital stores like [GOG](https://www.gog.com/) make it super easy to acquire and run DOS games using dedicated clients, they usually offer limited emulation tweaking capabilities and if you want to run anything bought outside those platforms then you most likely will be searching for a DOSBox frontend. There is already a good selection of [officialy listed frontends](https://www.dosbox.com/wiki/DOSBoxFrontends) but they don't suit my taste so I thought it would be an interesting excercise to make my own. DOSBox Express is a fun and educational side-project that I did for myself but I'm also sharing it with the community in case someone finds it useful.
## Download
Download the app from [project releases page](https://github.com/robert-ryu7/dosbox-express/releases).
## Getting Started
### System Requirements
App was tested on Windows 10 and elementary OS but should (hopefully) work on any newer version of Windows and other Linux distributions.
### Prerequisites
App expects "dosbox" directory to exist next to the executable and to contain DOSBox files. Simply download your preferred flavor of DOSBox and extract it there. App was developed with [DOSBox Staging](https://dosbox-staging.github.io/) in mind but was also proved to work with vanilla DOSBox. It should work with other popular forks but those are untested ATM. Please note that DOSBox might require some additional packages to be installed.
### Basic Usage
The app starts with the main window which is composed of 3 major parts:
- Search field - Type partial name of the game you're looking for to list only games containing this string of characters. 
- List - It shows the name and DOSBox ".conf" file path along with other game properties. You can modify the size of columns simply by dragging their borders and your changes will be saved. Clicking on items selects them, double-click starts the game immediately. If you click while holding shift you can select multiple items at once. Currently multi-select is useful only for deleting multiple entries.
- Toolbar - On the left side you can see a summary of your list selection, on the right there are all available actions that you can take, these are:
    - Delete - Deletes selected entries.
    - Edit - Allows you to modify selected entry.
    - Config - Opens up built-in editor for DOSBox configuration file referenced by currently selected entry.
    - Start - Starts the seleted entry.
    - Add - Allows you to add new entry. You can type in a path to ".conf" or use "Select" button to choose ".conf" file (you can also choose a game executable file directly).
    - Tools - Dialog opened by this button allows you to run DOSBox with any arbitrary arguments and to open base ".conf" file if you want to edit base (global) game settings.
    - Settings - Here you can find all application settings.
    - Info - Shows app version, copyright info and some useful links.

Use the "Add" action, provide the game name and the path to ".conf" file. If you don't have a valid ".conf" file ready the quickest way to start is to use "Select" button to select the game executable. You will be asked if you want to generate a configuration file, click "OK" and a new file will be created next to the executable with a basic autoexec that should work for simple games. Once the game is added to the list simply double-click on it to start.

Each game running with DOSBox Express uses 2 configuration files:
- base - Common DOSBox configuration which serves as a fallback and reference for the built-in config editor. You can edit this file but it is recommended to just edit what you need and not remove any pre-existing comments or settings.
- game-specific - This is the file you selected when adding the game, any values provided within will take precedence over the base config.

### Directories & files
1. When you first start the application 2 files should be created next to it:
- settings.json - As the name suggests this file contains all of your settings which can be managed within the app. If for any reason you would like to restore default values simply remove this file and it will be recreated at the next application start.
- db.sqlite - An SQLite database holding a table with all your added games. Similarly to settings, this file will be recreated when removed.
2. Next to the executable you also have:
- "dosbox" directory - DOSBox executable is required to be located inside.
- "themes" directory (optional) - Place for holding custom stylesheets. See [customization](#customization) section for more info.
- "games" directory (optional) - While not necessary it is recommended to put your games here. By default DOSBox Express will treat files selected from this directory as relative, enabling portability.
## Customization
If you know CSS and want to modify the visuals of the app you can write a stylesheet file and save it in "themes" directory next to where the executable is. You can then select it in settings menu. You can find a sample theme [here](static/themes/heroic-sample.css) that you can use as a basic reference, if you want to do more advanced changes take a deeper look at the source code.
## License
This project is licensed under the terms of the MIT license found [here](LICENSE.txt).
## Development
At the time of writing this document I consider DOSBox Express to be a complete application that achieves all of the project fundamental goals. There are currently no plans for adding any new major features but I'm open to feedback and suggestions.

Even though I'm ok with the current state of the application I feel there's still room for improvement. I don't want to make any promises but here's a short list of things I would like to implement in the future:
- macOS version - Should be easy but I currently don't have the means to make it happen.
- proper user manual and/or in-app help - I hope the app is simple enough for everybody to use straight away but if not, some form of documentation should help. There are a few options I would consider:
    - Distributing manual as a text file along with binaries.
    - Putting link to remote manual file in "Info" dialog.
    - Embedding manual into the application. Could implement it as a series of popups (maybe with some character like [Clippy from MS Office](https://en.wikipedia.org/wiki/Office_Assistant) but game-based) or simply as a scrollable content within dialog element.
    - Adding tooltips.
- right-click context menus - Even faster UX.
- Internationalization & Localization - There's not much text within the app but still a useful thing to have.
- more themes - Would love to see some high quality "skins" based on classic games like Dune 2. :wink:

I might be willing to accept contributions but haven't decided yet on how to approach project maintenance so if you're interested please let me know.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T6T0P3186)