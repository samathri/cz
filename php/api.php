<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// ✅ Your updated API key
$apiKey = "14f29a07-57fe-4543-800d-a7fd3dffdca3";
$url = "https://api.cricapi.com/v1/currentMatches?apikey=$apiKey&offset=0";

// cURL request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);

if ($response === false) {
    $error = curl_error($ch);
    curl_close($ch);
    echo json_encode(["error" => "Failed to fetch data: $error"]);
    exit;
}

curl_close($ch);

// Decode JSON
$jsonData = json_decode($response, true);

if ($jsonData === null) {
    echo json_encode([
        "error" => "JSON decoding failed",
        "rawResponse" => substr($response, 0, 300)
    ]);
    exit;
}

// ✅ API error handling
if (!isset($jsonData["status"]) || strtolower($jsonData["status"]) !== "success") {
    echo json_encode([
        "error" => $jsonData["reason"] ?? "Unknown API error",
        "status" => $jsonData["status"] ?? "N/A"
    ]);
    exit;
}

// ✅ Filter live matches
$matches = $jsonData["data"] ?? [];
$liveMatches = array_filter($matches, function ($match) {
    return isset($match["matchStarted"]) && $match["matchStarted"];
});


// ✅ Final Output
echo json_encode([
    "success" => true,
    "data" => array_values($liveMatches)
]);
