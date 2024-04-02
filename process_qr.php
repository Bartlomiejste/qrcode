<?php
// Wyłączenie wyświetlania błędów
ini_set('display_errors', 0);
// Rozpoczęcie sesji
session_start();
// Dołączenie skryptu z funkcją połączenia z bazą danych
require 'database.php';

// Uzyskanie połączenia z bazą danych
$db = getDbConnection();

// Sprawdzenie, czy metoda żądania to POST i czy plik został przesłany
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['pdf_file'])) {
    // Pobranie przesłanego pliku
    $pdfFile = $_FILES['pdf_file'];
    // Pobranie rozszerzenia pliku i przekształcenie na małe litery
    $fileType = strtolower(pathinfo($pdfFile['name'], PATHINFO_EXTENSION));

    // Sprawdzenie, czy plik ma rozszerzenie pdf
    if ($fileType !== 'pdf') {
        // Jeśli nie, zwróć błąd
        echo json_encode(['error' => "Tylko pliki PDF są dozwolone."]);
        exit;
    }

    // Pobranie danych kodu QR z przesłanych danych formularza (jeśli dostępne)
    $qrData = $_POST['qrData'] ?? '';
    // Pobranie nazwy pliku z przesłanych danych formularza lub użycie domyślnej
    $fileName = $_POST['fileName'] ?? 'defaultFileName';
    // Utworzenie ścieżki do zapisu pliku
    $filePath = UPLOAD_DIR . '/' . $fileName ;

    // Próba przeniesienia przesłanego pliku do docelowej lokalizacji
    if (!move_uploaded_file($pdfFile['tmp_name'], $filePath)) {
        // Jeśli się nie uda, zwróć błąd
        echo json_encode(['error' => "Wystąpił błąd podczas przesyłania pliku."]);
        exit;
    }

    // Sprawdzenie, czy kod QR już istnieje w bazie danych
    $stmt = $db->prepare("SELECT id FROM view_docs_qr WHERE doctxt = :doctxt");
    $stmt->execute([':doctxt' => $qrData]);
    $docId = $stmt->fetchColumn();

    // Jeśli dokument z takim kodem QR już istnieje
    if ($docId) {
        // Zwróć informację, że dokument już istnieje
        echo json_encode(['exists' => true, 'docId' => $docId]);
        exit;
    }

    // Jeśli dokument nie istnieje, dodaj go do bazy danych
    $stmt = $db->prepare("INSERT INTO view_docs_qr (doctxt, doctype) VALUES (:doctxt, 0) RETURNING id");
    if (!$stmt->execute([':doctxt' => $qrData])) {
        // W przypadku błędu zwróć komunikat
        echo json_encode(['error' => 'Nie udało się utworzyć nowego dokumentu w bazie danych.']);
        exit;
    }

    $docId = $stmt->fetchColumn();
    if (!$docId) {
        // Jeśli nie udało się dodać dokumentu, zwróć błąd
        echo json_encode(['error' => 'Nie udało się zarejestrować dokumentu w bazie danych.']);
        exit;
    }

    // Aktualizacja informacji o pliku
    $updateResult = $db->prepare("SELECT fn_upd_fileinfo(:id, :fname, :fileinfo, :fgroup, :md5sum, :docid, :doctype, :replacefile, :userid)");
    $result = $updateResult->execute([
        ':id' => -1,
        ':fname' => $fileName,
        ':fileinfo' => $qrData,
        ':fgroup' => 'selldocs',
        ':md5sum' => '',
        ':docid' => $docId,
        ':doctype' => 0,
        ':replacefile' => 0,
        ':userid' => $_SESSION['gluserID']
    ]);

    // Jeśli aktualizacja się powiedzie, zwróć sukces
    if ($result) {
        echo json_encode(['message' => "Dodano kod QR: $qrData do bazy danych.", 'filePath' => $filePath]);
    } else {
        // W przeciwnym razie zwróć błąd
        echo json_encode(['error' => 'Nie udało się zaktualizować informacji o pliku.']);
    }
} else {
    // Jeśli metoda żądania nie jest POST, zwróć błąd
    http_response_code(405);
    echo json_encode(['error' => 'Nieobsługiwana metoda żądania.']);
}