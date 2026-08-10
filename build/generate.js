// =============================================================
// generate.js — Terminal Blog Static Site Generator
// Usage: node generate.js
// Requires: Node.js 18+ (uses fs, path — no npm packages)
// =============================================================

'use strict';

const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');

// -------------------------------------------------------------
// Paths
// -------------------------------------------------------------
const ARTICLES_DIR  = path.join(__dirname, 'articles');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DIST_DIR      = path.join(__dirname, 'dist');
const CONFIG_FILE   = path.join(__dirname, 'config.json');

// -------------------------------------------------------------
// Generate og.png at outPath (1200x630) using sharp + SVG
// Mimics page header: prompt line, breadcrumb path, description
// Breadcrumb is always one line — font shrinks to fit width
// Desc wraps at ~60 chars, positioned below breadcrumb
// -------------------------------------------------------------
function generateOgImage(outPath, prompt, breadcrumb, desc) {
  const W = 1200;
  const H = 630;

  // escape XML special chars
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // -------------------------------------------------------------
  // Breadcrumb: single line, font shrinks to fit usable width
  // Courier New monospace char width ratio ≈ 0.6 * font-size
  // Usable width = W - (2 * x margin) = 1200 - 144 = 1056
  // -------------------------------------------------------------
  const bcFontNat   = 72;
  const bcXMargin   = 72;
  const bcUsableW   = W - bcXMargin * 2;
  const bcCharRatio = 0.6;
  const bcFontMax   = Math.min(bcFontNat, Math.floor(bcUsableW / (breadcrumb.length * bcCharRatio)));
  const bcFont      = bcFontMax;
  const bcY         = 260;

  // wrap desc at ~60 chars
  const descWords = desc.split(' ');
  const descLines = [];
  let   dline     = '';
  descWords.forEach(function (w) {
    if ((dline + ' ' + w).trim().length > 60) {
      descLines.push(dline.trim());
      dline = w;
    } else {
      dline = (dline + ' ' + w).trim();
    }
  });
  if (dline) descLines.push(dline.trim());

  const descFontNat = 32;
  const descStepNat = 44;
  const bcDescGap   = 50;
  const descBaseY   = bcY + bcFont + bcDescGap;

  const descSvg = descLines.map(function (l, i) {
    return '<text x="72" y="' + (descBaseY + i * descStepNat) + '" font-size="' + descFontNat + '" fill="#888" font-family="Courier New, monospace">' + esc(l) + '</text>';
  }).join('\n');

  const svg = [
    '<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">',
    '  <rect width="' + W + '" height="' + H + '" fill="#272727"/>',
    '  <rect x="0" y="0" width="' + W + '" height="4" fill="#555"/>',
    '  <text x="72" y="120" font-size="32" fill="#555" font-family="Courier New, monospace">' + esc(prompt) + ':~$</text>',
    '  <text x="72" y="' + bcY + '" font-size="' + bcFont + '" fill="#e8e8e8" font-family="Courier New, monospace">' + esc(breadcrumb) + '</text>',
    descSvg,
    '</svg>'
  ].join('\n');

  return sharp(Buffer.from(svg)).png().toFile(outPath);
}

