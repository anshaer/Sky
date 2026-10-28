# 星空觀測儀與居民編輯器

把壓縮包內所有檔案放在 GitHub Pages 專案同一層。主頁為 `index.html`，居民編輯頁為 `editor.html`，模型目錄為 `model_gallery.html`。頁面使用網路上的 Three.js、OrbitControls、樣式與字型。

## 編輯居民並更新 GitHub

1. 開啟 `editor.html`，會自動讀取同一層的 JSON。
2. 左側搜尋天體名稱或編號，例如地球 P03、月球 S03-001、恆星 H-Ori-001。每個編號的居民名單獨立。
3. 選取居民，或按「新增居民」。可以修改編號、名字、住址、模型、網址、連結按鈕文字與說明，也可複製、刪除居民。
4. 右側模型預覽可拖曳旋轉、滾輪縮放。從模型分類及 modelId 選擇外形。
5. 按「匯出 residents.json」，把下載的檔案更新到 GitHub 同名位置。GitHub Pages 更新完成後重新整理主頁。

所有修改保留於本次編輯記憶體中，需匯出才能保存；編輯頁不會直接寫入 GitHub。JSON 匯出會檢查唯一編號、住址、模型及網址。

### 使用電腦上的 JSON

也可直接開啟本機 `editor.html`。如果瀏覽器不允許自動讀取旁邊的 JSON，按「匯入 JSON」，一次選取自己的 `models.json`、`bodies.json`、`residents.json`，需要編輯工具箱時再加 `toolbox.json`。請同時保留 HTML 旁邊的 editor.js 與 model-renderer.js。3D 預覽需要網路載入 Three.js。

### 天體模型

選好天體後按「預覽／設定天體模型」，變更 modelId，完成後匯出 `bodies.json`。只是調整居民模型時，不需要匯出 bodies.json。

### 工具箱

編輯頁左側切換「工具箱」，可編輯每個工具項目的模型、名字、網址、按鈕文字與說明，完成後匯出 `toolbox.json`。

## 每位居民的連結按鈕文字

在編輯器的「開啟網頁按鈕文字」欄設定，也可直接修改 JSON 的 `linkText`：

```json
{
  "id": "resident-1",
  "bodyId": "P03",
  "name": "隔壁老王",
  "modelId": "astronaut-30",
  "url": "https://example.com/",
  "linkText": "參觀老王的頻道 ↗",
  "description": "居民自己的說明。"
}
```

主頁點居民名字或漂浮模型會聚焦該居民，更新說明欄；說明欄的網站按鈕依該居民的 linkText 顯示。留空則使用「開啟名字的網頁」。不會彈出前往視窗；按資訊卡連結才開新分頁。toolbox.json 的 links 項目也適用。

## 模型庫造型數

| 類別 | 數量 | 編號 |
| --- | --- | --- |
| 人造衛星 | 20 | satellite-01 ～ satellite-20 |
| 天體衛星 | 20 | moon-01 ～ moon-20 |
| 天體，不含太陽 | 20 | planet-01 ～ planet-20 |
| 太空人 | 30 | astronaut-01 ～ astronaut-30 |
| 太空遺失物／工具 | 20 | debris-01 ～ debris-20 |
| 太空船 | 15 | ship-01 ～ ship-10，以及 ship-original-1 ～ 5 |

此外保留原有太陽、標準行星與各歷史任務模型，合計 183 款。這些數字是可選的**模型造型數**，不會憑空增加太陽系實際天體。

天體模型包含海洋、沙漠、森林、冰雪、氣態條帶、熔岩、環狀等樣式；天體衛星包含撞擊坑、冰裂、雙色、雙葉等樣式。遺失物包含井蓋、防熱毯、相機、工具包、腕鏡、扳手、鐵鎚、電鑽、鉗子、螺栓、手套、頭盔、電纜與面板等。

模型目錄與編輯器共用主頁的 `model-renderer.js`，避免模型預覽與主頁使用不同的建立方法。模型參數集中在 `models.json`。

