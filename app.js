/**
 * Web CNC 刀具與製程管理系統 (CNC Tool & Process Management System)
 * Core Application Engine - Enhanced Production Release
 */

(function () {
    'use strict';

    // --- UTILITIES: HTML Escape & Toast Notification ---
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(message, type = 'info', duration = 3200) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        const colors = {
            success: 'bg-emerald-900/90 border-emerald-500/80 text-emerald-200',
            error: 'bg-rose-900/90 border-rose-500/80 text-rose-200',
            warning: 'bg-amber-900/90 border-amber-500/80 text-amber-200',
            info: 'bg-slate-800/95 border-blue-500/80 text-slate-100'
        };
        const icons = {
            success: 'check-circle-2',
            error: 'alert-triangle',
            warning: 'alert-circle',
            info: 'info'
        };

        const colorClass = colors[type] || colors.info;
        const iconName = icons[type] || icons.info;

        toast.className = `toast-item pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium ${colorClass}`;
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
            <span class="flex-1">${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);
        lucide.createIcons({ root: toast });

        setTimeout(() => {
            toast.classList.add('toast-leave');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // --- DEFAULT INITIAL STATE ---
    const DEFAULT_CUSTOM_FIELDS = [
        { key: 'supplier', label: '供應商', type: 'text', unit: '', options: '' },
        { key: 'last_calibration', label: '最近對刀/校正日期', type: 'date', unit: '', options: '' },
        { key: 'unit_price', label: '刀具單價', type: 'number', unit: 'NTD', options: '' }
    ];

    const DEFAULT_MASTER_TOOLS = [
        {
            id: 'T-EM-010',
            name: 'D10 4刃極細微粒鎢鋼立銑刀',
            type: '立銑刀',
            d: 10.0,
            l: 75.0,
            z: 4,
            material: '硬質合金 (Carbide)',
            coating: 'AlCrN',
            rpm: 5200,
            feed: 1250,
            fz: 0.06,
            coolant: '水溶性切削液',
            stock: 12,
            safety: 4,
            status: '在庫',
            customData: { supplier: '住友 Sumitomo', last_calibration: '2026-09-20', unit_price: 1800 }
        },
        {
            id: 'T-EM-006',
            name: 'D6 4刃高硬度立銑刀',
            type: '立銑刀',
            d: 6.0,
            l: 60.0,
            z: 4,
            material: '硬質合金 (Carbide)',
            coating: 'TiAlN',
            rpm: 8000,
            feed: 1400,
            fz: 0.044,
            coolant: '水溶性切削液',
            stock: 8,
            safety: 5,
            status: '在庫',
            customData: { supplier: 'OSG', last_calibration: '2026-09-18', unit_price: 1200 }
        },
        {
            id: 'T-BM-008',
            name: 'D8 R4 2刃球頭銑刀 (曲面精加工)',
            type: '球頭銑刀',
            d: 8.0,
            l: 80.0,
            z: 2,
            material: '硬質合金 (Carbide)',
            coating: 'DLC 鍍膜',
            rpm: 6500,
            feed: 1100,
            fz: 0.08,
            coolant: '高壓吹氣',
            stock: 2,
            safety: 3,
            status: '需補貨',
            customData: { supplier: 'NS Tool', last_calibration: '2026-09-15', unit_price: 2400 }
        },
        {
            id: 'T-DR-085',
            name: 'D8.5 硬質合金內冷鑽頭',
            type: '鑽頭',
            d: 8.5,
            l: 110.0,
            z: 2,
            material: '鎢鋼內冷 (Coolant-through)',
            coating: 'TiN',
            rpm: 3400,
            feed: 680,
            fz: 0.10,
            coolant: '水溶性切削液',
            stock: 15,
            safety: 5,
            status: '在庫',
            customData: { supplier: 'Seco', last_calibration: '2026-09-22', unit_price: 2100 }
        },
        {
            id: 'T-TAP-M10',
            name: 'M10x1.5 螺旋攻牙絲攻 (通孔/盲孔)',
            type: '絲攻/攻牙刀',
            d: 10.0,
            l: 75.0,
            z: 3,
            material: '粉末高速鋼 (HSS-E)',
            coating: 'TiCN',
            rpm: 500,
            feed: 750,
            fz: 1.5,
            coolant: '切削油',
            stock: 6,
            safety: 2,
            status: '在庫',
            customData: { supplier: 'YAMAWA', last_calibration: '2026-09-10', unit_price: 650 }
        },
        {
            id: 'T-FM-050',
            name: 'D50 4刃捨棄式面銑刀盤',
            type: '面銑刀',
            d: 50.0,
            l: 40.0,
            z: 4,
            material: '合金鋼刀頭 + 鎢鋼刀片',
            coating: '無',
            rpm: 1800,
            feed: 1440,
            fz: 0.20,
            coolant: '微量潤滑 (MQL)',
            stock: 3,
            safety: 1,
            status: '使用中',
            customData: { supplier: 'Sandvik Coromant', last_calibration: '2026-09-01', unit_price: 8500 }
        }
    ];

    const DEFAULT_HIERARCHY = [
        {
            id: 'mach-1',
            name: 'VMC-850A (立式加工中心)',
            type: 'machine',
            children: [
                {
                    id: 'part-101',
                    name: 'Part-A101_OP10 (航太鋁合金支架粗精加工)',
                    type: 'part',
                    parentId: 'mach-1',
                    slots: [
                        { slotNo: 'T01', offsetH: 1, offsetD: 1, toolId: 'T-FM-050', overhangL: 45, comment: '工件頂面粗銑開粗' },
                        { slotNo: 'T02', offsetH: 2, offsetD: 2, toolId: 'T-EM-010', overhangL: 35, comment: '外形階梯粗銑及精銑' },
                        { slotNo: 'T03', offsetH: 3, offsetD: 3, toolId: 'T-DR-085', overhangL: 50, comment: 'M10 螺紋底孔鑽削' },
                        { slotNo: 'T04', offsetH: 4, offsetD: 4, toolId: 'T-TAP-M10', overhangL: 40, comment: 'M10x1.5 剛性攻牙' }
                    ]
                },
                {
                    id: 'part-102',
                    name: 'Part-A101_OP20 (反面精銑與去毛刺)',
                    type: 'part',
                    parentId: 'mach-1',
                    slots: [
                        { slotNo: 'T01', offsetH: 1, offsetD: 1, toolId: 'T-EM-006', overhangL: 30, comment: '反面口袋精銑' }
                    ]
                }
            ]
        },
        {
            id: 'mach-2',
            name: '5-Axis-01 (DMG MORI 五軸加工機)',
            type: 'machine',
            children: [
                {
                    id: 'part-201',
                    name: 'Impeller-B500_OP10 (鈦合金葉輪五軸葉片開粗)',
                    type: 'part',
                    parentId: 'mach-2',
                    slots: [
                        { slotNo: 'T01', offsetH: 1, offsetD: 1, toolId: 'T-BM-008', overhangL: 55, comment: '五軸曲面流道清角精銑' }
                    ]
                }
            ]
        },
        {
            id: 'mach-3',
            name: 'Lathe-CNC-02 (臥式車削中心)',
            type: 'machine',
            children: []
        }
    ];

    // --- APPLICATION STATE ---
    let state = {
        masterTools: JSON.parse(localStorage.getItem('cnc_master_tools')) || DEFAULT_MASTER_TOOLS,
        customFields: JSON.parse(localStorage.getItem('cnc_custom_fields')) || DEFAULT_CUSTOM_FIELDS,
        hierarchy: JSON.parse(localStorage.getItem('cnc_hierarchy')) || DEFAULT_HIERARCHY,
        collapsedNodes: {},
        selectedSetupId: null,
        activeTab: 'tab-master',
        searchQuery: '',
        typeFilter: '',
        stockFilter: ''
    };

    // --- SUPABASE CLOUD & REALTIME ENGINE ---
    let supabaseClient = null;
    let realtimeChannel = null;
    let cloudSyncTimer = null;
    let isApplyingRemoteChange = false;

    // Save state: 本地模式才存 LocalStorage；連線雲端時以 Supabase 為單一資料源 (SSOT)
    function saveState(skipCloud = false) {
        if (!supabaseClient) {
            // 純本地模式：寫入 localStorage
            try {
                localStorage.setItem('cnc_master_tools', JSON.stringify(state.masterTools));
                localStorage.setItem('cnc_custom_fields', JSON.stringify(state.customFields));
                localStorage.setItem('cnc_hierarchy', JSON.stringify(state.hierarchy));
            } catch (e) {
                console.error('LocalStorage save failed:', e);
                showToast('資料儲存失敗，請檢查瀏覽器空間配額', 'error');
            }
        } else if (!skipCloud && !isApplyingRemoteChange) {
            // 雲端模式：防抖同步至 Supabase，不污染 localStorage
            debounceSyncToCloud();
        }
    }

    // --- INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => {
        initUI();
        renderAll();
        setupEventListeners();
        initSupabase();
    });

    function initUI() {
        lucide.createIcons();
    }

    function renderAll() {
        renderHierarchyTree();
        renderMasterToolTable();
        renderPartSetupTab();
        renderCustomFieldsTable();
        updateBadgesAndCounters();
        populateMachineStatusSelects();
        populateDiffSelects();
        lucide.createIcons();
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                switchTab(targetTab);
            });
        });

        // Search and Filters
        const searchInput = document.getElementById('globalSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.trim().toLowerCase();
                clearBtn.classList.toggle('hidden', state.searchQuery === '');
                renderMasterToolTable();
                renderPartSetupTab();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                state.searchQuery = '';
                clearBtn.classList.add('hidden');
                renderMasterToolTable();
                renderPartSetupTab();
            });
        }

        const typeFilterSel = document.getElementById('typeFilterSelect');
        if (typeFilterSel) {
            typeFilterSel.addEventListener('change', (e) => {
                state.typeFilter = e.target.value;
                renderMasterToolTable();
            });
        }

        const stockFilterSel = document.getElementById('stockFilterSelect');
        if (stockFilterSel) {
            stockFilterSel.addEventListener('change', (e) => {
                state.stockFilter = e.target.value;
                renderMasterToolTable();
            });
        }

        // Reset Demo Data
        const resetBtn = document.getElementById('resetDemoDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('確定要重置所有資料為系統預設範例？自訂的機台、刀具與欄位將被覆蓋。')) {
                    state.masterTools = JSON.parse(JSON.stringify(DEFAULT_MASTER_TOOLS));
                    state.customFields = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_FIELDS));
                    state.hierarchy = JSON.parse(JSON.stringify(DEFAULT_HIERARCHY));
                    state.selectedSetupId = null;
                    saveState();
                    renderAll();
                    showToast('系統已重置為標準預設範例資料', 'success');
                }
            });
        }

        // Export Excel
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);

        // Download Excel Template
        const dlTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
        if (dlTemplateBtn) dlTemplateBtn.addEventListener('click', downloadExcelTemplate);

        // Export PDF / Presetter Sheet Modal
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) exportPdfBtn.addEventListener('click', openPresetterModal);

        // Backup & Restore JSON Handlers
        const exportJsonBtn = document.getElementById('exportJsonBackupBtn');
        if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJsonBackup);

        const importJsonInput = document.getElementById('importJsonBackupInput');
        if (importJsonInput) {
            importJsonInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) importJsonBackup(file);
                e.target.value = '';
            });
        }

        // Add machine button
        const addMachBtn = document.getElementById('addMachineBtn');
        if (addMachBtn) {
            addMachBtn.addEventListener('click', () => {
                openNodeModal('machine');
            });
        }

        // Expand / Collapse All Tree button
        const expandTreeBtn = document.getElementById('expandAllTreeBtn');
        if (expandTreeBtn) {
            expandTreeBtn.addEventListener('click', () => {
                const allMachineIds = state.hierarchy.map(m => m.id);
                const hasUncollapsed = allMachineIds.some(id => !state.collapsedNodes[id]);
                allMachineIds.forEach(id => {
                    state.collapsedNodes[id] = hasUncollapsed;
                });
                renderHierarchyTree();
            });
        }

        // Add Tool Slot button
        const addSlotBtn = document.getElementById('addToolSlotBtn');
        if (addSlotBtn) {
            addSlotBtn.addEventListener('click', () => {
                window.addToolSlot();
            });
        }

        // Clone Tool Setup button
        const cloneBtn = document.getElementById('cloneSetupBtn');
        if (cloneBtn) {
            cloneBtn.addEventListener('click', () => {
                window.cloneToolSetup();
            });
        }

        // Modals & Calculator Listeners
        setupModalListeners();
        setupCalculatorListeners();
        setupPresetterModalListeners();
        setupSupabaseListeners();
    }

    function switchTab(tabId) {
        state.activeTab = tabId;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active', 'border-blue-500', 'text-blue-400');
                btn.classList.remove('border-transparent', 'text-slate-400');
            } else {
                btn.classList.remove('active', 'border-blue-500', 'text-blue-400');
                btn.classList.add('border-transparent', 'text-slate-400');
            }
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', content.id !== tabId);
        });

        if (tabId === 'tab-machine-status') {
            populateMachineStatusSelects();
            const sel = document.getElementById('machineStatusSelect');
            if (sel && sel.value) renderMachineStatusTable(sel.value);
        }
        if (tabId === 'tab-presetter') {
            populateDiffSelects();
        }
    }

    // --- BADGES & STATS COUNTERS ---
    function updateBadgesAndCounters() {
        document.getElementById('masterBadge').textContent = state.masterTools.length;
        document.getElementById('statTotalTools').textContent = state.masterTools.length;
        
        const lowStockCount = state.masterTools.filter(t => t.stock <= t.safety || t.status === '需補貨').length;
        document.getElementById('statLowStock').textContent = lowStockCount;

        document.getElementById('customFieldsBadge').textContent = state.customFields.length;

        // Machine count & bound tool count
        let mCount = state.hierarchy.length;
        let boundCount = 0;
        state.hierarchy.forEach(m => {
            (m.children || []).forEach(p => {
                boundCount += (p.slots || []).filter(s => s.toolId).length;
            });
        });
        document.getElementById('machineCount').textContent = mCount;
        document.getElementById('boundToolCount').textContent = boundCount;

        // Selected setup info tag
        const currentSelTag = document.getElementById('currentSelectionInfo');
        const setupBadge = document.getElementById('selectedSetupBadge');

        if (state.selectedSetupId) {
            const nodeInfo = findPartNodeById(state.selectedSetupId);
            if (nodeInfo) {
                currentSelTag.textContent = `目前檢視工件: ${nodeInfo.part.name}`;
                setupBadge.textContent = nodeInfo.part.name.split(' ')[0];
                setupBadge.classList.remove('hidden');
            }
        } else {
            currentSelTag.textContent = '目前檢視: 全區刀具庫';
            setupBadge.classList.add('hidden');
        }
    }

    // --- TAB 1: 刀具總表 (MASTER TOOL LIBRARY) ---
    function renderMasterToolTable() {
        const tbody = document.getElementById('masterToolTableBody');
        const headerMarker = document.getElementById('dynamicColHeaderMarker');
        if (!tbody || !headerMarker) return;

        // Dynamically build Custom Field Headers
        document.querySelectorAll('.custom-col-header').forEach(el => el.remove());
        
        state.customFields.forEach(cf => {
            const th = document.createElement('th');
            th.className = 'py-3 px-3 custom-col-header text-slate-300';
            th.textContent = `${cf.label} ${cf.unit ? '(' + cf.unit + ')' : ''}`;
            headerMarker.parentNode.insertBefore(th, headerMarker);
        });

        // Filter tools
        let filtered = state.masterTools.filter(tool => {
            const q = state.searchQuery;
            const matchSearch = !q || 
                tool.id.toLowerCase().includes(q) ||
                tool.name.toLowerCase().includes(q) ||
                tool.type.toLowerCase().includes(q) ||
                (tool.material && tool.material.toLowerCase().includes(q)) ||
                (tool.coating && tool.coating.toLowerCase().includes(q));

            const matchType = !state.typeFilter || tool.type === state.typeFilter;
            const matchStock = !state.stockFilter || tool.status === state.stockFilter;

            return matchSearch && matchType && matchStock;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${11 + state.customFields.length}" class="py-12 text-center text-slate-500">
                        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                        <p>未找到符合條件的刀具</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        tbody.innerHTML = filtered.map(t => {
            // Status Badge CSS
            let statusBadgeClass = 'bg-slate-700 text-slate-300';
            if (t.status === '在庫') statusBadgeClass = 'bg-emerald-950 text-emerald-400 border border-emerald-800/60';
            else if (t.status === '使用中') statusBadgeClass = 'bg-blue-950 text-blue-400 border border-blue-800/60';
            else if (t.status === '需補貨') statusBadgeClass = 'bg-amber-950 text-amber-400 border border-amber-800/60';
            else if (t.status === '報廢' || t.status === '修磨中') statusBadgeClass = 'bg-rose-950 text-rose-400 border border-rose-800/60';

            // Dynamic custom cells
            const customCellsHtml = state.customFields.map(cf => {
                const val = (t.customData && t.customData[cf.key] !== undefined) ? t.customData[cf.key] : '-';
                return `<td class="py-3 px-3 font-mono text-xs text-slate-300">${escapeHtml(val)}</td>`;
            }).join('');

            return `
                <tr class="hover:bg-slate-800/70 transition group cursor-grab active:cursor-grabbing"
                    draggable="true"
                    ondragstart="window.handleToolDragStart(event, '${escapeHtml(t.id)}')">
                    <td class="py-3 px-3 text-center" title="拖曳至刀槽配置">
                        <i data-lucide="grip-vertical" class="w-4 h-4 text-slate-600 group-hover:text-blue-400 inline-block"></i>
                    </td>
                    <td class="py-3 px-3 font-mono font-bold text-cyan-400">${escapeHtml(t.id)}</td>
                    <td class="py-3 px-3 font-semibold text-slate-100">${escapeHtml(t.name)}</td>
                    <td class="py-3 px-3">
                        <span class="bg-slate-700/70 text-slate-300 px-2 py-0.5 rounded text-xs">${escapeHtml(t.type)}</span>
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-slate-200">D${escapeHtml(t.d)}</td>
                    <td class="py-3 px-3 text-right font-mono text-slate-300">${escapeHtml(t.l || '-')}</td>
                    <td class="py-3 px-3 text-center font-mono text-slate-300">${escapeHtml(t.z || '-')}</td>
                    <td class="py-3 px-3 text-xs">
                        <div class="text-slate-200">${escapeHtml(t.material || 'Carbide')}</div>
                        <div class="text-slate-400 font-mono text-[11px]">${escapeHtml(t.coating || '無')}</div>
                    </td>
                    <td class="py-3 px-3 font-mono text-xs">
                        <div class="text-blue-300 font-bold">${t.rpm ? escapeHtml(t.rpm) + ' RPM' : '-'}</div>
                        <div class="text-slate-400">F: ${escapeHtml(t.feed || '-')} | fz: ${escapeHtml(t.fz || '-')}</div>
                    </td>
                    <td class="py-3 px-3">
                        <div class="flex items-center gap-1.5 mb-1">
                            <span class="px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass}">${escapeHtml(t.status)}</span>
                        </div>
                        <div class="text-xs text-slate-400 font-mono">庫存: <strong class="text-slate-200">${escapeHtml(t.stock)}</strong> (安全: ${escapeHtml(t.safety)})</div>
                    </td>
                    ${customCellsHtml}
                    <td class="py-3 px-3 text-center" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-center gap-1">
                            <button onclick="window.editTool('${escapeHtml(t.id)}')" class="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition" title="編輯刀具">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button onclick="window.deleteTool('${escapeHtml(t.id)}')" class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition" title="刪除刀具">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    // --- TAB 2: 機台與工件配刀階層 (HIERARCHY TREE) ---
    function renderHierarchyTree() {
        const container = document.getElementById('hierarchyTree');
        if (!container) return;

        container.innerHTML = state.hierarchy.map(machine => {
            const isCollapsed = !!state.collapsedNodes[machine.id];
            const hasChildren = machine.children && machine.children.length > 0;

            const childrenHtml = hasChildren ? machine.children.map(part => {
                const isActive = state.selectedSetupId === part.id;
                const slotCount = (part.slots || []).length;
                const boundToolsCount = (part.slots || []).filter(s => s.toolId).length;

                return `
                    <div class="tree-node-content ml-5 p-2 rounded-lg border border-transparent cursor-pointer flex items-center justify-between text-xs font-medium ${isActive ? 'active' : 'text-slate-300 hover:text-white'} group/part"
                         onclick="window.selectPartSetup('${escapeHtml(part.id)}')">
                        <div class="flex items-center gap-2 truncate flex-1 min-w-0">
                            <i data-lucide="file-cog" class="w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'} flex-shrink-0"></i>
                            <span class="truncate">${escapeHtml(part.name)}</span>
                        </div>
                        <div class="flex items-center gap-1 flex-shrink-0">
                            <span class="bg-slate-900/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-slate-700">
                                ${boundToolsCount}/${slotCount}刀
                            </span>
                            <div class="hidden group-hover/part:flex items-center gap-0.5 ml-1" onclick="event.stopPropagation()">
                                <button title="編輯工件" onclick="window.openPartEditModal('${escapeHtml(part.id)}')" class="p-0.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded">
                                    <i data-lucide="edit-3" class="w-3 h-3"></i>
                                </button>
                                <button title="複製刀具表" onclick="window.openCloneModal('${escapeHtml(part.id)}')" class="p-0.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-700 rounded">
                                    <i data-lucide="copy" class="w-3 h-3"></i>
                                </button>
                                <button title="刪除工件" onclick="window.deletePart('${escapeHtml(part.id)}')" class="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded">
                                    <i data-lucide="trash" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('') : `<div class="ml-6 py-1 text-xs text-slate-500 italic">尚無工件專案</div>`;

            return `
                <div class="space-y-1 mb-2">
                    <!-- Machine Level 1 -->
                    <div class="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 flex items-center justify-between group cursor-pointer"
                         onclick="window.toggleNodeCollapse('${escapeHtml(machine.id)}', event)">
                        <div class="flex items-center gap-2 text-slate-100 font-bold text-xs truncate flex-1 min-w-0">
                            <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="w-4 h-4 text-slate-400 flex-shrink-0"></i>
                            <i data-lucide="monitor" class="w-4 h-4 text-cyan-400 flex-shrink-0"></i>
                            <span class="truncate">${escapeHtml(machine.name)}</span>
                        </div>
                        <div class="flex items-center gap-0.5 flex-shrink-0 ml-1" onclick="event.stopPropagation()">
                            <button onclick="window.openNodeModal('part', '${escapeHtml(machine.id)}')" title="新增工件/工序" 
                                    class="p-1 opacity-70 group-hover:opacity-100 hover:text-blue-400 hover:bg-slate-600 rounded transition">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="window.openMachineEditModal('${escapeHtml(machine.id)}')" title="編輯機台名稱" 
                                    class="p-1 opacity-70 group-hover:opacity-100 hover:text-cyan-400 hover:bg-slate-600 rounded transition">
                                <i data-lucide="edit" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="window.deleteMachine('${escapeHtml(machine.id)}')" title="刪除機台" 
                                    class="p-1 opacity-70 group-hover:opacity-100 hover:text-rose-400 hover:bg-slate-600 rounded transition">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Part Level 2 -->
                    <div class="space-y-1 pl-1 ${isCollapsed ? 'hidden' : ''}">
                        ${childrenHtml}
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    }

    window.toggleNodeCollapse = function (machineId, event) {
        if (event) event.stopPropagation();
        state.collapsedNodes[machineId] = !state.collapsedNodes[machineId];
        renderHierarchyTree();
    };

    function findPartNodeById(id) {
        for (const m of state.hierarchy) {
            for (const p of (m.children || [])) {
                if (p.id === id) {
                    return { machine: m, part: p };
                }
            }
        }
        return null;
    }

    window.selectPartSetup = function (partId) {
        state.selectedSetupId = partId;
        renderHierarchyTree();
        renderPartSetupTab();
        updateBadgesAndCounters();

        if (state.activeTab === 'tab-master') {
            switchTab('tab-hierarchy');
        }
    };

    window.deleteMachine = function (machineId) {
        const machine = state.hierarchy.find(m => m.id === machineId);
        if (!machine) return;

        const partCount = (machine.children || []).length;
        const msg = partCount > 0
            ? `確定要刪除機台「${machine.name}」？此機台下包含 ${partCount} 個工件的配刀表將一併永久移除！`
            : `確定要刪除機台「${machine.name}」？`;

        if (!confirm(msg)) return;

        state.hierarchy = state.hierarchy.filter(m => m.id !== machineId);
        if (state.selectedSetupId) {
            const stillExists = findPartNodeById(state.selectedSetupId);
            if (!stillExists) state.selectedSetupId = null;
        }

        saveState();
        renderAll();
        showToast(`已刪除機台「${machine.name}」`, 'warning');
    };

    window.openMachineEditModal = function (machineId) {
        const machine = state.hierarchy.find(m => m.id === machineId);
        if (!machine) return;

        document.getElementById('machineEditId').value = machine.id;
        document.getElementById('machineEditName').value = machine.name;
        document.getElementById('machineEditModal').classList.remove('hidden');
    };

    window.deletePart = function (partId) {
        const nodeInfo = findPartNodeById(partId);
        if (!nodeInfo) return;
        if (!confirm(`確定要刪除工件「${nodeInfo.part.name}」？此工件所有刀槽配置將一併移除。`)) return;

        nodeInfo.machine.children = nodeInfo.machine.children.filter(p => p.id !== partId);
        if (state.selectedSetupId === partId) state.selectedSetupId = null;

        saveState();
        renderAll();
        showToast(`已刪除工件「${nodeInfo.part.name}」`, 'info');
    };

    window.openPartEditModal = function (partId) {
        const nodeInfo = findPartNodeById(partId);
        if (!nodeInfo) return;

        document.getElementById('partEditId').value = partId;
        document.getElementById('partEditName').value = nodeInfo.part.name;

        const machSel = document.getElementById('partEditMachine');
        machSel.innerHTML = state.hierarchy.map(m =>
            `<option value="${escapeHtml(m.id)}" ${m.id === nodeInfo.machine.id ? 'selected' : ''}>${escapeHtml(m.name)}</option>`
        ).join('');

        document.getElementById('partEditModal').classList.remove('hidden');
    };

    // --- TAB 2: 機台工件配刀工作區 (PART TOOLING SETUP) ---
    function renderPartSetupTab() {
        const titleEl = document.getElementById('setupTitle');
        const subTitleEl = document.getElementById('setupSubTitle');
        const slotList = document.getElementById('partSlotList');

        renderQuickToolPicker();

        if (!state.selectedSetupId) {
            titleEl.textContent = '請從左側點擊選擇工件/工序 (Part/OP)';
            subTitleEl.textContent = '目前未選取工件加工專案。點選左側樹狀節點開始配置刀位 (T01-T24)';
            slotList.innerHTML = `
                <div class="py-16 text-center text-slate-500">
                    <i data-lucide="arrow-left-circle" class="w-12 h-12 mx-auto mb-3 opacity-40 animate-pulse"></i>
                    <p class="text-sm font-medium">請在左側導覽樹點選「機台 ➔ 工件料號」</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const nodeInfo = findPartNodeById(state.selectedSetupId);
        if (!nodeInfo) return;

        const { machine, part } = nodeInfo;
        titleEl.textContent = `${machine.name} ➔ ${part.name}`;
        subTitleEl.textContent = `目前已配置 ${(part.slots || []).length} 個刀位 (可將右側或總表刀具拖放至下方刀槽)`;

        if (!part.slots || part.slots.length === 0) {
            slotList.innerHTML = `
                <div class="py-12 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                    <p class="text-sm mb-2">此工件目前尚未建立刀槽</p>
                    <button onclick="window.addToolSlot()" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                        新增第一個刀槽 (T01)
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        // Render slots with Drag & Drop target capability
        slotList.innerHTML = part.slots.map((slot, idx) => {
            const masterTool = state.masterTools.find(t => t.id === slot.toolId);

            let toolContentHtml = '';
            if (masterTool) {
                toolContentHtml = `
                    <div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 items-center bg-slate-900/90 p-2.5 rounded-lg border border-slate-700">
                        <div>
                            <div class="text-xs font-mono font-bold text-cyan-400">${escapeHtml(masterTool.id)}</div>
                            <div class="text-xs font-semibold text-slate-200 truncate">${escapeHtml(masterTool.name)}</div>
                        </div>
                        <div class="text-xs font-mono text-slate-300">
                            <div>外徑: D${escapeHtml(masterTool.d)}mm</div>
                            <div class="text-slate-400 text-[11px]">材質: ${escapeHtml(masterTool.material || 'Carbide')}</div>
                        </div>
                        <div class="text-xs font-mono text-slate-300">
                            <div class="text-blue-300 font-bold">${masterTool.rpm ? escapeHtml(masterTool.rpm) + ' RPM' : '-'}</div>
                            <div class="text-slate-400">進給 F: ${escapeHtml(masterTool.feed || '-')}</div>
                        </div>
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="window.unbindSlotTool('${escapeHtml(slot.slotNo)}')" class="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 px-2.5 py-1 rounded transition">
                                解除綁定
                            </button>
                        </div>
                    </div>
                `;
            } else {
                toolContentHtml = `
                    <div class="flex-1 flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-dashed border-slate-700 text-slate-500 text-xs">
                        <span>未綁定刀具 (空刀位) - 可從右側或刀具總表拖曳至此處</span>
                        <select onchange="window.bindSlotTool('${escapeHtml(slot.slotNo)}', this.value)" class="bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 px-2 py-1 focus:outline-none">
                            <option value="">-- 手動選擇刀具 --</option>
                            ${state.masterTools.map(mt => `<option value="${escapeHtml(mt.id)}">${escapeHtml(mt.id)} - ${escapeHtml(mt.name)} (D${mt.d})</option>`).join('')}
                        </select>
                    </div>
                `;
            }

            return `
                <div class="slot-card bg-slate-800/90 p-3 rounded-xl border border-slate-700 hover:border-blue-500/60 transition space-y-2.5"
                     data-slot-no="${escapeHtml(slot.slotNo)}"
                     ondragover="window.handleSlotDragOver(event)"
                     ondragleave="window.handleSlotDragLeave(event)"
                     ondrop="window.handleSlotDrop(event, '${escapeHtml(slot.slotNo)}')">
                    
                    <div class="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow">
                                ${escapeHtml(slot.slotNo)}
                            </span>
                            <div class="flex items-center gap-4 text-xs font-mono">
                                <div><span class="text-slate-400">長度補償 H:</span> <strong class="text-cyan-300">H${escapeHtml(slot.offsetH || idx + 1)}</strong></div>
                                <div><span class="text-slate-400">刀徑補償 D:</span> <strong class="text-cyan-300">D${escapeHtml(slot.offsetD || idx + 1)}</strong></div>
                                <div><span class="text-slate-400">凸出長度:</span> <input type="number" value="${slot.overhangL || 35}" onchange="window.updateSlotOverhang('${escapeHtml(slot.slotNo)}', this.value)" class="w-14 bg-slate-900 text-slate-200 border border-slate-700 rounded px-1 py-0.5 text-center text-xs"> mm</div>
                            </div>
                        </div>

                        <div class="flex items-center gap-1">
                            <button onclick="window.removeSlot('${escapeHtml(slot.slotNo)}')" title="刪除刀槽" class="p-1 text-slate-400 hover:text-rose-400 rounded">
                                <i data-lucide="trash" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Slot Tool Content Area -->
                    ${toolContentHtml}

                    <div class="flex items-center gap-2">
                        <i data-lucide="message-square" class="w-3.5 h-3.5 text-slate-500"></i>
                        <input type="text" value="${escapeHtml(slot.comment || '')}" placeholder="新增加工備註 (例: 開粗留 0.2mm 精修餘量)..."
                               onchange="window.updateSlotComment('${escapeHtml(slot.slotNo)}', this.value)"
                               class="flex-1 bg-slate-900/60 border border-slate-700/60 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500">
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    }

    // --- QUICK MASTER TOOL PICKER & DRAG SYSTEM ---
    function renderQuickToolPicker() {
        const container = document.getElementById('quickToolList');
        if (!container) return;

        const filterInput = document.getElementById('quickPickerSearch');
        const q = filterInput ? filterInput.value.trim().toLowerCase() : '';

        const list = state.masterTools.filter(t => !q || t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));

        container.innerHTML = list.map(t => {
            return `
                <div class="p-2.5 bg-slate-900/90 rounded-lg border border-slate-700/80 hover:border-blue-500 cursor-grab active:cursor-grabbing transition group flex items-center justify-between"
                     draggable="true"
                     ondragstart="window.handleToolDragStart(event, '${escapeHtml(t.id)}')">
                    <div class="truncate">
                        <div class="flex items-center gap-1.5">
                            <i data-lucide="grip-vertical" class="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400"></i>
                            <span class="font-mono font-bold text-xs text-cyan-400">${escapeHtml(t.id)}</span>
                            <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">${escapeHtml(t.type)}</span>
                        </div>
                        <div class="text-xs text-slate-200 truncate pl-5">${escapeHtml(t.name)}</div>
                    </div>
                    <div class="text-right font-mono text-xs text-slate-400 flex-shrink-0">
                        <div>D${escapeHtml(t.d)}</div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();

        if (filterInput && !filterInput.hasListener) {
            filterInput.hasListener = true;
            filterInput.addEventListener('input', renderQuickToolPicker);
        }
    }

    // Drag and Drop Event Handlers
    window.handleToolDragStart = function (e, toolId) {
        e.dataTransfer.setData('text/plain', toolId);
        e.dataTransfer.effectAllowed = 'copy';
    };

    window.handleSlotDragOver = function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    };

    window.handleSlotDragLeave = function (e) {
        e.currentTarget.classList.remove('drag-over');
    };

    window.handleSlotDrop = function (e, slotNo) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const toolId = e.dataTransfer.getData('text/plain');
        if (toolId) {
            window.bindSlotTool(slotNo, toolId);
        }
    };

    // Slot Modification helpers
    window.addToolSlot = function () {
        if (!state.selectedSetupId) {
            showToast('請先在左側導覽樹選擇工件/工序 (Part/OP)', 'warning');
            return;
        }
        const nodeInfo = findPartNodeById(state.selectedSetupId);
        if (!nodeInfo) return;

        const part = nodeInfo.part;
        part.slots = part.slots || [];
        const nextIdx = part.slots.length + 1;
        const slotNo = 'T' + (nextIdx < 10 ? '0' + nextIdx : nextIdx);

        part.slots.push({
            slotNo: slotNo,
            offsetH: nextIdx,
            offsetD: nextIdx,
            toolId: '',
            overhangL: 35,
            comment: ''
        });

        saveState();
        renderPartSetupTab();
        renderHierarchyTree();
        showToast(`已新增刀位 ${slotNo}`, 'success');
    };

    window.removeSlot = function (slotNo) {
        if (!state.selectedSetupId) return;
        const nodeInfo = findPartNodeById(state.selectedSetupId);
        if (!nodeInfo) return;

        nodeInfo.part.slots = nodeInfo.part.slots.filter(s => s.slotNo !== slotNo);
        saveState();
        renderPartSetupTab();
        renderHierarchyTree();
    };

    window.bindSlotTool = function (slotNo, toolId) {
        if (!state.selectedSetupId) return;
        const nodeInfo = findPartNodeById(state.selectedSetupId);
        if (!nodeInfo) return;

        const slot = nodeInfo.part.slots.find(s => s.slotNo === slotNo);
        if (slot) {
            slot.toolId = toolId;
            saveState();
            renderPartSetupTab();
            renderHierarchyTree();
            updateBadgesAndCounters();
            if (toolId) {
                showToast(`刀槽 ${slotNo} 已綁定刀具 [${toolId}]`, 'success');
            } else {
                showToast(`刀槽 ${slotNo} 已解除綁定`, 'info');
            }
        }
    };

    window.unbindSlotTool = function (slotNo) {
        window.bindSlotTool(slotNo, '');
    };

    window.updateSlotOverhang = function (slotNo, val) {
        if (!state.selectedSetupId) return;
        const nodeInfo = findPartNodeById(state.selectedSetupId);
        if (!nodeInfo) return;
        const slot = nodeInfo.part.slots.find(s => s.slotNo === slotNo);
        if (slot) {
            slot.overhangL = parseFloat(val) || 35;
            saveState();
        }
    };

    window.updateSlotComment = function (slotNo, val) {
        if (!state.selectedSetupId) return;
        const nodeInfo = findPartNodeById(state.selectedSetupId);
        if (!nodeInfo) return;
        const slot = nodeInfo.part.slots.find(s => s.slotNo === slotNo);
        if (slot) {
            slot.comment = val;
            saveState();
        }
    };

    // CLONE TOOL TABLE (複製加工刀具表)
    window.openCloneModal = function (sourcePartId) {
        const srcId = sourcePartId || state.selectedSetupId;
        if (!srcId) {
            showToast('請先在左側選取要作為複製來源的工件專案', 'warning');
            return;
        }
        const sourceNode = findPartNodeById(srcId);
        if (!sourceNode) return;

        document.getElementById('cloneSourceInfo').textContent =
            `來源工件：${sourceNode.part.name}  (機台: ${sourceNode.machine.name})`;
        document.getElementById('cloneNewPartName').value = sourceNode.part.name + '_COPY';

        const sel = document.getElementById('cloneTargetMachine');
        sel.innerHTML = state.hierarchy.map(m =>
            `<option value="${escapeHtml(m.id)}" ${m.id === sourceNode.machine.id ? 'selected' : ''}>${escapeHtml(m.name)}</option>`
        ).join('');

        document.getElementById('cloneModal').dataset.srcPartId = srcId;
        document.getElementById('cloneModal').classList.remove('hidden');
    };

    window.cloneToolSetup = function () {
        window.openCloneModal(state.selectedSetupId);
    };

    // --- TAB 3: 機器現況刀具表 (MACHINE STATUS TABLE) ---
    function populateMachineStatusSelects() {
        const sel = document.getElementById('machineStatusSelect');
        if (!sel) return;
        const prev = sel.value;
        sel.innerHTML = '<option value="">―― 請選擇機台 ――</option>' +
            state.hierarchy.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join('');
        if (prev) sel.value = prev;
    }

    function renderMachineStatusTable(machineId) {
        const tbody = document.getElementById('machineStatusTableBody');
        const summaryEl = document.getElementById('machineStatusSummary');
        if (!tbody) return;

        if (!machineId) {
            tbody.innerHTML = '<tr><td colspan="12" class="py-12 text-center text-slate-500">請選擇機台以顯示現況刀具表</td></tr>';
            if (summaryEl) summaryEl.textContent = '';
            return;
        }

        const machine = state.hierarchy.find(m => m.id === machineId);
        if (!machine) return;

        const parts = machine.children || [];
        if (parts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" class="py-10 text-center text-slate-500">此機台目前無工件/工序配置</td></tr>';
            if (summaryEl) summaryEl.textContent = '';
            return;
        }

        let totalSlots = 0, boundSlots = 0;
        let rows = [];

        parts.forEach(part => {
            const slots = part.slots || [];
            if (slots.length === 0) return;

            slots.forEach((slot, idx) => {
                const mt = state.masterTools.find(t => t.id === slot.toolId);
                totalSlots++;
                if (mt) boundSlots++;

                let statusClass = 'bg-slate-700 text-slate-300';
                if (mt) {
                    if (mt.status === '在庫') statusClass = 'bg-emerald-950 text-emerald-400';
                    else if (mt.status === '使用中') statusClass = 'bg-blue-950 text-blue-400';
                    else if (mt.status === '需補貨') statusClass = 'bg-amber-950 text-amber-400';
                    else statusClass = 'bg-rose-950 text-rose-400';
                }

                const partNameCell = idx === 0
                    ? `<td rowspan="${slots.length}" class="py-2.5 px-3 text-xs font-semibold text-slate-200 bg-slate-800/60 align-top border-r border-slate-700">${escapeHtml(part.name)}</td>`
                    : '';

                rows.push(`
                    <tr class="hover:bg-slate-800/50 transition ${idx === 0 ? 'border-t-2 border-slate-600' : ''}">
                        ${partNameCell}
                        <td class="py-2.5 px-3 font-bold text-blue-400 font-mono">${escapeHtml(slot.slotNo)}</td>
                        <td class="py-2.5 px-3 font-mono text-xs text-cyan-300">H${escapeHtml(slot.offsetH)}/D${escapeHtml(slot.offsetD)}</td>
                        <td class="py-2.5 px-3 font-mono font-bold text-amber-300 text-xs">${mt ? escapeHtml(mt.id) : '<span class="text-slate-600">未綁定</span>'}</td>
                        <td class="py-2.5 px-3 text-xs text-slate-200">${mt ? escapeHtml(mt.name) : '-'}</td>
                        <td class="py-2.5 px-3">${mt ? `<span class="bg-slate-700/70 text-slate-300 px-1.5 py-0.5 rounded text-xs">${escapeHtml(mt.type)}</span>` : '-'}</td>
                        <td class="py-2.5 px-3 text-right font-mono text-xs">${mt ? 'D' + escapeHtml(mt.d) : '-'}</td>
                        <td class="py-2.5 px-3 text-right font-mono text-xs">${escapeHtml(slot.overhangL)} mm</td>
                        <td class="py-2.5 px-3 text-right font-mono text-xs text-blue-300">${mt ? escapeHtml(mt.rpm) : '-'}</td>
                        <td class="py-2.5 px-3 text-right font-mono text-xs">${mt ? escapeHtml(mt.feed) : '-'}</td>
                        <td class="py-2.5 px-3">${mt ? `<span class="px-1.5 py-0.5 rounded text-xs ${statusClass}">${escapeHtml(mt.status)}</span>` : '-'}</td>
                        <td class="py-2.5 px-3 text-xs text-slate-400">${escapeHtml(slot.comment || '')}</td>
                    </tr>
                `);
            });
        });

        tbody.innerHTML = rows.length ? rows.join('') :
            '<tr><td colspan="12" class="py-10 text-center text-slate-500">此機台工件目前皆無刀槽配置</td></tr>';

        if (summaryEl) summaryEl.textContent =
            `共 ${parts.length} 個工件，刀槽 ${boundSlots}/${totalSlots} 已配刀`;
        lucide.createIcons();
    }

    // --- TAB 4: 刀具差異比對表 (DIFF COMPARISON) ---
    function populateDiffSelects() {
        const machSel = document.getElementById('diffMachineSelect');
        if (!machSel) return;
        const prev = machSel.value;
        machSel.innerHTML = '<option value="">―― 請選擇機台 ――</option>' +
            state.hierarchy.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join('');
        if (prev) machSel.value = prev;
    }

    function populateDiffPartSelect(machineId) {
        const partSel = document.getElementById('diffPartSelect');
        if (!partSel) return;
        if (!machineId) {
            partSel.innerHTML = '<option value="">―― 請先選擇機台 ――</option>';
            return;
        }
        let options = '<option value="">―― 請選擇比對目標工件 ――</option>';
        state.hierarchy.forEach(m => {
            (m.children || []).forEach(p => {
                options += `<option value="${escapeHtml(p.id)}">[${escapeHtml(m.name)}] ${escapeHtml(p.name)}</option>`;
            });
        });
        partSel.innerHTML = options;
    }

    function runDiffComparison() {
        const machineId = document.getElementById('diffMachineSelect').value;
        const targetPartId = document.getElementById('diffPartSelect').value;
        const tbody = document.getElementById('diffTableBody');
        const badgesEl = document.getElementById('diffSummaryBadges');

        if (!machineId || !targetPartId) {
            tbody.innerHTML = '<tr><td colspan="8" class="py-10 text-center text-slate-500">請選擇機台與目標製程工件後執行比對</td></tr>';
            if (badgesEl) badgesEl.innerHTML = '';
            return;
        }

        const machine = state.hierarchy.find(m => m.id === machineId);
        if (!machine) return;

        // Machine tools set
        const machineTools = new Map();
        (machine.children || []).forEach(part => {
            (part.slots || []).forEach(slot => {
                if (slot.toolId) {
                    if (!machineTools.has(slot.toolId)) machineTools.set(slot.toolId, []);
                    machineTools.get(slot.toolId).push({ part, slot });
                }
            });
        });

        // Target part tools set
        const targetNode = findPartNodeById(targetPartId);
        if (!targetNode) return;
        const targetTools = new Map();
        (targetNode.part.slots || []).forEach(slot => {
            if (slot.toolId) targetTools.set(slot.toolId, { part: targetNode.part, slot });
        });

        const allToolIds = new Set([...machineTools.keys(), ...targetTools.keys()]);

        let sameCount = 0, onlyMachine = 0, onlyTarget = 0;
        let rows = [];

        allToolIds.forEach(toolId => {
            const mt = state.masterTools.find(t => t.id === toolId);
            const inMachine = machineTools.has(toolId);
            const inTarget = targetTools.has(toolId);

            let statusLabel, statusClass, explanation;
            if (inMachine && inTarget) {
                statusLabel = '✓ 共用';
                statusClass = 'bg-emerald-950 text-emerald-400 border border-emerald-800/60';
                explanation = '兩者都使用此刀具';
                sameCount++;
            } else if (inMachine && !inTarget) {
                statusLabel = '− 機台有 / 製程無';
                statusClass = 'bg-blue-950 text-blue-400 border border-blue-800/60';
                explanation = '機台目前裝刀，比對製程不需要';
                onlyMachine++;
            } else {
                statusLabel = '⊕ 製程需要 / 機台無';
                statusClass = 'bg-amber-950 text-amber-400 border border-amber-800/60';
                explanation = '比對製程需要，機台目前未裝';
                onlyTarget++;
            }

            const machineInfo = inMachine
                ? machineTools.get(toolId).map(e => `${escapeHtml(e.slot.slotNo)}(${escapeHtml(e.part.name.split(' ')[0])})`).join(', ')
                : '-';
            const targetInfo = inTarget
                ? `${escapeHtml(targetTools.get(toolId).slot.slotNo)} (${escapeHtml(targetTools.get(toolId).part.name.split(' ')[0])})`
                : '-';

            rows.push(`
                <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded text-xs font-medium ${statusClass}">${statusLabel}</span>
                    </td>
                    <td class="py-3 px-3 font-mono text-xs text-slate-300">
                        ${inMachine ? machineTools.get(toolId).map(e => escapeHtml(e.slot.slotNo)).join(', ') : '-'}
                    </td>
                    <td class="py-3 px-3 font-mono font-bold text-xs text-amber-300">${escapeHtml(toolId)}</td>
                    <td class="py-3 px-3 text-xs text-slate-200">${mt ? escapeHtml(mt.name) : escapeHtml(toolId)}</td>
                    <td class="py-3 px-3 text-right font-mono text-xs">${mt ? 'D' + escapeHtml(mt.d) : '-'}</td>
                    <td class="py-3 px-3 text-xs text-cyan-300">${machineInfo}</td>
                    <td class="py-3 px-3 text-xs text-purple-300">${targetInfo}</td>
                    <td class="py-3 px-3 text-xs text-slate-400">${explanation}</td>
                </tr>
            `);
        });

        tbody.innerHTML = rows.length ? rows.join('') :
            '<tr><td colspan="8" class="py-10 text-center text-slate-500">機台與比對製程均無刀具綁定資料</td></tr>';

        if (badgesEl) {
            badgesEl.innerHTML = `
                <span class="px-2.5 py-1 rounded-full text-xs bg-emerald-900/60 text-emerald-400 border border-emerald-700">共用: ${sameCount}</span>
                <span class="px-2.5 py-1 rounded-full text-xs bg-blue-900/60 text-blue-400 border border-blue-700">機台獨有: ${onlyMachine}</span>
                <span class="px-2.5 py-1 rounded-full text-xs bg-amber-900/60 text-amber-400 border border-amber-700">製程需要: ${onlyTarget}</span>
            `;
        }
    }

    // --- TAB 5: 動態自訂欄位 (CUSTOM FIELDS) ---
    function renderCustomFieldsTable() {
        const tbody = document.getElementById('customFieldsTableBody');
        if (!tbody) return;

        if (state.customFields.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-8 text-center text-slate-500">目前無自訂欄位，點選右上方「新增自訂欄位」即可擴充。</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = state.customFields.map(cf => {
            return `
                <tr class="hover:bg-slate-700/40">
                    <td class="py-3 px-4 font-mono font-bold text-blue-400">${escapeHtml(cf.key)}</td>
                    <td class="py-3 px-4 font-semibold text-slate-200">${escapeHtml(cf.label)}</td>
                    <td class="py-3 px-4">
                        <span class="bg-slate-700 text-cyan-300 px-2 py-0.5 rounded text-xs font-mono">${escapeHtml(cf.type)}</span>
                    </td>
                    <td class="py-3 px-4 font-mono text-slate-300">${escapeHtml(cf.unit || '-')}</td>
                    <td class="py-3 px-4 text-xs text-slate-400">${escapeHtml(cf.options || '-')}</td>
                    <td class="py-3 px-4 text-center">
                        <button onclick="window.deleteCustomField('${escapeHtml(cf.key)}')" class="text-rose-400 hover:text-rose-300 p-1 hover:bg-slate-700 rounded transition">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    window.deleteCustomField = function (key) {
        if (confirm(`確定要刪除自訂欄位 [${key}]？此欄位將從所有刀具資料中移除。`)) {
            state.customFields = state.customFields.filter(cf => cf.key !== key);
            saveState();
            renderCustomFieldsTable();
            renderMasterToolTable();
            updateBadgesAndCounters();
            showToast(`已刪除自訂欄位 [${key}]`, 'info');
        }
    };

    // --- MODAL & FORM HANDLERS ---
    function setupModalListeners() {
        // Master Tool Add/Edit Modal
        const toolModal = document.getElementById('toolModal');
        const toolForm = document.getElementById('toolForm');

        document.getElementById('openAddToolModalBtn').addEventListener('click', () => {
            openToolModal();
        });

        document.getElementById('closeToolModalBtn').addEventListener('click', () => toolModal.classList.add('hidden'));
        document.getElementById('cancelToolModalBtn').addEventListener('click', () => toolModal.classList.add('hidden'));

        toolForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('toolFormId').value;
            const code = document.getElementById('toolFormCode').value.trim();
            const name = document.getElementById('toolFormName').value.trim();
            const type = document.getElementById('toolFormType').value;
            const d = parseFloat(document.getElementById('toolFormD').value) || 0;
            const l = parseFloat(document.getElementById('toolFormL').value) || 0;
            const z = parseInt(document.getElementById('toolFormZ').value) || 2;
            const material = document.getElementById('toolFormMaterial').value.trim();
            const coating = document.getElementById('toolFormCoating').value.trim();

            const rpm = parseInt(document.getElementById('toolFormRPM').value) || 0;
            const feed = parseInt(document.getElementById('toolFormFeed').value) || 0;
            const fz = parseFloat(document.getElementById('toolFormFz').value) || 0;
            const coolant = document.getElementById('toolFormCoolant').value;

            const stock = parseInt(document.getElementById('toolFormStock').value) || 0;
            const safety = parseInt(document.getElementById('toolFormSafety').value) || 0;
            const status = document.getElementById('toolFormStatus').value;

            // Collect Custom Fields values
            const customData = {};
            state.customFields.forEach(cf => {
                const el = document.getElementById(`cf_input_${cf.key}`);
                if (el) {
                    customData[cf.key] = el.value;
                }
            });

            const toolObj = {
                id: code,
                name,
                type,
                d,
                l,
                z,
                material,
                coating,
                rpm,
                feed,
                fz,
                coolant,
                stock,
                safety,
                status,
                customData
            };

            if (editId) {
                const idx = state.masterTools.findIndex(t => t.id === editId);
                if (idx !== -1) {
                    state.masterTools[idx] = toolObj;
                    showToast(`刀具 [${code}] 已更新`, 'success');
                }
            } else {
                if (state.masterTools.some(t => t.id === code)) {
                    showToast(`刀具編號 [${code}] 已存在，請使用不同的 Tool ID！`, 'error');
                    return;
                }
                state.masterTools.unshift(toolObj);
                showToast(`刀具 [${code}] 已建立`, 'success');
            }

            saveState();
            renderMasterToolTable();
            renderPartSetupTab();
            updateBadgesAndCounters();
            toolModal.classList.add('hidden');
        });

        // Custom Field Modal
        const cfModal = document.getElementById('customFieldModal');
        const cfForm = document.getElementById('customFieldForm');

        document.getElementById('openAddCustomFieldModalBtn').addEventListener('click', () => {
            cfForm.reset();
            cfModal.classList.remove('hidden');
        });

        document.getElementById('closeCustomFieldModalBtn').addEventListener('click', () => cfModal.classList.add('hidden'));
        document.getElementById('cancelCustomFieldModalBtn').addEventListener('click', () => cfModal.classList.add('hidden'));

        cfForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const key = document.getElementById('cfKey').value.trim().toLowerCase().replace(/\s+/g, '_');
            const label = document.getElementById('cfLabel').value.trim();
            const type = document.getElementById('cfType').value;
            const unit = document.getElementById('cfUnit').value.trim();
            const options = document.getElementById('cfOptions').value.trim();

            if (state.customFields.some(cf => cf.key === key)) {
                showToast(`欄位代碼 [${key}] 已存在！`, 'error');
                return;
            }

            state.customFields.push({ key, label, type, unit, options });
            saveState();
            renderCustomFieldsTable();
            renderMasterToolTable();
            updateBadgesAndCounters();
            cfModal.classList.add('hidden');
            showToast(`已新增自訂欄位「${label}」`, 'success');
        });

        // Node Modal (Add Machine / Part)
        const nodeModal = document.getElementById('nodeModal');
        const nodeForm = document.getElementById('nodeForm');

        document.getElementById('closeNodeModalBtn').addEventListener('click', () => nodeModal.classList.add('hidden'));
        document.getElementById('cancelNodeModalBtn').addEventListener('click', () => nodeModal.classList.add('hidden'));

        nodeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const parentId = document.getElementById('nodeFormParentId').value;
            const name = document.getElementById('nodeFormName').value.trim();
            if (!name) return;

            if (!parentId) {
                state.hierarchy.push({
                    id: 'mach-' + Date.now(),
                    name: name,
                    type: 'machine',
                    children: []
                });
                showToast(`已建立機台「${name}」`, 'success');
            } else {
                const m = state.hierarchy.find(item => item.id === parentId);
                if (m) {
                    m.children = m.children || [];
                    const newPartId = 'part-' + Date.now();
                    m.children.push({
                        id: newPartId,
                        name: name,
                        type: 'part',
                        parentId: parentId,
                        slots: [
                            { slotNo: 'T01', offsetH: 1, offsetD: 1, toolId: '', overhangL: 35, comment: '' }
                        ]
                    });
                    state.selectedSetupId = newPartId;
                    showToast(`已建立工件「${name}」並自動選取`, 'success');
                }
            }

            saveState();
            renderHierarchyTree();
            renderPartSetupTab();
            updateBadgesAndCounters();
            nodeModal.classList.add('hidden');
            populateMachineStatusSelects();
            populateDiffSelects();
        });

        // Machine Edit Modal
        const machineEditModal = document.getElementById('machineEditModal');
        const machineEditForm = document.getElementById('machineEditForm');
        document.getElementById('closeMachineEditModalBtn').addEventListener('click', () => machineEditModal.classList.add('hidden'));
        document.getElementById('cancelMachineEditModalBtn').addEventListener('click', () => machineEditModal.classList.add('hidden'));

        machineEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const machId = document.getElementById('machineEditId').value;
            const newName = document.getElementById('machineEditName').value.trim();
            if (!newName) return;

            const mach = state.hierarchy.find(m => m.id === machId);
            if (mach) {
                mach.name = newName;
                saveState();
                renderAll();
                showToast(`機台名稱已更新為「${newName}」`, 'success');
            }
            machineEditModal.classList.add('hidden');
        });

        // Clone Modal
        const cloneModal = document.getElementById('cloneModal');
        document.getElementById('closeCloneModalBtn').addEventListener('click', () => cloneModal.classList.add('hidden'));
        document.getElementById('cancelCloneModalBtn').addEventListener('click', () => cloneModal.classList.add('hidden'));
        document.getElementById('confirmCloneBtn').addEventListener('click', () => {
            const srcPartId = cloneModal.dataset.srcPartId;
            const targetMachineId = document.getElementById('cloneTargetMachine').value;
            const newName = document.getElementById('cloneNewPartName').value.trim();

            if (!targetMachineId || !newName) {
                showToast('請選擇目標機台並輸入新工件名稱', 'warning');
                return;
            }

            const sourceNode = findPartNodeById(srcPartId);
            if (!sourceNode) return;

            const targetMachine = state.hierarchy.find(m => m.id === targetMachineId);
            if (!targetMachine) return;

            const clonedSlots = JSON.parse(JSON.stringify(sourceNode.part.slots || []));
            const newPartId = 'part-' + Date.now();

            targetMachine.children = targetMachine.children || [];
            targetMachine.children.push({
                id: newPartId,
                name: newName,
                type: 'part',
                parentId: targetMachineId,
                slots: clonedSlots
            });

            saveState();
            renderAll();
            cloneModal.classList.add('hidden');
            window.selectPartSetup(newPartId);
            showToast(`成功複製刀具表至「${targetMachine.name}」`, 'success');
        });

        // Part Edit/Move Modal
        const partEditModal = document.getElementById('partEditModal');
        document.getElementById('closePartEditModalBtn').addEventListener('click', () => partEditModal.classList.add('hidden'));
        document.getElementById('cancelPartEditModalBtn').addEventListener('click', () => partEditModal.classList.add('hidden'));
        document.getElementById('confirmPartEditBtn').addEventListener('click', () => {
            const partId = document.getElementById('partEditId').value;
            const newName = document.getElementById('partEditName').value.trim();
            const newMachineId = document.getElementById('partEditMachine').value;

            if (!newName || !newMachineId) {
                showToast('請填寫工件名稱並選擇機台', 'warning');
                return;
            }

            const sourceNode = findPartNodeById(partId);
            if (!sourceNode) return;

            const { machine: oldMachine, part } = sourceNode;
            part.name = newName;

            if (oldMachine.id !== newMachineId) {
                const newMachine = state.hierarchy.find(m => m.id === newMachineId);
                if (!newMachine) return;

                oldMachine.children = oldMachine.children.filter(p => p.id !== partId);
                part.parentId = newMachineId;
                newMachine.children = newMachine.children || [];
                newMachine.children.push(part);
            }

            saveState();
            renderAll();
            partEditModal.classList.add('hidden');
            showToast('工件資訊更新成功', 'success');
        });

        // Machine Status Tab select
        const machineStatusSel = document.getElementById('machineStatusSelect');
        if (machineStatusSel) {
            machineStatusSel.addEventListener('change', (e) => {
                renderMachineStatusTable(e.target.value);
            });
        }

        // Diff Tab selects
        const diffMachineSel = document.getElementById('diffMachineSelect');
        if (diffMachineSel) {
            diffMachineSel.addEventListener('change', (e) => {
                populateDiffPartSelect(e.target.value);
            });
        }
        const runDiffBtn = document.getElementById('runDiffBtn');
        if (runDiffBtn) {
            runDiffBtn.addEventListener('click', runDiffComparison);
        }
    }

    function openToolModal(toolIdToEdit = null) {
        const modal = document.getElementById('toolModal');
        const title = document.getElementById('toolModalTitle');
        const form = document.getElementById('toolForm');
        form.reset();

        renderDynamicFormInputs(toolIdToEdit);

        if (toolIdToEdit) {
            const tool = state.masterTools.find(t => t.id === toolIdToEdit);
            if (tool) {
                title.querySelector('span').textContent = '編輯刀具 (Edit Tool)';
                document.getElementById('toolFormId').value = tool.id;
                document.getElementById('toolFormCode').value = tool.id;
                document.getElementById('toolFormCode').readOnly = true;
                document.getElementById('toolFormName').value = tool.name;
                document.getElementById('toolFormType').value = tool.type;
                document.getElementById('toolFormD').value = tool.d;
                document.getElementById('toolFormL').value = tool.l || '';
                document.getElementById('toolFormZ').value = tool.z || 4;
                document.getElementById('toolFormMaterial').value = tool.material || '';
                document.getElementById('toolFormCoating').value = tool.coating || '';

                document.getElementById('toolFormRPM').value = tool.rpm || '';
                document.getElementById('toolFormFeed').value = tool.feed || '';
                document.getElementById('toolFormFz').value = tool.fz || '';
                document.getElementById('toolFormCoolant').value = tool.coolant || '水溶性切削液';

                document.getElementById('toolFormStock').value = tool.stock;
                document.getElementById('toolFormSafety').value = tool.safety;
                document.getElementById('toolFormStatus').value = tool.status;

                if (tool.customData) {
                    state.customFields.forEach(cf => {
                        const el = document.getElementById(`cf_input_${cf.key}`);
                        if (el && tool.customData[cf.key] !== undefined) {
                            el.value = tool.customData[cf.key];
                        }
                    });
                }
            }
        } else {
            title.querySelector('span').textContent = '新增刀具 (Add Master Tool)';
            document.getElementById('toolFormId').value = '';
            document.getElementById('toolFormCode').readOnly = false;
        }

        modal.classList.remove('hidden');
    }

    function renderDynamicFormInputs(editId) {
        const container = document.getElementById('dynamicCustomFieldsContainer');
        const inputsWrapper = document.getElementById('dynamicFieldsInputs');

        if (state.customFields.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        inputsWrapper.innerHTML = state.customFields.map(cf => {
            let inputHtml = '';
            if (cf.type === 'select') {
                const opts = (cf.options || '').split(',').map(o => o.trim());
                inputHtml = `
                    <select id="cf_input_${cf.key}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100">
                        ${opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
                    </select>
                `;
            } else if (cf.type === 'number') {
                inputHtml = `<input type="number" step="any" id="cf_input_${cf.key}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100">`;
            } else if (cf.type === 'date') {
                inputHtml = `<input type="date" id="cf_input_${cf.key}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100">`;
            } else {
                inputHtml = `<input type="text" id="cf_input_${cf.key}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100">`;
            }

            return `
                <div>
                    <label class="block text-xs text-slate-400 mb-1">${escapeHtml(cf.label)} ${cf.unit ? '(' + escapeHtml(cf.unit) + ')' : ''}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');
    }

    window.editTool = function (toolId) {
        openToolModal(toolId);
    };

    window.deleteTool = function (toolId) {
        if (confirm(`確定要刪除刀具 [${toolId}]？`)) {
            state.masterTools = state.masterTools.filter(t => t.id !== toolId);
            saveState();
            renderMasterToolTable();
            renderPartSetupTab();
            updateBadgesAndCounters();
            showToast(`已刪除刀具 [${toolId}]`, 'info');
        }
    };

    window.openNodeModal = function (type, parentId = '') {
        const modal = document.getElementById('nodeModal');
        const title = document.getElementById('nodeModalTitle');
        const label = document.getElementById('nodeFormLabel');
        const input = document.getElementById('nodeFormName');
        document.getElementById('nodeFormParentId').value = parentId;
        input.value = '';

        if (type === 'machine') {
            title.textContent = '新增 CNC 機台';
            label.textContent = '機台名稱/編號 (例: VMC-850A, 5-Axis-01)';
        } else {
            title.textContent = '新增工件 / 加工工序 (Part/OP)';
            label.textContent = '工件圖號與工序名稱 (例: Part-A101_OP10)';
        }

        modal.classList.remove('hidden');
    };

    // --- SPEED & FEED CALCULATOR ---
    function setupCalculatorListeners() {
        const modal = document.getElementById('calcModal');
        const openBtn = document.getElementById('calcModalOpenBtn');
        const closeBtn = document.getElementById('closeCalcModalBtn');

        openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            calculateSpeedAndFeed();
        });
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

        const inputs = ['calcD', 'calcZ', 'calcVc', 'calcFz', 'calcAp', 'calcAe'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateSpeedAndFeed);
        });

        // Copy Calc Parameters
        const copyBtn = document.getElementById('copyCalcParamsBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const rpm = document.getElementById('resRPM').textContent;
                const feed = document.getElementById('resFeed').textContent;
                const mrr = document.getElementById('resMRR').textContent;
                const text = `主軸轉速 S: ${rpm} RPM | 進給 F: ${feed} mm/min | MRR: ${mrr}`;
                navigator.clipboard.writeText(text).then(() => {
                    showToast('已複製切削參數至剪貼簿', 'success');
                }).catch(() => {
                    showToast(text, 'info');
                });
            });
        }

        // Apply to Tool Form
        const applyBtn = document.getElementById('applyCalcToFormBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const rpm = parseInt(document.getElementById('resRPM').textContent) || 0;
                const feed = parseInt(document.getElementById('resFeed').textContent) || 0;
                const d = parseFloat(document.getElementById('calcD').value) || 0;
                const z = parseInt(document.getElementById('calcZ').value) || 0;
                const fz = parseFloat(document.getElementById('calcFz').value) || 0;

                const formModal = document.getElementById('toolModal');
                if (formModal && !formModal.classList.contains('hidden')) {
                    if (rpm) document.getElementById('toolFormRPM').value = rpm;
                    if (feed) document.getElementById('toolFormFeed').value = feed;
                    if (d) document.getElementById('toolFormD').value = d;
                    if (z) document.getElementById('toolFormZ').value = z;
                    if (fz) document.getElementById('toolFormFz').value = fz;
                    modal.classList.add('hidden');
                    showToast('已將切削參數帶入刀具編輯表單！', 'success');
                } else {
                    // Open tool modal and prefill
                    openToolModal();
                    if (rpm) document.getElementById('toolFormRPM').value = rpm;
                    if (feed) document.getElementById('toolFormFeed').value = feed;
                    if (d) document.getElementById('toolFormD').value = d;
                    if (z) document.getElementById('toolFormZ').value = z;
                    if (fz) document.getElementById('toolFormFz').value = fz;
                    modal.classList.add('hidden');
                    showToast('已開啟新增刀具並帶入切削參數', 'info');
                }
            });
        }
    }

    function calculateSpeedAndFeed() {
        const d = parseFloat(document.getElementById('calcD').value) || 1;
        const z = parseFloat(document.getElementById('calcZ').value) || 1;
        const vc = parseFloat(document.getElementById('calcVc').value) || 0;
        const fz = parseFloat(document.getElementById('calcFz').value) || 0;
        const ap = parseFloat(document.getElementById('calcAp').value) || 0;
        const ae = parseFloat(document.getElementById('calcAe').value) || 0;

        // RPM = (1000 * Vc) / (pi * D)
        const rpm = Math.round((1000 * vc) / (Math.PI * d));
        // Feed = RPM * Z * fz
        const feed = Math.round(rpm * z * fz);
        // MRR = (ap * ae * Feed) / 1000 (cm^3/min)
        const mrr = ((ap * ae * feed) / 1000).toFixed(1);

        document.getElementById('resRPM').textContent = isFinite(rpm) ? rpm : 0;
        document.getElementById('resFeed').textContent = isFinite(feed) ? feed : 0;
        const resMRREl = document.getElementById('resMRR');
        if (resMRREl) {
            resMRREl.innerHTML = `${isFinite(mrr) ? mrr : 0} <span class="text-xs font-normal text-slate-400">cm³/min</span>`;
        }
    }

    // --- PRESETTER SHEET & PDF EXPORT MODAL ---
    function setupPresetterModalListeners() {
        const modal = document.getElementById('presetterModal');
        const closeBtn = document.getElementById('closePresetterModalBtn');
        const partSel = document.getElementById('presetterPartSelect');
        const printBtn = document.getElementById('printBrowserBtn');
        const downloadPdfBtn = document.getElementById('downloadPdfActionBtn');

        if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

        if (partSel) {
            partSel.addEventListener('change', (e) => {
                renderPresetterSheet(e.target.value);
            });
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', exportPresetterToPdf);
        }
    }

    function openPresetterModal() {
        const modal = document.getElementById('presetterModal');
        const partSel = document.getElementById('presetterPartSelect');
        if (!modal || !partSel) return;

        // Build list of all parts
        let options = [];
        state.hierarchy.forEach(m => {
            (m.children || []).forEach(p => {
                options.push({
                    id: p.id,
                    label: `[${m.name}] ${p.name}`
                });
            });
        });

        if (options.length === 0) {
            showToast('目前尚未建立任何工件配刀專案，無法產出對刀單', 'warning');
            return;
        }

        partSel.innerHTML = options.map(opt =>
            `<option value="${escapeHtml(opt.id)}" ${opt.id === state.selectedSetupId ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
        ).join('');

        const targetPartId = state.selectedSetupId || options[0].id;
        partSel.value = targetPartId;
        renderPresetterSheet(targetPartId);
        modal.classList.remove('hidden');
    }

    function renderPresetterSheet(partId) {
        const sheet = document.getElementById('printableArea');
        if (!sheet) return;

        const nodeInfo = findPartNodeById(partId);
        if (!nodeInfo) {
            sheet.innerHTML = '<div class="py-12 text-center text-slate-500">查無工件資料</div>';
            return;
        }

        const { machine, part } = nodeInfo;
        const slots = part.slots || [];
        const todayStr = new Date().toISOString().split('T')[0];

        let tableRowsHtml = '';
        if (slots.length === 0) {
            tableRowsHtml = '<tr><td colspan="10" class="py-8 text-center text-slate-400">此工件目前無刀位設定</td></tr>';
        } else {
            tableRowsHtml = slots.map((s, idx) => {
                const mt = state.masterTools.find(t => t.id === s.toolId);
                return `
                    <tr class="border-b border-slate-300">
                        <td class="py-2 px-2 text-center font-bold font-mono text-slate-900">${escapeHtml(s.slotNo)}</td>
                        <td class="py-2 px-2 text-center font-mono text-slate-700">H${escapeHtml(s.offsetH || idx + 1)}</td>
                        <td class="py-2 px-2 text-center font-mono text-slate-700">D${escapeHtml(s.offsetD || idx + 1)}</td>
                        <td class="py-2 px-2 font-mono font-bold text-slate-800">${mt ? escapeHtml(mt.id) : '<span class="text-slate-400">未指定</span>'}</td>
                        <td class="py-2 px-2 font-medium text-slate-900">${mt ? escapeHtml(mt.name) : '-'}</td>
                        <td class="py-2 px-2 text-right font-mono">${mt ? 'D' + escapeHtml(mt.d) : '-'}</td>
                        <td class="py-2 px-2 text-right font-mono">${escapeHtml(s.overhangL)} mm</td>
                        <td class="py-2 px-2 text-center border-l-2 border-slate-300 bg-slate-50 font-mono text-slate-400">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
                        <td class="py-2 px-2 text-center bg-slate-50 font-mono text-slate-400">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
                        <td class="py-2 px-2 text-slate-700 text-[11px]">${escapeHtml(s.comment || '')}</td>
                    </tr>
                `;
            }).join('');
        }

        sheet.innerHTML = `
            <!-- Sheet Header -->
            <div class="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                    <h2 class="text-xl font-bold tracking-tight text-slate-900">CNC 現場加工對刀量測簽核單</h2>
                    <p class="text-xs text-slate-500 font-mono mt-0.5">CNC Machine Presetter & Tool Setup Report</p>
                </div>
                <div class="text-right text-xs space-y-0.5">
                    <div><strong>製表日期：</strong> ${todayStr}</div>
                    <div class="font-mono text-slate-500">STATUS: OFFICIAL RELEASE</div>
                </div>
            </div>

            <!-- Meta Data Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs text-slate-800">
                <div><span class="text-slate-500">加工機台：</span><strong class="font-bold">${escapeHtml(machine.name)}</strong></div>
                <div><span class="text-slate-500">工件/工序：</span><strong class="font-bold">${escapeHtml(part.name)}</strong></div>
                <div><span class="text-slate-500">總配置刀數：</span><strong class="font-mono font-bold">${slots.length} 把</strong></div>
                <div><span class="text-slate-500">對刀儀：</span><strong>連線雷射對刀儀 / 光學</strong></div>
            </div>

            <!-- Tool Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border border-slate-300">
                    <thead class="bg-slate-200 text-slate-700 font-bold uppercase text-[11px] border-b-2 border-slate-400">
                        <tr>
                            <th class="py-2 px-2 text-center w-12">刀槽</th>
                            <th class="py-2 px-2 text-center w-12">長補H</th>
                            <th class="py-2 px-2 text-center w-12">徑補D</th>
                            <th class="py-2 px-2">刀具編號 (ID)</th>
                            <th class="py-2 px-2">刀具名稱規格</th>
                            <th class="py-2 px-2 text-right">理論刀徑</th>
                            <th class="py-2 px-2 text-right">要求凸出長度</th>
                            <th class="py-2 px-2 text-center bg-slate-300/80 border-l-2 border-slate-400">實測凸出長度</th>
                            <th class="py-2 px-2 text-center bg-slate-300/80">實測刀徑/磨耗</th>
                            <th class="py-2 px-2">加工工藝說明</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Signatures & Safety notes -->
            <div class="pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-xs text-slate-800">
                <div class="border border-slate-300 p-2.5 rounded bg-slate-50">
                    <div class="text-slate-500 mb-4">CAM / 程式設計師簽名：</div>
                    <div class="border-b border-slate-400 w-3/4"></div>
                </div>
                <div class="border border-slate-300 p-2.5 rounded bg-slate-50">
                    <div class="text-slate-500 mb-4">現場對刀操作員簽名：</div>
                    <div class="border-b border-slate-400 w-3/4"></div>
                </div>
                <div class="border border-slate-300 p-2.5 rounded bg-slate-50">
                    <div class="text-slate-500 mb-4">品保 / 首件檢驗 (IPQC)：</div>
                    <div class="border-b border-slate-400 w-3/4"></div>
                </div>
            </div>

            <div class="text-[10px] text-slate-400 text-center font-mono pt-2">
                * 請現場操機人員於首件加工前確認各刀位伸出長度與跳動誤差 (Runout < 0.005mm)，確認無誤後方可啟動主軸。
            </div>
        `;
    }

    function exportPresetterToPdf() {
        const element = document.getElementById('printableArea');
        if (!element) return;

        showToast('正在產生高解析度 PDF，請稍候...', 'info');

        const opt = {
            margin: [0.3, 0.3, 0.3, 0.3],
            filename: `CNC_Tool_Presetter_Sheet_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            showToast('PDF 對刀單匯出成功！', 'success');
        }).catch(err => {
            console.error(err);
            showToast('PDF 匯出失敗: ' + err.message, 'error');
        });
    }

    // --- JSON BACKUP & RESTORE ---
    function exportJsonBackup() {
        const backupData = {
            version: '2.5',
            exportDate: new Date().toISOString(),
            masterTools: state.masterTools,
            customFields: state.customFields,
            hierarchy: state.hierarchy
        };

        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CNC_Tool_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('全系統資料備份 JSON 匯出完成', 'success');
    }

    function importJsonBackup(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.masterTools || !data.hierarchy) {
                    throw new Error('格式不正確，缺少必要的資料節點 (masterTools / hierarchy)');
                }

                if (!confirm(`確定要還原備份資料？\n\n備份日期: ${data.exportDate || '未知'}\n刀具數: ${data.masterTools.length}\n機台數: ${data.hierarchy.length}`)) {
                    return;
                }

                state.masterTools = data.masterTools || [];
                state.customFields = data.customFields || DEFAULT_CUSTOM_FIELDS;
                state.hierarchy = data.hierarchy || [];
                state.selectedSetupId = null;

                saveState();
                renderAll();
                showToast('全系統備份還原成功！', 'success');
            } catch (err) {
                showToast('JSON 解析還原失敗: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // --- EXCEL TEMPLATE DOWNLOAD ---
    function downloadExcelTemplate() {
        const sampleRow = {
            '刀具編號': 'T-EM-SAMPLE',
            '刀具名稱': 'D12 4刃鎢鋼銑刀範例',
            '刀具類型': '立銑刀',
            '刀徑 D': 12.0,
            '刀長 L': 75.0,
            '刃數 Z': 4,
            '材質': '超微粒硬質合金',
            '鍍膜': 'TiAlN',
            '主軸轉速 RPM': 4800,
            '進給速度 F': 1150,
            '每刃進給 fz': 0.06,
            '冷卻方式': '水溶性切削液',
            '現有庫存': 10,
            '安全庫存': 3,
            '狀態': '在庫'
        };

        // Add custom fields to template
        state.customFields.forEach(cf => {
            sampleRow[cf.label] = cf.type === 'number' ? 100 : (cf.type === 'date' ? '2026-10-01' : '範例');
        });

        const worksheet = XLSX.utils.json_to_sheet([sampleRow]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '刀具匯入範本');

        XLSX.writeFile(workbook, `CNC_刀具批次匯入標準範本.xlsx`);
        showToast('已下載 Excel 批次匯入範本', 'success');
    }

    // --- EXCEL EXPORT & IMPORT ---
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    showToast('匯入的檔案無資料！', 'warning');
                    return;
                }

                let importedCount = 0;
                json.forEach(row => {
                    const id = row['刀具編號'] || row['Tool ID'] || row['id'];
                    const name = row['刀具名稱'] || row['Name'] || row['name'];
                    if (id && name) {
                        const existingIdx = state.masterTools.findIndex(t => t.id === String(id));
                        
                        // Parse customData
                        const customData = {};
                        state.customFields.forEach(cf => {
                            if (row[cf.label] !== undefined) customData[cf.key] = row[cf.label];
                            else if (row[cf.key] !== undefined) customData[cf.key] = row[cf.key];
                        });

                        const toolObj = {
                            id: String(id).trim(),
                            name: String(name).trim(),
                            type: row['刀具類型'] || row['Type'] || '立銑刀',
                            d: parseFloat(row['刀徑 D'] || row['D']) || 10,
                            l: parseFloat(row['刀長 L'] || row['L']) || 75,
                            z: parseInt(row['刃數 Z'] || row['Z']) || 4,
                            material: row['材質'] || row['Material'] || 'Carbide',
                            coating: row['鍍膜'] || row['Coating'] || '無',
                            rpm: parseInt(row['主軸轉速 RPM'] || row['RPM']) || 4000,
                            feed: parseInt(row['進給速度 F'] || row['Feed']) || 1000,
                            fz: parseFloat(row['每刃進給 fz'] || row['fz']) || 0.05,
                            coolant: row['冷卻方式'] || '水溶性切削液',
                            stock: parseInt(row['現有庫存'] || row['庫存']) || 10,
                            safety: parseInt(row['安全庫存']) || 2,
                            status: row['狀態'] || '在庫',
                            customData
                        };

                        if (existingIdx !== -1) {
                            state.masterTools[existingIdx] = toolObj;
                        } else {
                            state.masterTools.push(toolObj);
                        }
                        importedCount++;
                    }
                });

                saveState();
                renderMasterToolTable();
                updateBadgesAndCounters();
                showToast(`成功匯入/更新 ${importedCount} 筆刀具資料！`, 'success');
            } catch (err) {
                showToast('匯入解析失敗: ' + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    });

    function exportToExcel() {
        const dataToExport = state.masterTools.map(t => {
            const row = {
                '刀具編號 (Tool ID)': t.id,
                '刀具名稱': t.name,
                '刀具類型': t.type,
                '外徑 D (mm)': t.d,
                '全長 L (mm)': t.l,
                '刃數 Z': t.z,
                '材質': t.material,
                '鍍膜': t.coating,
                '建議轉速 RPM': t.rpm,
                '進給 F (mm/min)': t.feed,
                '每刃進給 fz': t.fz,
                '冷卻方式': t.coolant,
                '現有庫存': t.stock,
                '安全庫存': t.safety,
                '狀態': t.status
            };

            state.customFields.forEach(cf => {
                row[cf.label] = (t.customData && t.customData[cf.key] !== undefined) ? t.customData[cf.key] : '';
            });

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Tools');

        XLSX.writeFile(workbook, `CNC_Tool_Master_Library_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('已匯出 Excel 刀具總表', 'success');
    }

    // PDF export backward-compat route
    function exportToPdf() {
        openPresetterModal();
    }

    // =========================================================================
    // --- SUPABASE CLOUD DATABASE & REALTIME WEBSOCKET SUBSCRIPTION MODULE ---
    // =========================================================================

    function updateCloudStatusUI(status, label) {
        const dot = document.getElementById('cloudStatusDot');
        const text = document.getElementById('cloudStatusText');
        if (!dot || !text) return;

        dot.className = 'w-2 h-2 rounded-full';
        if (status === 'connected') {
            dot.classList.add('bg-emerald-400', 'shadow-[0_0_8px_rgba(52,211,153,0.8)]');
            text.textContent = label || '雲端同步中';
            text.className = 'text-emerald-300';
        } else if (status === 'syncing') {
            dot.classList.add('bg-cyan-400', 'animate-ping');
            text.textContent = label || '同步中...';
            text.className = 'text-cyan-300';
        } else if (status === 'error') {
            dot.classList.add('bg-rose-500');
            text.textContent = label || '連線異常';
            text.className = 'text-rose-300';
        } else {
            dot.classList.add('bg-slate-500');
            text.textContent = label || '本機模式';
            text.className = 'text-slate-300';
        }
    }

    function initSupabase() {
        const savedUrl = localStorage.getItem('cnc_supabase_url');
        const savedKey = localStorage.getItem('cnc_supabase_key');

        if (!savedUrl || !savedKey || !window.supabase) {
            updateCloudStatusUI('offline', '本機模式');
            return;
        }

        try {
            supabaseClient = window.supabase.createClient(savedUrl, savedKey);
            updateCloudStatusUI('syncing', '連線中...');
            fetchCloudState();
            subscribeToRealtime();
        } catch (err) {
            console.error('Supabase 初始化失敗:', err);
            updateCloudStatusUI('error', '金鑰錯誤');
        }
    }

    async function fetchCloudState() {
        if (!supabaseClient) return;

        try {
            updateCloudStatusUI('syncing', '下載雲端...');
            const { data, error } = await supabaseClient
                .from('cnc_storage')
                .select('*')
                .eq('id', 'default_workshop')
                .maybeSingle();

            if (error) throw error;

            if (data && data.master_tools && data.master_tools.length > 0) {
                // 雲端有資料，直接以雲端為準更新記憶體狀態並渲染 (不污染 localStorage)
                isApplyingRemoteChange = true;
                state.masterTools = data.master_tools || state.masterTools;
                state.hierarchy = data.hierarchy || state.hierarchy;
                state.customFields = data.custom_fields || state.customFields;
                renderAll();
                isApplyingRemoteChange = false;
                updateCloudStatusUI('connected', '雲端同步中');
                showToast('已從 Supabase 雲端載入最新資料', 'success');
            } else {
                // 雲端表剛建立是空的，將當前預設/現有資料推上雲端建立初始版本
                await pushStateToCloud(true);
                updateCloudStatusUI('connected', '雲端同步中');
                showToast('已在 Supabase 雲端建立初始資料庫資料', 'success');
            }
        } catch (err) {
            console.error('fetchCloudState error:', err);
            updateCloudStatusUI('error', '雲端連線失敗');
            showToast('雲端資料讀取失敗，請檢查金鑰或網路', 'warning');
        }
    }

    function debounceSyncToCloud() {
        if (!supabaseClient) return;

        updateCloudStatusUI('syncing', '儲存中...');
        clearTimeout(cloudSyncTimer);
        cloudSyncTimer = setTimeout(async () => {
            await pushStateToCloud(false);
        }, 800);
    }

    async function pushStateToCloud(silent = false) {
        if (!supabaseClient || isApplyingRemoteChange) return;

        try {
            const { error } = await supabaseClient
                .from('cnc_storage')
                .upsert({
                    id: 'default_workshop',
                    master_tools: state.masterTools,
                    hierarchy: state.hierarchy,
                    custom_fields: state.customFields,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            updateCloudStatusUI('connected', '雲端同步中');
            if (!silent) {
                showToast('已同步寫入 Supabase 雲端資料庫', 'success', 2000);
            }
        } catch (err) {
            console.error('pushStateToCloud error:', err);
            updateCloudStatusUI('error', '同步失敗');
            showToast('上傳雲端失敗: ' + err.message, 'error');
        }
    }

    function subscribeToRealtime() {
        if (!supabaseClient) return;

        // 若已有舊連線先移除
        if (realtimeChannel) {
            supabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = supabaseClient
            .channel('cnc_workshop_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'cnc_storage',
                    filter: 'id=eq.default_workshop'
                },
                (payload) => {
                    const newData = payload.new;
                    if (!newData) return;

                    // 避免收到自己剛剛發送的回音更新
                    const remoteJson = JSON.stringify(newData.master_tools);
                    const localJson = JSON.stringify(state.masterTools);
                    if (remoteJson === localJson) return;

                    isApplyingRemoteChange = true;
                    state.masterTools = newData.master_tools || [];
                    state.hierarchy = newData.hierarchy || [];
                    state.customFields = newData.custom_fields || [];
                    renderAll();
                    isApplyingRemoteChange = false;

                    updateCloudStatusUI('connected', '雲端同步中');
                    showToast('🔄 Realtime: 收到其他設備即時更新！', 'info', 3000);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Supabase Realtime WebSocket 長連線已建立！');
                    updateCloudStatusUI('connected', '雲端同步中');
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn('Realtime 連線中斷');
                }
            });
    }

    function setupSupabaseListeners() {
        const modal = document.getElementById('supabaseModal');
        const openBtn = document.getElementById('supabaseConfigBtn');
        const closeBtn = document.getElementById('closeSupabaseModalBtn');
        const saveBtn = document.getElementById('saveSupabaseConfigBtn');
        const disconnectBtn = document.getElementById('disconnectSupabaseBtn');
        const copySqlBtn = document.getElementById('copySqlBtn');

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                document.getElementById('sbUrlInput').value = localStorage.getItem('cnc_supabase_url') || '';
                document.getElementById('sbKeyInput').value = localStorage.getItem('cnc_supabase_key') || '';
                modal.classList.remove('hidden');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        }

        if (copySqlBtn) {
            copySqlBtn.addEventListener('click', () => {
                const sql = document.getElementById('sqlSnippet').textContent;
                navigator.clipboard.writeText(sql).then(() => {
                    showToast('SQL 語法已複製！請至 Supabase 後台 SQL Editor 貼上執行', 'success');
                });
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const url = document.getElementById('sbUrlInput').value.trim();
                const key = document.getElementById('sbKeyInput').value.trim();

                if (!url || !key) {
                    showToast('請完整輸入 Supabase Project URL 與 API Key', 'warning');
                    return;
                }

                localStorage.setItem('cnc_supabase_url', url);
                localStorage.setItem('cnc_supabase_key', key);

                modal.classList.add('hidden');
                showToast('正在驗證並連線 Supabase...', 'info');

                initSupabase();
            });
        }

        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                if (confirm('確定要中斷雲端連線並切換回純本機離線模式？')) {
                    if (realtimeChannel && supabaseClient) {
                        supabaseClient.removeChannel(realtimeChannel);
                    }
                    supabaseClient = null;
                    realtimeChannel = null;
                    localStorage.removeItem('cnc_supabase_url');
                    localStorage.removeItem('cnc_supabase_key');
                    modal.classList.add('hidden');
                    updateCloudStatusUI('offline', '本機模式');
                    showToast('已切換為純本機離線模式', 'info');
                }
            });
        }
    }

})();

