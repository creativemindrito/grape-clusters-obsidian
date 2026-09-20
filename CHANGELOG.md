# Changelog

## 1.2.0

- **Spokes**, a new setting, on by default. Inside a folder, only the links to its main note pull now, the note that's linked with at least half of that folder. The other links in the folder stay on screen but let go, so the folder settles into a wheel, the main note in the middle and everything else around it, instead of a knot. A folder without a main note keeps all its links, like before. On my test vault of 3,000 notes this lets go of 1,334 links across 21 folders, and my journal folder alone accounts for 544 of them.
- **Ring**, a new setting, off by default. It puts the note in the root of your vault that links to the most main notes in the middle, and gives every folder that has a main note a fixed place on a circle around it, wide enough that the clusters don't touch. If there is no note in your root that links to main notes, the middle stays empty. It looks tidy on a small vault, but it takes the graph out of your hands, and on a big vault it ends up as a small wheel of clusters inside a wide halo of loose notes. I left it in because it may suit yours; try it and see. **Ring spacing** makes the circle wider or narrower, and the circle already follows Link distance in the graph settings.
- The summary is clearer: how many folders there are, how many have a main note, how many links pull and how many are only drawn.
- The README and the texts in the settings were rewritten to say what the plugin really does.
- With Spokes off, the layout is exactly what 1.1.2 did, checked link by link against the test vault at every folder depth, with and without Backbone.

## 1.1.2

- Clusters could drift apart while you dragged a note if center force was turned all the way down. The README now suggests 0.15, and the *Cluster by folder* setting says to keep it at 0.15 or higher. The README also shows step by step how a cluster forms, and there's a new table for when something in the graph looks off. The way the plugin lays out your graph did not change.

## 1.1.1

- Releases are now made by GitHub itself from the tagged commit, and `main.js` and `manifest.json` come with a GitHub attestation. That was the one recommendation left in Obsidian's review of the plugin. The plugin itself did not change.

Coming from 1.0.1? Then 1.1.0 is new to you as well. It came out the same day, and that one did change the plugin:

- **Folder depth**, a new setting. Keep it at 1 and every top-level folder is a cluster, like before. Set it to 2 and every subfolder becomes its own cluster.
- The main note of a folder now counts links in both directions, so a status note that half the folder points to counts too.
- Tags, attachments and notes you haven't written yet join the folder that uses them. If several folders use the same one, it stays loose instead of pulling those folders together.
- The README now says what actually makes a cluster (links inside a folder, not colors) and lists the graph settings I use.

## 1.1.0

- **Folder depth**, a new setting. Keep it at 1 and every top-level folder is a cluster, like before. Set it to 2 and every subfolder becomes its own cluster.
- The main note of a folder now counts links in both directions. A status note that half the folder points to is a main note too, not only an index that points at everyone.
- Tags, attachments and notes you haven't written yet join the folder that uses them. If several folders use the same one, it stays loose. Before, they drifted to the edge on a long line, or one tag pulled folders together.
- If Obsidian ever swaps the physics worker of an open graph, Grape Clusters notices and hooks the new one.
- README: what actually makes a cluster, and the graph settings I use.

## 1.0.1

- A new README, with the Vineyard banner and how to install from inside Obsidian. The plugin itself did not change.

## 1.0.0

- First release.
