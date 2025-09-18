(function () {
    const store = window.ResearchStore;
    const qs = window.Utils ? window.Utils.qs : (id => document.getElementById(id));
    const escapeStr = window.Utils ? window.Utils.escapeStr : (s => (s || '').replace(/"/g, '\\"'));
    const parseAspectForm = window.Utils ? window.Utils.parseAspectForm : (s => (s || '').split(',').map(t => t.trim()).filter(Boolean));
    const arrEqual = window.Utils ? window.Utils.arrEqual : ((a, b) => { if (!Array.isArray(a) || !Array.isArray(b)) return false; if (a.length !== b.length) return false; const as = [...a].slice().sort().join(','); const bs = [...b].slice().sort().join(','); return as === bs; });
    const fillTemplate = window.Utils ? window.Utils.fillTemplate : ((tpl, data) => window.fillTemplate ? window.fillTemplate(tpl, data) : '');

    // generateCode builds the final script output based on form values and original data.
    // It collects multiple "parts" (prereqs, pages, options, etc.) and then concatenates
    // them according to TEMPLATE_ORDER. Localization lines are collected separately and
    // inserted into TEMPLATE.fullFile via the {localization} placeholder.
    function generateCode() {
        const form = qs('researchForm');
        if (!form) return;

        function getFormData() {
            const data = {};
            for (const el of form.elements) {
                if (el.name) data[el.name] = el.value;
            }
            const tabSelEdit = qs('tabSelectEdit');
            const tabInputEdit = qs('tabInputEdit');
            data.tab = (tabSelEdit && tabSelEdit.value === '__custom__') ? (tabInputEdit ? tabInputEdit.value : '') : (tabSelEdit ? tabSelEdit.value : '');
            return data;
        }

        const d = getFormData();
        const selectedIdx = store.getSelectedResearchIndex();
        const isNew = selectedIdx === null;
        const original = store.getOriginalResearchData() || {};

        // Guard: editing an original that isn't loaded
        if (!isNew && Object.keys(original).length === 0) {
            qs('output-code').textContent = '// No original data loaded.';
            return;
        }

        // Guard: new research must have a key
        if (isNew && !(d.key && d.key.trim())) {
            qs('output-code').textContent = '// No key specified for new research.';
            return;
        }

        const key = d.key;

        // Parts buffer: collect statements per logical section
        const parts = {
            prereqs: [], siblings: [], aspects: [], addResearch: [], warp: [], move: [], complexity: [], options: [], refresh: [], pages: [], localization: []
        };

        // Localization: add name if changed or for new research
        if (isNew) {
            if (d.name && d.name.trim()) parts.localization.push(`game.setLocalization("en_US", "tc.research_name.${escapeStr(key)}", "${escapeStr(d.name)}");`);
        } else if ((d.name || '') !== (original.Name || '')) {
            parts.localization.push(`game.setLocalization("en_US", "tc.research_name.${escapeStr(key)}", "${escapeStr(d.name)}");`);
        }

        // Localization: research text (always emitted if present)
        const researchTextEl = qs('research-text');
        if (researchTextEl && researchTextEl.value && researchTextEl.value.trim()) {
            parts.localization.push(`game.setLocalization("en_US", "tc.research_text.${escapeStr(key)}", "${escapeStr(researchTextEl.value)}");`);
        }

        // Parents/siblings handling: either add (new) or update (existing)
        const parentArr = (d.parent || '').split(',').map(s => s.trim()).filter(Boolean);
        const hiddenArr = (d.hiddenParent || '').split(',').map(s => s.trim()).filter(Boolean);
        const siblingArr = (d.sibling || '').split(',').map(s => s.trim()).filter(Boolean);

        const origParentArr = original._parentsArr || (original.Parents || '').split(';').map(s => s.trim()).filter(Boolean);
        const origHiddenArr = original._parentsHiddenArr || (original.ParentsHidden || '').split(';').map(s => s.trim()).filter(Boolean);
        const origSiblingArr = original._siblingsArr || (original.Siblings || '').split(';').map(s => s.trim()).filter(Boolean);

        if (isNew) {
            parentArr.forEach(p => parts.prereqs.push(`Research.addPrereq("${escapeStr(key)}", "${escapeStr(p)}", false);`));
            hiddenArr.forEach(p => parts.prereqs.push(`Research.addPrereq("${escapeStr(key)}", "${escapeStr(p)}", true);`));
            siblingArr.forEach(s => parts.siblings.push(`Research.addSibling("${escapeStr(key)}", "${escapeStr(s)}");`));
        } else {
            if (!arrEqual(parentArr, origParentArr) || !arrEqual(hiddenArr, origHiddenArr)) {
                parts.prereqs.push(`Research.clearPrereqs("${escapeStr(key)}");`);
                parentArr.forEach(p => parts.prereqs.push(`Research.addPrereq("${escapeStr(key)}", "${escapeStr(p)}", false);`));
                hiddenArr.forEach(p => parts.prereqs.push(`Research.addPrereq("${escapeStr(key)}", "${escapeStr(p)}", true);`));
            }
            if (!arrEqual(siblingArr, origSiblingArr)) {
                parts.siblings.push(`Research.clearSiblings("${escapeStr(key)}");`);
                siblingArr.forEach(s => parts.siblings.push(`Research.addSibling("${escapeStr(key)}", "${escapeStr(s)}");`));
            }
        }

        // Aspects: normalize and emit only if changed for existing researches
        const origAspectArr = original._aspectArr || (original.Tag || '').split(';').map(s => { const m = s.trim().match(/^([0-9]+)x([A-Za-z0-9_]+)$/); return m ? (m[2].toLowerCase() + ' ' + m[1]) : ''; }).filter(Boolean);
        const aspectArr = parseAspectForm(d.aspectTrigger || '');
        if (!isNew && !arrEqual(aspectArr, origAspectArr)) {
            parts.aspects.push(fillTemplate(TEMPLATE.setRequiredAspects, { key, aspects: d.aspectTrigger || '' }));
        }

        // addResearch for new researches
        if (isNew) {
            const aspectsStr = escapeStr(d.aspectTrigger || '');
            const xVal = (d.x !== '') ? Number(d.x) : 0;
            const yVal = (d.y !== '') ? Number(d.y) : 0;
            const complexityVal = (d.complexity !== '') ? Number(d.complexity) : 0;
            const iconVal = escapeStr((qs('research-icon') && qs('research-icon').value) || '');
            parts.addResearch.push(`Research.addResearch("${escapeStr(key)}", "${escapeStr(d.tab)}", "${aspectsStr}", ${xVal}, ${yVal}, ${complexityVal}, <${iconVal}>);`);
        }

        // Warp handling: remove then optionally add
        const warpInput = form.querySelector('[name=warp]');
        if (warpInput && warpInput.value !== '') {
            const warpInt = parseInt(warpInput.value);
            if (!isNaN(warpInt)) {
                parts.warp.push(fillTemplate(TEMPLATE.removeFromResearch, { key }));
                if (warpInt > 0) parts.warp.push(fillTemplate(TEMPLATE.addToResearch, { key, amount: warpInt }));
            }
        }

        // Move/complexity/options/refresh/pages handled below in straightforward manner
        const hasXY = d.x !== '' && d.y !== '';
        if (!isNew && hasXY) parts.move.push(fillTemplate(TEMPLATE.moveResearch, { key, tab: d.tab, x: d.x, y: d.y }));
        if (!isNew && ((d.complexity || '') !== (original.complexity || ''))) parts.complexity.push(fillTemplate(TEMPLATE.setComplexity, { key, complexity: d.complexity }));

        const optionMap = [
            { name: 'round', template: 'setRound' },
            { name: 'spiky', template: 'setSpiky' },
            { name: 'stub', template: 'setStub' },
            { name: 'secondary', template: 'setSecondary' },
            { name: 'virtual', template: 'setVirtual' },
            { name: 'autounlock', template: 'setAutoUnlock' },
            { name: 'concealed', template: 'setConcealed' }
        ];
        optionMap.forEach(opt => {
            const checked = form.querySelector(`[name=option-${opt.name}]:checked`);
            if (!checked) return;
            const val = checked.value;
            if (val !== 'none') parts.options.push(fillTemplate(TEMPLATE[opt.template], { key, value: val }));
        });

        if (qs('refreshRecipe').checked) parts.refresh.push(fillTemplate(TEMPLATE.refreshResearchRecipe, { key }));

        // Pages: iterate through UI entries and build page templates
        const pageEntries = document.querySelectorAll('.page-entry');
        pageEntries.forEach((entry, index) => {
            const pageTypeSel = entry.querySelector('.page-type');
            const pageType = pageTypeSel ? pageTypeSel.value : null;
            if (!pageType) return;
            switch (pageType) {
                case 'text': {
                    const textInput = entry.querySelector('.text-input');
                    const textContent = textInput ? textInput.value : '';
                    if (textContent) {
                        parts.pages.push(fillTemplate(TEMPLATE.textPage, { key, pageIndex: index }));
                        parts.localization.push(`game.setLocalization("en_US", "tc.research_page.${escapeStr(key)}.${index}", "${escapeStr(textContent)}");`);
                    }
                    break;
                }
                case 'crafting': {
                    const outputInput = entry.querySelector('.output-item');
                    const output = outputInput ? outputInput.value : '';
                    if (output) parts.pages.push(fillTemplate(TEMPLATE.craftingPage, { key, output }));
                    break;
                }
                case 'arcane': {
                    const outputInput = entry.querySelector('.output-item');
                    const output = outputInput ? outputInput.value : '';
                    if (output) parts.pages.push(fillTemplate(TEMPLATE.arcanePage, { key, output }));
                    break;
                }
                case 'crucible': {
                    const outputInput = entry.querySelector('.output-item');
                    const output = outputInput ? outputInput.value : '';
                    if (output) parts.pages.push(fillTemplate(TEMPLATE.cruciblePage, { key, output }));
                    break;
                }
                case 'infusion': {
                    const outputInput = entry.querySelector('.output-item');
                    const output = outputInput ? outputInput.value : '';
                    if (output) parts.pages.push(fillTemplate(TEMPLATE.infusionPage, { key, output }));
                    break;
                }
                case 'enchantment': {
                    const enchantmentInput = entry.querySelector('.enchantment-id');
                    const enchantmentId = enchantmentInput ? enchantmentInput.value : '';
                    if (enchantmentId) parts.pages.push(fillTemplate(TEMPLATE.enchantmentPage, { key, enchantmentId }));
                    break;
                }
            }
        });

        // If pages are present and we're editing, clear existing pages first
        if (parts.pages.length && !isNew) parts.pages.unshift(`Research.clearPages("${escapeStr(key)}");`);

        // Build sections in configured order and allow per-section comments from templates.js
        const order = window.TEMPLATE_ORDER || ['prereqs', 'siblings', 'aspects', 'addResearch', 'warp', 'move', 'complexity', 'options', 'refresh', 'pages', 'localization'];
        const sections = [];
        const commentMap = window.TEMPLATE_SECTION_COMMENTS || {};

        order.forEach(sec => {
            if (sec === 'localization') return;
            if (!parts[sec] || parts[sec].length === 0) return;
            const prefix = commentMap[sec] || '';
            if (prefix) sections.push(prefix);
            sections.push(parts[sec].join('\n'));
        });

        let code = sections.join('\n');
        if (!code.trim()) code = 'No changes.';

        // Assemble localization block and ensure comment prefix ends with newline
        let locPrefix = commentMap.localization || '';
        if (locPrefix && !locPrefix.endsWith('\n')) locPrefix = locPrefix + '\n';
        const localizationBody = parts.localization.length ? (locPrefix + parts.localization.join('\n')) : '';
        const finalOutput = fillTemplate(TEMPLATE.fullFile, { body: code, localization: localizationBody });
        qs('output-code').textContent = finalOutput;
    }

    qs('generateBtn').addEventListener('click', generateCode);

    const copyBtn = qs('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            const code = qs('output-code').textContent;
            if (!code) return;
            navigator.clipboard.writeText(code)
                .then(() => { window.showCopyToast && window.showCopyToast('Copied to clipboard!'); })
                .catch(() => { window.showCopyToast && window.showCopyToast('Copy failed.'); });
        });
    }
})();
