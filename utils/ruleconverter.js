#!/usr/bin/env node
/**
 * 规则集格式转换工具
 *
 * 转换规则：
 * list ↔ yaml 格式互转
 * - 保留所有规则类型：DOMAIN, DOMAIN-SUFFIX, DOMAIN-KEYWORD, IP-CIDR 等
 * - 保留注释和空行，统一注释缩进
 * - list 格式：直接列出规则，每行一条
 * - yaml 格式：以 payload: 开头，规则前加 "- " 前缀
 */

const fs = require('fs')
const path = require('path')

const [, , srcDir, destDir] = process.argv

if (!srcDir || !destDir) {
  console.error('用法: node ruleconverter.js <源目录> <目标目录>')
  process.exit(1)
}

const srcExt = path.extname(fs.readdirSync(srcDir).find(f => f.includes('.')) || '')
const isListToYaml = srcExt === '.list'

fs.mkdirSync(destDir, { recursive: true })

fs.readdirSync(srcDir).forEach(file => {
  const srcPath = path.join(srcDir, file)
  if (!fs.statSync(srcPath).isFile()) return

  const baseName = path.basename(file, path.extname(file))
  const destExt = isListToYaml ? '.yaml' : '.list'
  const destPath = path.join(destDir, baseName + destExt)

  const content = fs.readFileSync(srcPath, 'utf8')
  const lines = content.split('\n')

  let result
  if (isListToYaml) {
    // list → yaml 转换
    const rules = lines.map(line => {
      const trimmed = line.trim()

      // 空行保持原样
      if (!trimmed) return line

      // 注释行统一缩进到与规则相同的位置
      if (trimmed.startsWith('#')) {
        return `  # ${trimmed.substring(1).trim()}`
      }

      // 规则行添加 yaml 前缀
      return `  - ${trimmed}`
    })
    result = 'payload:\n' + rules.join('\n')
  } else {
    // yaml → list 转换
    result = lines
      .filter(line => line.trim() !== 'payload:')
      .map(line => {
        const trimmed = line.trim()

        // 空行保持原样
        if (!trimmed) return ''

        // 注释行去除缩进，保持统一格式
        if (trimmed.startsWith('#')) {
          return `# ${trimmed.substring(1).trim()}`
        }

        // 规则行去除 yaml 前缀
        return line.replace(/^\s*-\s*/, '')
      })
      .join('\n')
  }

  fs.writeFileSync(destPath, result)
  console.log(`✅ ${file} → ${baseName}${destExt}`)
})

console.log(`\n🎉 转换完成！`)
