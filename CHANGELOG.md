# Changelog

## 1.1.1

- Releases are now made by GitHub itself from the tagged commit, and `main.js` and `manifest.json` come with a GitHub attestation. That was the one recommendation left in Obsidian's review of the plugin. The plugin itself did not change.

Coming from 1.0.1? Then 1.1.0 is new to you as well. It came out the same day, and that one did change the plugin:

- **Folder depth**, a new setting. Keep it at 1 and every top-level folder is a cluster, like before. Set it to 2 and every subfolder becomes its own bunch.
- The main note of a folder now counts links in both directions, so a status note that half the folder points to counts too.
- Tags, attachments and notes you haven't written yet join the folder that uses them. If several folders use the same one, it stays loose instead of pulling those folders together.
- The README now says what actually makes a cluster (links inside a folder, not colors) and lists the graph settings I use.

## 1.1.0

- **Folder depth**, a new setting. Keep it at 1 and every top-level folder is a cluster, like before. Set it to 2 and every subfolder becomes its own bunch.
- The main note of a folder now counts links in both directions. A status note that half the folder points to is a main note too, not only an index that points at everyone.
- Tags, attachments and notes you haven't written yet join the folder that uses them. If several folders use the same one, it stays loose. Before, they drifted to the edge on a long line, or one tag pulled folders together.
- If Obsidian ever swaps the physics worker of an open graph, Grape Clusters notices and hooks the new one.
- README: what actually makes a cluster, and the graph settings I use.

## 1.0.1

- A new README, with the Vineyard banner and how to install from inside Obsidian. The plugin itself did not change.

## 1.0.0

- First release.
