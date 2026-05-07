// Bridge between Template.body (plain text in storage) and RichEmailEditor
// (HTML via contentEditable). Storage stays plain so existing consumers —
// template-card first-line preview, templates-tab search index, word count —
// keep working. Inline formatting (bold/color/list) only persists for the
// current edit session; it's stripped on save.

export function textToEditorHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export function editorHtmlToText(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  const walk = (node: Node, isFirstBlock: boolean): string => {
    let out = "";
    let firstChild = isFirstBlock;
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent ?? "";
      } else if (child.nodeName === "BR") {
        out += "\n";
      } else if (child.nodeName === "DIV" || child.nodeName === "P") {
        if (!firstChild) out += "\n";
        out += walk(child, true);
        firstChild = false;
      } else {
        out += walk(child, firstChild);
      }
    });
    return out;
  };

  return walk(root, true);
}
