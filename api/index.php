<?php
ini_set('max_input_vars', 1000000);
ini_set('mysql.connect_timeout', 300);
ini_set('default_socket_timeout', 300);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include_once "Specter.php";
include_once "ORM.php";

$method = filter_input(INPUT_POST, 'method');
$output = $method . '';

switch ($method) {
    case 'set-specter':
        $image = filter_input(INPUT_POST, 'image');
        $json = filter_input(INPUT_POST, 'json');
        $author_id = filter_input(INPUT_POST, 'author');
        $lat = filter_input(INPUT_POST, 'lat');
        $lon = filter_input(INPUT_POST, 'lon');
        $object = filter_input(INPUT_POST, 'object');
        $description = filter_input(INPUT_POST, 'description');

        $specter = new Specter(null, $json, $author_id, $image, $lat, $lon, $object, $description);
        $output = json_encode($_POST);

        break;
    case 'get-specter':
        $orm = new ORM();
        $output = json_encode($orm->getRowsFromTable('specters'));
        break;
    case 'set-author':

        break;
    case 'get-author':

        break;
    default:
        header("HTTP/1.0 400 Bad request");
}
echo $output;
