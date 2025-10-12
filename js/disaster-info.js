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
      // === 以下はあなたの既存ロジックをそのまま ===
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const geoData = await geoRes.json();

      const city = geoData.address.city || geoData.address.town || geoData.address.village || "不明な地域";
      const cityCodeMap = { "広島市": "3410000", "呉市": "3420200", "東広島市": "3421200", "福山市": "3420700", "掛川市":"2221300" };
      const matchedKey = Object.keys(cityCodeMap).find((key) => city.includes(key));
      const CLASS_AREA_CODE = matchedKey ? cityCodeMap[matchedKey] : null;

      if (!CLASS_AREA_CODE) {
        output.innerHTML = `<p>${city} の市町村コードが見つかりません。</p>`;
        return;
      }

      const areaRes = await fetch("https://www.jma.go.jp/bosai/common/const/area.json");
      const areaData = await areaRes.json();

      let class20Entry = areaData["class20s"][CLASS_AREA_CODE];
      if (!class20Entry) {
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

      const warningRes = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${officeCode}.json`);
      const warningData = await warningRes.json();

      const targetArea = warningData.areaTypes[1].areas.find(a => a.code === CLASS_AREA_CODE);
      let warningTexts = [];
      if (targetArea && targetArea.warnings) {
        warningTexts = targetArea.warnings
          .filter(w => w.status !== "解除" && w.status !== "発表警報・注意報はなし")
          .map(w => `${w.status}: ${w.name}`);
      }

      const quakeRes = await fetch("https://www.jma.go.jp/bosai/quake/data/list.json");
      const quakeList = await quakeRes.json();
      let localQuake = null;
      for (const quake of quakeList.slice(0, 10)) {
        const quakeDetailRes = await fetch(`https://www.jma.go.jp/bosai/quake/data/${quake.json}`);
        const quakeDetail = await quakeDetailRes.json();
        const prefs = quakeDetail?.Body?.Intensity?.Observation?.Pref;
        if (!prefs) continue;
        const matched = prefs.find((p) => p?.PrefName === prefName);
        if (matched) {
          localQuake = {
            title: quakeDetail.Head?.Title || "地震情報",
            hypocenter: quakeDetail.Body?.Earthquake?.Hypocenter?.Name || "震源不明",
            magnitude: quakeDetail.Body?.Earthquake?.Magnitude || "―",
            maxInt: quakeDetail.Body?.Intensity?.Observation?.MaxInt || "―",
            time: quakeDetail.Head?.ReportDateTime || "",
          };
          break;
        }
      }

      // === 出力 ===
      let html = `<h3>${T.location}: ${city}</h3>`;
      html += `<h4>${T.warnTitle}</h4>`;
      if (warningTexts.length > 0) html += `<ul>${warningTexts.map(w => `<li>${w}</li>`).join("")}</ul>`;
      else html += `<p>${T.noWarn}</p>`;

      html += `<h4>${T.quakeTitle}</h4>`;
      if (localQuake) {
        html += `
          <p>${localQuake.title}</p>
          <p>震源：${localQuake.hypocenter}</p>
          <p>M${localQuake.magnitude}　最大震度：${localQuake.maxInt}</p>
        `;
      } else html += `<p>${T.noQuake(prefName)}</p>`;

      html += `
        <p style="margin-top:10px; font-size:small; color:gray;">
        ${T.source}<a href="https://www.jma.go.jp/" target="_blank">${T.jma}</a> |
        <a href="https://www.jma.go.jp/bosai/" target="_blank">${T.portal}</a>
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

// ✅ ページ初期ロード時
window.addEventListener("load", window.loadDisasterInfo);
