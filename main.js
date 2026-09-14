'use strict';
// One cluster per folder.
const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

const DEFAULTS = { enabled: true, backbone: true, depth: 1, cables: 0.15, inside: 0.4, colorInside: true, summary: false };

// Nodes without links of their own.
const FOLLOWERS = new Set(['tag', 'unresolved', 'attachment']);

// Top folder of a path.
function topFolder(id) {
  const i = id.indexOf('/');
  return i < 0 ? '' : id.slice(0, i);
}

// The folder, as deep as asked.
function folderOf(id, depth) {
  const parts = id.split('/');
  parts.pop();
  return parts.slice(0, Math.max(1, Math.floor(depth) || 1)).join('/');
}

// Is folder a above folder b?
function above(a, b) {
  return a === '' ? b !== '' : b.startsWith(a + '/');
}

// Links the physics may see.
function filterLinks(pairs, ids, typeOf, backbone, depth = 1) {
  const deep = Math.max(1, Math.floor(depth) || 1);
  // Once per note, not per link.
  const folders = new Map();
  const folder = (id) => {
    let f = folders.get(id);
    if (f === undefined) {
      f = deep > 1 ? folderOf(id, deep) : topFolder(id);
      folders.set(id, f);
    }
    return f;
  };
  const kinds = new Map();
  const follows = (id) => {
    let k = kinds.get(id);
    if (k === undefined) {
      k = FOLLOWERS.has(typeOf(id));
      kinds.set(id, k);
    }
    return k;
  };
  const members = new Map();
  for (const id of ids) {
    if (follows(id)) continue;
    const f = folder(id);
    if (!members.has(f)) members.set(f, new Set());
    members.get(f).add(id);
  }
  // Where a follower is used.
  const homes = new Map();
  const home = (id, f) => {
    if (!homes.has(id)) homes.set(id, new Set());
    homes.get(id).add(f);
  };
  // Neighbours inside the folder.
  const inside = new Map();
  const meet = (a, b) => {
    if (!inside.has(a)) inside.set(a, new Set());
    inside.get(a).add(b);
  };
  for (const [a, b] of pairs) {
    const fa = follows(a);
    const fb = follows(b);
    if (fa && !fb) home(a, folder(b));
    else if (fb && !fa) home(b, folder(a));
    else if (!fa && !fb && a !== b && folder(a) === folder(b)) {
      meet(a, b);
      meet(b, a);
    }
  }
  // Hub: linked with half its folder.
  const hubs = new Set();
  for (const [f, notes] of members) {
    if (!f) continue;
    const need = Math.ceil((notes.size - 1) / 2);
    for (const id of notes) if ((inside.has(id) ? inside.get(id).size : 0) >= need) hubs.add(id);
  }
  const keep = (a, b) => {
    const fa = follows(a);
    const fb = follows(b);
    if (fa && fb) return true;
    // A follower joins one folder.
    if (fa) return homes.get(a).size === 1;
    if (fb) return homes.get(b).size === 1;
    const A = folder(a);
    const B = folder(b);
    if (A === B) return true;
    if (!backbone) return false;
    return (above(A, B) && hubs.has(b)) || (above(B, A) && hubs.has(a));
  };
  const links = pairs.filter(([a, b]) => keep(a, b));
  return {
    links,
    folders: [...members.keys()].filter(Boolean),
    hubs: [...hubs],
    kept: links.length,
    drawnOnly: pairs.length - links.length,
  };
}

// Color of the folder side.
function colorFor(source, target) {
  const node = topFolder(source.id) ? source : topFolder(target.id) ? target : null;
  return node && node.color ? node.color.rgb : null;
}

