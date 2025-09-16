// ThaumcraftResearchEditor scripts
// CSV読込・研究選択・編集・コード生成

// CSVパース用: PapaParse CDN
const PAPA_URL = "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js";
if (!window.Papa) {
    const script = document.createElement('script');
    script.src = PAPA_URL;
    script.onload = function () {
        if (window._autoLoadCsv) window._autoLoadCsv();
    };
    document.head.appendChild(script);
}

window._autoLoadCsv = function () {
    if (window.Papa) {
        handleCsvLoad();
    }
};

let researchData = [];
let tabs = [];
let currentTab = '';

// CSV読込
function handleCsvLoad() {
    const fileInput = document.getElementById('csvFileInput');
    const status = document.getElementById('csvStatus');
    if (!fileInput.files.length) {
        status.textContent = 'tc4research.csvを選択してください';
        return;
    }
    const file = fileInput.files[0];
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            if (!results.meta.fields.includes('Category') && !results.meta.fields.includes('Tab')) {
                status.textContent = 'tc4research.csvを選択してください';
                researchData = [];
                tabs = [];
                populateTabSelect();
                populateResearchSelect();
                return;
            }
            researchData = results.data.filter(row => row.Key);
            // Parents/ParentsHidden/Siblingsをソートして格納
            researchData.forEach(row => {
                if (row.Parents) {
                    row.Parents = row.Parents.split(';').map(s => s.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)).join(';');
                }
                if (row.ParentsHidden) {
                    row.ParentsHidden = row.ParentsHidden.split(';').map(s => s.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)).join(';');
                }
                if (row.Siblings) {
                    row.Siblings = row.Siblings.split(';').map(s => s.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)).join(';');
                }
            });
            tabs = Array.from(new Set(researchData.map(r => r.Category || r.Tab))).filter(Boolean);
            currentTab = '';
            status.textContent = `研究データ ${researchData.length}件 読込完了`;
            populateTabSelect();
            populateResearchSelect();
        },
        error: function (err) {
            status.textContent = 'CSV読込失敗: ' + err;
        }
    });
}

document.getElementById('loadCsvBtn').addEventListener('click', handleCsvLoad);
document.getElementById('csvFileInput').addEventListener('change', handleCsvLoad);

function populateTabSelect() {
    const tabSel = document.getElementById('tabSelect');
    tabSel.innerHTML = '<option value="">-- Select Tab --</option>';
    tabs.forEach(tab => {
        tabSel.innerHTML += `<option value="${tab}">${tab}</option>`;
    });
    tabSel.value = currentTab;
}

document.getElementById('tabSelect').addEventListener('change', function () {
    currentTab = this.value;
    populateResearchSelect();
    document.getElementById('editSection').style.display = 'none';
});

// 研究リスト表示
function populateResearchSelect() {
    const select = document.getElementById('researchSelect');
    select.innerHTML = '<option value="">-- Select Research --</option>';
    if (!currentTab) return;
    // Name昇順でソート
    const sorted = researchData.filter(r => r.Category === currentTab)
        .slice().sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
    sorted.forEach((r, i) => {
        select.innerHTML += `<option value="${researchData.indexOf(r)}">${r.Name} (${r.Key})</option>`;
    });
}

document.getElementById('researchSelect').addEventListener('change', function () {
    const idx = this.value;
    if (idx === "") {
        document.getElementById('editSection').style.display = 'none';
        return;
    }
    showResearchForm(researchData[idx]);
});

// 編集前の元データを保持するグローバル変数
let originalResearchData = null;

