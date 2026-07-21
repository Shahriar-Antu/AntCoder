#!/usr/bin/env node

const https = require("https")
const http = require("http")
const fs = require("fs")
const path = require("path")
const os = require("os")

const REPO = "Shahriar-Antu/AntCoder"
const pkg = require("../package.json")
const VERSION = pkg.version

const platformMap = { darwin: "darwin", linux: "linux", win32: "windows" }
const archMap = { x64: "x64", arm64: "arm64" }

const platform = platformMap[os.platform()]
const arch = archMap[os.arch()]

if (!platform || !arch) {
  console.error(`Unsupported platform: ${os.platform()} ${os.arch()}`)
  process.exit(1)
}

const ext = platform === "windows" ? ".exe" : ""
const asset = `antcoder-${platform}-${arch}${ext}`
const dest = path.join(__dirname, ".antcoder")

function fetch(url, redirects) {
  if (redirects > 10) {
    console.error("Too many redirects")
    process.exit(1)
  }
  const mod = url.startsWith("https") ? https : http
  mod
    .get(url, { headers: { "User-Agent": "antcoder-postinstall" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, redirects + 1)
      }
      if (res.statusCode !== 200) {
        console.error(`Failed to download ${asset}: HTTP ${res.statusCode}`)
        // Non-fatal — user can still use curl install method
        process.exit(0)
      }
      const tmp = dest + ".tmp"
      const file = fs.createWriteStream(tmp)
      res.pipe(file)
      file.on("finish", () => {
        file.close(() => {
          fs.chmodSync(tmp, 0o755)
          fs.renameSync(tmp, dest)
          console.log(`antcoder v${VERSION} installed successfully`)
        })
      })
    })
    .on("error", (err) => {
      console.error(`Download failed: ${err.message}`)
      // Non-fatal
      process.exit(0)
    })
}

const url = `https://github.com/${REPO}/releases/download/v${VERSION}/${asset}`
fetch(url, 0)