// -------------------------------------------------------------
// Load config
// -------------------------------------------------------------
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('[error] config.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// -------------------------------------------------------------
// Load all post.json files from articles/*/post.json
// Normalizes tag (string) or tags (array) → post.tags (always array)
// -------------------------------------------------------------
function loadPosts() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error('[error] articles/ directory not found');
    process.exit(1);
  }

  const entries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  const posts   = [];

  entries.forEach(function (entry) {
    if (!entry.isDirectory()) return;

    const jsonPath = path.join(ARTICLES_DIR, entry.name, 'post.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn('[warn] no post.json in articles/' + entry.name + ' — skipping');
      return;
    }

    try {
      const post = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      // normalize tag → tags (always an array)
      if (!post.tags) {
        post.tags = post.tag ? [post.tag] : [];
      }
      if (typeof post.tags === 'string') {
        post.tags = [post.tags];
      }
      delete post.tag;

      // auto-add 'pinned' tag if post is pinned and not already tagged
      if (post.pinned === true && post.tags.indexOf('pinned') === -1) {
        post.tags.push('pinned');
      }

      posts.push(post);
      console.log('[load] ' + post.slug);
    } catch (e) {
      console.warn('[warn] failed to parse ' + jsonPath + ' — ' + e.message);
    }
  });

  // -------------------------------------------------------------
  // Sort: pinned (by pinnedOrder, then date) first, then unpinned by date
  // -------------------------------------------------------------
  const pinned   = posts.filter(function (p) { return p.pinned === true; });
  const unpinned = posts.filter(function (p) { return p.pinned !== true; });

  pinned.sort(function (a, b) {
    const aHasOrder = typeof a.pinnedOrder === 'number';
    const bHasOrder = typeof b.pinnedOrder === 'number';
    if (aHasOrder && bHasOrder)  return a.pinnedOrder - b.pinnedOrder;
    if (aHasOrder && !bHasOrder) return -1;
    if (!aHasOrder && bHasOrder) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  unpinned.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  return pinned.concat(unpinned);
}

// -------------------------------------------------------------
// Collect unique tags and post counts from all posts
// Returns: { tagname: count, ... }
// -------------------------------------------------------------
function collectTagCounts(posts) {
  const counts = {};
  posts.forEach(function (post) {
    post.tags.forEach(function (tag) {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return counts;
}

// -------------------------------------------------------------
// Build nav HTML — pinned first, then remaining tags abc order
// assetPrefix: depth-aware path back to dist/
// -------------------------------------------------------------
function buildNav(tags, assetPrefix) {
  const sorted  = tags.filter(function (t) { return t !== 'pinned'; }).sort();
  const ordered = tags.indexOf('pinned') !== -1 ? ['pinned'].concat(sorted) : sorted;

  const links = ordered.map(function (tag) {
    return '<a href="' + assetPrefix + 'articles/' + tag + '/index.html">' + tag + '</a>';
  }).join(' | ');

  return '<nav class="site-nav">' + links + '</nav>\n    <hr class="nav-hr" />';
}

// -------------------------------------------------------------
// Token replacement — replaces all {{TOKEN}} occurrences
// -------------------------------------------------------------
function render(template, tokens) {
  let out = template;
  Object.keys(tokens).forEach(function (key) {
    const re = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
    out = out.replace(re, tokens[key]);
  });
  return out;
}

// -------------------------------------------------------------
// Build dist/index.html — main post listing
// Post links resolve to first tag's article directory
// Asset prefix: '' (same dir as dist/)
// -------------------------------------------------------------
function buildIndex(config, posts, allTags, indexTemplate) {
  const items = posts.map(function (post) {
    const pin      = post.pinned ? '📌 ' : '';
    const firstTag = post.tags[0] || 'untagged';
    const href     = 'articles/' + firstTag + '/' + post.slug + '/index.html';
    const sortedTags = post.tags.filter(function (t) { return t === 'pinned'; })
      .concat(post.tags.filter(function (t) { return t !== 'pinned'; }).sort());
    const tagLinks = sortedTags.map(function (t) {
      return '<a href="articles/' + t + '/index.html">#' + t + '</a>';
    }).join(' ');

    return [
      '        <li>',
      '          <div class="post-list-meta">',
      '            <span class="post-date">' + post.date + '</span>',
      '            <span class="post-read-time">' + (post.readTime || '') + '</span>',
      '            <span class="post-tags">' + tagLinks + '</span>',
      '          </div>',
      '          <div class="post-list-body">',
      '            <a class="post-title-link" href="' + href + '">' + pin + post.title + '</a>',
      '            <p class="post-list-desc">' + (post.description || '') + '</p>',
      '          </div>',
      '        </li>'
    ].join('\n');
  }).join('\n');

  const ogImagePath = path.join(DIST_DIR, 'og.png');
  const ogImageUrl  = config.siteUrl.replace(/\/$/, '') + '/og.png';
  const canonicalUrl = config.siteUrl.replace(/\/$/, '') + '/';

  generateOgImage(ogImagePath, config.sitePrompt, '~' + config.siteTitle, config.siteDesc)
    .then(function () { console.log('[dist] og.png'); })
    .catch(function (e) { console.warn('[warn] og.png failed: ' + e.message); });

  const html = render(indexTemplate, {
    ASSET_PREFIX:    '',
    SITE_TITLE:      config.siteTitle,
    SITE_PROMPT:     config.sitePrompt,
    SITE_DESC:       config.siteDesc,
    CURRENT_YEAR:    config.currentYear,
    AUTHOR:          config.author,
    CANONICAL_URL:   canonicalUrl,
    OG_IMAGE_URL:    ogImageUrl,
    NAV_ITEMS:       buildNav(allTags, ''),
    POST_LIST_ITEMS: items
  });

  const outPath = path.join(DIST_DIR, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('[dist] index.html');
}

// -------------------------------------------------------------
// Build dist/articles/<tag>/index.html — per-tag post listing
// tagPosts: posts filtered to this tag, already sorted
// tagCounts: { tag: count } for display
// Asset prefix: '../../' (two levels up to dist/)
// -------------------------------------------------------------
function buildTagIndex(config, tag, tagPosts, tagCounts, allTags, tagTemplate) {
  const outDir = path.join(DIST_DIR, 'articles', tag);
  fs.mkdirSync(outDir, { recursive: true });

  const items = tagPosts.map(function (post) {
    const pin        = post.pinned ? '📌 ' : '';
    const href       = post.slug + '/index.html';
    const sortedTags = post.tags.filter(function (t) { return t === 'pinned'; })
      .concat(post.tags.filter(function (t) { return t !== 'pinned'; }).sort());
    const tagLinks = sortedTags.map(function (t) {
      return '<a href="../' + t + '/index.html">#' + t + '</a>';
    }).join(' ');

    return [
      '        <li>',
      '          <div class="post-list-meta">',
      '            <span class="post-date">' + post.date + '</span>',
      '            <span class="post-read-time">' + (post.readTime || '') + '</span>',
      '            <span class="post-tags">' + tagLinks + '</span>',
      '          </div>',
      '          <div class="post-list-body">',
      '            <a class="post-title-link" href="' + href + '">' + pin + post.title + '</a>',
      '            <p class="post-list-desc">' + (post.description || '') + '</p>',
      '          </div>',
      '        </li>'
    ].join('\n');
  }).join('\n');

  const ogImagePath  = path.join(outDir, 'og.png');
  const ogImageUrl   = config.siteUrl.replace(/\/$/, '') + '/articles/' + tag + '/og.png';
  const canonicalUrl = config.siteUrl.replace(/\/$/, '') + '/articles/' + tag + '/';

  generateOgImage(ogImagePath, config.sitePrompt, '~' + config.siteTitle + '/' + tag, config.siteDesc)
    .then(function () { console.log('[dist] articles/' + tag + '/og.png'); })
    .catch(function (e) { console.warn('[warn] articles/' + tag + '/og.png failed: ' + e.message); });

  const html = render(tagTemplate, {
    ASSET_PREFIX:    '../../',
    SITE_TITLE:      config.siteTitle,
    SITE_PROMPT:     config.sitePrompt,
    SITE_DESC:       config.siteDesc,
    CURRENT_YEAR:    config.currentYear,
    AUTHOR:          config.author,
    CANONICAL_URL:   canonicalUrl,
    OG_IMAGE_URL:    ogImageUrl,
    NAV_ITEMS:       buildNav(allTags, '../../'),
    TAG_NAME:        tag,
    TAG_COUNT:       tagCounts[tag] || tagPosts.length,
    POST_LIST_ITEMS: items
  });

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log('[dist] articles/' + tag + '/index.html');
}

// -------------------------------------------------------------
// Build dist/articles/pinned/index.html
// Links point to the post under its first tag directory
// Asset prefix: '../../' (two levels up to dist/)
// -------------------------------------------------------------
function buildPinnedIndex(config, posts, tagTemplate) {
  const pinnedPosts = posts.filter(function (p) { return p.pinned === true; });
  const outDir      = path.join(DIST_DIR, 'articles', 'pinned');
  fs.mkdirSync(outDir, { recursive: true });

  const items = pinnedPosts.map(function (post) {
    const firstTag   = post.tags[0] || 'untagged';
    const href       = '../' + firstTag + '/' + post.slug + '/index.html';
    const sortedTags = post.tags.filter(function (t) { return t === 'pinned'; })
      .concat(post.tags.filter(function (t) { return t !== 'pinned'; }).sort());
    const tagLinks = sortedTags.map(function (t) {
      return '<a href="../' + t + '/index.html">#' + t + '</a>';
    }).join(' ');

    return [
      '        <li>',
      '          <div class="post-list-meta">',
      '            <span class="post-date">' + post.date + '</span>',
      '            <span class="post-read-time">' + (post.readTime || '') + '</span>',
      '            <span class="post-tags">' + tagLinks + '</span>',
      '          </div>',
      '          <div class="post-list-body">',
      '            <a class="post-title-link" href="' + href + '">📌 ' + post.title + '</a>',
      '            <p class="post-list-desc">' + (post.description || '') + '</p>',
      '          </div>',
      '        </li>'
    ].join('\n');
  }).join('\n');

  const ogImagePath  = path.join(outDir, 'og.png');
  const ogImageUrl   = config.siteUrl.replace(/\/$/, '') + '/articles/pinned/og.png';
  const canonicalUrl = config.siteUrl.replace(/\/$/, '') + '/articles/pinned/';

  generateOgImage(ogImagePath, config.sitePrompt, '~' + config.siteTitle + '/pinned', config.siteDesc)
    .then(function () { console.log('[dist] articles/pinned/og.png'); })
    .catch(function (e) { console.warn('[warn] articles/pinned/og.png failed: ' + e.message); });

  const html = render(tagTemplate, {
    ASSET_PREFIX:    '../../',
    SITE_TITLE:      config.siteTitle,
    SITE_PROMPT:     config.sitePrompt,
    SITE_DESC:       config.siteDesc,
    CURRENT_YEAR:    config.currentYear,
    AUTHOR:          config.author,
    CANONICAL_URL:   canonicalUrl,
    OG_IMAGE_URL:    ogImageUrl,
    TAG_NAME:        'pinned',
    TAG_COUNT:       pinnedPosts.length,
    POST_LIST_ITEMS: items
  });

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log('[dist] articles/pinned/index.html');
}

// -------------------------------------------------------------
// Build dist/articles/<tag>/<slug>/index.html
// One output page per post per tag
// Asset prefix: '../../../' (three levels up to dist/)
// -------------------------------------------------------------
function buildPost(config, post, postTemplate, tag, allTags) {
  const outDir  = path.join(DIST_DIR, 'articles', tag, post.slug);
  fs.mkdirSync(outDir, { recursive: true });

  const tagList      = post.tags.map(function (t) { return '#' + t; }).join(' ');
  const articleTags  = post.tags.map(function (t) {
    return '  <meta property="article:tag" content="' + t + '" />';
  }).join('\n');
  const ogImagePath  = path.join(outDir, 'og.png');
  const ogImageUrl   = config.siteUrl.replace(/\/$/, '') + '/articles/' + tag + '/' + post.slug + '/og.png';
  const canonicalUrl = config.siteUrl.replace(/\/$/, '') + '/articles/' + tag + '/' + post.slug + '/';

  generateOgImage(ogImagePath, config.sitePrompt, '~' + config.siteTitle + '/' + tag + '/' + post.slug, post.description || config.siteDesc)
    .then(function () { console.log('[dist] articles/' + tag + '/' + post.slug + '/og.png'); })
    .catch(function (e) { console.warn('[warn] articles/' + tag + '/' + post.slug + '/og.png failed: ' + e.message); });

  const html = render(postTemplate, {
    ASSET_PREFIX:   '../../../',
    SITE_TITLE:     config.siteTitle,
    SITE_PROMPT:    config.sitePrompt,
    SITE_DESC:      config.siteDesc,
    CURRENT_YEAR:   config.currentYear,
    AUTHOR:         config.author,
    CANONICAL_URL:  canonicalUrl,
    OG_IMAGE_URL:   ogImageUrl,
    ARTICLE_TAGS:   articleTags,
    NAV_ITEMS:      buildNav(allTags, '../../../'),
    POST_SLUG:      post.slug,
    POST_TITLE:     post.title,
    POST_DESC:      post.description,
    POST_DATE:      post.date,
    POST_READ_TIME: post.readTime,
    POST_TAG_NAME:  tag,
    POST_TAGS:      tagList,
    POST_CONTENT:   post.body
  });

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log('[dist] articles/' + tag + '/' + post.slug + '/index.html');
}

// -------------------------------------------------------------
// Copy static assets to dist/
// -------------------------------------------------------------
function copyAssets() {
  ['style.css', 'theme.js'].forEach(function (file) {
    const src  = path.join(__dirname, file);
    const dest = path.join(DIST_DIR, file);

    if (!fs.existsSync(src)) {
      console.warn('[warn] ' + file + ' not found in project root — skipping');
      return;
    }

    fs.copyFileSync(src, dest);
    console.log('[dist] ' + file);
  });
}

// -------------------------------------------------------------
// Main
// -------------------------------------------------------------
function main() {
  console.log('[generate] start');

  // ensure dist/ exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const config        = loadConfig();
  const posts         = loadPosts();
  const tagCounts     = collectTagCounts(posts);
  const indexTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');
  const postTemplate  = fs.readFileSync(path.join(TEMPLATES_DIR, 'post.html'),  'utf8');
  const tagTemplate   = fs.readFileSync(path.join(TEMPLATES_DIR, 'tag.html'),   'utf8');

  // build sorted tag list — pinned first, then abc
  const allTags = Object.keys(tagCounts).filter(function (t) { return t !== 'pinned'; }).sort();
  if (tagCounts['pinned']) allTags.unshift('pinned');

  buildIndex(config, posts, allTags, indexTemplate);

  // build per-tag index pages
  Object.keys(tagCounts).forEach(function (tag) {
    const tagPosts = posts.filter(function (p) { return p.tags.indexOf(tag) !== -1; });
    buildTagIndex(config, tag, tagPosts, tagCounts, allTags, tagTemplate);
  });

  // build post pages — one per tag
  posts.forEach(function (post) {
    post.tags.forEach(function (tag) {
      buildPost(config, post, postTemplate, tag, allTags);
    });
  });

  copyAssets();

  console.log('[generate] done — ' + posts.length + ' post(s) written to dist/');
}

main();
