// shelters.js
// ============================
// グローバル変数とデバウンス管理
// ============================
let expandedCard = null;
let currentElevation = null; // 現在地の標高を保存
let currentMarkers = []; // 既存マーカーを管理する配列
let apiTimeout;          // 💡 デバウンス用のタイマーID

// ユーザーの現在地を保持する変数（map.jsから更新される）
// initMap() または startTracking() 成功時に正確な値に更新される
let currentLat = 0; 
let currentLng = 0;
// 避難所検索の半径（キロメートル）
const SEARCH_RADIUS_KM = 5; 


// ============================
// 標高取得
// ============================
function getElevation(lat, lng) {
  return new Promise((resolve, reject) => {
    const elevator = new google.maps.ElevationService();
    elevator.getElevationForLocations(
      { locations: [{ lat: lat, lng: lng }] },
      (results, status) => {
        if (status === "OK" && results[0]) {
          console.log("標高:", results[0].elevation.toFixed(1) + 'm');
          resolve(results[0].elevation);
        } else {
          console.error("標高取得失敗:", status);
          reject(status);
        }
      }
    );
  });
}

// ============================
// 標高差を計算して表現する関数
// ============================
function getElevationDifferenceText(shelterElevation, currentElevation) {
    if (shelterElevation === undefined) return "取得中...";
    if (currentElevation === null || currentElevation === undefined) return "（現在地の標高を取得中...）";

    const diff = shelterElevation - currentElevation;

    if (Math.abs(diff) < 0.1) {
        return "（現在地とほぼ同じ高さ）";
    } else if (diff > 0) {
        return `（現在地より ${diff.toFixed(1)} m 高い）`;
    } else {
        return `（現在地より ${Math.abs(diff).toFixed(1)} m 低い）`;
    }
}


// ============================
// APIデータ取得
// ============================
// mapのBoundsではなく、中心座標と半径でデータを取得する
async function loadSheltersFromAPI(lat, lng, radiusKm) {
    
    // 1. 座標が有効かチェック
    if (lat === 0 && lng === 0) {
        console.warn("⚠️ 現在地の座標が未設定のため、APIリクエストをスキップします。");
        return []; 
    }
    
    // 2. PHP APIへのリクエストURLを構築 (サーバー側もこのパラメータに対応が必要です)
    const params = new URLSearchParams({
        lat: lat,
        lng: lng,
        radius: radiusKm // サーバー側でこの半径内のデータをフィルタリング
    });
    
    const apiUrl = `php/getShelters.php?${params.toString()}`;

    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`APIリクエスト失敗: ${response.status} ${response.statusText}`);
        }
        
        // 3. JSONデータを受け取る
        const shelters = await response.json(); 
        
        return shelters;
        
    } catch (error) {
        console.error("避難所データのロード中にエラーが発生しました:", error);
        document.getElementById("shelter-list").innerHTML = "<li>❌ 避難所データの取得中にエラーが発生しました。</li>";
        return [];
    }
}


// ============================
// UI生成ヘルパー
// ============================
function getLabels(lang = "ja") {
    const labels = {
        ja: { distance: "直線距離", elevation: "標高", hazard: "対象となる災害種別" },
        zh: { distance: "直线距离", elevation: "海拔", hazard: "适用灾害类型" },
        en: { distance: "Distance", elevation: "Elevation", hazard: "Applicable hazards" },
        es: { distance: "Distancia en línea recta", elevation: "Altitud", hazard: "Tipos de desastres aplicables" },
    };
    const langKey = window.currentLang || "ja";
    return labels[langKey] || labels.ja;
}

