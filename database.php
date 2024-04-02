<?php
require 'config.php';

function getDbConnection() {
    try {
        $db = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $db;
    } catch (PDOException $e) {
        die("Nie można połączyć z bazą danych: " . $e->getMessage());
    }
}

function getFilename($db, $id, $group) {
    $stmt = $db->prepare("SELECT fn_get_filename(:id, :grp)");
    $stmt->execute([':id' => $id, ':grp' => $group]);
    return $stmt->fetchColumn();
}

function updateFileInfo($db, $params) {
    $stmt = $db->prepare("SELECT fn_upd_fileinfo(:id, :fname, :fileinfo, :fgroup, :md5sum, :docid, :doctype, :replacefile, :userid)");
    $stmt->execute($params);
    return $stmt->fetchColumn();
}