class GrapeClusters extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.hooks = [];
    this.byRenderer = new WeakMap();
    this.drawing = null;
    this.lastSummary = new WeakMap();
    this.warned = false;
    this.addSettingTab(new GrapeClustersSettingTab(this.app, this));
    this.addCommand({
      id: 'toggle',
      name: 'Toggle folder clusters',
      callback: () => this.setEnabled(!this.settings.enabled, { notify: true }),
    });
    this.app.workspace.onLayoutReady(() => this.scan());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.scan()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.scan()));
  }

  onunload() {
    for (const hook of this.hooks) this.detach(hook);
    this.hooks = [];
    if (this.drawing) {
      this.drawing.proto.render = this.drawing.original;
      this.drawing = null;
    }
  }

  async setEnabled(on, { notify = false } = {}) {
    this.settings.enabled = on;
    await this.save();
    if (notify) new Notice(on ? 'Folder clusters on.' : 'Folder clusters off: the regular graph.');
  }

  async save() {
    await this.saveData(this.settings);
    for (const hook of this.hooks) this.send(hook);
  }

  // Save and redraw only.
  async saveQuiet() {
    await this.saveData(this.settings);
    for (const { renderer } of this.hooks) if (typeof renderer.changed === 'function') renderer.changed();
  }

  // Only the global graph.
  scan() {
    const alive = new Set();
    for (const leaf of this.app.workspace.getLeavesOfType('graph')) {
      const view = leaf.view;
      if (!view || !view.renderer) continue;
      alive.add(view.renderer);
      this.attach(view.renderer);
    }
    this.hooks = this.hooks.filter((h) => alive.has(h.renderer));
  }

  attach(renderer) {
    const known = this.hooks.find((h) => h.renderer === renderer);
    if (known && (known.worker === renderer.worker || !renderer.worker)) return;
    // Obsidian swapped the worker.
    if (known) this.hooks = this.hooks.filter((h) => h !== known);
    const worker = renderer.worker;
    const ok = worker && typeof worker.postMessage === 'function' && Array.isArray(renderer.links);
    if (!ok) {
      this.warnOnce();
      return;
    }
    const original = worker.postMessage;
    const hook = { renderer, worker, original, cross: null, color: { rgb: 0, a: 0 } };
    const plugin = this;
    worker.postMessage = function (message, ...rest) {
      if (plugin.settings.enabled && message && Array.isArray(message.links)) {
        const result = plugin.filterFor(renderer, message.links);
        plugin.rememberCross(hook, message.links, result.links);
        plugin.hookDrawing(renderer);
        message = Object.assign({}, message, { links: result.links });
        plugin.summarize(renderer, result);
      }
      return original.call(worker, message, ...rest);
    };
    this.hooks.push(hook);
    this.byRenderer.set(renderer, hook);
    if (renderer.links.length) this.send(hook);
  }

  // Resend links through the filter.
  send({ renderer, worker }) {
    const pairs = renderer.links.map((l) => [l.source.id, l.target.id]);
    worker.postMessage({ links: pairs, alpha: 1, run: true });
  }

  detach({ renderer, worker, original }) {
    if (worker.postMessage !== original) delete worker.postMessage;
    try {
      const pairs = renderer.links.map((l) => [l.source.id, l.target.id]);
      original.call(worker, { links: pairs, alpha: 1, run: true });
    } catch (e) {
      // The view is already closed.
    }
  }

  filterFor(renderer, pairs) {
    const types = new Map(renderer.nodes.map((n) => [n.id, n.type || '']));
    const typeOf = (id) => types.get(id) || '';
    return filterLinks(pairs, [...types.keys()], typeOf, this.settings.backbone, this.settings.depth);
  }

  // Links that are only drawn.
  rememberCross(hook, all, kept) {
    const keeps = new Map();
    for (const [a, b] of kept) {
      if (!keeps.has(a)) keeps.set(a, new Set());
      keeps.get(a).add(b);
    }
    const cross = new Map();
    for (const [a, b] of all) {
      if (keeps.has(a) && keeps.get(a).has(b)) continue;
      if (!cross.has(a)) cross.set(a, new Set());
      cross.get(a).add(b);
    }
    hook.cross = cross;
  }

  // Soft links, colored clusters.
  hookDrawing(renderer) {
    if (this.drawing || !renderer.links.length) return;
    const proto = Object.getPrototypeOf(renderer.links[0]);
    if (!proto || proto === Object.prototype || typeof proto.render !== 'function') return;
    const original = proto.render;
    const plugin = this;
    proto.render = function () {
      const r = this.renderer;
      const hook = r && plugin.byRenderer.get(r);
      if (!hook || !hook.cross || !plugin.settings.enabled || !r.colors || !r.colors.line) return original.call(this);
      const focus = typeof r.getHighlightNode === 'function' ? r.getHighlightNode() : null;
      if (focus && (this.source === focus || this.target === focus)) return original.call(this);
      const line = r.colors.line;
      const own = hook.color;
      const cross = hook.cross.get(this.source.id);
      if (cross && cross.has(this.target.id)) {
        own.rgb = line.rgb;
        own.a = line.a * plugin.settings.cables;
      } else {
        const rgb = plugin.settings.colorInside ? colorFor(this.source, this.target) : null;
        own.rgb = rgb === null ? line.rgb : rgb;
        own.a = line.a * plugin.settings.inside;
      }
      r.colors.line = own;
      try {
        return original.call(this);
      } finally {
        r.colors.line = line;
      }
    };
    this.drawing = { proto, original };
  }

  summarize(renderer, result) {
    if (!this.settings.summary) return;
    const text = `Grape Clusters: ${result.folders.length} folders, ${result.kept} links shape the layout, ${result.drawnOnly} are only drawn.`;
    if (this.lastSummary.get(renderer) === text) return;
    this.lastSummary.set(renderer, text);
    new Notice(text, 5000);
  }

  warnOnce() {
    if (this.warned) return;
    this.warned = true;
    new Notice('Grape Clusters does not recognize this version of the graph view, so it changes nothing.', 8000);
  }
}

class GrapeClustersSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  slider(containerEl, key, name, desc) {
    new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addSlider((s) =>
        s
          .setLimits(0, 100, 5)
          .setValue(Math.round(this.plugin.settings[key] * 100))
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings[key] = v / 100;
            await this.plugin.saveQuiet();
          })
      );
  }

  toggle(containerEl, key, name, desc, relayout) {
    new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addToggle((t) =>
        t.setValue(this.plugin.settings[key]).onChange(async (v) => {
          this.plugin.settings[key] = v;
          await (relayout ? this.plugin.save() : this.plugin.saveQuiet());
        })
      );
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    this.toggle(containerEl, 'enabled', 'Cluster by folder',
      'Every folder becomes its own cluster. All links stay visible; only the layout listens to the links inside a folder. Keep Center force in the graph settings at 0.15 or higher. Without it, the clusters drift apart when you drag a note.', true);
    new Setting(containerEl)
      .setName('Folder depth')
      .setDesc('1 makes a cluster of every top-level folder. 2 gives every subfolder its own cluster, and so on.')
      .addSlider((s) =>
        s
          .setLimits(1, 3, 1)
          .setValue(this.plugin.settings.depth)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.depth = v;
            await this.plugin.save();
          })
      );
    this.toggle(containerEl, 'backbone', 'Backbone',
      'Notes above a folder hold on to the main note of that folder, so the clusters stay together. A main note is linked with at least half of its folder.', true);
    this.slider(containerEl, 'cables', 'Links between clusters',
      'How visible the links between two folders are. 0 hides them, 100 draws them as usual. Hover a note to see all of its links.');
    this.slider(containerEl, 'inside', 'Links inside a cluster',
      'How visible the links inside a folder are, and the backbone links. Lower is calmer.');
    this.toggle(containerEl, 'colorInside', 'Color links by folder',
      'Links inside a folder take the color of that folder, from the groups in the graph settings.', false);
    this.toggle(containerEl, 'summary', 'Show a summary',
      'Show a short notice with the numbers each time the graph is rebuilt.', false);
  }
}

module.exports = GrapeClusters;
module.exports.filterLinks = filterLinks;
module.exports.topFolder = topFolder;
module.exports.folderOf = folderOf;
module.exports.above = above;
module.exports.colorFor = colorFor;
