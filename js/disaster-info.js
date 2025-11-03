const testMode = false;

// 🌍 グローバル関数として公開（言語変更時に再実行可能）
<<<<<<< HEAD
window.loadDisasterInfo = async function () {
  const output = document.getElementById("disaster-info");
  const lang = window.currentLang || localStorage.getItem("selectedLang") || "ja";
=======
window.loadDisasterInfo = async function() {
  const output_header = document.getElementById("disaster-header");
  const output_body = document.getElementById("disaster-body");
  const lang = window.currentLang || "ja";
>>>>>>> 1f75d9a3bfe9c173a2986486e4c02cfee86c043c

  // 🌐 多言語辞書
  const langText = {
    ja: {
      loading: "位置情報を取得中...",
      noGeo: "位置情報が取得できません",
      warnTitle: "警報・注意報",
      quakeTitle: "最新の地震情報",
      EqTiltle: "震源・震度に関する情報",
      noWarn: "現在、警報・注意報は発表されていません。",
      noQuake: (p) => `${p}周辺では最近の地震はありません。`,
      epicenter: "震源",
      maximum_seismic_intensity: "最大震度",
      unknownArea: "不明な地域",
      fetchError: "災害情報の取得に失敗しました。",
      geoError: "位置情報の取得に失敗しました。"
    },
    en: {
      loading: "Retrieving location...",
      noGeo: "Unable to get location.",
      warnTitle: "Warnings & Advisories",
      quakeTitle: "Latest Earthquake Info",
      EqTiltle: "Epicenter and Seismic Intensity",
      noWarn: "No warnings or advisories are currently issued.",
      noQuake: (p) => `No recent earthquakes near ${p}.`,
      epicenter: "Epicenter",
      maximum_seismic_intensity: "Maximum Seismic Intensity",
      unknownArea: "Unknown area",
      fetchError: "Failed to retrieve disaster information.",
      geoError: "Failed to obtain location."
    },
    zh: {
      loading: "正在获取位置信息...",
      noGeo: "无法获取位置信息",
      warnTitle: "警报・注意信息",
      quakeTitle: "最新地震信息",
      EqTiltle: "震源・震度相关信息",
      noWarn: "当前没有发布任何警报或注意信息。",
      noQuake: (p) => `最近${p}周边未发生地震。`,
      epicenter: "震源",
      maximum_seismic_intensity: "最大震度",
      unknownArea: "未知地区",
      fetchError: "灾害信息获取失败。",
      geoError: "位置信息获取失败。"
    }
  };

  // 追加：警報コード → 多言語名
  const warningKindI18n = {
    ja: {
      "32":"暴風雪特別警報","33":"大雨特別警報","35":"暴風特別警報","36":"大雪特別警報","37":"波浪特別警報","38":"高潮特別警報",
      "02":"暴風雪警報","03":"大雨警報","04":"洪水警報","05":"暴風警報","06":"大雪警報","07":"波浪警報","08":"高潮警報",
      "10":"大雨注意報","12":"大雪注意報","13":"風雪注意報","14":"雷注意報","15":"強風注意報","16":"波浪注意報","17":"融雪注意報",
      "18":"洪水注意報","19":"高潮注意報","20":"濃霧注意報","21":"乾燥注意報","22":"なだれ注意報","23":"低温注意報","24":"霜注意報",
      "25":"着氷注意報","26":"着雪注意報","27":"その他の注意報"
    },
    en: {
      "32":"Emergency: Heavy Snowstorm","33":"Emergency: Heavy Rain","35":"Emergency: Storm","36":"Emergency: Heavy Snow",
      "37":"Emergency: High Waves","38":"Emergency: Storm Surge",
      "02":"Blizzard Warning","03":"Heavy Rain Warning","04":"Flood Warning","05":"Storm Warning","06":"Heavy Snow Warning",
      "07":"High Waves Warning","08":"Storm Surge Warning",
      "10":"Heavy Rain Advisory","12":"Snow Advisory","13":"Snowstorm Advisory","14":"Thunderstorm Advisory","15":"Strong Wind Advisory",
      "16":"High Waves Advisory","17":"Snowmelt Advisory","18":"Flood Advisory","19":"Storm Surge Advisory","20":"Dense Fog Advisory",
      "21":"Dry Air Advisory","22":"Avalanche Advisory","23":"Low Temperature Advisory","24":"Frost Advisory","25":"Icing Advisory",
      "26":"Snow Accretion Advisory","27":"Other Advisory"
    },
    zh: {
      "32":"特別警报：暴风雪","33":"特別警报：大雨","35":"特別警报：暴风","36":"特別警报：大雪","37":"特別警报：大浪","38":"特別警报：风暴潮",
      "02":"暴风雪警报","03":"大雨警报","04":"洪水警报","05":"暴风警报","06":"大雪警报","07":"大浪警报","08":"风暴潮警报",
      "10":"大雨注意信息","12":"大雪注意信息","13":"风雪注意信息","14":"雷电注意信息","15":"强风注意信息","16":"大浪注意信息",
      "17":"融雪注意信息","18":"洪水注意信息","19":"风暴潮注意信息","20":"浓雾注意信息","21":"干燥注意信息","22":"雪崩注意信息",
      "23":"低温注意信息","24":"霜冻注意信息","25":"结冰注意信息","26":"着雪注意信息","27":"其他注意信息"
    }
  };

  const T = langText[lang] || langText.ja;

  // === テストモード ===
  if (testMode) {
    output.innerHTML = `
      <h3>${T.quakeTitle}</h3>
      <p>（テストデータ）</p>
    `;
    return;
  }

  if (!navigator.geolocation) {
    output_header.textContent = T.noGeo;
    return;
  } else {
    output_header.textContent = T.loading;
  }

<<<<<<< HEAD
  output.textContent = T.loading;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
=======
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
>>>>>>> 1f75d9a3bfe9c173a2986486e4c02cfee86c043c

      try {
        // === ① 現在地の市町村名取得（表示用 + 照合用の2回） ===
        const geoResDisp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${encodeURIComponent(lang)}`
        );
        const geoDisp = await geoResDisp.json();
        const adDisp = geoDisp.address || {};
        let cityDisp = adDisp.city || adDisp.town || adDisp.village || adDisp.island || T.unknownArea;
        const districtDisp = adDisp.city_district || adDisp.suburb || "";
        const fullNameDisp = districtDisp ? `${cityDisp}${districtDisp}` : cityDisp;

        // === 日本語での再取得（area.json 照合用） ===
        const geoResJa = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ja`
        );
        const geoJa = await geoResJa.json();
        const adJa = geoJa.address || {};
        let cityJa = adJa.city || adJa.town || adJa.village || adJa.island || "不明な地域";
        const districtJa = adJa.city_district || adJa.suburb || "";
        const fullNameJa = districtJa ? `${cityJa}${districtJa}` : cityJa;

        // === ゆらぎ吸収関数 ===
        const normalizeJP = (s) =>
          (s || "")
            .replace(/\s+/g, "")
            .replace(/[都道府県府]|市|区|町|村|郡|島/g, "")
            .toLowerCase();

        const nFullJa = normalizeJP(fullNameJa);
        const nCityJa = normalizeJP(cityJa);

        // === ② area.json から市町村コードを取得 ===
        const AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";
        const areaRes = await fetch(AREA_URL);
        const areaData = await areaRes.json();

        const class20Entries = Object.entries(areaData.class20s);
        let cityEntry =
          class20Entries.find(([_, info]) => {
            const n = normalizeJP(info.name);
            return nFullJa.includes(n) || n.includes(nFullJa);
          }) ||
          class20Entries.find(([_, info]) => {
            const n = normalizeJP(info.name);
            return nCityJa.includes(n) || n.includes(nCityJa);
          });

        const CLASS_AREA_CODE = cityEntry ? cityEntry[0] : null;

        if (!CLASS_AREA_CODE) {
          output.innerHTML = `<p>${fullNameDisp} : ${T.unknownArea}</p>`;
          return;
        }

        const class20Info = areaData.class20s[CLASS_AREA_CODE];
        const class15 = class20Info.parent;
        const class10 = areaData.class15s[class15]?.parent;
        const officeCode = areaData.class10s[class10]?.parent;

        // === ③ 警報情報取得 ===
        const warningRes = await fetch(
          `https://www.jma.go.jp/bosai/warning/data/warning/${officeCode}.json`
        );
        const warningData = await warningRes.json();

        let targetArea = null;
        for (const type of warningData.areaTypes) {
          targetArea = type.areas.find(
            (a) => a.code === CLASS_AREA_CODE || fullNameJa.includes(a.name)
          );
          if (targetArea) break;
        }

        // ここを修正：コード→名称へ変換し、重複を除去
        let warningTexts = [];
        if (targetArea && targetArea.warnings) {
          warningTexts = targetArea.warnings
            .filter(w => w.status !== "解除" && w.status !== "発表警報・注意報はなし")
            .map(w => {
              const byCode = warningKindI18n[lang]?.[w.code];
              return byCode || w.name || w.code;
            });

          // 重複除去
          warningTexts = [...new Set(warningTexts)];
        }

        // === ④ 地震情報 ===
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

          const rawRegion =
            detailXml.getElementsByTagName("Hypocenter")[0]
              ?.getElementsByTagName("Area")[0]
              ?.getElementsByTagName("Name")[0]
              ?.textContent || "";
          const quakeRegion = rawRegion.replace(/地方.*/, "地方");

          if (quakeRegion) {
            localQuake = {
              region: quakeRegion,
              originTime: detailXml.querySelector("OriginTime")?.textContent || "",
              magnitude:
                detailXml.getElementsByTagName("jmx_eb:Magnitude")[0]?.textContent ||
                "—",
              maxInt:
                detailXml.querySelector("MaxInt")?.textContent ||
                detailXml.querySelector("jmx_eb\\:MaxInt")?.textContent ||
                "—"
            };

            if (localQuake.originTime) {
              const d = new Date(localQuake.originTime);
              localQuake.originTime = d.toLocaleString(
                lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "ja-JP",
                { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
              );
            }
            break;
          }
        }

<<<<<<< HEAD
        // === 出力 ===
        output.innerHTML = `
          <div id="disaster-info">
            <div id="disaster-header">
              <h3 id="city-name">${fullNameDisp}</h3>
            </div>
            <div id="disaster-body">
              <div class="disaster-item">
                <h4>${T.warnTitle}</h4>
                ${
                  warningTexts.length > 0
                    ? `<p>${warningTexts.join(", ")}</p>`
                    : `<p>${T.noWarn}</p>`
                }
              </div>
              <div class="disaster-item">
                <h4>${T.EqTiltle}</h4>
                ${
                  localQuake
                    ? `<p>${localQuake.originTime} ${T.epicenter}: ${localQuake.region}  M${localQuake.magnitude} ${T.maximum_seismic_intensity}: ${localQuake.maxInt}</p>`
                    : `<p>${T.noQuake(fullNameDisp)}</p>`
                }
              </div>
            </div>
          </div>
        `;
      } catch (err) {
        console.error("エラー:", err);
        output.textContent = T.fetchError;
      }
    },
    (err) => {
      console.error("位置情報取得エラー:", err);
      output.textContent = T.geoError;
    }
  );