function getShelterCardHTML(shelter, expanded = false, labels = getLabels()) {
    let extraInfo = "";

    if (expanded) {
        let elevationText = "取得中...";
        let diffText = "";
        let hazardText = shelter.disasterType || "不明";

        if (shelter.elevation !== undefined) {
            elevationText = `${shelter.elevation.toFixed(1)} m`;
            diffText = getElevationDifferenceText(shelter.elevation, currentElevation);
        } else {
            diffText = "（現在地の標高を取得中...）";
        }

        extraInfo = `
            ${labels.elevation}: ${elevationText}<br>
            ${diffText}<br><br>
            ${labels.hazard}: ${shelter.disasterType || "不明"}<br>
        `;
    }

    return `
        <strong>${shelter.name}</strong><br>
        <small>
        ${shelter.address}<br>
        ${shelter.distance !== undefined ? `${labels.distance}: ${shelter.distance.toFixed(2)} km<br>` : ''}
        ${extraInfo}
        </small>
    `;
}

function createShelterCards(shelters, onClickCallback) {
    const listDiv = document.getElementById("shelter-list");
    listDiv.innerHTML = "";

    // 距離でソートし、上位5件を表示
    const sortedShelters = shelters.sort((a, b) => a.distance - b.distance).slice(0, 5);
    
    if (sortedShelters.length === 0) {
        listDiv.innerHTML = "<li>指定範囲内に避難所は見つかりませんでした。</li>";
        return;
    }

    sortedShelters.forEach(shelter => {
        const card = document.createElement('div');
        card.className = 'shelter-card';
        card.innerHTML = getShelterCardHTML(shelter, false); 

        card.onclick = () => {
            toggleCard(card, shelter, onClickCallback);
        };

        listDiv.appendChild(card);
    });
}

function addShelterMarkers(map, shelters, onClickCallback) {
    // 既存マーカーを削除
    currentMarkers.forEach(marker => marker.setMap(null));
    currentMarkers = [];

    shelters.forEach(shelter => {
        
        const iconElement = document.createElement('img');
        iconElement.src = 'img/pin1.png'; 
        iconElement.style.width = '96px'; 
        iconElement.style.height = '96px';
        
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: shelter.lat, lng: shelter.lng },
            map: map,
            title: shelter.name,
            content: iconElement, 
        });

        marker.addListener("click", () => {
            // カードを見つけて展開
            const card = Array.from(document.querySelectorAll('.shelter-card')).find(c => c.querySelector('strong')?.textContent === shelter.name);
            if (card) toggleCard(card, shelter, onClickCallback);
            else onClickCallback(shelter); 
        });

        marker.addListener("dblclick", () => {
            onClickCallback(shelter); 
        });
        
        currentMarkers.push(marker);
    });
}

function toggleCard(card, shelter, onClickCallback) {
    if (expandedCard && expandedCard !== card) collapseCard(expandedCard, expandedCard.shelterData);

    if (card.classList.contains('expanded')) {
        collapseCard(card, shelter);
        expandedCard = null;
    } else {
        expandCard(card, shelter);
        expandedCard = card;
        card.shelterData = shelter; 
        // 経路表示をトリガー
        onClickCallback(shelter); 
    }
}

async function expandCard(card, shelter) {
    const lang = window.currentLang || "ja";
    const labels = getLabels(lang);

    card.classList.add('expanded');

    // まず取得中を表示
    card.innerHTML = getShelterCardHTML(shelter, true, labels);

    if (shelter.elevation === undefined) {
        try {
            const elevation = await getElevation(shelter.lat, shelter.lng);
            shelter.elevation = elevation.toFixed(1);

            if (expandedCard === card) {
                card.innerHTML = getShelterCardHTML(shelter, true, labels);
            }
        } catch (err) {
            console.error("標高取得失敗:", err);
            shelter.elevation = "取得失敗";
            if (expandedCard === card) {
                card.innerHTML = getShelterCardHTML(shelter, true, labels);
            }
        }
    }
}

function collapseCard(card, shelter) {
    const lang = window.currentLang || "ja";
    const labels = getLabels(lang);

    card.classList.remove('expanded');
    card.innerHTML = getShelterCardHTML(shelter, false, labels);
}

// --- 2点間の距離を計算（ハーサイン公式） --- (変更なし)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


