// ======= 防災情報デモ（地震 + 警報）=======
// testMode = true にするとダミーデータを使用
const testMode = false;

// ページ読み込み時に実行
window.onload = async () => {
  const output = document.getElementById("disaster-info");
  output.textContent = "位置情報を取得中...";

  if (testMode) {
    // ======= テストモード =======
    output.innerHTML = `
      <h3>現在地: 広島市中区（テスト）</h3>
      <h4>警報・注意報</h4>
      <p>大雨警報（土砂災害）・洪水注意報が発表中です。</p>
      <h4>最新の地震情報</h4>
      <p>10月11日 09時23分ごろ、和歌山県北部で震度4の地震がありました。</p>
      <p style="color:gray">(※これはテスト表示です。実際の災害ではありません)</p>
    `;
    return;
  }
 

 // ======= 本番モード =======
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    // ① 逆ジオコーディングで市町村名取得（OpenStreetMap）
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const geoData = await geoRes.json();
    const city = geoData.address.city || geoData.address.town || geoData.address.village || "不明な地域";

    output.innerHTML = `<h3>現在地: ${city}</h3><p>災害情報を取得中...</p>`;
    
    // 位置情報から市町村名を市町村コードへ変換
    const cityCodeMap = {
          "広島市"  : "3410000",
          "呉市"    : "3420200",
          "東広島市": "3421200",
          "福山市"  : "3420700",
          // 他の市町村も追加
    };

    const code = cityCodeMap[city] || null;
    console.log("取得した市町村コード:", code);

    // 気象庁の市町村情報JSON
    const AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";

    // 市町村コードを使った警報情報ページ（ブラウザ表示用）
    const warning_info_url = `https://www.jma.go.jp/bosai/warning/#area_type=class20s&area_code=${code}&lang=ja`;

    // JSONデータ取得用URL（警報・注意報データ）
    const url = `https://www.jma.go.jp/bosai/warning/data/warning/${code}.json`;
    console.log("警報ページURL:", warning_info_url);
    console.log("警報JSON取得URL:", url);

    // ② 警報・注意報（仮に広島市：3410000.xml）
    const alertRes = await fetch(url);
    const alertText = await alertRes.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(alertText, "text/xml");
    const title = xmlDoc.querySelector("Title")?.textContent || "警報・注意報なし";

    // ③ 地震情報
    const eqRes = await fetch("https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml");
    const eqText = await eqRes.text();
    const eqXml = parser.parseFromString(eqText, "text/xml");
    const latestEq = eqXml.querySelector("entry > title")?.textContent || "最新の地震情報なし";

    // ④ 出力
    output.innerHTML = `
      <h3>現在地: ${city}</h3>
      <h4>警報・注意報</h4>
      <p>${title}</p>
      <h4>最新の地震情報</h4>
      <p>${latestEq}</p>
    `;
  },
  
  (err) => {
    output.textContent = "位置情報が取得できませんでした。";
    console.error(err);
  });
};