=======
            console.log("取得した市町村名:", fullName);

            // === ② area.json から市町村コードを取得 ===
            const AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";
            const areaRes = await fetch(AREA_URL);
            const areaData = await areaRes.json();

            const cityEntry = Object.entries(areaData.class20s).find(([code, info]) => fullName.includes(info.name));
            const CLASS_AREA_CODE = cityEntry ? cityEntry[0] : null;

            if (!CLASS_AREA_CODE) {
                output_header.innerHTML = `<p>${fullName} の市町村コードが見つかりません。</p>`;
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
                        return ` ${kindName}`;
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
                        magnitude: detailXml.getElementsByTagName("jmx_eb:Magnitude")[0]?.textContent || "―",
                        maxInt: detailXml.querySelector("MaxInt")?.textContent ||
                                detailXml.querySelector("jmx_eb\\:MaxInt")?.textContent ||"―",
                        updated: e.getElementsByTagName("updated")[0]?.textContent ?? ""
                    };
                    if (localQuake) {
                        const originDate = new Date(localQuake.originTime);
                        const formattedOrigin = originDate.toLocaleString("ja-JP", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                        });
                        localQuake.originTime=formattedOrigin;
                    } 
                    break;
                }
            }
    // === 出力 ===
    let html_header =`
        <!-- 左/上段：市名 -->
        <div id="disaster-header">
          <h3 id="city-name">${fullName}</h3>
        </div>
    `;

    let html_body = `
      <!-- 右/下段：警報 + 地震 -->
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
              ? `<p>${localQuake.originTime}  震源：${localQuake.region}  M${localQuake.magnitude} 最大震度：${localQuake.maxInt}</p>`
              : `<p>${T.noQuake(fullName)}</p>`
          }
        </div>
      </div>
    `;

    output_header.innerHTML = html_header;
    output_body.innerHTML = html_body;

    } catch (err) {
      console.error("エラー:", err);
      output_body.textContent = "災害情報の取得に失敗しました。";
    }
  },
  (err) => {
    console.error("位置情報取得エラー:", err);
    output_header.textContent = "位置情報の取得に失敗しました。";
  });
>>>>>>> 1f75d9a3bfe9c173a2986486e4c02cfee86c043c
};

// ✅ ページ初期ロード時
window.addEventListener("load", window.loadDisasterInfo);



