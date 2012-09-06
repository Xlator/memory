<?php
require_once("db.php");

$query = "INSERT INTO log (clicks, end) VALUES (:score, datetime('now'))";
if(!is_null($_POST['score'])) {
    $parameters = array("score" => $_POST['score']);
    echo json_encode(Database::executeNonQuery($query, $parameters));
    return;
}