// 編集フォーム表示
function showResearchForm(data) {
    document.getElementById('editSection').style.display = '';
    document.getElementById('research-pages').style.display = '';
    document.getElementById('key').value = data.Key || '';
    document.getElementById('name').value = data.Name || '';
    populateTabSelectEdit(data.Category || '');
    document.getElementById('x').value = data.x || '';
    document.getElementById('y').value = data.y || '';
    document.getElementById('complexity').value = data.complexity || '';
    document.getElementById('parent').value = (data.Parents || '').split(';').map(s => s.trim()).filter(Boolean).join(', ');
    document.getElementById('hiddenParent').value = (data.ParentsHidden || '').split(';').map(s => s.trim()).filter(Boolean).join(', ');
    document.getElementById('sibling').value = (data.Siblings || '').split(';').map(s => s.trim()).filter(Boolean).join(', ');
    let aspectValue = data.Tag || '';
    // 6xCognitio;3xLux → 6 cognitio, 3 lux 形式に変換
    aspectValue = aspectValue.split(';').map(s => {
        const m = s.trim().match(/^([0-9]+)x([A-Za-z0-9_]+)$/);
        return m ? (m[1] + ' ' + m[2].toLowerCase()) : '';
    }).filter(Boolean).join(', ');
    document.getElementById('aspectTrigger').value = aspectValue;
    // 元データを保持
    originalResearchData = Object.assign({}, data);
}

function populateTabSelectEdit(selectedTab) {
    const tabSelEdit = document.getElementById('tabSelectEdit');
    tabSelEdit.innerHTML = '';
    tabs.forEach(tab => {
        tabSelEdit.innerHTML += `<option value="${tab}">${tab}</option>`;
    });
    tabSelEdit.innerHTML += '<option value="__custom__">その他（手入力）</option>';
    if (selectedTab && tabs.includes(selectedTab)) {
        tabSelEdit.value = selectedTab;
        document.getElementById('tabInputEdit').style.display = 'none';
    } else if (selectedTab) {
        tabSelEdit.value = '__custom__';
        document.getElementById('tabInputEdit').style.display = '';
        document.getElementById('tabInputEdit').value = selectedTab;
    } else {
        tabSelEdit.value = '';
        document.getElementById('tabInputEdit').style.display = 'none';
        document.getElementById('tabInputEdit').value = '';
    }
}

document.getElementById('tabSelectEdit').addEventListener('change', function () {
    if (this.value === '__custom__') {
        document.getElementById('tabInputEdit').style.display = '';
        document.getElementById('tabInputEdit').value = '';
    } else {
        document.getElementById('tabInputEdit').style.display = 'none';
        document.getElementById('tabInputEdit').value = '';
    }
});

