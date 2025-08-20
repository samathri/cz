<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$apiKey = "a6b89693-432a-46c7-a5cf-c8888ce3cd77"; 
$url = "https://api.cricapi.com/v1/currentMatches?apikey=$apiKey&offset=0";

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

$jsonData = json_decode($response, true);

if ($jsonData === null) {
    echo json_encode([
        "error" => "JSON decoding failed",
        "rawResponse" => substr($response, 0, 300)
    ]);
    exit;
}

// Return full raw response and keys for debugging
echo json_encode([
    "rawResponse" => $jsonData,
    "topLevelKeys" => array_keys($jsonData),
    "dataSample" => isset($jsonData['data']) ? array_slice($jsonData['data'], 0, 3) : []
]);
