const textAreas = document.querySelectorAll('textarea');

textAreas.forEach(textArea => {
    textArea.addEventListener('input', debounce(async (event) => {
        const text = event.target.value;
        
        if (!text.trim()) {
            clearHighlights(event.target);
            return;
        }

        const namedEntities = await fetchNamedEntities(text);
        
        applyHighlights(event.target, namedEntities);

    }, 500));
});

async function fetchNamedEntities(text) {
    const backendUrl = "http://127.0.0.1:8000/process-text";
    
    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.entities; 

    } catch (error) {
        console.error("NERバックエンドとの通信エラー:", error);
        return [];
    }
}

function applyHighlights(element, entities) {
    clearHighlights(element); 

    if (entities.length === 0) return;
    const ranges = entities.map(entity => {
        const range = new Range();
        range.setStart(element.firstChild, entity.start);
        range.setEnd(element.firstChild, entity.end);
        return range;
    });

    try {
        const highlight = new Highlight(...ranges);
        CSS.highlights.set('ner-highlight', highlight);
    } catch (e) {
        console.error("Highlight APIの適用エラー:", e);
    }
}

function clearHighlights(element) {
    if (CSS.highlights) {
        CSS.highlights.clear();
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