## 檔案用途

| 檔案 | 用途 |
| --- | --- |
| index.html | 星空主頁 |
| editor.html、editor.js | 居民／工具箱／天體介紹、距離與模型編輯頁 |
| model_gallery.html | 全模型分類預覽 |
| model-renderer.js | 主頁、編輯器及目錄共用的模型程式，必須一起上傳 |
| models.json | 183 款模型參數，version 1 |
| bodies.json | 1003 個天體項目的編號、模型、所屬天體、顏色、自訂介紹與相對距離，version 2 |
| residents.json | 每位居民的獨立住址、模型、連結、按鈕字及說明，version 2 |
| toolbox.json | 工具箱連結與模型，version 2 |
| descriptions.json | 天體／星座說明，version 1 |

## 編號與獨立住址

P03 為地球，S03-001 為月球，A03-001 為 ISS，H-Ori-001 為獵戶座內的一個星圖項目。完整對照見 bodies.json。bodyId 決定居民住在哪顆天體，modelId 決定外形，兩者互相獨立。星球、衛星、人造物與恆星都有自己的完整名單；沒有居民就是 0，不借用其他天體名單。編輯居民 id 時請保持唯一。

每次選取天體，漂浮組只從該天體名單不重複抽最多五位；完整名單仍顯示所有居民。residents.json 和 toolbox.json 的 `floating.refreshSeconds` 分別控制換批時間，預設 60 秒，可設 5～86400 秒。近看居民期間保留正在追蹤的模型，返回天體後恢復輪換。

## 直接改模型參數

models.json 的每個模型項目有 name、category、generator、scale、rotation 等欄位。可先複製一款模型、換一個模型編號，再在 bodies.json 或 residents.json 填入新的 modelId。

- parts：以零件組合，零件支援 box、sphere、cylinder、cone、torus、ring、icosahedron、octahedron、lathe 及 buffer。
- sphere：球形天體，可設定 color、segments、roughness、metalness、surface 與 rings。
- moon：衛星表面，可設定 surface 的 pattern、seed、craterCount、crackCount、deform 及 twin。
- 零件 position／scale 是三軸陣列；rotation 為弧度，約 1.5708 為 90 度。
- 模型大小會乘上該天體或漂浮居民的展示尺寸。body.color 是模型未指定固定顏色時的天體顏色。

## 主頁原有功能

同一母星的天然衛星與全部人造物合併在同一近看選單。無普通行星母星的探測器歸在太陽。星座標籤沿視野移動，名單與避讓位置每五秒重排。點衛星時主畫面近看它自己，左上小總覽保留母星關係。左／右鍵旋轉、滾輪縮放、關閉平移。版權固定頁底。軌道、尺寸、表面與歷史物件位置為展示示意。

## 更新既有網站

這次請一併更新 HTML、editor.js、model-renderer.js 及 models.json。原有居民與工具箱 JSON 可以保留，編輯器匯入後可加入 linkText、modelId 等欄位再匯出；不必用範例名單覆蓋自己的資料。bodies.json 編號保持不變，新增顏色資料可讓預覽更一致。原有 descriptions.json 可繼續使用。

範例網址 example.com 請自行替換。所有 JSON 需使用雙引號，最後一筆後面不要加逗號。


## 本次更新：天體介紹、距離、居民往返、彗星與搜尋

- `index.html`：主頁新功能、載入提示與居民搜尋。
- `editor.html`、`editor.js`：天體介紹／相對距離／居民往返編輯。
- `bodies.json`：收錄三顆示意彗星 C-001、C-002、C-003。若已有自訂資料，請保留原檔設定並加入新彗星三筆，或匯入編輯器後自行整理再匯出。主頁即使沿用舊版 bodies.json，也會顯示預設彗星。
- 其他檔案維持相容；請保留自己的 `residents.json`、`toolbox.json`、`descriptions.json`，不要用範例資料覆蓋。

