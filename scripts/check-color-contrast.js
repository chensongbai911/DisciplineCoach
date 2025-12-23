/**
 * 颜色对比度检查脚本
 * 用于验证项目中的颜色组合是否符合 WCAG 标准
 *
 * 使用方法：
 * node scripts/check-color-contrast.js
 */

const { ColorContrastChecker } = require('../miniprogram/utils/accessibility');

// 定义项目中的颜色配置
const colors = {
  // 主色系
  primary: '#07C160',
  primaryLight: '#B7F4D6',
  primaryDark: '#029E6D',

  // 文本色
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
  textWhite: '#FFFFFF',

  // 背景色
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F7F8FA',
  bgTertiary: '#EFEFEF',
  bgLight: '#FAFBFC',

  // 功能色
  success: '#07C160',
  warning: '#FF9500',
  error: '#FA5151',
  info: '#10AEFF',

  // 维度色
  sport: '#FF6B6B',
  diet: '#38B2AC',
  sleep: '#9F7AEA',
  reading: '#F6AD55',
  study: '#4299E1',

  // 深色模式
  darkBg: '#1A1A1A',
  darkBgSecondary: '#2A2A2A',
  darkText: '#F5F5F5',
  darkTextSecondary: '#B0B0B0'
};

// 定义常见的颜色组合
const colorCombinations = [
  // 亮色模式
  { name: '主要文本/白色背景', fg: 'textPrimary', bg: 'bgPrimary', size: 14 },
  { name: '次要文本/白色背景', fg: 'textSecondary', bg: 'bgPrimary', size: 14 },
  { name: '说明文本/白色背景', fg: 'textTertiary', bg: 'bgPrimary', size: 14 },
  { name: '禁用文本/白色背景', fg: 'textDisabled', bg: 'bgPrimary', size: 14 },

  { name: '主要文本/灰色背景', fg: 'textPrimary', bg: 'bgSecondary', size: 14 },
  { name: '次要文本/灰色背景', fg: 'textSecondary', bg: 'bgSecondary', size: 14 },

  { name: '白色文本/主色背景', fg: 'textWhite', bg: 'primary', size: 14 },
  { name: '白色文本/成功色背景', fg: 'textWhite', bg: 'success', size: 14 },
  { name: '白色文本/警告色背景', fg: 'textWhite', bg: 'warning', size: 14 },
  { name: '白色文本/错误色背景', fg: 'textWhite', bg: 'error', size: 14 },
  { name: '白色文本/信息色背景', fg: 'textWhite', bg: 'info', size: 14 },

  // 维度色
  { name: '白色文本/运动色背景', fg: 'textWhite', bg: 'sport', size: 14 },
  { name: '白色文本/饮食色背景', fg: 'textWhite', bg: 'diet', size: 14 },
  { name: '白色文本/睡眠色背景', fg: 'textWhite', bg: 'sleep', size: 14 },
  { name: '白色文本/阅读色背景', fg: 'textWhite', bg: 'reading', size: 14 },
  { name: '白色文本/学习色背景', fg: 'textWhite', bg: 'study', size: 14 },

  // 深色模式
  { name: '浅色文本/深色背景', fg: 'darkText', bg: 'darkBg', size: 14 },
  { name: '次要文本/深色背景', fg: 'darkTextSecondary', bg: 'darkBg', size: 14 },
  { name: '浅色文本/深色卡片', fg: 'darkText', bg: 'darkBgSecondary', size: 14 }
];

// 检查函数
function checkContrast () {
  console.log('\n==========================================');
  console.log('🎨 颜色对比度检查报告');
  console.log('==========================================\n');

  let passCount = 0;
  let failCount = 0;
  let warnings = [];

  colorCombinations.forEach((combo) => {
    const fgColor = colors[combo.fg];
    const bgColor = colors[combo.bg];
    const ratio = ColorContrastChecker.getContrastRatio(fgColor, bgColor);
    const meetsAA = ColorContrastChecker.meetsWCAG_AA(fgColor, bgColor, combo.size);
    const meetsAAA = ColorContrastChecker.meetsWCAG_AAA(fgColor, bgColor, combo.size);

    const status = meetsAA ? '✅ PASS' : '❌ FAIL';
    const level = meetsAAA ? 'AAA' : meetsAA ? 'AA' : '不符合';

    console.log(`${status} ${combo.name}`);
    console.log(`   前景: ${fgColor} | 背景: ${bgColor}`);
    console.log(`   对比度: ${ratio.toFixed(2)}:1 | 等级: ${level}`);
    console.log('');

    if (meetsAA) {
      passCount++;
    } else {
      failCount++;
      warnings.push({
        name: combo.name,
        ratio: ratio.toFixed(2),
        fg: fgColor,
        bg: bgColor
      });
    }
  });

  // 总结
  console.log('==========================================');
  console.log('📊 检查总结');
  console.log('==========================================\n');
  console.log(`总检查项: ${colorCombinations.length}`);
  console.log(`✅ 通过: ${passCount} (${(passCount / colorCombinations.length * 100).toFixed(1)}%)`);
  console.log(`❌ 失败: ${failCount} (${(failCount / colorCombinations.length * 100).toFixed(1)}%)`);
  console.log('');

  // 建议
  if (warnings.length > 0) {
    console.log('==========================================');
    console.log('⚠️  需要改进的颜色组合');
    console.log('==========================================\n');

    warnings.forEach((w, i) => {
      console.log(`${i + 1}. ${w.name}`);
      console.log(`   对比度: ${w.ratio}:1 (需要 ≥ 4.5:1)`);
      console.log(`   建议: 增加前景色深度或背景色浅度`);
      console.log('');
    });
  } else {
    console.log('🎉 所有颜色组合都符合 WCAG AA 标准！');
  }

  console.log('==========================================');
  console.log('📖 WCAG 标准说明');
  console.log('==========================================\n');
  console.log('WCAG AA: 普通文本 4.5:1, 大文本 3:1');
  console.log('WCAG AAA: 普通文本 7:1, 大文本 4.5:1');
  console.log('大文本: 18px 及以上，或 14px 加粗\n');
}

// 执行检查
try {
  checkContrast();
} catch (error) {
  console.error('检查失败:', error);
  process.exit(1);
}
