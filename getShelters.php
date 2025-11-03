<?php
// ヘッダー設定：JSONを返し、キャッシュをさせない
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT'); // 過去の日付

// 言語が変更されたときに指定するデータを変更する用に処理をしていますが、避難所データが表示されない問題が発生しているため、
// 一旦コメントアウトしています
// // ----------------------------------------------------
// // 0. 言語パラメータ
// // ----------------------------------------------------
// $supported_langs = ['ja','en','zh'];
// $lang = isset($_GET['lang']) ? strtolower($_GET['lang']) : 'ja';
// if (!in_array($lang, $supported_langs, true)) $lang = 'ja';

// // 言語ごとの CSV とヘッダー名（実際のCSVヘッダーに合わせて調整してください）
// $config = [
//   'ja' => [
//     'file' => __DIR__ . '/../csv/shelter_japan.csv',
//     'cols' => [
//       'lat' => '緯度',
//       'lng' => '経度',
//       'name' => '施設・場所名',
//       'address' => '住所',
//     ],
//     'disasters' => [
//       '洪水',
//       '崖崩れ、土石流及び地滑り',
//       '高潮',
//       '地震',
//       '津波',
//       '大規模な火事',
//       '内水氾濫',
//       '火山現象',
//     ],
//   ],
//   'en' => [
//     'file' => __DIR__ . '/../csv/shelter_english.csv',
//     'cols' => [
//       'lat' => 'Latitude',
//       'lng' => 'Longitude',
//       'name' => 'Facility/Place Name',
//       'address' => 'Address',
//     ],
//     'disasters' => [
//       'Flood',
//       'Landslide / Debris flow / Slope failure',
//       'Storm surge',
//       'Earthquake',
//       'Tsunami',
//       'Large fire',
//       'Inland flood',
//       'Volcanic phenomena',
//     ],
//   ],
//   'zh' => [
//     'file' => __DIR__ . '/../csv/shelter_chinese.csv',
//     'cols' => [
//       'lat' => '纬度',
//       'lng' => '经度',
//       'name' => '设施・场所名',
//       'address' => '地址',
//     ],
//     'disasters' => [
//       '洪水',
//       '崩塌、泥石流及滑坡',
//       '风暴潮',
//       '地震',
//       '海啸',
//       '大规模火灾',
//       '内涝',
//       '火山现象',
//     ],
//   ],
// ];

// $csv_file = $config[$lang]['file'];
// $colmap   = $config[$lang]['cols'];
// $disaster_headers = $config[$lang]['disasters'];


// ----------------------------------------------------
// 1. 現在地と検索半径を取得
// ----------------------------------------------------
// GETリクエストで渡されることを想定
$user_lat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;     // ユーザーの現在地 緯度
$user_lng = isset($_GET['lng']) ? (float)$_GET['lng'] : null;     // ユーザーの現在地 経度
$radius_km = isset($_GET['radius']) ? (float)$_GET['radius'] : 5; // 検索半径（デフォルト: 5km）

// 必須パラメータがなければエラーを返す
if (!($user_lat && $user_lng)) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Location parameters (lat, lng) missing or invalid."]);
    exit;
}

// ----------------------------------------------------
// 2. 距離計算ヘルパー関数 (ハーサイン公式)
// ----------------------------------------------------
/**
 * 2つの緯度・経度間の距離をキロメートル単位で計算
 * @param float $lat1 緯度1
 * @param float $lon1 経度1
 * @param float $lat2 緯度2
 * @param float $lon2 経度2
 * @return float 距離 (km)
 */
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $R = 6371; // 地球の半径 (km)
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $lat1 = deg2rad($lat1);
    $lat2 = deg2rad($lat2);
    
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos($lat1) * cos($lat2) * sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    return $R * $c;
}

// ----------------------------------------------------
// 3. CSVファイルの読み込みとフィルタリング
// ----------------------------------------------------
// 📄 ここは、あなたの実際のCSVファイルのパスに合わせてください
$csv_file = __DIR__ . '/../csv/shelter_japan.csv'; // ← 修正ポイント

// 災害関連のヘッダー名
$disaster_headers = [
    '洪水',
    '崖崩れ、土石流及び地滑り',
    '高潮',
    '地震',
    '津波',
    '大規模な火事',
    '内水氾濫',
    '火山現象'
];

$shelters_with_distance = [];
$header = [];
$lat_col = -1; 
$lon_col = -1; 

if (($handle = fopen($csv_file, "r")) !== FALSE) {
    // 最初の行（ヘッダー）を処理
    if (($header = fgetcsv($handle, 1000, ",")) !== FALSE) {
        $lat_col = array_search('緯度', $header);
        $lon_col = array_search('経度', $header);
        
        if ($lat_col === FALSE || $lon_col === FALSE) {
            http_response_code(500);
            echo json_encode(["error" => "CSV header error: '緯度' or '経度' column not found."]);
            fclose($handle);
            exit;
        }
    }

    // 2行目以降のデータを処理
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        $lat = (float)$data[$lat_col];
        $lon = (float)$data[$lon_col];
        
        // 距離を計算
        $distance = calculateDistance($user_lat, $user_lng, $lat, $lon);
        
        // フィルタリング処理：計算した距離が指定半径内にあるか
        if ($distance <= $radius_km) {
            
            $row_data = array_combine($header, $data);
            
            // 災害タイプを結合
            $disasters = [];
            foreach ($disaster_headers as $d_name) {
                $idx = array_search($d_name, $header);
                if ($idx !== FALSE && (isset($row_data[$d_name]) && $row_data[$d_name] === '1')) {
                    $disasters[] = $d_name;
                }
            }
            
            // JavaScriptで利用しやすいオブジェクトを構成
            $shelter_obj = [
                'name' => trim($row_data['施設・場所名']),
                'address' => trim($row_data['住所']),
                'lat' => $lat,
                'lng' => $lon,
                'disasterType' => implode(', ', $disasters),
                'distance' => $distance // 距離情報を含める
            ];
            
            $shelters_with_distance[] = $shelter_obj;
        }
    }
    fclose($handle);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to open CSV file: " . $csv_file]);
    exit;
}

// ----------------------------------------------------
// 4. 結果を距離でソートし、JSON形式で返す
// ----------------------------------------------------
// クライアント側（shelters.js）で再度ソートし、上位5件に絞るため、ここでは全て返す
// ソートは省略し、クライアント側の負荷を減らすために、ここではフィルタリングのみに留めます。
// もしここで上位N件に絞りたい場合は、ここでソート・スライス処理を行います。

echo json_encode($shelters_with_distance);
?>