// コード生成
function generateCode() {
    const form = document.getElementById('researchForm');
    const d = {};
    for (const el of form.elements) {
        if (el.name) d[el.name] = el.value;
    }
    // Research Tabの値をselect/inputから取得
    let tabValue = '';
    const tabSelEdit = document.getElementById('tabSelectEdit');
    const tabInputEdit = document.getElementById('tabInputEdit');
    if (tabSelEdit.value === '__custom__') {
        tabValue = tabInputEdit.value;
    } else {
        tabValue = tabSelEdit.value;
    }
    d.tab = tabValue;
    let code = '';
    if (!originalResearchData) {
        document.getElementById('output-code').textContent = '// No original data loaded.';
        return;
    }
    const key = d.key;
    // Name
    if ((d.name || '') !== (originalResearchData.Name || '')) {
        code += fillTemplate(TEMPLATE.setName, { key, name: d.name }) + '\n';
    }
    // Parents/Siblings/ParentsHidden
    const parentStr = d.parent || '';
    const hiddenParentStr = d.hiddenParent || '';
    const siblingStr = d.sibling || '';
    // 元データをカンマ区切りに変換
    const origParentArr = (originalResearchData.Parents || '').split(';').map(s => s.trim()).filter(Boolean);
    const origHiddenArr = (originalResearchData.ParentsHidden || '').split(';').map(s => s.trim()).filter(Boolean);
    const origSiblingArr = (originalResearchData.Siblings || '').split(';').map(s => s.trim()).filter(Boolean);
    // 入力値を配列化
    const parentArr = parentStr.split(',').map(s => s.trim()).filter(Boolean);
    const hiddenArr = hiddenParentStr.split(',').map(s => s.trim()).filter(Boolean);
    const siblingArr = siblingStr.split(',').map(s => s.trim()).filter(Boolean);
    // 配列同士を比較
    function arrEqual(a, b) {
        if (a.length !== b.length) return false;
        const as = [...a].sort().join(',');
        const bs = [...b].sort().join(',');
        return as === bs;
    }
    if (!arrEqual(parentArr, origParentArr) || !arrEqual(hiddenArr, origHiddenArr)) {
        code += `Research.clearPrereqs("${key}");\n`;
        parentArr.forEach(parent => {
            code += `Research.addPrereq("${key}", "${parent}", false);\n`;
        });
        hiddenArr.forEach(parent => {
            code += `Research.addPrereq("${key}", "${parent}", true);\n`;
        });
    }
    if (!arrEqual(siblingArr, origSiblingArr)) {
        code += `Research.clearSiblings("${key}");\n`;
        siblingArr.forEach(sibling => {
            code += `Research.addSibling("${key}", "${sibling}");\n`;
        });
    }
    // AspectTrigger
    // 元データ: 6xCognitio;3xLux → ["6 cognitio", "3 lux"]
    const origAspectArr = (originalResearchData.Tag || '').split(';').map(s => {
        const m = s.trim().match(/^([0-9]+)x([A-Za-z0-9_]+)$/);
        return m ? (m[1] + ' ' + m[2].toLowerCase()) : '';
    }).filter(Boolean);
    // 入力値: 6 Cognitio, 3 Lux → ["6 cognitio", "3 lux"]
    const aspectArr = (d.aspectTrigger || '').split(',').map(s => {
        const m = s.trim().match(/^([0-9]+)\s+([A-Za-z0-9_]+)$/);
        return m ? (m[1] + ' ' + m[2].toLowerCase()) : '';
    }).filter(Boolean);
    function arrEqual(a, b) {
        if (a.length !== b.length) return false;
        const as = [...a].sort().join(',');
        const bs = [...b].sort().join(',');
        return as === bs;
    }
    if (!arrEqual(aspectArr, origAspectArr)) {
        let aspects = (d.aspectTrigger || '');
        code += fillTemplate(TEMPLATE.setRequiredAspects, { key, aspects }) + '\n';
    }

    // Warp
    const warpInput = form.querySelector('[name=warp]');
    if (warpInput && warpInput.value !== '') {
        const warpInt = parseInt(warpInput.value);
        if (!isNaN(warpInt)) {
            code += fillTemplate(TEMPLATE.removeFromResearch, { key }) + '\n';
            if (warpInt > 0) {
                code += fillTemplate(TEMPLATE.addToResearch, { key, amount: warpInt }) + '\n';
            }
        }
    }

    // moveResearch出力（x, y両方入力されたときのみ）
    const hasXY = d.x !== '' && d.y !== '';
    if (hasXY) {
        code += fillTemplate(TEMPLATE.moveResearch, { key, tab: d.tab, x: d.x, y: d.y }) + '\n';
    }
    // Complexity出力
    if ((d.complexity || '') !== (originalResearchData.complexity || '')) {
        code += fillTemplate(TEMPLATE.setComplexity, { key, complexity: d.complexity }) + '\n';
    }
    // Research Options
    const optionMap = [
        { name: 'round', template: 'setRound' },
        { name: 'spiky', template: 'setSpiky' },
        { name: 'stub', template: 'setStub' },
        { name: 'secondary', template: 'setSecondary' },
        { name: 'virtual', template: 'setVirtual' },
        { name: 'autounlock', template: 'setAutoUnlock' },
        { name: 'concealed', template: 'setConcealed' },
    ];
    optionMap.forEach(opt => {
        const checked = form.querySelector(`[name=option-${opt.name}]:checked`);
        if (!checked) return;
        const val = checked.value;
        if (val !== 'none') {
            code += fillTemplate(TEMPLATE[opt.template], { key, value: val }) + '\n';
        }
    });

    // Refresh Research Recipe
    let refreshRecipeChecked = document.getElementById('refreshRecipe').checked;
    if (refreshRecipeChecked) {
        code += fillTemplate(TEMPLATE.refreshResearchRecipe, { key }) + '\n';
    }

    // Generate pages
    const pageEntries = document.querySelectorAll('.page-entry');
    let pagesCode = '';
    let localizationCode = '';
    pageEntries.forEach((entry, index) => {
        const pageTypeSel = entry.querySelector('.page-type');
        const pageType = pageTypeSel ? pageTypeSel.value : null;
        if (!pageType) return;
        if (index > 0) pagesCode += '\n';
        switch (pageType) {
            case 'text': {
                const textInput = entry.querySelector('.text-input');
                const textContent = textInput ? textInput.value : '';
                if (textContent) {
                    pagesCode += fillTemplate(TEMPLATE.textPage, { key, pageIndex: index });
                    localizationCode += `game.setLocalization("en_US", "tc.research_page.${key}.${index}", "${textContent.replace(/"/g, '\"')}");\n`;
                }
                break;
            }
            case 'crafting': {
                const outputInput = entry.querySelector('.output-item');
                const output = outputInput ? outputInput.value : '';
                if (output) {
                    pagesCode += fillTemplate(TEMPLATE.craftingPage, { key, output });
                }
                break;
            }
            case 'arcane': {
                const outputInput = entry.querySelector('.output-item');
                const output = outputInput ? outputInput.value : '';
                if (output) {
                    pagesCode += fillTemplate(TEMPLATE.arcanePage, { key, output });
                }
                break;
            }
            case 'crucible': {
                const outputInput = entry.querySelector('.output-item');
                const output = outputInput ? outputInput.value : '';
                if (output) {
                    pagesCode += fillTemplate(TEMPLATE.cruciblePage, { key, output });
                }
                break;
            }
            case 'infusion': {
                const outputInput = entry.querySelector('.output-item');
                const output = outputInput ? outputInput.value : '';
                if (output) {
                    pagesCode += fillTemplate(TEMPLATE.infusionPage, { key, output });
                }
                break;
            }
            case 'enchantment': {
                const enchantmentInput = entry.querySelector('.enchantment-id');
                const enchantmentId = enchantmentInput ? enchantmentInput.value : '';
                if (enchantmentId) {
                    pagesCode += fillTemplate(TEMPLATE.enchantmentPage, { key, enchantmentId });
                }
                break;
            }
        }
    });
    if (pageEntries.length === 0) {
        // 他の変更がなければrefreshのみ出力、それもなければNo changes.
        if (refreshRecipeChecked && code.trim() === '') {
            code = fillTemplate(TEMPLATE.refreshResearchRecipe, { key }) + '\n';
        } else if (code.trim() === '') {
            code = 'No changes.';
        }
    } else {
        if (pagesCode) {
            code += `Research.clearPages("${key}");\n`;
            code += pagesCode + '\n';
        }
    }
    // 全体テンプレートでラップ
    const finalOutput = fillTemplate(TEMPLATE.fullFile, { body: code, localization: localizationCode });
    document.getElementById('output-code').textContent = finalOutput;
}

