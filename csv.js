(function () {
    // Loads tc4research CSV using PapaParse, normalizes fields and updates ResearchStore
    const PAPA_URL = "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js";
    if (!window.Papa) {
        const script = document.createElement('script');
        script.src = PAPA_URL;
        script.onload = function () {
            if (window._autoLoadCsv) window._autoLoadCsv();
        };
        document.head.appendChild(script);
    }

    const qs = window.Utils ? window.Utils.qs : (id => document.getElementById(id));
    const normalizeTagToAspectArr = window.Utils ? window.Utils.normalizeTagToAspectArr : (tag => (tag || '').split(';').map(s => { const m = s.trim().match(/^([0-9]+)x([A-Za-z0-9_]+)$/); return m ? (m[2].toLowerCase() + ' ' + m[1]) : '' }).filter(Boolean));

    // Keep prereq lists sorted and semicolon-separated in a canonical form
    function sortPrereqStr(str) {
        return (str || '')
            .split(';')
            .map(s => s.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
            .join(';');
    }

    // Convert raw CSV row into normalized object used by UI and generator
    function normalizeRow(row) {
        const parentsArr = (row.Parents || '').split(';').map(s => s.trim()).filter(Boolean);
        const parentsHiddenArr = (row.ParentsHidden || '').split(';').map(s => s.trim()).filter(Boolean);
        const siblingsArr = (row.Siblings || '').split(';').map(s => s.trim()).filter(Boolean);
        row._parentsArr = parentsArr;
        row._parentsHiddenArr = parentsHiddenArr;
        row._siblingsArr = siblingsArr;
        row._formParents = parentsArr.join(', ');
        row._formParentsHidden = parentsHiddenArr.join(', ');
        row._formSiblings = siblingsArr.join(', ');

        const aspectArr = normalizeTagToAspectArr(row.Tag || '');
        row._aspectArr = aspectArr;
        row._formAspects = aspectArr.join(', ');

        row._formX = (row.x !== undefined && row.x !== null) ? String(row.x) : '';
        row._formY = (row.y !== undefined && row.y !== null) ? String(row.y) : '';
        row._formComplexity = (row.complexity !== undefined && row.complexity !== null) ? String(row.complexity) : '';

        return row;
    }

    // Parse and load the selected CSV file, update store and UI
    function handleCsvLoad() {
        const fileInputEl = qs('csvFileInput');
        const statusEl = qs('csvStatus');
        if (!fileInputEl) return;

        if (!fileInputEl.files || !fileInputEl.files.length) {
            if (statusEl) statusEl.textContent = 'tc4research.csvを選択してください';
            return;
        }

        const file = fileInputEl.files[0];

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: results => {
                const { data: rows, meta } = results;
                const fields = meta && meta.fields ? meta.fields : [];
                if (!fields.includes('Category') && !fields.includes('Tab')) {
                    if (statusEl) statusEl.textContent = 'tc4research.csvを選択してください';
                    ResearchStore.resetAll();
                    return;
                }

                const data = rows
                    .filter(r => r.Key)
                    .map(r => {
                        if (r.Parents) r.Parents = sortPrereqStr(r.Parents);
                        if (r.ParentsHidden) r.ParentsHidden = sortPrereqStr(r.ParentsHidden);
                        if (r.Siblings) r.Siblings = sortPrereqStr(r.Siblings);
                        return normalizeRow(r);
                    });

                const tabs = Array.from(new Set(data.map(r => r.Category || r.Tab))).filter(Boolean);
                ResearchStore.setCSVData(data);
                ResearchStore.setTabs(tabs);
                ResearchStore.setCurrentTab('');
                if (statusEl) statusEl.textContent = `研究データ ${data.length}件 読込完了`;
                ResearchStore.setSelectedResearchIndex(null);
                ResearchStore.setFormState({});
                ResearchStore.notify('csv:loaded');
            },
            error: err => {
                if (statusEl) statusEl.textContent = 'CSV読込失敗: ' + err;
                ResearchStore.resetAll();
            }
        });
    }

    const loadBtn = qs('loadCsvBtn');
    const fileInputEl = qs('csvFileInput');
    if (loadBtn) loadBtn.addEventListener('click', handleCsvLoad);
    if (fileInputEl) fileInputEl.addEventListener('change', handleCsvLoad);

    window._autoLoadCsv = function () { if (window.Papa) handleCsvLoad(); };
})();
