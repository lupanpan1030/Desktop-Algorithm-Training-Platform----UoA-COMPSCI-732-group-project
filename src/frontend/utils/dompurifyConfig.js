import DOMPurify from 'dompurify';

// only allow common Markdown-generated tags
DOMPurify.setConfig({
  ALLOWED_TAGS: [
    'p','h1','h2','h3','h4','h5','h6',
    'a','ul','ol','li',
    'strong','em','blockquote',
    'code','pre','img'
  ],
  ALLOWED_ATTR: [
    'href','src','alt','title'
  ]
});

// ensure all <a> open safely in a new tab
DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export default DOMPurify;
