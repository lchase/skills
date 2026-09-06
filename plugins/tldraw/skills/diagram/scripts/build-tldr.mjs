#!/usr/bin/env node
// Build a .tldr file from a simple diagram spec, then optionally export PNG/SVG
// via @kitschpatrol/tldraw-cli.
//
// Usage:
//   node build-tldr.mjs <spec.json> [out.tldr] [--formats png,svg] [--dark] [--transparent]
//
// out.tldr is optional -- with no second argument the file is written to the CURRENT
// working directory as <spec.title | spec filename | "diagram">.tldr. tldraw only opens
// the .tldr extension, so any other extension you pass is rewritten to .tldr.
//
// Spec shape (all coordinates optional -- omit them to get auto-layout):
//   {
//     "title": "Checkout flow",     // optional -- names the output files
//     "nodes": [
//       { "id": "a", "text": "Start", "shape": "ellipse", "color": "green" },
//       { "id": "b", "text": "Do the thing" },
//       { "id": "c", "text": "Done?", "shape": "diamond" }
//     ],
//     "edges": [
//       { "from": "a", "to": "b" },
//       { "from": "b", "to": "c", "text": "then" },
//       { "from": "c", "to": "b", "text": "no", "dashed": true }
//     ]
//   }
//
// node.shape:  rectangle (default) | ellipse | diamond | cloud | hexagon | triangle | rhombus | trapezoid | star | oval
// node.color / edge.color: black (default) grey blue green red orange yellow violet
//                          light-blue light-green light-red light-violet
// node.w / node.h:  box size (defaults 180 x 90)
// node.x / node.y:  explicit top-left position; if ANY node sets both, auto-layout is skipped

import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'

const args = process.argv.slice(2)
const positional = args.filter((a) => !a.startsWith('--'))
const flags = args.filter((a) => a.startsWith('--'))
const [specPath, outArg] = positional
if (!specPath) {
	console.error('usage: build-tldr.mjs <spec.json> [out.tldr] [--formats png,svg] [--dark] [--transparent]')
	console.error('  out.tldr defaults to ./<spec title or name>.tldr in the current directory')
	process.exit(1)
}

const slug = (s) =>
	String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'diagram'

const formatsFlag = flags.find((f) => f.startsWith('--formats'))
const formats = formatsFlag ? formatsFlag.split('=')[1]?.split(',').filter(Boolean) ?? [] : []
const dark = flags.includes('--dark')
const transparent = flags.includes('--transparent')

const spec = JSON.parse(readFileSync(specPath, 'utf8'))
const nodes = spec.nodes ?? []
const edges = spec.edges ?? []
if (nodes.length === 0) {
	console.error('spec has no nodes')
	process.exit(1)
}

// Output path: explicit arg wins. Otherwise ./<name>.tldr in the CURRENT directory,
// named from spec.title, else the spec filename (minus .spec/.json), else "diagram".
// tldraw only recognizes the .tldr extension (.tldraw won't open in the editor or
// render), so a non-.tldr extension is nudged to .tldr.
let outPath
if (outArg) {
	outPath = extname(outArg).toLowerCase() === '.tldr' ? outArg : `${outArg.replace(/\.(tldraw|json)$/i, '')}.tldr`
	if (outPath !== outArg) console.warn(`note: tldraw uses the .tldr extension -- writing "${basename(outPath)}"`)
} else {
	const stem = spec.title ? slug(spec.title) : slug(basename(specPath).replace(/\.(spec\.)?json$/i, ''))
	outPath = `${stem}.tldr`
}

// ---------- ids + fractional indexes ----------
// tldraw ids must match /^[A-Za-z0-9]+$/ -- no '-' or '_', so base64url is out.
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const sid = () => {
	let s = ''
	for (const b of randomBytes(21)) s += ALPHABET[b % ALPHABET.length]
	return `shape:${s}`
}
// tldraw fractional index keys: 'a' + base62 digits (0-9A-Za-z). a1..az is one
// integer "bucket"; the next bucket is 'b' + 2 digits, etc. Emit strictly
// increasing, well-formed keys.
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
let idxN = 0
const nextIndex = () => {
	const n = ++idxN
	if (n < 62) return `a${B62[n]}`
	const m = n - 62
	if (m < 62 * 62) return `b${B62[Math.floor(m / 62)]}${B62[m % 62]}`
	throw new Error('too many shapes for the simple index scheme (>3900)')
}

// ---------- auto layout (layered top-to-bottom) ----------
const GEO = new Set([
	'rectangle', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon',
	'star', 'rhombus', 'rhombus-2', 'oval', 'trapezoid', 'arrow-right', 'arrow-left',
	'arrow-up', 'arrow-down', 'x-box', 'check-box', 'cloud', 'heart',
])
for (const n of nodes) {
	if (n.shape && !GEO.has(n.shape)) {
		console.warn(`node "${n.id}": unknown shape "${n.shape}" -- using rectangle`)
		n.shape = 'rectangle'
	}
}

const byId = new Map(nodes.map((n) => [n.id, n]))
const hasExplicit = nodes.every((n) => typeof n.x === 'number' && typeof n.y === 'number')