### 編輯天體介紹與距離
選擇天體，按「天體介紹／距離／模型」。介紹可自由寫同事趣事；修改後匯出 `bodies.json`。
`description` 為天體介紹，優先於 `descriptions.json` 的同一天體介紹；未設定時仍使用原來介紹，空字串代表刻意留白。星座介紹仍由 `descriptions.json` 設定。
`distanceScale` 是衛星／人造物與母星的展示距離倍數，1 是原始距離，0.5 較近、2 較遠，範圍 0.1–20，會留出避免碰撞的最小間距。天然衛星與依附行星的人造物採母星表面外間距縮放，日心人造物採日心半徑縮放。這不是公里或實際星曆。

### 設定居民兩地往返
選擇居民，將「居住／移動方式」改為「兩地往返」。住址 `bodyId` 是出發地，填入目的天體編號和單程秒數（10–86400，預設120），匯出 `residents.json`。

```json
{"id":"example-traveler","name":"隔壁老王","bodyId":"P03","modelId":"ship-01","url":"","description":"地月通勤中","travel":{"enabled":true,"destinationId":"S03-001","durationSeconds":120}}
```

同一居民只需一筆，兩地完整名單都會顯示；依當前往返方向，人名標示「出發中」或「抵達中」。兩地切換時可點擊同一人聚焦飛船，說明欄可返回任一端點。浮動模型維持最多5位、原本的輪替秒數不變；不在當批的居民仍可從完整名單或搜尋選取。往返使用實際經過時間，與星球公轉的暫停和速度設定分開；重新整理不會每次從頭出發。目的地尚未展開的衛星以母星旁預估位置作展示，展開後使用實際模型位置。停用往返後居民只出現在住址天體。

### 彗星
哈雷、海爾－波普、百武三顆彗星使用不同偏心率與傾角的壓縮橢圓繞日軌道，以太陽為焦點；靠近太陽時移動較快，彗尾較明顯，尾巴大致背向太陽。可從探測器頁籤或天體編號選取、編輯介紹與安排居民。造型、軌道與速度為娛樂示意，不是即時天文位置。

主頁標題區現在可搜尋全部居民姓名，搜尋結果會標示住址／往返目的地，點擊即可聚焦。


## 2026-10-29 更新：真實彗星、距離重排與紀念收藏

### 要更新的檔案
`index.html`、`editor.html`、`editor.js`、`models.json`、`bodies.json`、`residents.json`。其他執行檔與 JSON 維持相容。
若 GitHub 上已有自訂資料，請保留自己的居民與天體內容，合併以下新增紀錄；不要以範例檔覆蓋自訂名單。既有天體編號與既有居民編號均未更動。

### 三顆彗星
| 編號 | 名稱 | 造型 |
| --- | --- | --- |
| C-001 | 哈雷彗星 | 標準彗核、彗髮與彗尾 |
| C-002 | 海爾－波普彗星 | 細藍色離子尾＋彎曲金白色塵埃尾 |
| C-003 | 百武彗星 | 加長青藍彗尾，基本長度約為標準的3.2倍 |

沿用原本 C-001～C-003 編號及內部 key，原有居民住址繼續有效。軌道經過壓縮，沒有使用真實日期的即時星曆；尾巴長度是造型參數。彗尾朝背向太陽的方向，雙尾的塵埃尾另沿行進方向後彎。

