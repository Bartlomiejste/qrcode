<?php
// Dołączenie pliku konfiguracyjnego, który zawiera stałe takie jak DB_DSN, DB_USER, DB_PASSWORD
require 'config.php';

// Funkcja do nawiązywania połączenia z bazą danych
function getDbConnection() {
    try {
        // Tworzenie nowego obiektu PDO do obsługi połączenia z bazą danych
        $db = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
        // Ustawienie trybu błędu na wyjątek, aby łatwiej zarządzać błędami
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $db; // Zwracanie obiektu połączenia
    } catch (PDOException $e) {
        // W przypadku niepowodzenia połączenia, zakończ działanie skryptu i wyświetl błąd
        die("Nie można połączyć z bazą danych: " . $e->getMessage());
    }
}

// Funkcja do pobierania nazwy pliku z bazy danych na podstawie identyfikatora i grupy
function getFilename($db, $id, $group) {
    // Przygotowanie zapytania SQL wykorzystującego funkcję zdefiniowaną w bazie danych
    $stmt = $db->prepare("SELECT fn_get_filename(:id, :grp)");
    // Wykonywanie zapytania z przekazanymi parametrami
    $stmt->execute([':id' => $id, ':grp' => $group]);
    // Zwracanie wyniku zapytania (nazwy pliku)
    return $stmt->fetchColumn();
}

// Funkcja do aktualizacji informacji o pliku w bazie danych
function updateFileInfo($db, $params) {
    // Przygotowanie zapytania SQL wykorzystującego funkcję zdefiniowaną w bazie danych
    $stmt = $db->prepare("SELECT fn_upd_fileinfo(:id, :fname, :fileinfo, :fgroup, :md5sum, :docid, :doctype, :replacefile, :userid)");
    // Wykonywanie zapytania z przekazanym tablicą parametrów
    $stmt->execute($params);
    // Zwracanie wyniku zapytania, który może zawierać wartość zwróconą przez funkcję bazy danych
    return $stmt->fetchColumn();
}