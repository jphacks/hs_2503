const testMode = false;

window.onload = async () => {
    const output = document.getElementById("disaster-info");

    if (testMode) {
        output.innerHTML = `
            <h3>現在地: 広島市中区（テスト）</h3>
            <h4>警報・注意報</h4>
            <p>大雨警報（土砂災害）・洪水注意報が発表中です。</p>
            <h4>最新の地震情報</h4>
            <p>10月11日 09時23分ごろ、広島県北部で震度4の地震がありました。</p>
            <p style="color:gray">(※これはテスト表示です。実際の災害ではありません)</p>
        `;
        return;
    }

    if (!navigator.geolocation) {
        output.textContent = "位置情報が取得できません";
        return;
    }

    output.textContent = "位置情報を取得中...";

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
        // === ① 現在地の市町村名取得 ===
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const geoData = await geoRes.json();
        
        const city =
            geoData.address.city ||
            geoData.address.town ||
            geoData.address.village ||
            "不明な地域";
 
        console.log("取得した市町村名:", city);

        // === ② 市町村名 → コード変換 ===
        const cityCodeMap = {
            "広島市": "3410000",
            "呉市": "3420200",
            "東広島市": "3421200",
            "福山市": "3420700",
            "掛川市":"2221300",
            // 必要に応じて追加
        };

        // 取得した市町村名に含まれるキーを探す
        const matchedKey = Object.keys(cityCodeMap).find((key) => city.includes(key));
        const CLASS_AREA_CODE = matchedKey ? cityCodeMap[matchedKey] : null;

        if (!CLASS_AREA_CODE) {
            output.innerHTML = `<p>${city} の市町村コードが見つかりません。</p>`;
            return;
        }

        console.log("取得した市町村コード:", CLASS_AREA_CODE);

        // === ③ area.json から地方気象台コード導出 ===
        const AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";
        const areaRes = await fetch(AREA_URL);
        const areaData = await areaRes.json();

        let class20Entry = areaData["class20s"][CLASS_AREA_CODE];
        if (!class20Entry) {
            console.warn(`class20s に ${CLASS_AREA_CODE} が見つかりません。class15s を確認します。`);
            // class15s に存在する場合を補完
            class20Entry = Object.values(areaData["class20s"]).find(
                (entry) => entry.name.includes(city.replace("市", ""))
            );
        }

        if (!class20Entry) {
            output.innerHTML = `<p>${city} の地域情報が気象庁データに存在しません。</p>`;
            return;
        }

        const prefName = class20Entry.name;
        const class15 = class20Entry.parent;
        const class10 = areaData["class15s"][class15]?.parent;
        const officeCode = areaData["class10s"][class10]?.parent;

        console.log("地方気象台コード:", officeCode);

        // === ④ 警報JSON取得 ===
        const warningRes = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${officeCode}.json`);
        const warningData = await warningRes.json();

        // === ⑤ 現在地の警報情報抽出 ===
        const targetArea = warningData.areaTypes[1].areas.find(a => a.code === CLASS_AREA_CODE);

        let warningTexts = [];
        if (targetArea && targetArea.warnings) {
            warningTexts = targetArea.warnings
                .filter(w => w.status !== "解除" && w.status !== "発表警報・注意報はなし")
                .map(w => {
                // ======= 警報・注意報コード対応表（JMA定義） =======
                const warningKindMap = {
                    "32": "暴風雪特別警報",
                    "33": "大雨特別警報",
                    "35": "暴風特別警報",
                    "36": "大雪特別警報",
                    "37" : "波浪特別警報",
                    "38": "高潮特別警報",
                    "02": "暴風雪警報",
                    "03": "大雨警報",
                    "04": "洪水警報",
                    "05": "暴風警報",
                    "06": "大雪警報",
                    "07": "波浪警報",
                    "08": "高潮警報",
                    "10": "大雨注意報",
                    "12": "大雪注意報",
                    "13": "風雪注意報",
                    "14": "雷注意報",
                    "15": "強風注意報",
                    "16": "波浪注意報",
                    "17": "融雪注意報",
                    "18": "洪水注意報",
                    "19": "高潮注意報",
                    "20": "濃霧注意報",
                    "21": "乾燥注意報",
                    "22": "なだれ注意報",
                    "23": "低温注意報",
                    "24": "霜注意報",
                    "25": "着氷注意報",
                    "26": "着雪注意報",
                    "27": "その他の注意報"
                };
                const kindName = warningKindMap[w.code] || w.name || w.code;
                    return `${w.status}: ${kindName}`;
                });
            }
      
            // === ⑥ 地震情報（都道府県内のみ抽出） ===
            const quakeRes = await fetch(
                "https://www.jma.go.jp/bosai/quake/data/list.json"
            );
            const quakeList = await quakeRes.json();

            let localQuake = null;
            for (const quake of quakeList.slice(0, 10)) {
                const quakeDetailRes = await fetch(
                    `https://www.jma.go.jp/bosai/quake/data/${quake.json}`
                );
                const quakeDetail = await quakeDetailRes.json();
                const prefs = quakeDetail?.Body?.Intensity?.Observation?.Pref;
                // Prefが存在しない（＝観測情報がない）場合はスキップ
                if (!prefs) continue;
                // PrefName が都道府県名と一致するものを探す
                const matched = prefs.find((p) => p?.PrefName === prefName);
                if (matched) {
                    localQuake = {
                    title: quakeDetail.Head?.Title || "地震情報",
                    hypocenter:
                        quakeDetail.Body?.Earthquake?.Hypocenter?.Name || "震源不明",
                    magnitude:
                        quakeDetail.Body?.Earthquake?.Magnitude || "―",
                    maxInt:
                        quakeDetail.Body?.Intensity?.Observation?.MaxInt || "―",
                    time: quakeDetail.Head?.ReportDateTime || "",
                    };
                    break;
                }
            }

            // === ⑦ HTML出力 ===
            let html = `<h3>現在地: ${city}</h3>`;
                html += `<h4>警報・注意報</h4>`;
            if (warningTexts.length > 0) {
                html += `<ul>${warningTexts.map(w => `<li>${w}</li>`).join("")}</ul>`;
            } else {
                html += `<p>現在、警報・注意報は発表されていません。</p>`;
            }

            html += `<h4>最新の地震情報</h4>`;
            if (localQuake) {
                html += `
                    <p>${localQuake.title}</p>
                    <p>震源：${localQuake.hypocenter}</p>
                    <p>M${localQuake.magnitude}　最大震度：${localQuake.maxInt}</p>
                `;
            } else {
                html += `<p>${prefName}周辺では最近の地震はありません。</p>`;
            }
            html += `
                <p style="margin-top:10px; font-size:small; color:gray;">
                情報提供：<a href="https://www.jma.go.jp/" target="_blank">気象庁</a>　
                |　
                <a href="https://www.jma.go.jp/bosai/" target="_blank">防災情報ポータル</a>
                </p>
            `;
            output.innerHTML = html;
        } catch (err) {
            console.error("エラー:", err);
            output.textContent = "災害情報の取得に失敗しました。";
        }
    },
    (err) => {
        console.error("位置情報取得エラー:", err);
        output.textContent = "位置情報の取得に失敗しました。";
    });
};