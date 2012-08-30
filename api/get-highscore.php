<?php
require_once("db.php");

$query = "SELECT clicks FROM log ORDER BY clicks ASC LIMIT 1";
echo json_encode(Database::executeQuery($query, array(), true));
