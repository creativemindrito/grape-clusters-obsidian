'use strict';
// One cluster per folder.
const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

const DEFAULTS = { enabled: true, backbone: true, cables: 0.15, inside: 0.4, colorInside: true, summary: false };

// Top folder of a path.
function topFolder(id) {
  const i = id.indexOf('/');
  return i < 0 ? '' : id.slice(0, i);
}

// Links the physics may see.
function filterLinks(pairs, ids, typeOf, backbone) {
  const members = new Map();
  for (const id of ids) {
    if (typeOf(id) === 'tag') continue;
    const folder = topFolder(id);
    if (!members.has(folder)) members.set(folder, new Set());
    members.get(folder).add(id);
  }
  const inside = new Map();
  for (const [a, b] of pairs) {
    const folder = topFolder(a);
    if (folder && folder === topFolder(b)) inside.set(a, (inside.get(a) || 0) + 1);
  }
  // Hub: links half its folder.
  const isHub = (id) => {
    const folder = topFolder(id);
    if (!folder || !members.has(folder)) return false;
    const rest = members.get(folder).size - 1;
    return (inside.get(id) || 0) >= Math.ceil(rest / 2);
  };
  const isRoot = (id) => topFolder(id) === '' && typeOf(id) === '';
  const keep = (a, b) => {
    if (typeOf(a) === 'tag' || typeOf(b) === 'tag') return true;
    if (topFolder(a) === topFolder(b)) return true;
    if (!backbone) return false;
    return (isRoot(a) && isHub(b)) || (isRoot(b) && isHub(a));
  };
  const links = pairs.filter(([a, b]) => keep(a, b));
  return {
    links,
    folders: [...members.keys()].filter(Boolean),
    hubs: ids.filter(isHub),
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
    if (this.hooks.some((h) => h.renderer === renderer)) return;
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
    return filterLinks(pairs, [...types.keys()], typeOf, this.settings.backbone);
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
      'Every top-level folder becomes its own cluster. All links stay visible; only the layout listens to the links inside a folder.', true);
    this.toggle(containerEl, 'backbone', 'Backbone',
      'Notes in the root of your vault hold on to the hub of each folder, so the clusters stay together. A hub is a note that links to at least half of its folder.', true);
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
module.exports.colorFor = colorFor;