// ============================
// メイン処理 (現在地中心のデータ取得に対応)
// ============================
async function initShelterCards(map, onClickCallback) {
    
    // 現在地が未設定の場合は、地図の中心をフォールバックとして使用
    let latToUse = currentLat;
    let lngToUse = currentLng;

    if (latToUse === 0 && lngToUse === 0) {
        const center = map.getCenter();
        latToUse = center.lat();
        lngToUse = center.lng();
        console.warn("現在地がまだ取得できていないため、地図の中心を現在地として距離と検索を行います。");
    }

    try {
        // 1. APIから現在地中心の避難所データを取得
        console.log(`📡 APIから避難所データを取得中... (Lat:${latToUse.toFixed(4)}, Lng:${lngToUse.toFixed(4)})`);
        // 現在地と固定半径を渡す
        const shelters = await loadSheltersFromAPI(latToUse, lngToUse, SEARCH_RADIUS_KM);
        
        if (shelters.length === 0) {
            console.log("検索範囲内に避難所データはありません。");
            document.getElementById("shelter-list").innerHTML = "<li>指定範囲内に避難所は見つかりませんでした。</li>";
            addShelterMarkers(map, [], onClickCallback); 
            return;
        }

        // 2. ユーザー現在地からの距離を計算
        shelters.forEach(s => {
            s.distance = calculateDistance(latToUse, lngToUse, s.lat, s.lng);
        });

        // 3. マーカーとカードを表示 (カードは距離でソートされた上位5件)
        addShelterMarkers(map, shelters, onClickCallback); 
        createShelterCards(shelters, onClickCallback); 

    } catch (error) {
        console.error("避難所データの最終処理に失敗しました:", error);
    }
}


// ============================
// 最終的な地図イベントリスナーの設定
// ============================
// map.jsのコールバックで、現在の位置情報を更新するためにグローバルな関数を定義
// map.jsは updateSheltersPosition(pos) を通じてこれを呼び出す
if (typeof window.setSheltersPosition === "undefined") {
    window.setSheltersPosition = (pos) => {
        currentLat = pos.lat;
        currentLng = pos.lng;

        // 現在地の標高を更新
        getElevation(pos.lat, pos.lng)
            .then(elev => {
            currentElevation = elev;
            console.log(`現在地標高: ${elev.toFixed(1)}m`);
            })
            .catch(err => console.warn("現在地の標高取得失敗:", err));

        // 現在地が更新されたら、避難所データを再ロードする（デバウンス適用）
        clearTimeout(apiTimeout);
        apiTimeout = setTimeout(() => {
            console.log("📍 位置情報更新: 避難所データ再ロード (デバウンス後)");
            // mapオブジェクトはグローバル変数 map.jsで保持されていると仮定
            if (window.map) {
                initShelterCards(window.map, window.showRouteToShelter);
            }
        }, 500); // 500ms待機
    }
}

function setupMapListeners(map, initialLat, initialLng, onClickCallback) {
    currentLat = initialLat;
    currentLng = initialLng;
    
    // mapオブジェクトをグローバルに保持（map.jsが実行しない場合のため）
    window.map = map;
    window.showRouteToShelter = onClickCallback; // map.jsの関数を保存

    // 最初に一度だけデータをロードする処理 (map.getBounds()に依存しないため、初回idleで実行)
    let firstLoadListener = map.addListener('idle', function firstLoad() {
        console.log("初回 idle: 避難所データロード開始");
        
        // 初回ロードを実行
        initShelterCards(map, onClickCallback);
        
        // 初回ロードが終わったら、このリスナーは削除し、継続的なロードを設定
        google.maps.event.removeListener(firstLoadListener); 
        
        // 地図の移動・ズームによる継続的なロードは、現在地中心の検索では不要または地図の中心が変わった時のみに限定すべきです。
        // 現在地追跡中に地図を動かしても現在地は変わらないため、APIコールは不要です。
        // 地図の移動によるデータ再取得は廃止します。位置情報更新時（上記 window.setSheltersPosition 内）のみ再取得します。
        
        // map.addListener('idle', () => { ... デバウンス処理 ... }); // <-- 削除

        console.log("⚠️ 注意: 地図移動による避難所データ再ロードは廃止しました。再ロードは位置情報更新時のみ行われます。");
    });
}