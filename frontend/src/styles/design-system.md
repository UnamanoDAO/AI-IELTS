# LeanEnglish 设计系统规范

## 🎨 品牌色彩

### 主色调（渐变色系统）
```css
/* 三色渐变 - 糖果马卡龙风格 */
--color-lavender: #C8B5E8;    /* 薰衣草紫 - 起点 */
--color-sky: #8AC9D8;         /* 天空蓝 - 中间 */
--color-mint: #7FE8D8;        /* 薄荷青 - 终点 */

/* 主渐变 - 从左到右 */
--gradient-primary: linear-gradient(135deg, #C8B5E8 0%, #8AC9D8 50%, #7FE8D8 100%);

/* 主渐变 - 从上到下 */
--gradient-vertical: linear-gradient(180deg, #C8B5E8 0%, #8AC9D8 50%, #7FE8D8 100%);

/* 主渐变 - 径向 */
--gradient-radial: radial-gradient(circle, #C8B5E8 0%, #8AC9D8 50%, #7FE8D8 100%);
```

### 单色版本（需要纯色时使用）
```css
--color-primary: #8AC9D8;     /* 主色 - 天空蓝（中间色） */
--color-accent-1: #C8B5E8;    /* 强调色 1 - 薰衣草紫 */
--color-accent-2: #7FE8D8;    /* 强调色 2 - 薄荷青 */
```

### 渐变变体
```css
/* 轻微渐变 - 用于背景 */
--gradient-subtle: linear-gradient(135deg, rgba(200, 181, 232, 0.08) 0%, rgba(138, 201, 216, 0.08) 50%, rgba(127, 232, 216, 0.08) 100%);

/* 深色渐变 - 用于按钮 */
--gradient-button: linear-gradient(135deg, #C8B5E8 0%, #8AC9D8 60%, #7FE8D8 100%);

/* 反向渐变 */
--gradient-reverse: linear-gradient(135deg, #7FE8D8 0%, #8AC9D8 50%, #C8B5E8 100%);
```

## 🖌️ 文字颜色

```css
--text-primary: #2C3E50;      /* 主要文字 - 深灰蓝 */
--text-secondary: #5A6C7D;    /* 次要文字 - 中灰 */
--text-tertiary: #95A5B8;     /* 辅助文字 - 浅灰 */
--text-on-gradient: #FFFFFF;  /* 渐变背景上的文字 - 白色 */
```

## 🎯 功能色彩

```css
--color-success: #6BCF7F;     /* 成功 - 柔和绿 */
--color-warning: #FFB547;     /* 警告 - 柔和橙 */
--color-error: #FF6B9D;       /* 错误 - 柔和粉红 */
--color-info: #8AC9D8;        /* 信息 - 天空蓝（主色） */
```

## 📐 间距系统

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

## 🔤 字体系统

```css
/* 字体族 */
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

/* 字体大小 */
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-2xl: 32px;

/* 字重 */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## 🎭 阴影系统

```css
/* 轻微阴影 - 卡片 */
--shadow-sm: 0 2px 8px rgba(138, 201, 216, 0.12);

/* 中等阴影 - 悬浮 */
--shadow-md: 0 4px 16px rgba(138, 201, 216, 0.16);

/* 深阴影 - 模态框 */
--shadow-lg: 0 8px 32px rgba(138, 201, 216, 0.24);

/* 内阴影 - 输入框 */
--shadow-inset: inset 0 2px 4px rgba(138, 201, 216, 0.08);
```

## 📏 圆角系统

```css
--radius-sm: 8px;    /* 小圆角 - 按钮 */
--radius-md: 12px;   /* 中圆角 - 卡片 */
--radius-lg: 16px;   /* 大圆角 - 容器 */
--radius-full: 9999px; /* 完全圆角 - 标签、头像 */
```

## 🎨 组件应用指南

### 按钮

```css
/* 主要按钮 */
.btn-primary {
  background: var(--gradient-button);
  color: var(--text-on-gradient);
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-sm);
}

.btn-primary:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* 次要按钮 */
.btn-secondary {
  background: white;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-sm);
}
```

### 卡片

```css
.card {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
```

### 输入框

```css
.input {
  border: 2px solid #E5E7EB;
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(138, 201, 216, 0.1);
  outline: none;
}
```

### 渐变文字

```css
.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## 🌈 使用原则

1. **渐变为主**：优先使用渐变色，营造柔和梦幻的氛围
2. **对比度**：确保文字在渐变背景上有足够的对比度
3. **一致性**：统一使用设计系统中定义的颜色和间距
4. **动画流畅**：所有过渡动画使用 ease 或 ease-in-out
5. **留白充足**：保持足够的空白空间，避免拥挤感

## 📱 响应式断点

```css
--breakpoint-mobile: 768px;
--breakpoint-tablet: 1024px;
--breakpoint-desktop: 1280px;
```

## 🎪 品牌特色

- **糖果马卡龙风格**：柔和的渐变色彩
- **细腻质感**：如陶瓷般光滑的表面
- **轻盈感**：浅色调营造轻松愉悦的学习氛围
- **梦幻感**：薰衣草紫到薄荷青的渐变如梦境般美丽