### 全體位置與距離
- 真實行星使用平均日心距離，以 `42 + 130 × ln(1 + AU)` 壓縮成畫面半徑；日心遠近排序保持正確，行星大小另採辨識比例。
- 158 顆既有天然衛星均依 NASA/JPL 平均軌道資料重排。各母星的近遠順序不再依加入清單的順序決定；距離經母星半徑與對數壓縮，再留出可辨識的軌道間距。`bodies.json` 的 `orbit` 保留平均公里距離、週期及傾角，主頁近看顯示平均公里距離。
- `distanceScale` 仍可自訂展示間距。若為個別物件設不同倍數，遠近排序可被使用者刻意改變。
- SOHO 放在地球朝向太陽的一側（L1 附近），與地球同步繞日；JWST 在地球背日側（L2 附近），不當作普通繞地圓軌道。L1/L2 間距為辨識而放大。
- 蓋亞保留「觀測任務時期的 L2」位置，清楚標為歷史展示；不是2025年退休後的即時軌道。
- 靠行星的人造物在各自母星附近；日心任務用日心展示軌道；航海家、先鋒與新視野號保留深空方向，不畫成繞太陽的循環運動。深空半徑為代表性展示值，非目前精確距離。
- 尚未展開的衛星與已展開的衛星共用位置計算，因此居民飛向衛星時，切換近看不會使目的地跳到另一側。

### 九位移動居民
新增 `traveler-01`～`traveler-09`，3位從地球 P03、3位從火星 P04、3位從木衛二 S05-002 出發。各人目的地、單程秒數、模型與介紹皆可在編輯器改。

| 編號 | 出發 | 目的 |
| --- | --- | --- |
| traveler-01 | 地球 | 火星 |
| traveler-02 | 地球 | 月球 |
| traveler-03 | 地球 | 木衛二 |
| traveler-04 | 火星 | 地球 |
| traveler-05 | 火星 | 木衛二 |
| traveler-06 | 火星 | 月球 |
| traveler-07 | 木衛二 | 地球 |
| traveler-08 | 木衛二 | 火星 |
| traveler-09 | 木衛二 | 月球 |

### 虛構收藏與固定居民
| 編號 | 收藏 | 母星／住址 | 模型 |
| --- | --- | --- | --- |
| F-WATNEY | 馬克·瓦特尼 | 火星 P04 | 橘色太空人 |
| F-COOPER | 約瑟·庫珀 | 土星 P06 | 白色太空人 |
| F-SULETTA | 蘇萊塔·墨丘利 | 水星 P01 | 白藍人形機甲，V字天線 |
| F-LIMA | 利馬計畫探險船 | 海王星 P08 | 桁架、引擎、天線長程船 |
| resident-rolf-robertson | 羅爾夫·羅伯遜 | 月球 S03-001 | 月球太空人，固定顯示 |

虛構衛星在衛星清單中獨立選取、配置居民與修改介紹。模型均為簡化致敬造型。羅爾夫放在 `residents.json`，`alwaysVisible: true` 保留一個漂浮名額，不被隨機輪替移除；編輯器新增「固定顯示居民模型」勾選項。每次仍最多5個漂浮模型。

### 冥王星外紀念區
- P-KSP：Sun（坎巴拉太空計畫）。衛星為 KSP-MOHO、KSP-EVE、KSP-KERBIN、KSP-DUNA、KSP-DRES、KSP-JOOL、KSP-EELOO。
- P-3BODY：E（三體紀念行星）。衛星為 3BODY-SUN1、3BODY-SUN2、3BODY-SUN3，使用不同色的發光造型。
- 兩組均位於冥王星展示軌道外，每個天體有獨立模型及住址編號。依收藏設定建立層級，不是作品原設定或真實三體引力模擬。

### 距離與彗星資料來源
- NASA/JPL 衛星平均軌道參數：https://ssd.jpl.nasa.gov/sats/elem/ （此表不是即時星曆；Magaclite/Megaclite、Philophrosyn/Philophrosyne 名稱做對照）
- NASA 行星位置：https://science.nasa.gov/solar-system/planet-sizes-and-locations-in-our-solar-system/
- SOHO 軌道：https://soho.nascom.nasa.gov/about/orbit.html
- 哈雷彗星：https://science.nasa.gov/solar-system/comets/1p-halley/
- 海爾－波普彗星雙尾：https://spdf.gsfc.nasa.gov/pub/documents/archived_websites/pwg.gsfc.nasa.gov/stargaze/Scomets.htm
- 百武彗星長尾：https://www.esa.int/Newsroom/Press_Releases/Ulysses_feels_the_brush_of_a_comet_s_tail
