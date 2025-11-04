// shelters.js
// ============================
// グローバル変数とデバウンス管理
// ============================
let expandedCard = null;
let currentElevation = null; // 現在地の標高を保存
let currentMarkers = []; // 既存マーカーを管理する配列
let apiTimeout;          // 💡 デバウンス用のタイマーID

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
          const elevationValue = Number(results[0].elevation);
          console.log("標高:", elevationValue.toFixed(1) + 'm');
          resolve(elevationValue);
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
async function loadSheltersFromAPI(lat, lng, radiusKm) {
    if (lat === 0 && lng === 0) {
        console.warn("⚠️ 現在地の座標が未設定のため、APIリクエストをスキップします。");
        return []; 
    }

    const params = new URLSearchParams({
        lat: lat,
        lng: lng,
        radius: radiusKm
    });
    const apiUrl = `php/getShelters.php?${params.toString()}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`APIリクエスト失敗: ${response.status} ${response.statusText}`);
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

        if (shelter.elevation !== undefined && !isNaN(Number(shelter.elevation))) {
            const elevationValue = Number(shelter.elevation);
            elevationText = `${elevationValue.toFixed(1)} m`;
            diffText = getElevationDifferenceText(elevationValue, currentElevation);
        } else {
            diffText = "（現在地の標高を取得中...）";
        }

        extraInfo = `
            ${labels.elevation}: ${elevationText}<br>
            ${diffText}<br>
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

    const sortedShelters = shelters.sort((a, b) => a.distance - b.distance).slice(0, 5);
    if (sortedShelters.length === 0) {
        listDiv.innerHTML = "<li>指定範囲内に避難所は見つかりませんでした。</li>";
        return;
    }

    sortedShelters.forEach(shelter => {
        const card = document.createElement('div');
        card.className = 'shelter-card';
        card.innerHTML = getShelterCardHTML(shelter, false); 

        card.onclick = () => toggleCard(card, shelter, onClickCallback);
        listDiv.appendChild(card);
    });
}


function addShelterMarkers(map, shelters, onClickCallback) {
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
            const card = Array.from(document.querySelectorAll('.shelter-card')).find(c => c.querySelector('strong')?.textContent === shelter.name);
            if (card) toggleCard(card, shelter, onClickCallback);
            else onClickCallback(shelter);
        });

        marker.addListener("dblclick", () => onClickCallback(shelter));
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
        onClickCallback(shelter);
    }
}


async function expandCard(card, shelter) {
    const lang = window.currentLang || "ja";
    const labels = getLabels(lang);

    card.classList.add('expanded');
    card.innerHTML = getShelterCardHTML(shelter, true, labels);

    if (shelter.elevation === undefined || isNaN(Number(shelter.elevation))) {
        try {
            const elevation = await getElevation(shelter.lat, shelter.lng);
            shelter.elevation = Number(elevation); // ← 常に数値型で保持
            if (expandedCard === card) card.innerHTML = getShelterCardHTML(shelter, true, labels);
        } catch (err) {
            console.error("標高取得失敗:", err);
            shelter.elevation = null;
            if (expandedCard === card) card.innerHTML = getShelterCardHTML(shelter, true, labels);
        }
    }
}


function collapseCard(card, shelter) {
    const lang = window.currentLang || "ja";
    const labels = getLabels(lang);
    card.classList.remove('expanded');
    card.innerHTML = getShelterCardHTML(shelter, false, labels);
}


// ============================
// 距離計算
// ============================
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
// メイン処理
// ============================
async function initShelterCards(map, onClickCallback) {
    let latToUse = currentLat;
    let lngToUse = currentLng;

    if (latToUse === 0 && lngToUse === 0) {
        const center = map.getCenter();
        latToUse = center.lat();
        lngToUse = center.lng();
        console.warn("現在地がまだ取得できていないため、地図の中心を現在地として距離と検索を行います。");
    }

    try {
        console.log(`📡 APIから避難所データを取得中... (Lat:${latToUse.toFixed(4)}, Lng:${lngToUse.toFixed(4)})`);
        const shelters = await loadSheltersFromAPI(latToUse, lngToUse, SEARCH_RADIUS_KM);
        
        if (shelters.length === 0) {
            document.getElementById("shelter-list").innerHTML = "<li>指定範囲内に避難所は見つかりませんでした。</li>";
            addShelterMarkers(map, [], onClickCallback);
            return;
        }

        shelters.forEach(s => {
            s.distance = calculateDistance(latToUse, lngToUse, s.lat, s.lng);
        });

        addShelterMarkers(map, shelters, onClickCallback); 
        createShelterCards(shelters, onClickCallback); 

    } catch (error) {
        console.error("避難所データの最終処理に失敗しました:", error);
    }
}


// ============================
// 現在地更新時処理
// ============================
if (typeof window.setSheltersPosition === "undefined") {
    window.setSheltersPosition = (pos) => {
        currentLat = pos.lat;
        currentLng = pos.lng;

        getElevation(pos.lat, pos.lng)
            .then(elev => {
                currentElevation = elev;
                console.log(`現在地標高: ${elev.toFixed(1)}m`);
            })
            .catch(err => console.warn("現在地の標高取得失敗:", err));

        clearTimeout(apiTimeout);
        apiTimeout = setTimeout(() => {
            console.log("📍 位置情報更新: 避難所データ再ロード (デバウンス後)");
            if (window.map) initShelterCards(window.map, window.showRouteToShelter);
        }, 500);
    }
}


// ============================
// 地図リスナー設定
// ============================
function setupMapListeners(map, initialLat, initialLng, onClickCallback) {
    currentLat = initialLat;
    currentLng = initialLng;
    
    window.map = map;
    window.showRouteToShelter = onClickCallback;

    let firstLoadListener = map.addListener('idle', function firstLoad() {
        console.log("初回 idle: 避難所データロード開始");
        initShelterCards(map, onClickCallback);
        google.maps.event.removeListener(firstLoadListener);
        console.log("⚠️ 注意: 地図移動による避難所データ再ロードは廃止しました。再ロードは位置情報更新時のみ行われます。");
    });
}
