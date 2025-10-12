// ======= 防災情報（警報 + 地震情報）=======
window.onload = async () => {
    const output = document.getElementById("disaster-info");

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
            // === ⑥ HTML出力 ===
            let html = `<h3>現在地: ${fullName}</h3>`;
            html += `<h4>警報・注意報</h4>`;
            if (warningTexts.length > 0) {
                html += `<ul>${warningTexts.map(w => `<li>${w}</li>`).join("")}</ul>`;
            } else {
                html += `<p>現在、警報・注意報は発表されていません。</p>`;
            }
            html += `<h4>最新の地震情報</h4>`;
            if (localQuake) {
                const originDate = new Date(localQuake.originTime);
                const formattedOrigin = originDate.toLocaleString("ja-JP", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                });
                html += `
                    <p>発生時刻：${formattedOrigin}</p>
                    <p>地震発生地域:${localQuake.region}</p>
                    <p>M${localQuake.mag}　最大震度：${localQuake.maxInt}</p>
                `;
            } else {
                html += `<p>${fullName}周辺では最近の地震はありません。</p>`;
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
