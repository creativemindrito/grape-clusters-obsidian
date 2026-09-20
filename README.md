# Grape Clusters

![Welcome to the Vineyard family: Grape Clusters, a plugin for Obsidian](banner.png)

## The Vineyard family

Vineyard is what I call the little Obsidian things I make and give away. Right now that's this plugin and a theme.

| | 💎 Obsidian | 🐙 GitHub |
|---|---|---|
| 🍇 **Grape Clusters**, the plugin on this page | [Plugin page](https://community.obsidian.md/plugins/grape-clusters) | [Repository](https://github.com/creativemindrito/grape-clusters-obsidian) |
| 🍷 **Bordeaux**, the dark red theme in the screenshots | [Theme page](https://community.obsidian.md/themes/bordeaux) | [Repository](https://github.com/creativemindrito/bordeaux-theme-obsidian) |

![The same test vault of about 500 notes, first without and then with Grape Clusters](screenshot.png)

My graph view never showed me much. I'd open it to see how my notes hang together and get one big grey knot in the middle of the screen.

That's how the graph works: every link is a pull. Two notes that link to each other get dragged towards one another, and where a note ends up is whatever all those pulls settle on. My notes link across folders all the time, a journal entry to a project and that project to a person, so everything pulls on everything and it all lands in one pile.

I looked for a setting to group the graph by folder and there isn't one. I wanted to keep Obsidian's own graph, with my links and my colors, and still let every folder gather its own notes. So I made this.

Grape Clusters picks which links are allowed to pull. Every link stays on the screen, only fainter, and how faint is up to you. Hover a note and its links come back at full strength. I first tried it on a vault of about 500 notes and 1,800 links, which is the screenshot above, and then kept going to 3,000.

## How it looks

I wanted to know if it holds up in a big vault, so I grew the same test vault in three steps. Every folder has its own color.

**500 notes in 9 folders**

![A test vault with 500 notes in 9 folders, every folder its own cluster](500-notes.png)

**1,500 notes in 15 folders**

![The same test vault with 1,500 notes in 15 folders](1500-notes.png)

**3,000 notes in 21 folders, 300 of them loose**

![The same test vault with 3,000 notes in 21 folders, and 300 loose notes around the edge](3000-notes.png)

Those 300 are in there on purpose, to see what happens to notes that don't belong anywhere. Half of them sit in a folder and link to nothing at all, so there's nothing to pull them in. The other half sit in the root of the vault, outside every folder, each with one link into a folder. A note from outside only joins a cluster if it links to that folder's main note, and these link to a random note instead. Both kinds end up around the edge.

At 3,000 notes the graph stutters a bit when you zoom all the way out. Zoomed in, it's smooth.

## How it works

Grape Clusters works with the links you already have. It doesn't add any and it doesn't take any away; it only decides which ones the layout is allowed to pull on.

A link between two different folders lets go. That's what gives every folder room to gather its own notes, with space between the clusters. There's one exception: if a note outside a folder links to that folder's main note, that link still pulls, so a note in the root of your vault can hold a cluster in place. Without it the clusters drift apart. That's the *Backbone* setting.

Inside a folder, Grape Clusters looks for the main note: one that's linked with at least half of the folder, whether that note links to them or they link to it. Usually it's the note you made to list everything in there. Links to a main note pull. The other links inside that folder let go, so the folder settles into a wheel, the main note in the middle and everything else around it, instead of a knot. That's the *Spokes* setting. A folder can have more than one main note, and a folder without one keeps all its links, the way it worked before.

On my test vault of 3,000 notes that lets go of 1,334 links across 21 folders, and my journal folder alone accounts for 544 of them.

One thing to know before you turn it on. A wheel is held together by its spokes and nothing else, so every time Obsidian works the layout out again, which it does whenever you drag a note, the clusters pull in for a moment and spread back out. It settles in a second. Nothing is lost, it just moves more than you may be used to.

## Make your first cluster

Say you keep twenty recipes in a folder called `Recipes`.

1. Add one more note to that folder and link it to every recipe. Most people call it something like `Recipes index`. Grape Clusters finds it by itself and treats it as the main note.
2. Open the graph view. The recipes gather around it.
3. From a note in the root of your vault, say `Home`, link to that new note. Now the cluster stays near the rest of your graph instead of floating off on its own.
4. Give it a color. In the graph settings, open *Groups* and add `path:"Recipes/"` with a color you like.

Do the same for your other folders. A folder with one or two notes stays small, and that's fine.

## Settings

These are the settings I like best. Start from there and change whatever you like.

**My graph settings**

![My graph settings, with center force at 0.15 and link distance around 250](settings-graph.png)

**Grape Clusters, the way it comes when you install it**

![The settings of Grape Clusters with nothing changed](settings-plugin.png)

In Obsidian's settings, Grape Clusters has its own page at the bottom of the list on the left, under *Community plugins*.

| Setting | What it does | Default |
|---|---|---|
| Cluster by folder | Turns the whole thing on or off | On |
| Folder depth | Which folders get a cluster: 1 is your top-level folders, 2 is every subfolder | 1 |
| Backbone | Lets a note above a folder pull on that folder's main note, so the clusters stay together | On |
| Spokes | Inside a folder, only the links to its main note pull. The rest stay on screen and let go | On |
| Ring | Holds the main note of every folder that has one in a fixed spot on a circle | Off |
| Ring spacing | Makes that circle wider or narrower | 100% |
| Links between clusters | How visible the links are that let go. At 0 they disappear | 15% |
| Links inside a cluster | How visible the links are that still pull | 40% |
| Color links by folder | Links inside a cluster get the color of that folder | On |
| Show a summary | Shows a short notice with the numbers whenever they change | Off |

*Links between clusters* and *Links inside a cluster* go by whether a link still pulls, not by where it runs. So with *Spokes* on, the links inside a folder that let go follow *Links between clusters* along with the rest.

There's also a command called *Toggle folder clusters* if you want to flip back to the normal graph quickly.

**About Ring.** Everything else in this plugin only chooses which links pull, and leaves the placing to Obsidian. Ring is the one setting that doesn't: it holds the main note of every folder on a spot on a circle, in alphabetical order, and puts it back if you drag it away. A folder without a main note doesn't get a spot and keeps drifting, and a folder with more than one puts only its best connected note on the circle. In the middle goes the note in the root of your vault that links to the most main notes, and if you don't have one the middle stays empty. It's tidy on a small vault. On a big one it ends up as a tight circle of clusters with a wide scatter of loose notes around it, and I liked my own graph better without it, which is why it's off unless you ask for it. The circle already follows *Link distance* from your graph settings, and *Ring spacing* widens or narrows it from there.

## Install

The easiest way is inside Obsidian. Open *Settings → Community plugins*, click *Browse* and search for Grape Clusters, then click *Install* and *Enable*. If you've never used community plugins, Obsidian first asks you to turn them on.

You can also open the [Grape Clusters page](https://community.obsidian.md/plugins/grape-clusters) on the Obsidian website and click *Add to Obsidian*. Obsidian opens on the plugin, and you click *Install* and *Enable* there.

If you'd rather do it by hand, download `main.js` and `manifest.json` from the [latest release](https://github.com/creativemindrito/grape-clusters-obsidian/releases/latest). Put both in a folder called `grape-clusters` in `.obsidian/plugins/` inside your vault, and switch the plugin on under *Settings → Community plugins*.

After that, open the graph view.

## Privacy

Grape Clusters doesn't connect to the internet and never touches your notes. The only file it writes is its own settings file, and the only other one it reads is your graph settings, to see how long your links are. The plugin itself is one file, `main.js`, with `manifest.json` next to it so Obsidian knows what it is. Nothing else comes with it.

Every release is put together by GitHub itself, straight from the tagged version of this repository, and GitHub signs a record of which files came out of it. If you use GitHub's command line tool and want to check a download against that record, run `gh attestation verify main.js --owner creativemindrito`.

## Heads-up

Grape Clusters reaches into parts of the graph view that Obsidian doesn't officially open up to plugins, and with Ring on it also holds notes in place, the same way Obsidian does while you drag one. If an update changes those parts it won't break your graph: the most that happens is that Grape Clusters stops doing its work, and turning it off always brings the normal graph back. If it can't recognize the graph at all, it says so once and leaves everything alone. If only the fading of the links stops working, it goes quiet and the clusters carry on.

It needs Obsidian 1.13 or newer. I've only tested it on a computer, though there's nothing in it that a phone can't run. It changes the big graph view and leaves the local graph in the sidebar as it is.

## If something looks off

| What you see | What to do |
|---|---|
| Nothing changes at all | Check that you're in the big graph view and not the local graph. Still the same? Close the graph tab and open it again. |
| The clusters drift apart when you drag a note | Set *Center force* under *Forces* to 0.15 or higher. Grape Clusters takes a lot of pull away, so center force is what holds the whole graph together. |
| A folder is a loose handful of dots | Its notes hardly link to each other, so there's nothing to pull them together. Give that folder a note that links to everything in it; Grape Clusters takes that as the main note. |
| One note drifts away from its own cluster | With *Spokes* on, a note that doesn't link to the main note has nothing pulling it in. Link it to the main note, or turn *Spokes* off so the links between the notes pull again. |
| You don't use folders | Then there's nothing to cluster by. Everything sits in the root, no cluster forms, and the only thing you'll notice is that your links look fainter. |
| Your subfolders are one big cluster | Clusters form at your top-level folders. Set *Folder depth* to 2 and every subfolder gets its own. |
| Notes in the root of your vault float around the edge | Root notes don't get a cluster of their own. Link one to the main note of a folder and it hangs on to that cluster. With *Ring* on, the root note that links to the most main notes goes in the middle instead. |
| A tag or attachment floats on its own | It's used in more than one folder, so it stays loose on purpose. Otherwise one `#todo` could pull all those folders into a knot. |

## Uninstall

Switch it off under *Settings → Community plugins* and the normal graph is back right away. Hit *Uninstall* there if you want it gone for good.

## Made by

[creativemindrito](https://github.com/creativemindrito). Free to use under the [MIT license](LICENSE). Found a bug or have an idea? Open an issue and tell me about it.
