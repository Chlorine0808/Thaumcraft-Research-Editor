(function () {
    const store = window.ResearchStore;
    const qs = window.Utils ? window.Utils.qs : (id => document.getElementById(id));
    const clear = window.Utils ? window.Utils.clear : (el => { if (el) el.innerHTML = ''; });

    // Cached elements
    const tabSelectEl = qs('tabSelect');
    const researchSelectEl = qs('researchSelect');
    const tabSelectEditEl = qs('tabSelectEdit');
    const tabInputEditEl = qs('tabInputEdit');
    const addPageBtn = qs('add-page');
    const pagesContainerEl = qs('pages-container');

    // Render available tabs into the tab select dropdown
    function renderTabs() {
        const tabSel = tabSelectEl;
        if (!tabSel) return;
        tabSel.innerHTML = '<option value="">-- Select Tab --</option>';
        store.getTabs().forEach(tab => {
            tabSel.innerHTML += `<option value="${tab}">${tab}</option>`;
        });
        tabSel.value = store.getCurrentTab();
    }

    // Render research list for the currently selected tab
    function renderResearchList() {
        const sel = researchSelectEl;
        if (!sel) return;
        sel.innerHTML = '<option value="__new__">-- New Research --</option>';
        if (!store.getCurrentTab()) return;
        const sorted = store.getResearchListForCurrentTabSorted();
        sorted.forEach(r => {
            sel.innerHTML += `<option value="${store.getResearchData().indexOf(r)}">${r.Name} (${r.Key})</option>`;
        });
    }

    // Populate the edit form using the provided research data object.
    // When isNew=true, the form is prepared for creating a new research.
    function showResearchForm(data, isNew = false) {
        const form = qs('researchForm');
        if (form) form.reset();

        // Clear pages and reset common controls
        if (pagesContainerEl) pagesContainerEl.innerHTML = '';
        const optionNames = ['round', 'spiky', 'stub', 'secondary', 'virtual', 'autounlock', 'concealed'];
        optionNames.forEach(n => {
            const noneRadio = form ? form.querySelector(`[name=option-${n}][value="none"]`) : null;
            if (noneRadio) noneRadio.checked = true;
        });
        const researchIconEl = qs('research-icon'); if (researchIconEl) researchIconEl.value = '';
        const researchTextEl = qs('research-text'); if (researchTextEl) researchTextEl.value = '';
        if (tabInputEditEl) { tabInputEditEl.style.display = 'none'; tabInputEditEl.value = ''; }
        const refreshEl = qs('refreshRecipe'); if (refreshEl) refreshEl.checked = false;

        qs('editSection').style.display = '';
        qs('research-pages').style.display = '';
        qs('new-research-fields').style.display = isNew ? '' : 'none';

        const keyEl = qs('key'); if (keyEl) keyEl.value = data.Key || '';
        if (keyEl) keyEl.readOnly = !isNew;
        const nameEl = qs('name'); if (nameEl) nameEl.value = data.Name || '';

        // Tab select edit
        clear(tabSelectEditEl);
        const tabs = store.getTabs();
        tabs.forEach(t => tabSelectEditEl.innerHTML += `<option value="${t}">${t}</option>`);
        tabSelectEditEl.innerHTML += '<option value="__custom__">Other tab</option>';
        const selTab = data.Category || data.Tab || '';
        if (selTab && tabs.includes(selTab)) {
            tabSelectEditEl.value = selTab;
            if (tabInputEditEl) tabInputEditEl.style.display = 'none';
        } else if (selTab) {
            tabSelectEditEl.value = '__custom__';
            if (tabInputEditEl) { tabInputEditEl.style.display = ''; tabInputEditEl.value = selTab; }
        } else {
            tabSelectEditEl.value = '';
            if (tabInputEditEl) { tabInputEditEl.style.display = 'none'; tabInputEditEl.value = ''; }
        }

        qs('x').value = data._formX || '';
        qs('y').value = data._formY || '';
        qs('complexity').value = data._formComplexity || '';
        qs('parent').value = data._formParents || '';
        qs('hiddenParent').value = data._formParentsHidden || '';
        qs('sibling').value = data._formSiblings || '';
        qs('aspectTrigger').value = data._formAspects || '';

        const researchTextEl2 = qs('research-text');
        if (researchTextEl2) researchTextEl2.value = data._researchText || '';
    }

    // Page entry helpers
    function updatePageContent(pageType, contentDiv) {
        switch (pageType) {
            case 'text':
                contentDiv.className = 'page-content text-content';
                contentDiv.innerHTML = '<textarea class="text-input" placeholder="Page text content..."></textarea>';
                break;
            case 'crafting':
                contentDiv.className = 'page-content crafting-content';
                contentDiv.innerHTML = '<input type="text" class="output-item" placeholder="Output item (e.g. minecraft:iron_block)">';
                break;
            case 'arcane':
                contentDiv.className = 'page-content arcane-content';
                contentDiv.innerHTML = '<input type="text" class="output-item" placeholder="Output item (e.g. Thaumcraft:WandRod)">';
                break;
            case 'crucible':
                contentDiv.className = 'page-content crucible-content';
                contentDiv.innerHTML = '<input type="text" class="output-item" placeholder="Output item (e.g. Thaumcraft:ItemResource:1)">';
                break;
            case 'infusion':
                contentDiv.className = 'page-content infusion-content';
                contentDiv.innerHTML = '<input type="text" class="output-item" placeholder="Output item (e.g. Thaumcraft:WandRod:2)">';
                break;
            case 'enchantment':
                contentDiv.className = 'page-content enchantment-content';
                contentDiv.innerHTML = '<input type="text" class="enchantment-id" placeholder="Enchantment ID (e.g. 18)">';
                break;
        }
    }

    function updatePageEntryButtons() {
        const entries = document.querySelectorAll('.page-entry');
        entries.forEach((entry, idx) => {
            const up = entry.querySelector('.move-up-page-btn');
            const down = entry.querySelector('.move-down-page-btn');
            const remove = entry.querySelector('.remove-page-btn');
            if (up) up.disabled = idx === 0;
            if (down) down.disabled = idx === entries.length - 1;
            if (remove) remove.disabled = false;
        });
    }

    function addPageEntry() {
        const container = pagesContainerEl;
        const entry = document.createElement('div');
        entry.className = 'page-entry';
        entry.innerHTML = `
        <select class="page-type">
            <option value="text">Text</option>
            <option value="crafting">Crafting Recipe</option>
            <option value="arcane">Arcane Recipe</option>
            <option value="infusion">Infusion Recipe</option>
            <option value="crucible">Crucible Recipe</option>
            <option value="enchantment">Enchantment</option>
        </select>
        <div class="page-content text-content">
            <textarea class="text-input" placeholder="Page text content..."></textarea>
        </div>
        <button type="button" class="move-up-page-btn">↑</button>
        <button type="button" class="move-down-page-btn">↓</button>
        <button type="button" class="remove-page-btn">Remove Page</button>
    `;
        entry.querySelector('.page-type').addEventListener('change', function () {
            updatePageContent(this.value, entry.querySelector('.page-content'));
        });
        if (container) container.appendChild(entry);
        updatePageEntryButtons();
    }

    // Events
    if (tabSelectEl) tabSelectEl.addEventListener('change', function () {
        store.setCurrentTab(this.value);
    });

    if (researchSelectEl) researchSelectEl.addEventListener('change', function () {
        const val = this.value;
        if (val === '__new__' || val === '') {
            store.setSelectedResearchIndex(null);
            showResearchForm({}, true);
        } else {
            store.setSelectedResearchIndex(val);
            showResearchForm(store.getOriginalResearchData(), false);
        }
    });

    if (tabSelectEditEl) tabSelectEditEl.addEventListener('change', function () {
        if (this.value === '__custom__') {
            if (tabInputEditEl) { tabInputEditEl.style.display = ''; tabInputEditEl.value = ''; }
        } else {
            if (tabInputEditEl) { tabInputEditEl.style.display = 'none'; tabInputEditEl.value = ''; }
        }
    });

    // Subscriptions
    store.subscribe('csv:data', renderResearchList);
    store.subscribe('tabs:changed', renderTabs);
    store.subscribe('tab:changed', function () {
        renderTabs();
        renderResearchList();
    });
    store.subscribe('research:selected', function (payload) {
        const idx = payload.index;
        if (idx === null) {
            showResearchForm({}, true);
            return;
        }
        showResearchForm(payload.original || {}, false);
    });

    // Initial UI
    renderTabs();
    renderResearchList();

    // Toast setup
    (function () {
        if (!qs('copy-toast')) {
            const toast = document.createElement('div');
            toast.id = 'copy-toast';
            document.body.appendChild(toast);
        }
    })();

    window.showCopyToast = function (msg) {
        const toast = qs('copy-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2000);
    };

    // Wire buttons and container events
    if (addPageBtn) addPageBtn.addEventListener('click', addPageEntry);

    if (pagesContainerEl) {
        pagesContainerEl.addEventListener('click', function (e) {
            const entry = e.target.closest('.page-entry');
            if (!entry) return;
            if (e.target.classList.contains('remove-page-btn')) {
                entry.remove();
                updatePageEntryButtons();
            } else if (e.target.classList.contains('move-up-page-btn')) {
                const prev = entry.previousElementSibling;
                if (prev) entry.parentNode.insertBefore(entry, prev);
                updatePageEntryButtons();
            } else if (e.target.classList.contains('move-down-page-btn')) {
                const next = entry.nextElementSibling;
                if (next) entry.parentNode.insertBefore(next, entry);
                updatePageEntryButtons();
            }
        });
    }

    // No static page-entry initialization required
})();
