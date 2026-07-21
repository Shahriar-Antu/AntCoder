#!/usr/bin/env bun
/**
 * Build Linux AppImage for AntCoder
 * Run on Ubuntu 22.04+ or in Docker
 */

import { $ } from "bun"
import fs from "fs"
import path from "path"

const __dirname = import.meta.dirname
const rootDir = path.resolve(__dirname, "../..")

async function main() {
  console.log("🔨 Building AntCoder Linux AppImage...")

  // 1. Build the Bun binary first
  console.log("📦 Building Bun binary...")
  await $`bun run --cwd ${rootDir}/packages/opencode build --single`

  const binaryPath = path.join(rootDir, "packages/opencode/dist/antcoder-linux-x64/bin/antcoder")
  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Binary not found at ${binaryPath}`)
  }

  // 2. Create AppDir structure
  const appDir = path.join(rootDir, "dist/appimage/AntCoder.AppDir")
  const usrBin = path.join(appDir, "usr/bin")
  const usrShare = path.join(appDir, "usr/share")
  const usrShareApp = path.join(usrShare, "applications")
  const usrShareIcons = path.join(usrShare, "icons/hicolor/256x256/apps")

  await $`rm -rf ${appDir}`
  await $`mkdir -p ${usrBin} ${usrShareApp} ${usrShareIcons}`

  // 3. Copy binary
  await $`cp ${binaryPath} ${usrBin}/antcoder`
  await $`chmod +x ${usrBin}/antcoder`

  // 4. Create .desktop file
  const desktopEntry = `[Desktop Entry]
Type=Application
Name=AntCoder
GenericName=AI Coding Agent
Comment=Local-only AI coding agent with llama.cpp backend
Exec=antcoder
Icon=antcoder
Terminal=true
Categories=Development;IDE;
Keywords=ai;coding;llm;local;
StartupNotify=false
`
  await Bun.write(path.join(usrShareApp, "antcoder.desktop"), desktopEntry)

  // 5. Create icon (placeholder - replace with actual icon)
  // For now, create a simple SVG and convert
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="32" fill="#1a1a2e"/>
  <text x="128" y="170" font-family="monospace" font-size="120" fill="#00d4aa" text-anchor="middle">🐜</text>
</svg>`
  await Bun.write(path.join(rootDir, "dist/appimage/icon.svg"), svgIcon)

  // Try to convert SVG to PNG (requires imagemagick or rsvg-convert)
  try {
    await $`rsvg-convert -w 256 -h 256 ${rootDir}/dist/appimage/icon.svg -o ${usrShareIcons}/antcoder.png`
  } catch {
    console.log("⚠️  rsvg-convert not found, skipping icon conversion")
    // Copy SVG as fallback
    await $`cp ${rootDir}/dist/appimage/icon.svg ${usrShareIcons}/antcoder.svg`
  }

  // 6. Create AppRun entry point
  const appRun = `#!/bin/bash
# AppRun - Entry point for AppImage
HERE="$(dirname "$(readlink -f "${0}")")"
export PATH="${HERE}/usr/bin:${PATH}"
export LD_LIBRARY_PATH="${HERE}/usr/lib:${LD_LIBRARY_PATH}"

# Ensure llama.cpp models directory exists
mkdir -p "${HOME}/.config/antcoder/models"

exec "${HERE}/usr/bin/antcoder" "$@"
`
  await Bun.write(path.join(appDir, "AppRun"), appRun)
  await $`chmod +x ${appDir}/AppRun`

  // 7. Download linuxdeploy and appimagetool
  const toolsDir = path.join(rootDir, "dist/appimage/tools")
  await $`mkdir -p ${toolsDir}`

  const linuxdeployUrl = "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage"
  const appimagetoolUrl = "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"

  const linuxdeployPath = path.join(toolsDir, "linuxdeploy-x86_64.AppImage")
  const appimagetoolPath = path.join(toolsDir, "appimagetool-x86_64.AppImage")

  if (!fs.existsSync(linuxdeployPath)) {
    console.log("📥 Downloading linuxdeploy...")
    await $`curl -L ${linuxdeployUrl} -o ${linuxdeployPath}`
    await $`chmod +x ${linuxdeployPath}`
  }

  if (!fs.existsSync(appimagetoolPath)) {
    console.log("📥 Downloading appimagetool...")
    await $`curl -L ${appimagetoolUrl} -o ${appimagetoolPath}`
    await $`chmod +x ${appimagetoolPath}`
  }

  // 8. Build AppImage using linuxdeploy
  console.log("🔨 Building AppImage with linuxdeploy...")
  await $`${linuxdeployPath} --appdir ${appDir} --output appimage --appimagetool ${appimagetoolPath}`

  // 9. Find and rename output
  const outputDir = path.join(rootDir, "dist/appimage")
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith(".AppImage"))
  if (files.length > 0) {
    const oldPath = path.join(outputDir, files[0])
    const newPath = path.join(outputDir, `AntCoder-${process.env.VERSION || "dev"}-linux-x86_64.AppImage`)
    fs.renameSync(oldPath, newPath)
    console.log(`✅ AppImage created: ${newPath}`)
  } else {
    throw new Error("AppImage not found after build")
  }
}

main().catch(err => {
  console.error("❌ Build failed:", err)
  process.exit(1)
})