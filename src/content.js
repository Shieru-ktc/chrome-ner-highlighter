const isEditable = (element) => {
    return element.nodeName === 'TEXTAREA' || element.isContentEditable;
};

document.body.addEventListener('keyup', debounce(async (event) => {
    const targetElement = event.target;

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
}, 500));

async function fetchNamedEntities(text) {
    const backendUrl = "http://127.0.0.1:8000/ner_text"; 
    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        return [];
    }
}

function applyHighlight(element, entities) {
    CSS.highlights.clear();

    if (!CSS.highlights || !entities || entities.length === 0) {
        return;
    }

    const ranges = [];
    const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

    for (const entity of entities) {
        const entityStart = entity.start;
        const entityEnd = entity.end;
        let startNode, startOffset, endNode, endOffset;

        treeWalker.currentNode = element;
        let charCount = 0;
        let currentNode;
        
        while (currentNode = treeWalker.nextNode()) {
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
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            ranges.push(range);
        }
    }

    if (ranges.length > 0) {
        setTimeout(() => {
            const nerHighlight = new Highlight(...ranges);
            CSS.highlights.set('ner-highlight', nerHighlight);
        }, 0);
    }
}

function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
}