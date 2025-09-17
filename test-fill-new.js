(function () {
    // Auto-fill form for creating a new research and trigger generation
    function fillNewResearchTest() {
        const s = window.ResearchStore;
        if (s) s.setSelectedResearchIndex(null); // ensure New Research

        // Ensure researchSelect is set to new
        const researchSelect = document.getElementById('researchSelect');
        if (researchSelect) {
            researchSelect.value = '__new__';
            researchSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Basic fields
        const keyEl = document.getElementById('key'); if (keyEl) keyEl.value = 'TEST_NEW';
        const nameEl = document.getElementById('name'); if (nameEl) nameEl.value = 'Test Research';
        const textEl = document.getElementById('research-text'); if (textEl) textEl.value = 'This is a test research entry.';
        const aspectEl = document.getElementById('aspectTrigger'); if (aspectEl) aspectEl.value = 'lucrum 39, potentia 100';
        const complexityEl = document.getElementById('complexity'); if (complexityEl) complexityEl.value = '4';
        const warpEl = document.getElementById('warp'); if (warpEl) warpEl.value = '0';
        const xEl = document.getElementById('x'); if (xEl) xEl.value = '5';
        const yEl = document.getElementById('y'); if (yEl) yEl.value = '10';
        const parentEl = document.getElementById('parent'); if (parentEl) parentEl.value = 'THAUMIUM';
        const hiddenParentEl = document.getElementById('hiddenParent'); if (hiddenParentEl) hiddenParentEl.value = '';
        const siblingEl = document.getElementById('sibling'); if (siblingEl) siblingEl.value = '';

        // Research icon
        const iconEl = document.getElementById('research-icon'); if (iconEl) iconEl.value = 'minecraft:iron_ingot';

        // Select a tab if available
        const tabSel = document.getElementById('tabSelect');
        if (tabSel && tabSel.options.length > 1) {
            tabSel.value = tabSel.options[1].value;
            tabSel.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Options: enable round
        const roundTrue = document.querySelector('[name=option-round][value="true"]'); if (roundTrue) roundTrue.checked = true;

        // Enable refresh
        const refresh = document.getElementById('refreshRecipe'); if (refresh) refresh.checked = true;

        // Add pages: text + crafting
        const addBtn = document.getElementById('add-page');
        if (addBtn) {
            addBtn.click();
            setTimeout(() => {
                const entries = document.querySelectorAll('.page-entry');
                if (entries[0]) {
                    const txt = entries[0].querySelector('.text-input'); if (txt) txt.value = 'This is the first page text.';
                }
                addBtn.click();
                setTimeout(() => {
                    const entries2 = document.querySelectorAll('.page-entry');
                    if (entries2[1]) {
                        const sel = entries2[1].querySelector('.page-type');
                        if (sel) { sel.value = 'crafting'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
                        const out = entries2[1].querySelector('.output-item'); if (out) out.value = 'minecraft:iron_block';
                    }
                    // Trigger generate
                    const gen = document.getElementById('generateBtn'); if (gen) gen.click();
                }, 60);
            }, 60);
        } else {
            const gen = document.getElementById('generateBtn'); if (gen) gen.click();
        }
    }

    window.fillNewResearchTest = fillNewResearchTest;
})();