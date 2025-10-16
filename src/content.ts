import type { NERResponse } from "./types";

const isEditable = (element: HTMLElement) => {
  return element.nodeName === "TEXTAREA" || element.isContentEditable;
};

document.body.addEventListener("input", async (event) => {
  const targetElement = event.target as HTMLInputElement;

  if (!isEditable(targetElement)) {
    CSS.highlights.clear();
    return;
  }

  const text = targetElement.value || targetElement.textContent;

  if (!text.trim()) {
    CSS.highlights.clear();
    return;
  }

  try {
    const namedEntities = await fetchNamedEntities(text);
    applyHighlight(targetElement, namedEntities);
  } catch (error) {
    CSS.highlights.clear();
  }
});

async function fetchNamedEntities(text: string) {
  const backendUrl = "http://127.0.0.1:8000/ner_text";
  const response = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text }),
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data || [];
}

function applyHighlight(element: HTMLElement, entities: NERResponse) {
  CSS.highlights.clear();

  if (!CSS.highlights || !entities || entities.length === 0) {
    return;
  }

  const ranges: Range[] = [];
  const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

  for (const entity of entities) {
    const entityStart = entity.start;
    const entityEnd = entity.end;
    let startNode, startOffset, endNode, endOffset;

    treeWalker.currentNode = element;
    let charCount = 0;
    let currentNode;

    while ((currentNode = treeWalker.nextNode() as Text)) {
      const nodeEnd = charCount + currentNode.length;
      if (!startNode && entityStart < nodeEnd) {
        startNode = currentNode;
        startOffset = entityStart - charCount;
      }
      if (!endNode && entityEnd <= nodeEnd) {
        endNode = currentNode;
        endOffset = entityEnd - charCount;
        break;
      }
      charCount = nodeEnd;
    }

    if (startNode && endNode) {
      const range = new Range();
      range.setStart(startNode, startOffset || 0);
      range.setEnd(endNode, endOffset || 0);
      ranges.push(range);
    }
  }

  if (ranges.length > 0) {
    setTimeout(() => {
      const nerHighlight = new Highlight(...ranges);
      CSS.highlights.set("ner-highlight", nerHighlight);
    }, 0);
  }
}
