let expandedCard = null;

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

    const shelters = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
            name: cols[nameIndex]?.trim(),
            address: cols[addressIndex]?.trim(),
            lat: parseFloat(cols[latIndex]),
            lng: parseFloat(cols[lngIndex])
        };
    }).filter(s => s.name && !isNaN(s.lat) && !isNaN(s.lng));

    return shelters;
}

// --- 避難所カード生成 ---
function createShelterCards(shelters, onClickCallback) {
    const listDiv = document.getElementById("shelter-list");
    listDiv.innerHTML = "";

    shelters.forEach(shelter => {
        const card = document.createElement('div');
        card.className = 'shelter-card';
        card.innerHTML = `
            <strong>${shelter.name}</strong><br>
            <small>
            ${shelter.address}<br>
            直線距離: ${shelter.distance.toFixed(2)} km<br>
            </small>
        `;

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
function expandCard(card, shelter) {
    const lang = window.currentLang || "ja";

    // 🌏 多言語ラベル辞書
    const labels = {
        ja: { distance: "直線距離", elevation: "標高", hazard: "対象となる災害種別" },
        zh: { distance: "直线距离", elevation: "海拔", hazard: "适用灾害类型" },
        en: { distance: "Distance", elevation: "Elevation", hazard: "Applicable hazards" },
        es: { distance: "Distancia en línea recta", elevation: "Altitud", hazard: "Tipos de desastres aplicables" },
    };
    const L = labels[lang] || labels.ja;

    card.classList.add('expanded');
    card.innerHTML = `
        <strong>${shelter.name}</strong><br>
        <small>
        ${shelter.address}<br>
        ${L.distance}: ${shelter.distance.toFixed(2)} km<br>
        ${L.elevation}: <br>
        ${L.hazard}: <br>
        </small>
    `;
}

// --- 収縮 ---
function collapseCard(card, shelter) {
    const lang = window.currentLang || "ja";

    // 🌏 多言語ラベル辞書（同じものを使用）
    const labels = {
        ja: { distance: "直線距離" },
        zh: { distance: "直线距离" },
        en: { distance: "Distance" },
        es: { distance: "Distancia en línea recta" },
    };
    const L = labels[lang] || labels.ja;

    card.classList.remove('expanded');
    card.innerHTML = `
        <strong>${shelter.name}</strong><br>
        <small>
        ${shelter.address}<br>
        ${L.distance}: ${shelter.distance.toFixed(2)} km<br>
        </small>
    `;
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
            // en: "./csv/shelter_hiroshima_english.csv",
            zh: "./csv/shelter_hiroshima_chinese.csv",
            // es: "./csv/shelter_hiroshima_spanish.csv",
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

    } catch (error) {
        console.error("避難所データの読み込みに失敗しました:", error);
    }
}