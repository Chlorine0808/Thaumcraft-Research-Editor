// Utilities used across csv.js, ui.js, generator.js
// Provides small DOM helpers, string/array utilities, and template wrapper.
(function () {
    const Utils = {
        // Get element by id (shorthand)
        qs(id) { return document.getElementById(id); },

        // Clear element's innerHTML safely
        clear(el) { if (el) el.innerHTML = ''; },

        // Escape double-quotes for inclusion in generated code strings
        escapeStr(s) { return (s || '').replace(/"/g, '\\"'); },

        // Compare two arrays regardless of order; returns true if they contain same items
        arrEqual(a, b) {
            if (!Array.isArray(a) || !Array.isArray(b)) return false;
            if (a.length !== b.length) return false;
            const as = [...a].slice().sort().join(',');
            const bs = [...b].slice().sort().join(',');
            return as === bs;
        },

        // Normalize free-form aspect input from form. Accepts '6 cognitio' or 'cognitio 6'
        // Returns array like ['cognitio 6']
        parseAspectForm(str) {
            return (str || '').split(',').map(s => {
                const t = s.trim(); if (!t) return '';
                let m = t.match(/^([0-9]+)\s+([A-Za-z0-9_]+)$/);
                if (m) return (m[2].toLowerCase() + ' ' + m[1]);
                m = t.match(/^([A-Za-z0-9_]+)\s+([0-9]+)$/);
                if (m) return (m[1].toLowerCase() + ' ' + m[2]);
                return '';
            }).filter(Boolean);
        },

        // Convert Tag field like '6xCognitio;3xLux' to ['cognitio 6', 'lux 3']
        normalizeTagToAspectArr(tag) {
            return (tag || '').split(';').map(s => {
                const m = s.trim().match(/^([0-9]+)x([A-Za-z0-9_]+)$/);
                return m ? (m[2].toLowerCase() + ' ' + m[1]) : '';
            }).filter(Boolean);
        },

        // Wrapper around global fillTemplate function (templates.js).
        // Keeps callers safe if fillTemplate is not available.
        fillTemplate(tpl, data) {
            return window.fillTemplate ? window.fillTemplate(tpl, data) : '';
        }
    };

    window.Utils = Utils;
})();