if (!hasExplicit) {
	const incoming = new Map(nodes.map((n) => [n.id, 0]))
	for (const e of edges) if (byId.has(e.to) && byId.has(e.from)) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1)

	// BFS layering from roots; nodes never reached get pushed to a trailing layer
	const layer = new Map()
	let frontier = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id)
	if (frontier.length === 0) frontier = [nodes[0].id] // cycle: seed with first node
	let depth = 0
	const seen = new Set()
	while (frontier.length) {
		const next = []
		for (const id of frontier) {
			if (seen.has(id)) continue
			seen.add(id)
			layer.set(id, Math.max(layer.get(id) ?? 0, depth))
			for (const e of edges) if (e.from === id && !seen.has(e.to)) next.push(e.to)
		}
		frontier = next
		depth++
	}
	let trailing = depth
	for (const n of nodes) if (!layer.has(n.id)) layer.set(n.id, trailing)

	const rows = new Map()
	for (const n of nodes) {
		const l = layer.get(n.id)
		if (!rows.has(l)) rows.set(l, [])
		rows.get(l).push(n)
	}
	const H_GAP = 90
	const V_GAP = 90
	for (const [l, row] of rows) {
		const widths = row.map((n) => n.w ?? 180)
		const total = widths.reduce((a, b) => a + b, 0) + H_GAP * (row.length - 1)
		let cx = -total / 2
		for (let i = 0; i < row.length; i++) {
			const n = row[i]
			n.x = cx
			n.y = l * ((spec.rowHeight ?? 90) + V_GAP)
			cx += widths[i] + H_GAP
		}
	}
}

// ---------- records ----------
const records = [
	{ gridSize: 10, name: '', meta: {}, id: 'document:document', typeName: 'document' },
	{ meta: {}, id: 'page:page', name: 'Page 1', index: 'a1', typeName: 'page' },
]

const shapeIdOf = new Map()
for (const n of nodes) {
	const id = sid()
	shapeIdOf.set(n.id, id)
	const w = n.w ?? 180
	const h = n.h ?? 90
	records.push({
		x: n.x,
		y: n.y,
		rotation: 0,
		isLocked: false,
		opacity: 1,
		meta: {},
		id,
		type: 'geo',
		parentId: 'page:page',
		index: nextIndex(),
		props: {
			w,
			h,
			geo: n.shape ?? 'rectangle',
			color: n.color ?? 'black',
			labelColor: n.color ?? 'black',
			fill: n.fill ?? 'none',
			dash: 'draw',
			size: n.size ?? 'm',
			font: n.font ?? 'draw',
			text: n.text ?? '',
			align: 'middle',
			verticalAlign: 'middle',
			growY: 0,
			url: '',
		},
		typeName: 'shape',
	})
}

for (const e of edges) {
	const from = shapeIdOf.get(e.from)
	const to = shapeIdOf.get(e.to)
	if (!from || !to) {
		console.warn(`edge skipped -- unknown node: ${e.from} -> ${e.to}`)
		continue
	}
	const anchor = (precise) => ({
		type: 'binding',
		boundShapeId: precise,
		normalizedAnchor: { x: 0.5, y: 0.5 },
		isPrecise: false,
		isExact: false,
	})
	records.push({
		x: 0,
		y: 0,
		rotation: 0,
		isLocked: false,
		opacity: 1,
		meta: {},
		id: sid(),
		type: 'arrow',
		parentId: 'page:page',
		index: nextIndex(),
		props: {
			dash: e.dashed ? 'dashed' : 'draw',
			size: 'm',
			fill: 'none',
			color: e.color ?? 'black',
			labelColor: e.color ?? 'black',
			bend: 0,
			start: anchor(from),
			end: anchor(to),
			arrowheadStart: 'none',
			arrowheadEnd: 'arrow',
			text: e.text ?? '',
			font: 'draw',
		},
		typeName: 'shape',
	})
}

const file = {
	tldrawFileFormatVersion: 1,
	schema: {
		schemaVersion: 1,
		storeVersion: 4,
		recordVersions: {
			asset: { version: 1, subTypeKey: 'type', subTypeVersions: { image: 3, video: 3, bookmark: 1 } },
			camera: { version: 1 },
			document: { version: 2 },
			instance: { version: 22 },
			instance_page_state: { version: 5 },
			page: { version: 1 },
			shape: {
				version: 3,
				subTypeKey: 'type',
				subTypeVersions: {
					group: 0, text: 1, bookmark: 2, draw: 1, geo: 8, note: 5, line: 1,
					frame: 0, arrow: 2, highlight: 0, embed: 4, image: 3, video: 2,
				},
			},
			instance_presence: { version: 5 },
			pointer: { version: 1 },
		},
	},
	records,
}

const out = resolve(outPath)
writeFileSync(out, JSON.stringify(file, null, '\t'))
console.log(`wrote ${out}  (${nodes.length} nodes, ${edges.length} edges)`)

// ---------- optional image export ----------
for (const fmt of formats) {
	const cliArgs = ['-y', '@kitschpatrol/tldraw-cli', 'export', out, '--format', fmt, '--output', dirname(out), '--name', basename(out, '.tldr')]
	if (dark) cliArgs.push('--dark')
	if (transparent) cliArgs.push('--transparent')
	console.log(`\n$ npx ${cliArgs.join(' ')}`)
	const r = spawnSync('npx', cliArgs, { stdio: 'inherit' })
	if (r.status !== 0) {
		console.error(`export to ${fmt} failed`)
		process.exit(r.status ?? 1)
	}
}
