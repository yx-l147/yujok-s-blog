/* Create a new thought markdown file with front-matter */

import fs from "fs"
import path from "path"

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No filename argument provided
Usage: pnpm new-thought -- <filename>`)
  process.exit(1)
}

let fileName = args[0]
if (!/\.(md|mdx)$/i.test(fileName)) {
  fileName += ".md"
}

const targetDir = "./src/content/thoughts/"
const fullPath = path.join(targetDir, fileName)

if (fs.existsSync(fullPath)) {
  console.error(`Error: File ${fullPath} already exists`)
  process.exit(1)
}

const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true })
}

const title = args[0].replace(/\.(md|mdx)$/i, "")
const content = `---
title: ${JSON.stringify(title)}
published: ${getDate()}
series: "偶得"
tags: []
draft: false
---

`

fs.writeFileSync(fullPath, content, "utf8")
console.log(`Thought ${fullPath} created`)
