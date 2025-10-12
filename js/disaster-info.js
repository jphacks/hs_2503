const testMode = false;

// 🌍 グローバル関数として公開（言語変更時に再実行可能）
window.loadDisasterInfo = async function() {
  const output = document.getElementById("disaster-info");
  const lang = window.currentLang || "ja";

  // 🌐 多言語辞書
  const langText = {
    ja: {
      loading: "位置情報を取得中...",
      noGeo: "位置情報が取得できません",
      testTitle: "現在地: 広島市中区（テスト）",
      testWarnTitle: "警報・注意報",
      testWarnText: "大雨警報（土砂災害）・洪水注意報が発表中です。",
      testEqTitle: "最新の地震情報",
      testEqText: "10月11日 09時23分ごろ、広島県北部で震度4の地震がありました。",
      testNote: "(※これはテスト表示です。実際の災害ではありません)",
      noWarn: "現在、警報・注意報は発表されていません。",
      noQuake: (p) => `${p}周辺では最近の地震はありません。`,
      location: "現在地",
      warnTitle: "警報・注意報",
      quakeTitle: "最新の地震情報",
      source: "情報提供：",
      jma: "気象庁",
      portal: "防災情報ポータル"
    },
    zh: {
      loading: "正在获取位置信息...",
      noGeo: "无法获取位置信息",
      testTitle: "当前位置: 广岛市中区（测试）",
      testWarnTitle: "警报・注意信息",
      testWarnText: "目前发布了大雨警报（土砂灾害）和洪水注意信息。",
      testEqTitle: "最新地震信息",
      testEqText: "10月11日 09:23左右，在广岛县北部发生了震度4的地震。",
      testNote: "（※此为测试显示，非真实灾害。）",
      noWarn: "当前没有发布任何警报或注意信息。",
      noQuake: (p) => `最近${p}周边未发生地震。`,
      location: "当前位置",
      warnTitle: "警报・注意信息",
      quakeTitle: "最新地震信息",
      source: "信息来源：",
      jma: "日本气象厅",
      portal: "防灾信息门户"
    },
    en: {
      loading: "Retrieving location...",
      noGeo: "Unable to get location.",
      testTitle: "Current location: Naka Ward, Hiroshima (test)",
      testWarnTitle: "Warnings & Advisories",
      testWarnText: "Heavy rain warning (landslide) and flood advisory in effect.",
      testEqTitle: "Latest Earthquake Information",
      testEqText: "At around 09:23 on Oct 11, a magnitude 4 earthquake occurred in northern Hiroshima Prefecture.",
      testNote: "(※ This is a test display, not a real disaster.)",
      noWarn: "No warnings or advisories are currently issued.",
      noQuake: (p) => `No recent earthquakes near ${p}.`,
      location: "Current Location",
      warnTitle: "Warnings & Advisories",
      quakeTitle: "Latest Earthquake Info",
      source: "Source:",
      jma: "Japan Meteorological Agency",
      portal: "Disaster Info Portal"
    }
  };

  const T = langText[lang] || langText.ja;

  // ✅ テストモード
  if (testMode) {
    output.innerHTML = `
      <h3>${T.testTitle}</h3>
      <h4>${T.testWarnTitle}</h4>
      <p>${T.testWarnText}</p>
      <h4>${T.testEqTitle}</h4>
      <p>${T.testEqText}</p>
      <p style="color:gray">${T.testNote}</p>
    `;
    return;
  }

  if (!navigator.geolocation) {
    output.textContent = T.noGeo;
    return;
  }

  output.textContent = T.loading;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
            // === ① 現在地の市町村名取得 ===
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const geoData = await geoRes.json();
            console.log(geoData);
            const addr = geoData.address;
            let city = addr.city;
            console.log(city);
            const prefectures = [
                "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
                "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
                "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
                "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
                "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
                "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
                "熊本県","大分県","宮崎県","鹿児島県","沖縄県"
            ];
            const isPrefectureName = prefectures.includes(city);
            console.log(isPrefectureName);
            if (!city || isPrefectureName) {
                // 市が無いか、都道府県名が入っていたら町や村を使う
                city = addr.town || addr.village || addr.island || "不明な地域";
            }
            const district = geoData.address.city_district || geoData.address.suburb || "";
            const fullName = district ? `${city}${district}` : city;

            console.log("取得した市町村名:", fullName);

            // === ② area.json から市町村コードを取得 ===
            const AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";
            const areaRes = await fetch(AREA_URL);
            const areaData = await areaRes.json();

            const cityEntry = Object.entries(areaData.class20s).find(([code, info]) => fullName.includes(info.name));
            const CLASS_AREA_CODE = cityEntry ? cityEntry[0] : null;

            if (!CLASS_AREA_CODE) {
                output.innerHTML = `<p>${fullName} の市町村コードが見つかりません。</p>`;
                return;
            }

            const class20Info = areaData.class20s[CLASS_AREA_CODE];
            const class15 = class20Info.parent;
            const class10 = areaData.class15s[class15]?.parent;
            const officeCode = areaData.class10s[class10]?.parent;

            console.log("地方気象台コード:", officeCode);

            // === ③ 警報JSON取得 ===
            const warningRes = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${officeCode}.json`);
            const warningData = await warningRes.json();

            // === ④ 現在地の警報情報抽出 ===
            let targetArea = null;
            for (const type of warningData.areaTypes) {
                targetArea = type.areas.find(a => a.code === CLASS_AREA_CODE || fullName.includes(a.name));
                if (targetArea) break;
            }

            let warningTexts = [];
            if (targetArea && targetArea.warnings) {
                warningTexts = targetArea.warnings
                    .filter(w=>  w.status !== "解除"&& w.status !== "発表警報・注意報はなし")
                    .map(w => {
                        const warningKindMap = {
                            "32": "暴風雪特別警報",
                            "33": "大雨特別警報",
                            "35": "暴風特別警報",
                            "36": "大雪特別警報",
                            "37": "波浪特別警報",
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
                        const status = w.status || "不明な状態";
                        return `${status}: ${kindName}`;
                    });
            }
            // === ⑤ 地震情報 ===
            const FEED_URL = "https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml";
            const PROXY = "https://corsproxy.io/?";
            const res = await fetch(PROXY + encodeURIComponent(FEED_URL));
            const xmlText = await res.text();
            const xml = new DOMParser().parseFromString(xmlText, "application/xml");
            const entries = xml.getElementsByTagName("entry");

            let localQuake = null;
            for (const e of entries) {
                const title = e.getElementsByTagName("title")[0]?.textContent ?? "";
                const link = e.getElementsByTagName("link")[0]?.getAttribute("href") ?? "";

                if (!/地震|震源|緊急地震速報/.test(title)) continue;

                const detailRes = await fetch(PROXY + encodeURIComponent(link));
                const detailText = await detailRes.text();
                const detailXml = new DOMParser().parseFromString(detailText, "application/xml");

                const rawRegion = detailXml.getElementsByTagName("Hypocenter")[0]
                    ?.getElementsByTagName("Area")[0]
                    ?.getElementsByTagName("Name")[0]
                    ?.textContent || "";
                const quakeRegion = rawRegion.replace(/地方.*/, "地方"); 
                console.log("地震発生地域:", quakeRegion);

                if (quakeRegion) {
                    localQuake = {
                        title,
                        region: quakeRegion,
                        originTime:detailXml.querySelector("OriginTime")?.textContent || "不明",
                        mag: detailXml.getElementsByTagName("jmx_eb:Magnitude")[0]?.textContent || "―",
                        maxInt: detailXml.querySelector("MaxInt")?.textContent ||
                                detailXml.querySelector("jmx_eb\\:MaxInt")?.textContent ||"―",
                        updated: e.getElementsByTagName("updated")[0]?.textContent ?? ""
                    };
                    break;
                }
            }
    // === 出力 ===
    let html = `
    <div id="disaster-info">
    <!-- 左カラム：市名 -->
    <div id="disaster-header">
        <h3 id="city-name">${city}</h3>
    </div>

    <!-- 右カラム：警報 + 地震 -->
    <div id="disaster-body">
        <!-- 警報 -->
        <div class="disaster-item">
        <h4>${T.warnTitle}</h4>
        ${
            warningTexts.length > 0
            ? `<p>${warningTexts.join(", ")}</p>`
            : `<p>${T.noWarn}</p>`
        }
        </div>

        <!-- 地震 -->
        <div class="disaster-item">
        <h4>${localQuake ? localQuake.title : T.quakeTitle}</h4>
        ${
            localQuake
            ? `<p>震源：${localQuake.hypocenter}  M${localQuake.magnitude} 最大震度：${localQuake.maxInt}</p>`
            : `<p>${T.noQuake(prefName)}</p>`
        }
        </div>

    </div>
    </div>

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

// ✅ ページ初期ロード時
window.addEventListener("load", window.loadDisasterInfo);
