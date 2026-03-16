import DOMPurify from 'dompurify';

interface SafeHtmlContentProps {
  html: string;
  class?: string;
}

const ALLOWED_TAGS = ['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 'span'];

const SafeHtmlContent = (props: SafeHtmlContentProps) => {
  if (!props.html) return null;
  const sanitized = DOMPurify.sanitize(props.html, { ALLOWED_TAGS });

  return (
    <div
      class={`safe-html-content prose prose-sm max-w-none text-slate-700 dark:text-slate-200 prose-p:my-1.5 prose-p:first:mt-0 prose-p:last:mb-0 prose-div:my-1.5 prose-div:first:mt-0 prose-div:last:mb-0 prose-strong:font-semibold ${
        props.class ?? ''
      }`}
      // eslint-disable-next-line solid/no-innerhtml
      innerHTML={sanitized}
    />
  );
};

export default SafeHtmlContent;

