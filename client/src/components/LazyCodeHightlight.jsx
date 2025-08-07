// client/src/components/LazyCodeHighlight.jsx - 新建文件
import { lazy, Suspense } from 'react';

const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(module => ({
    default: module.Light
  }))
);

export default function LazyCodeHighlight({ children, language, ...props }) {
  return (
    <Suspense fallback={<pre className="bg-gray-100 p-3 rounded">{children}</pre>}>
      <SyntaxHighlighter language={language} {...props}>
        {children}
      </SyntaxHighlighter>
    </Suspense>
  );
}