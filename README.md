# Web CNC 刀具與製程管理系統 (CNC Tool & Process Management System)

> 專為現代精密機械加工與智慧車間打造的輕量化、純前端、無伺服器依賴 (Serverless) 的 CNC 刀具庫存、工件配刀 (Tooling Setup) 與製程差異比對系統。

---

## 目錄
1. [系統總體架構](#1-系統總體架構)
2. [資料模型與儲存規範 (Data Schema)](#2-資料模型與儲存規範-data-schema)
3. [核心功能模組詳解](#3-核心功能模組詳解)
4. [切削動力學運算模組](#4-切削動力學運算模組)
5. [現場對刀單 (Presetter Sheet) 與輸出系統](#5-現場對刀單-presetter-sheet-與輸出系統)
6. [安全性與健壯性設計](#6-安全性與健壯性設計)
7. [檔案結構與進入點](#7-檔案結構與進入點)

---

## 1. 系統總體架構

本系統採用 **單向資料流 (Unidirectional Data Flow)** 與 **純客戶端驅動架構**，前端不依賴複雜的重型框架編譯步驟，使用標準 Web API 即可於任何現場 Windows 工控機、平版或離線終端運行。

```
+-----------------------------------------------------------------------------------+
|                                 使用者介面 (UI Layer)                              |
|   +-------------------+  +----------------------------------------------------+   |
|   | 機台/工件階層導覽樹 |  | 五大主頁籤視圖 (Tab Views):                         |   |
|   | (Hierarchy Tree)  |  | 1. 刀具總表 (Master Tool Library)                  |   |
|   | - 機台增刪改       |  | 2. 工件配刀工作區 (Part Tooling Setup + Drag/Drop)  |   |
|   | - 工件/工序增刪改  |  | 3. 機器現況刀具表 (Machine Tool Status)            |   |
|   +-------------------+  | 4. 刀具差異比對表 (Process Diff Comparison)         |   |
|                          | 5. 動態自訂欄位擴充 (Custom Fields Manager)        |   |
|                          +----------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
                                         │  事件觸發 / DOM 互動
                                         ▼
+-----------------------------------------------------------------------------------+
|                                核心邏輯引擎 (Core Engine)                         |
|   - 全域狀態管理中心 (Application State: state.masterTools, hierarchy, customFields)   |
|   - 刀槽配置與拖拉映射處理 (Drag & Drop Engine / Slot Assignment)                   |
|   - 切削參數動力學計算器 (ISO Speed, Feed, MRR Calculator)                        |
|   - 車間現場對刀單引擎 (Presetter Sheet Renderer & html2pdf Driver)                |
|   - 安全跳脫與防禦 (XSS Sanitizer & escapeHtml)                                    |
|   - 輕量非阻塞回饋系統 (Toast Notification Service)                               |
+-----------------------------------------------------------------------------------+
                     │                                         │
        Excel / JSON 匯出匯入                                永續化儲存 (雙軌支援)
                     ▼                                         ▼
+----------------------------------------+   +--------------------------------------+
|       外部檔案介面 (File I/O Layer)     |   |   1. 雲端資料庫 (Supabase Postgres)  |
|   - SheetJS (XLSX/CSV 批次解析與匯出)  |   |      * Realtime WebSocket 即時同步   |
|   - 匯入標準 Excel 範本自動生成器        |   |      * 全廠多機多螢幕共享資料庫       |
|   - 全系統 JSON 結構快照備份與還原      |   |   2. 客戶端本地快取 (LocalStorage)   |
+----------------------------------------+   |      * 斷網自動離線降級保護          |
                                             +--------------------------------------+
```

---

## 1.1 雲端多機即時連線 (Supabase Realtime)

系統已內建 **Supabase Serverless Cloud DB** 介面：
1. **零後端部署**：直接在瀏覽器呼叫 Supabase Client，多台平板/電腦共用雲端 PostgreSQL。
2. **WebSocket Realtime 廣播**：現場任何一台設備修改刀具、更換刀槽或調整偏置，所有其他已開啟網頁的設備會在數毫秒內**自動刷新**，完全免手動重新整理。
3. **離線自動降級 (Offline Fallback)**：未設定雲端或現場網路斷線時，100% 自動無縫改用瀏覽器本地快取，待重新連線時再次同步。

## 2. 資料模型與儲存規範 (Data Schema)

系統主要依賴三個核心狀態物件：

### 2.1 刀具總表實體 (Master Tool Object)
```typescript
interface MasterTool {
  id: string;               // 唯一刀具編號 (例: T-EM-010)
  name: string;             // 刀具名稱與規格描述
  type: string;             // 類型 (立銑刀, 球頭銑刀, 鑽頭, 絲攻, 面銑刀, 倒角刀)
  d: number;                // 刀具標稱外徑 (mm)
  l: number;                // 刀具全長/刃長 (mm)
  z: number;                // 刃數 (Flutes)
  material: string;         // 材質 (Carbide, HSS-E, CBN, PCD)
  coating: string;          // 鍍膜 (AlCrN, TiAlN, DLC, 無)
  rpm: number;              // 建議主軸轉速 (RPM)
  feed: number;             // 建議進給速度 F (mm/min)
  fz: number;               // 每刃進給 (mm/tooth)
  coolant: string;          // 冷卻方式 (水溶性切削液, 切削油, 高壓吹氣, MQL)
  stock: number;            // 現有庫存數量
  safety: number;           // 安全庫存水位
  status: string;           // 狀態 (在庫, 使用中, 需補貨, 修磨中, 報廢)
  customData: Record<string, any>; // 動態自訂擴充屬性 (Key-Value)
}
```

### 2.2 機台與工件配刀階層 (Hierarchy Tree Object)
```typescript
interface MachineNode {
  id: string;               // 機台唯一識別碼 (例: mach-1)
  name: string;             // 機台名稱/型號 (例: VMC-850A)
  type: 'machine';
  children: PartNode[];     // 機台擁有的工件加工專案
}

interface PartNode {
  id: string;               // 工件唯一識別碼 (例: part-101)
  name: string;             // 工件料號與工序 (例: Part-A101_OP10)
  type: 'part';
  parentId: string;         // 所屬機台 ID
  slots: ToolSlot[];        // 刀庫各刀槽配置清單
}

interface ToolSlot {
  slotNo: string;           // 刀號 (T01, T02, ...)
  offsetH: number;          // 長度補償號 (H01)
  offsetD: number;          // 半徑補償號 (D01)
  toolId: string;           // 關聯之 Master Tool ID (空字串表示空刀位)
  overhangL: number;        // 刀具凸出刀柄長度 (Overhang Length, mm)
  comment: string;          // 加工工藝與注意事項備註
}
```

### 2.3 自訂欄位定義 (Custom Field Definition)
```typescript
interface CustomField {
  key: string;              // 欄位內部鍵值 (英文下劃線, 如: supplier)
  label: string;            // 畫面顯示名稱 (如: 供應商)
  type: 'text' | 'number' | 'select' | 'date'; // 資料型別
  unit: string;             // 單位 (如: NTD, mm)
  options: string;          // 下拉選單選項 (逗號分隔)
}
```

---

## 3. 核心功能模組詳解

### 3.1 刀具總庫 (Master Library)
- **多維度檢索與篩選**：支援即時字串匹配（Tool ID、名稱、材質、鍍膜、規格規格 D/M）以及刀具型別與庫存水位下拉過濾。
- **動態擴充欄位渲染**：新增自訂欄位後，總表自動動態插入對應的欄位標頭與資料格。
- **拖曳源 (Drag Source)**：總表每一筆刀具均支援 HTML5 Drag & Drop，可直接將整列拖曳至目標工件刀槽。

### 3.2 機台工件配刀工作區 (Part Tooling Setup)
- **階層樹狀管理**：支援左側機台展開/折疊、機台改名、機台安全刪除、工件改名、工件跨機台移動與工件刀具表複製 (Clone Tool Setup)。
- **雙向派刀與刀槽維護**：
  - 快速派刀側邊欄即時過濾與拖曳。
  - 刀槽支援長度補償 H、半徑補償 D、伸出長度與加工註釋即時寫入儲存。
  - 支援空刀位手動下拉選取與一鍵解除綁定。

### 3.3 機器現況刀具表 (Machine Tool Status)
- 自動聚合指定機台下所有工件、工序現正裝夾的刀具清單。
- 顯示刀位 T、補償 H/D、外徑、伸出長度、RPM、進給與庫存狀態，利於現場操機人員掌握機台目前刀庫佔用狀況。

### 3.4 製程刀具差異比對表 (Process Diff Comparison)
- **基準機台 vs. 目標製程**：以指定機台目前裝載的刀具為基準，與即將上機切削的新工件/工序進行集合差集與交集運算。
- **三向狀態辨識**：
  - `✓ 共用`：現況機台與目標工件皆需使用，免換刀。
  - `− 機台有 / 製程無`：目前機台裝有此刀，新製程不需使用，可卸下或保留。
  - `⊕ 製程需要 / 機台無`：新製程必備但機台未裝，**需進行換刀或對刀動作**。

---

## 4. 切削動力學運算模組

系統內建模態切削參數計算器，依據 ISO 金屬切削標準實作切削速度、主軸轉速、進給與材料去除率 (MRR) 即時連動計算：

### 核心計算公式
1. **主軸轉速 (Spindle Speed)**:
   $$n = \frac{1000 \times V_c}{\pi \times D} \quad (\text{RPM})$$
2. **切削進給速度 (Table Feed Rate)**:
   $$V_f = n \times Z \times f_z \quad (\text{mm/min})$$
3. **排屑體積率 / 金屬去除率 (Material Removal Rate, MRR)**:
   $$\text{MRR} = \frac{a_p \times a_e \times V_f}{1000} \quad (\text{cm}^3/\text{min})$$
   - $D$：刀具外徑 (mm)
   - $Z$：刃數 (Flutes)
   - $V_c$：切削速度 (m/min)
   - $f_z$：每刃進給量 (mm/tooth)
   - $a_p$：軸向切深 (Axial Depth of Cut, mm)
   - $a_e$：徑向切寬 (Radial Width of Cut, mm)

*功能亮點*：提供「一鍵複製切削數值」與「一鍵套用至刀具表單」，運算結果直接寫入編輯欄位。

---

## 5. 現場對刀單 (Presetter Sheet) 與輸出系統

為了解決傳統車間紙本溝通不良造成的撞機 (Crash) 風險，系統建構符合工廠標準作業程序的現場對刀單模態：

- **車間防錯欄位**：包含刀槽 T01~Txx、H/D 補償號、刀具型號、理論直徑、要求伸出長度、加工備註。
- **實測紀錄格**：預留現場對刀儀（光學對刀儀/雷射對刀儀）實測長度與實測刀徑跳動量（Runout）的手寫/檢驗填寫框。
- **品保流程簽核區**：內建 CAM 程式工程師、現場對刀操作員、IPQC 首件檢驗三方簽章框。
- **輸出支援**：
  - **PDF 匯出**：整合 `html2pdf.js`，以橫向 Letter/A4 輸出高解析度向量報表。
  - **原生列印**：透過 `@media print` 樣式表自動隱藏非列印元素，直接調用作業系統印表機輸出。

---

## 6. 安全性與健壯性設計

1. **XSS 全域過濾**：
   - 實作 `escapeHtml()` 函式，嚴格處理所有動態插入 DOM 的字串，防範 CSV/Excel 注入惡意代碼與符號破版。
2. **非阻塞式操作回饋 (Toast System)**：
   - 取代瀏覽器原生阻塞式 `alert()`，提供 `showToast()` 包含 `success`、`error`、`warning`、`info` 四種層級的動態通知。
3. **全系統災備防護 (JSON Snapshot)**：
   - 支援將全部機台結構、工件刀位與刀庫屬性一鍵打包為標準 JSON 下載，並提供防呆驗證還原。
4. **標準 Excel 範本下載**：
   - 匯入介面提供「下載範本」，動態讀取目前的自訂欄位架構產生即用型 `.xlsx` 檔案，降低使用者欄位輸入錯誤率。

---

## 7. 檔案結構與進入點

```
cnctool/
├── index.html       # 系統單頁應用程式主要骨架、對話框 (Modals) 與頁籤容器
├── styles.css       # 介面自訂樣式、滾動條、拖放高亮、Toast 動畫與 @media print 列印樣式
├── app.js           # 系統核心驅動引擎 (狀態管理、DOM 渲染、計算器、SheetJS/html2pdf 介接)
└── README.md        # 本技術與架構規格說明書
```