document.getElementById('generateBtn').addEventListener('click', generateCode);

function updatePageEntryButtons() {
    const entries = document.querySelectorAll('.page-entry');
    entries.forEach((entry, idx) => {
        entry.querySelector('.move-up-page-btn').disabled = idx === 0;
        entry.querySelector('.move-down-page-btn').disabled = idx === entries.length - 1;
        entry.querySelector('.remove-page-btn').disabled = false;
    });
}

window.addEventListener('DOMContentLoaded', function () {
    if (window.Papa) {
        handleCsvLoad();
    } else {
        window._autoLoadCsv = function () { handleCsvLoad(); };
    }
    // 既存のページエントリにもイベント付与＆初期化
    document.querySelectorAll('.page-entry').forEach(entry => {
        const select = entry.querySelector('.page-type');
        const contentDiv = entry.querySelector('.page-content');
        if (select && contentDiv) {
            select.addEventListener('change', function () {
                updatePageContent(this.value, contentDiv);
            });
            // 入力欄の変更時にもgenerateCodeは呼ばない
            updatePageContent(select.value, contentDiv);
        }
    });
});

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

// ページ追加・削除・移動のイベントハンドラ
function addPageEntry() {
    const container = document.getElementById('pages-container');
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
    // ページタイプ変更時のイベント
    entry.querySelector('.page-type').addEventListener('change', function () {
        updatePageContent(this.value, entry.querySelector('.page-content'));
    });
    container.appendChild(entry);
    updatePageEntryButtons();
}

document.getElementById('add-page').addEventListener('click', addPageEntry);

document.getElementById('pages-container').addEventListener('click', function (e) {
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


