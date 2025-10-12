let expandedCard = null;

function getElevation(lat, lng) {
  return new Promise((resolve, reject) => {
    const elevator = new google.maps.ElevationService();
    elevator.getElevationForLocations(
      { locations: [{ lat: lat, lng: lng }] },
      (results, status) => {
        if (status === "OK" && results[0]) {
          console.log("標高:", results[0].elevation);
          resolve(results[0].elevation);
        } else {
          console.error("Elevation取得失敗:", status);
          reject(status);
        }
      }
    );
  });
}


// --- CSVファイルを読み込む関数 ---
async function loadSheltersFromCSV(csvPath) {
    const response = await fetch(csvPath);
    const text = await response.text();

    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');

    const nameIndex = headers.indexOf('施設・場所名');
    const addressIndex = headers.indexOf('住所');
    const latIndex = headers.indexOf('緯度');
    const lngIndex = headers.indexOf('経度');

    // 災害列インデックス
    const disasterCols = [
        '洪水',
        '崖崩れ、土石流及び地滑り',
        '高潮',
        '地震',
        '津波',
        '大規模な火事',
        '内水氾濫',
        '火山現象'
    ].map(col => headers.indexOf(col));

    const shelters = lines.slice(1).map(line => {
        const cols = line.split(',');

        // 災害種別リスト作成
        const disasters = disasterCols
            .map((idx, i) => (cols[idx] === '1' ? headers[disasterCols[i]] : null))
            .filter(d => d); // 1のものだけ残す

        return {
            name: cols[nameIndex]?.trim(),
            address: cols[addressIndex]?.trim(),
            lat: parseFloat(cols[latIndex]),
            lng: parseFloat(cols[lngIndex]),
            disasterType: disasters.join(', ') // 文字列化してカードで表示
        };
    }).filter(s => s.name && !isNaN(s.lat) && !isNaN(s.lng));

    return shelters;
}


// --- カードHTMLを生成する共通関数 ---
function getShelterCardHTML(shelter, expanded = false) {
    let extraInfo = "";

    if (expanded) {
        extraInfo = `
            標高: ${shelter.elevation !== undefined ? `${shelter.elevation} m` : "取得中..."}<br>
            対象の災害種別: ${shelter.disasterType ?? "不明"}<br>
        `;
    }

    return `
        <strong>${shelter.name}</strong><br>
        <small>
        ${shelter.address}<br>
        直線距離: ${shelter.distance.toFixed(2)} km<br>
        ${extraInfo}
        </small>
    `;
}

// --- 避難所カード生成 ---
function createShelterCards(shelters, onClickCallback) {
    const listDiv = document.getElementById("shelter-list");
    listDiv.innerHTML = "";

    shelters.forEach(shelter => {
        const card = document.createElement('div');
        card.className = 'shelter-card';
        card.innerHTML = getShelterCardHTML(shelter, false);

        card.onclick = () => {
            toggleCard(card, shelter, onClickCallback);
        };

        listDiv.appendChild(card);
    });
}

// --- 避難所マーカー表示 ---
function addShelterMarkers(map, shelters, onClickCallback) {
    shelters.forEach(shelter => {
        const marker = new google.maps.Marker({
            position: { lat: shelter.lat, lng: shelter.lng },
            map: map,
            title: shelter.name,
            icon: {
                url: 'img/pin1.png',       // アイコン画像のURL
                scaledSize: new google.maps.Size(80, 80), // 幅40px × 高さ40pxにリサイズ
                origin: new google.maps.Point(0, 0),      // 画像の起点
                anchor: new google.maps.Point(40, 80)     // アイコンの先端位置をマーカー位置に合わせる
            }
        });

        marker.addListener("click", () => {
            // カードを探して展開
            const cards = document.querySelectorAll('.shelter-card');
            const card = Array.from(cards).find(c => c.querySelector('strong').textContent === shelter.name);
            if (card) toggleCard(card, shelter, onClickCallback);
        });

        marker.addListener("dblclick", () => {
            onClickCallback(shelter); // 経路表示
        });
    });
}

// --- カードの展開・収縮共通関数 ---
function toggleCard(card, shelter, onClickCallback) {
    if (expandedCard && expandedCard !== card) collapseCard(expandedCard, expandedCard.shelterData);

    if (card.classList.contains('expanded')) {
        collapseCard(card, shelter);
        expandedCard = null;
    } else {
        expandCard(card, shelter);
        expandedCard = card;
        card.shelterData = shelter; // クリックされたカードに shelter 情報を保持
        onClickCallback(shelter);
    }
}

// --- 展開 ---
async function expandCard(card, shelter) {
    card.classList.add('expanded');
    card.innerHTML = getShelterCardHTML(shelter, true);

    // 🌍 標高を取得して表示を更新
    if (shelter.elevation === undefined) {
        const elevation = await getElevation(shelter.lat, shelter.lng);
        shelter.elevation = elevation;
        card.innerHTML = getShelterCardHTML(shelter, true);
    }
}

// --- 収縮 ---
function collapseCard(card, shelter) {
    card.classList.remove('expanded');
    card.innerHTML = getShelterCardHTML(shelter, false);
}


// --- 2点間の距離を計算（ハーサイン公式） ---
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径 (km)
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- メイン処理 ---
// 現在地 lat, lng は map.js 側で取得し渡す
async function initShelterCards(map, userLat, userLng, onClickCallback) {
    try {
        // ✅ 言語ごとに読み込むCSVを切り替え
        const lang = window.currentLang || "ja";
        const csvMap = {
            ja: "./csv/shelter_japan.csv",
            en: "./csv/shelter_hiroshima_english.csv",
            zh: "./csv/shelter_hiroshima_chinese.csv",
            es: "./csv/shelter_hiroshima_spanish.csv",
        };

        // 対応言語がなければ日本語をデフォルトに
        const csvPath = csvMap[lang] || csvMap["ja"];
        console.log(`📄 避難所CSV読込: ${csvPath}`);

        const shelters = await loadSheltersFromCSV(csvPath);

        // 各避難所との距離を計算
        shelters.forEach(s => {
            s.distance = calculateDistance(userLat, userLng, s.lat, s.lng);
        });

        // 近い順にソートして5件だけ取得
        const nearest = shelters.sort((a, b) => a.distance - b.distance).slice(0, 5);

        // カード表示
        createShelterCards(nearest, onClickCallback);

        // マーカー表示
        addShelterMarkers(map, nearest, onClickCallback);

        // 🌍 裏で標高を事前取得
        nearest.forEach(async s => {
        if (s.elevation === undefined) {
            const e = await getElevation(s.lat, s.lng);
            s.elevation = e.toFixed(1);
        }
        });

    } catch (error) {
        console.error("避難所データの読み込みに失敗しました:", error);
    }
}