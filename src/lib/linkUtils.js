/**
 * 检测文本中的 URL 并转换为可点击的链接
 * 支持 http、https、www 开头的链接
 */

// URL 正则表达式
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

/**
 * 将文本中的 URL 转换为 React 元素数组
 * @param {string} text - 要处理的文本
 * @returns {Array} React 元素数组
 */
export const renderTextWithLinks = (text) => {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;

  // 重置正则表达式的 lastIndex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    const index = match.index;

    // 添加链接前的文本
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // 添加链接
    const href = url.startsWith('www.') ? `https://${url}` : url;
    parts.push({
      type: 'link',
      href,
      text: url,
    });

    lastIndex = index + url.length;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

/**
 * 检查文本是否包含链接
 * @param {string} text - 要检查的文本
 * @returns {boolean}
 */
export const hasLinks = (text) => {
  if (!text) return false;
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
};
