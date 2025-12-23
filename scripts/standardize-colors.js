#!/usr/bin/env node

/**
 * 颜色标准化批量修改脚本
 * 用于自动化替换项目中所有非标准颜色值
 */

const fs = require('fs');
const path = require('path');

// 颜色映射表
const colorMap = {
  // 文本色标准化
  '#2D3748': '#333333',  // 一级文本
  '#718096': '#666666',  // 二级文本
  '#4A5568': '#666666',  // 二级文本（灰色）
  '#A0AEC0': '#999999',  // 三级文本

  // 背景色标准化
  '#F7FAFC': '#F7F8FA',  // 浅灰背景
  '#FAFBFC': '#F7F8FA',  // 浅灰背景
  '#EDF2F7': '#F7F8FA',  // 浅灰背景

  // 边框色标准化
  '#CBD5E0': '#E8E8E8',  // 浅边框
  '#E2E8F0': '#E8E8E8',  // 浅边框
  '#DDDDDD': '#E8E8E8',  // 浅边框

  // 维度色统一
  '#FF8E53': '#FF5252',  // 运动深色
  '#319795': '#1E9B96',  // 饮食深色
  '#805AD5': '#7B5FD1',  // 睡眠深色
  '#ED8936': '#E89239',  // 阅读深色
  '#3182CE': '#2E7EC9',  // 学习深色
};

// 需要扫描的文件扩展名
const extensions = ['.wxss', '.js', '.wxml'];

// 需要扫描的目录
const dirsToScan = [
  'miniprogram/pages',
  'miniprogram/components',
  'miniprogram/styles'
];

/**
 * 获取所有需要处理的文件
 */
function getAllFiles (dir, ext = []) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (extensions.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });

  return files;
}

/**
 * 替换文件中的颜色
 */
function replaceColorsInFile (filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let replacedCount = 0;

    // 替换每个颜色
    for (const [oldColor, newColor] of Object.entries(colorMap)) {
      const regex = new RegExp(oldColor, 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, newColor);
        replacedCount++;
      }
    }

    // 只有修改了才写入
    if (replacedCount > 0 && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return replacedCount;
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }

  return 0;
}

/**
 * 主函数
 */
function main () {
  console.log('🎨 开始颜色标准化...\n');

  const baseDir = process.cwd();
  let totalReplaced = 0;
  let filesProcessed = 0;

  dirsToScan.forEach(dir => {
    const fullDir = path.join(baseDir, dir);
    console.log(`📂 扫描目录: ${dir}`);

    const files = getAllFiles(fullDir);
    console.log(`   找到 ${files.length} 个文件\n`);

    files.forEach(file => {
      const replaced = replaceColorsInFile(file);
      if (replaced > 0) {
        console.log(`✅ ${path.relative(baseDir, file)} - 替换 ${replaced} 个颜色`);
        totalReplaced += replaced;
        filesProcessed++;
      }
    });
  });

  console.log(`\n📊 统计信息:`);
  console.log(`   处理文件数: ${filesProcessed} 个`);
  console.log(`   替换颜色数: ${totalReplaced} 个`);
  console.log(`\n✨ 颜色标准化完成！`);
}

// 检查环境
if (!fs.existsSync(path.join(process.cwd(), 'miniprogram'))) {
  console.error('❌ 错误: 无法找到 miniprogram 目录');
  console.error('   请在项目根目录运行此脚本');
  process.exit(1);
}

main();
