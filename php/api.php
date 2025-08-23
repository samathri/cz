<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);            // Hide errors from output
ini_set('log_errors', 1);                // Enable error logging
ini_set('error_log', __DIR__ . '/php-error.log');

header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json");

$apiKey = "xfuTUNLScdqJ8pLfh27z5rD69eFqk8gdFbik0fvj";
$baseUrl = "https://api.sportradar.com/cricket-t2/en";

/**
 * Fetch data from Sportradar API endpoint using cURL
 * @param string $endpoint Full API URL without api_key param
 * @param string $apiKey API key
 * @return array|null Decoded JSON or array with error
 */
function fetchSrApi($endpoint, $apiKey)
{
    $url = $endpoint . "?api_key=" . urlencode($apiKey);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);

    if (!$response) {
        $err = curl_error($ch);
        curl_close($ch);
        return ['error' => "cURL Error: $err"];
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return ['error' => "HTTP Error: $httpCode", 'raw' => $response];
    }

    $json = json_decode($response, true);

    if ($json === null) {
        file_put_contents(__DIR__ . '/invalid_json.log', $response);
        return ['error' => 'Invalid JSON response', 'raw' => $response];
    }

    return $json;
}

// Get today's date in UTC
$today = date('Y-m-d');
$now = new DateTime('now', new DateTimeZone('UTC'));

// Fetch full schedule for today
$todaySchedule = fetchSrApi("$baseUrl/schedules/$today/schedule.json", $apiKey);
if (isset($todaySchedule['error'])) {
    echo json_encode(['status' => 'error', 'message' => $todaySchedule['error']]);
    exit;
}

$allMatchesRaw = [];
if (isset($todaySchedule['sport_events']) && is_array($todaySchedule['sport_events'])) {
    $allMatchesRaw = $todaySchedule['sport_events'];
} elseif (isset($todaySchedule['sport_event'])) {
    $allMatchesRaw = [$todaySchedule['sport_event']];
}

$liveMatches = [];
$upcomingMatches = [];

foreach ($allMatchesRaw as $match) {
    if (!isset($match['scheduled']))
        continue;

    $scheduled = new DateTime($match['scheduled'], new DateTimeZone('UTC'));

    // Determine match status if available
    // Try to get match status from 'status' or 'status_code' or 'sport_event_status'
    $isFinished = false;
    $isLive = false;

    // Example keys to check for match state — adjust based on actual API response
    if (isset($match['status'])) {
        $status = strtolower($match['status']);
        if (in_array($status, ['closed', 'finished', 'completed'])) {
            $isFinished = true;
        }
        if (in_array($status, ['in_progress', 'live', 'started'])) {
            $isLive = true;
        }
    }

    // Also check nested sport_event_status.match_status if available
    if (isset($match['sport_event_status']['match_status'])) {
        $ms = strtolower($match['sport_event_status']['match_status']);
        if (in_array($ms, ['closed', 'finished', 'completed'])) {
            $isFinished = true;
            $isLive = false;
        }
        if (in_array($ms, ['in_progress', 'live', 'started'])) {
            $isLive = true;
        }
    }

    // Fallback logic:
    // If no status info, but scheduled time is <= now, assume live (not finished)
    if (!$isFinished && !$isLive && $scheduled <= $now) {
        $isLive = true;
    }

    if ($isLive) {
        $liveMatches[] = $match;
    } elseif ($scheduled > $now) {
        $upcomingMatches[] = $match;
    }
}

echo json_encode([
    'status' => 'success',
    'liveMatches' => $liveMatches,
    'upcomingMatches' => $upcomingMatches,
]);
