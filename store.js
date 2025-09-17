(function (global) {
    // Simple in-memory store with pub/sub notifications
    // Exposes ResearchStore with setters/getters and event subscription.
    const listeners = {};
    const state = {
        researchData: [],
        tabs: [],
        currentTab: '',
        selectedResearchIndex: null,
        originalResearchData: null,
        formState: {}
    };

    function emit(type, payload) {
        const handlers = listeners[type] || [];
        handlers.forEach(fn => {
            try { fn(payload); } catch (e) { /* swallow handler errors */ }
        });
    }

    const Store = {
        // Subscribe to store events. Returns an unsubscribe function.
        subscribe(type, fn) {
            (listeners[type] || (listeners[type] = [])).push(fn);
            return () => {
                listeners[type] = (listeners[type] || []).filter(f => f !== fn);
            };
        },

        // Emit an event
        notify(type, payload) { emit(type, payload); },

        // Reset entire store
        resetAll() {
            state.researchData = [];
            state.tabs = [];
            state.currentTab = '';
            state.selectedResearchIndex = null;
            state.originalResearchData = null;
            state.formState = {};
            emit('state:reset');
        },

        // Reset only form state
        resetFormState() {
            state.formState = {};
            emit('form:changed', state.formState);
        },

        // Setters
        setCSVData(data) {
            state.researchData = Array.isArray(data) ? data : [];
            emit('csv:data', state.researchData);
        },

        setTabs(tabs) {
            state.tabs = Array.isArray(tabs) ? tabs : [];
            emit('tabs:changed', state.tabs);
        },

        setCurrentTab(tab) {
            state.currentTab = tab || '';
            emit('tab:changed', state.currentTab);
        },

        setSelectedResearchIndex(idx) {
            // Normalize empty values to null (meaning 'new')
            if (idx === null || idx === undefined || idx === '') {
                state.selectedResearchIndex = null;
                state.originalResearchData = {};
            } else {
                const n = Number(idx);
                state.selectedResearchIndex = Number.isFinite(n) ? n : null;
                state.originalResearchData = (state.selectedResearchIndex !== null && state.researchData[state.selectedResearchIndex]) ? state.researchData[state.selectedResearchIndex] : {};
            }
            emit('research:selected', { index: state.selectedResearchIndex, original: state.originalResearchData });
        },

        setFormState(patch) {
            state.formState = { ...state.formState, ...patch };
            emit('form:changed', state.formState);
        },

        // Getters
        getState() { return state; },
        getResearchData() { return state.researchData; },
        getTabs() { return state.tabs; },
        getCurrentTab() { return state.currentTab; },
        getSelectedResearchIndex() { return state.selectedResearchIndex; },
        getOriginalResearchData() { return state.originalResearchData; },
        getFormState() { return state.formState; },

        // Return researches for current tab, sorted by Name
        getResearchListForCurrentTabSorted() {
            const tab = state.currentTab;
            const list = state.researchData.filter(r => (r.Category || r.Tab) === tab);
            return list.slice().sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
        }
    };

    global.ResearchStore = Store;
})(window);
