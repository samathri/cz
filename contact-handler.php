<?php
// Database credentials
$host = 'localhost';
$db   = 'cricket';
$user = 'root';
$pass = '';

// Create connection
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = htmlspecialchars(trim($_POST['name']));
    $email = htmlspecialchars(trim($_POST['email']));
    $message = htmlspecialchars(trim($_POST['message']));

    if (!empty($name) && !empty($email) && !empty($message)) {
        $stmt = $conn->prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $name, $email, $message);

        if ($stmt->execute()) {
            // Redirect back to index.html with a success query param
            header("Location: index.html?status=success#contact-section");
        } else {
            header("Location: index.html?status=error#contact-section");
        }
        $stmt->close();
    } else {
        header("Location: index.html?status=empty#contact-section");
    }
    $conn->close();
    exit;
}
?>
