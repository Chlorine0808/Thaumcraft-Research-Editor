(function () {
    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async function fillEditExistingTest() {
        const s = window.ResearchStore;
        // Ensure there is at least one research to edit
        if (s && (!s.getResearchData || s.getResearchData().length === 0)) {
            s.setCSVData([{ Key: 'EXIST1', Name: 'Exist One', Tag: '10xCognitio;5xLux', Category: 'Test' }]);
            s.setTabs(['Test']);
            s.setCurrentTab('Test');
            s.setSelectedResearchIndex(0);
        } else if (s) {
            const tabs = s.getTabs();
            if (tabs && tabs.length) s.setCurrentTab(tabs[0]);
            s.setSelectedResearchIndex(0);
        }

        // Reflect selection in UI
        const researchSelect = document.getElementById('researchSelect');
        if (researchSelect) {
            const first = researchSelect.querySelector('option[value]:not([value="__new__"])');
            if (first) { researchSelect.value = first.value; researchSelect.dispatchEvent(new Event('change', { bubbles: true })); }
        }

        // Wait for UI to populate
        await sleep(200);

        // Fill basic fields
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('key', 'EXIST1');
        setVal('name', 'Exist One Modified');
        setVal('research-text', 'Updated research description.');
        setVal('aspectTrigger', 'cognitio 10, lux 6');
        setVal('complexity', '3');
        setVal('warp', '1');
        setVal('x', '8'); setVal('y', '12');
        setVal('parent', 'THAUMIUM, NITOR');
        setVal('hiddenParent', 'INFUSION');
        setVal('sibling', 'JARLABEL');
        setVal('research-icon', 'minecraft:gold_ingot');

        // Tab selection fallback
        const tabSelEdit = document.getElementById('tabSelectEdit');
        const tabInputEdit = document.getElementById('tabInputEdit');
        if (tabSelEdit && tabSelEdit.options.length > 1) {
            tabSelEdit.value = tabSelEdit.options[1].value;
            tabSelEdit.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (tabInputEdit) {
            tabInputEdit.style.display = '';
            tabInputEdit.value = 'CustomTab';
        }

        // Options
        const setRadio = (name, value) => { const el = document.querySelector(`[name=option-${name}][value="${value}"]`); if (el) el.checked = true; };
        setRadio('round', 'false');
        setRadio('spiky', 'true');
        setRadio('stub', 'false');
        setRadio('secondary', 'true');
        setRadio('virtual', 'false');
        setRadio('autounlock', 'true');
        setRadio('concealed', 'false');

        // Refresh
        const refresh = document.getElementById('refreshRecipe'); if (refresh) refresh.checked = true;

        // Pages to add with configuration
        const pagesToAdd = [
            { type: 'text', configure: entry => { const t = entry.querySelector('.text-input'); if (t) t.value = 'Page 1 text content.'; } },
            { type: 'crafting', configure: entry => { const o = entry.querySelector('.output-item'); if (o) o.value = 'minecraft:gold_block'; } },
            { type: 'arcane', configure: entry => { const o = entry.querySelector('.output-item'); if (o) o.value = 'Thaumcraft:WandRod'; } },
            { type: 'infusion', configure: entry => { const o = entry.querySelector('.output-item'); if (o) o.value = 'Thaumcraft:InfusionResult'; } },
            { type: 'enchantment', configure: entry => { const e = entry.querySelector('.enchantment-id'); if (e) e.value = '18'; } }
        ];

        const addBtn = document.getElementById('add-page');
        if (!addBtn) {
            const gen = document.getElementById('generateBtn'); if (gen) gen.click();
            return;
        }

        for (const p of pagesToAdd) {
            addBtn.click();
            await sleep(60);
            const entries = document.querySelectorAll('.page-entry');
            const entry = entries[entries.length - 1];
            if (!entry) continue;
            const sel = entry.querySelector('.page-type');
            if (sel) { sel.value = p.type; sel.dispatchEvent(new Event('change', { bubbles: true })); }
            await sleep(40);
            p.configure(entry);
            await sleep(40);
        }

        // Trigger generate
        const gen = document.getElementById('generateBtn'); if (gen) gen.click();
    }

    window.fillEditExistingTest = fillEditExistingTest;
})();