# Node.js Fundamentals

## Description

This repository contains solutions for Node.js Fundamentals assignment. Please read [Usage](#usage) section carefully

## Getting Started

1. **Clone this repo**

   ```bash
   git clone https://github.com/Lorenzo-StJohn/node-nodejs-fundamentals
   cd node-nodejs-fundamentals
   git checkout develop
   ```

## Requirements

- Node.js version: >=24.10.0
- npm version: >=10.9.2

## Usage

### File System (src/fs)

- `npm run fs:snapshot` - Create snapshot of workspace directory

  `workspace` directory should be either in project root folder or in src/fs

  File `snapshot.json` will be created next to it

  ***

- `npm run fs:restore` - Restore directory structure from snapshot

  File `snapshot.json` should be either in project root folder or in src/fs

  `workspace_restored` directory will be created next to it

  ***

- `npm run fs:findByExt` - Find files by extension in workspace

  `workspace` directory should be either in project root folder or in src/fs

  It's case-sensitive for extension and case-insensitive for sorting

  ***

- `npm run fs:merge` - Merge .txt files from workspace/parts

  `workspace` directory with `parts` directory in it should be either in project root folder or in src/fs

  File `merged.txt` will be created in `workspace` folder

- `npm run fs:merge -- --files a.txt,b.txt,c.txt` - Merge specific files from workspace/parts in provided order

  `workspace` directory with `parts` directory in it should be either in project root folder or in src/fs

  File `merged.txt` will be created in `workspace` folder

---

### CLI (src/cli)

- `npm run cli:interactive` - Interactive command-line interface
  ***
- `npm run cli:progress` - Display progress bar

  > [!WARNING]
  > If you want to use color flag, be aware that some shells treat # symbol as comment starting, so you may need to quote color argument, for example: `node src/cli/progress --interval 100 --color '#66aaee' --duration 6000 --length 50`
  > Alternatively you can temporary disable treating it as comment in `bash` shell with this command: `shopt -u interactive_comments`

---

### Modules (src/modules)

- `npm run modules:dynamic` - Dynamic plugin loading

---

### Hash (src/hash)

- `npm run hash:verify` - Verify file checksums using SHA256

  File `checksums.json` should be either in project root folder or in src/hash

  Listed in checksums.json files should be in `workspace` folder (not in some its subfolder!)

  The `workspace` folder should be either in project root folder or in src/hash

---

### Streams (src/streams)

- `npm run streams:lineNumberer` - Add line numbers to stdin input

  In some shells original command may not work correctly, in that case you can try this command instead: `node -e "process.stdout.write('hello\\nworld')" | node src/streams/lineNumberer.js` ot this: `(echo hello & echo world) | node src/streams/lineNumberer.js`

  ***

- `npm run streams:filter` - Filter stdin lines by pattern

  In some shells original command may not work correctly, in that case you can try this command instead: `node -e "process.stdout.write('hello\\nworld\\ntest')" | node src/streams/filter.js --pattern test` ot this: `(echo hello & echo world & echo test) | node src/streams/filter.js --pattern test`

  ***

- `npm run streams:split` - Split file into chunks

  File `source.txt` should be either in project root folder or in src/streams

  Chunk files will be created in `chunks` folder in src/streams

---

### Zlib (src/zip)

- `npm run zip:compressDir` - Compress directory to .br archive

  Folder `workspace` should be either in project root folder or in src/zip

  Folder `toCompress` should be inside `workspace` folder

  ***

- `npm run zip:decompressDir` - Decompress .br archive

  Folder`workspace` should be either in project root folder or in src/zip

  Folder `compressed` with `archive.br` inside it should be inside `workspace` folder

---

### Worker Threads (src/wt)

- `npm run wt:main` - Parallel sorting with worker threads

  The `data.json` should be either in project folder or in src/wt

  (Chunks are sorted in worker.js, in main.js k-way merge sorting algorithm with binary heap is used for creating resulting array.)

  ***

### Child Processes (src/cp)

- `npm run cp:execCommand` - Execute command in child process

  You can test it also with commands like this: `node src/cp/execCommand.js "ls -la"`

  But don't forget quotes (in this example — around "ls -la")!

---
