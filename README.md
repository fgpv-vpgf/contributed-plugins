# contributed-plugins
Free to use but unsupported plugins for FGPV/RAMP2

*Under construction* 🔧🔨

This is a repository containing plugins for the [FGPV-VGPF RAMP2 Viewer](https://github.com/fgpv-vpgf/fgpv-vpgf) that have been submitted by users of the library. None of the plugins are officially maintained or supported by the RAMP2 development team; however we hope they are useful or provide learning opportunities.

[List of Plugins](#list-of-plugins)

## Submission Guidelines

### New Plugins

Create a pull request with the new plugin. The following things are advised for the content of the PR.

Create a folder at the root of the repo that has a clear, consise name. Use dashes between words. E.g. `feature-graphing-tool`

Consider looking at the [My First Plugin](https://github.com/fgpv-vpgf/contributed-plugins/tree/master/my-first-plugin) sample template and copying or emulating the content there.

At the root of the folder there should be a `README.md` file. The file should contain
- A good description of what the plugin does
- Instructions on how to use the plugin, or a link to another doc file/site. E.g. if there is code that needs to be in the host page.
- Optional Recommended: Github account ids of authors/maintainers
- Optional Recommended: Version of RAMP the plugin was developed against / tested with
- Optional Recommended: Level of support. I.e. will the author entertain issue submissions? Will they respond to questions (if yes, indicate preferred means of contact)? Do they plan to update code with RAMP releases? Is future development on the plugin planned?
- Optional: Release status and/or release history
- Optional: Contact email of authors/maintainers
- Optional: Links to any active websites using the plugin

*TODO put recommended subdirectory structure here*

If the submitter wishes to be in the *Authors* user group (will allow them to pull their own PRs), make the request in the body of your first PR.

Update the primary repo README, adding the new plugin to the list of plugins.

### Updates to Existing Plugins

Authors are free to update their plugins at whim. Please attempt to keep the plugin's README file in synch with the content

### General Principles

- Well commented code is not enforced, but is encouraged.
- Commit messages should be clear and concise.
- No extreme vulgarity / hateful content / X-Rated content / general evil
- The branch being PR'd should be rebased from the `master` branch of this repo.

## List of Plugins

- [Draw](https://github.com/fgpv-vpgf/contributed-plugins/tree/master/draw) - Provides tools for drawing and measuring on the map
- [My First Plugin](https://github.com/fgpv-vpgf/contributed-plugins/tree/master/my-first-plugin) - A basic sample and starter template for plugins
- [Swiper](https://github.com/fgpv-vpgf/contributed-plugins/tree/master/swiper) - Adds a LayerSwipe to the map
- [Thematic Slider](https://github.com/fgpv-vpgf/contributed-plugins/tree/master/thematic-slider) - Adds a thematic slider to the map

### Core Plugins

These plugins come bundled with the RAMP core library. Links are provided here to serve as more sources of plugin examples.

- [Areas Of Interest](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/master/packages/ramp-plugin-areas-of-interest) - Displays a list of items that will zoom to a specified area when clicked.
- [Back To Cart](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/master/packages/ramp-plugin-back-to-cart) - A mechanism to preserve state and send layer info to another page containing a layers shopping cart
- [Coordinate Info](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/master/packages/ramp-plugin-coordinate-info) - Displays details about the co-ordinates of a clicked point
- [Custom Export](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/master/packages/ramp-plugin-custom-export) - Allows custom export templates to be constructed
- [Enhanced Table](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/master/packages/ramp-plugin-enhanced-table) - A data table for attributes with filtering capabilities