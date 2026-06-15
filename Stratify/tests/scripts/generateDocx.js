const fs = require('fs');
const marked = require('marked');
const htmlDocx = require('html-docx-js');

// Read the Markdown file
const md = fs.readFileSync('TEST_REPORT.md', 'utf-8');

// Convert Markdown to HTML
const htmlContent = marked.parse(md);

// Wrap in a basic HTML structure to ensure proper styling in Word
const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
    h1 { color: #2C3E50; font-size: 24pt; border-bottom: 2px solid #34495E; padding-bottom: 5px; }
    h2 { color: #34495E; font-size: 18pt; margin-top: 20px; }
    h3 { color: #7F8C8D; font-size: 14pt; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #BDC3C7; padding: 8px; text-align: left; }
    th { background-color: #ECF0F1; color: #2C3E50; font-weight: bold; }
    code { font-family: Consolas, monospace; background-color: #F8F9F9; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #F8F9F9; padding: 10px; border-radius: 5px; border: 1px solid #E5E8E8; }
    blockquote { border-left: 4px solid #BDC3C7; padding-left: 10px; color: #7F8C8D; font-style: italic; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
`;

// Convert HTML to DOCX
const docxBlob = htmlDocx.asBlob(fullHtml);

// Save to file
(async () => {
  try {
    let buffer;
    if (docxBlob.arrayBuffer) {
      const arrayBuffer = await docxBlob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = Buffer.from(docxBlob);
    }
    fs.writeFileSync('TEST_REPORT.docx', buffer);
    console.log('✅ Professional Word report generated: TEST_REPORT.docx');
  } catch (err) {
    console.error('Failed to save DOCX', err);
  }
})();
