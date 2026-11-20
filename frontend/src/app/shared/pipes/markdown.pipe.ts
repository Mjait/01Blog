import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    // 1. Escape basic HTML entities to prevent XSS
    let html = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Code blocks (```lang\ncode\n```)
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);

    // 3. Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 4. Headers (### H3, ## H2, # H1)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 5. Blockquotes (> quote)
    html = html.replace(/^\&gt;\s?(.*$)/gim, '<blockquote>$1</blockquote>');

    // 6. Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 7. Italic (*text*)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 8. Markdown links [text](url) - safe protocols only
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 9. Bullet lists (- item)
    html = html.replace(/^\-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    // 10. Line breaks (except inside pre/lists)
    html = html.replace(/\n/g, '<br/>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
