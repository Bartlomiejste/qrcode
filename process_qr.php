<?php
ini_set('display_errors', 0);
session_start();
require 'database.php';

$db = getDbConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['pdf_file'])) {
    $pdfFile = $_FILES['pdf_file'];
    $fileType = strtolower(pathinfo($pdfFile['name'], PATHINFO_EXTENSION));

    if ($fileType !== 'pdf') {
        echo json_encode(['error' => "Tylko pliki PDF są dozwolone."]);
        exit;
    }

    $qrData = $_POST['qrData'] ?? '';
    $fileName = $_POST['fileName'] ?? 'defaultFileName';
    $filePath = UPLOAD_DIR . '/' . $fileName ;

    if (!move_uploaded_file($pdfFile['tmp_name'], $filePath)) {
        echo json_encode(['error' => "Wystąpił błąd podczas przesyłania pliku."]);
        exit;
    }

    // Sprawdzenie, czy kod QR już istnieje w bazie danych
    $stmt = $db->prepare("SELECT id FROM view_docs_qr WHERE doctxt = :doctxt");
    $stmt->execute([':doctxt' => $qrData]);
    $docId = $stmt->fetchColumn();

    if ($docId) {
        // Jeśli kod QR już istnieje, zwróć informację o istnieniu
        echo json_encode(['exists' => true, 'docId' => $docId]);
        exit;
    }

    // Dodawanie nowego dokumentu do bazy danych
    $stmt = $db->prepare("INSERT INTO view_docs_qr (doctxt, doctype) VALUES (:doctxt, 0) RETURNING id");
    if (!$stmt->execute([':doctxt' => $qrData])) {
        echo json_encode(['error' => 'Nie udało się utworzyć nowego dokumentu w bazie danych.']);
        exit;
    }

    $docId = $stmt->fetchColumn();
    if (!$docId) {
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

    if ($result) {
        echo json_encode(['message' => "Dodano kod QR: $qrData do bazy danych.", 'filePath' => $filePath]);
    } else {
        echo json_encode(['error' => 'Nie udało się zaktualizować informacji o pliku.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Nieobsługiwana metoda żądania.']);
}