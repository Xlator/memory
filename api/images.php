<?php 
require_once("db.php");

    function encodeimage($imagefile) {
        $filename = file_exists($imagefile) ? htmlentities($imagefile) : die('nope');
        $filetype = pathinfo($filename, PATHINFO_EXTENSION);
        $imgbin = fread(fopen($filename, "r"), filesize($filename));
        return 'data:image/' . $filetype . ';base64,' . base64_encode($imgbin);
    }

    $images = array(); 

    function getImageTypeFromBlob($imageData)
    {
        $signatures = array(
            'jpg' => "\xFF\xD8\xFF",
            'gif' => "GIF",
            'png' => "\x89PNG",
            'bmp' => "BM",
            'swf' => "CWS"
        );

        $first4Bytes = substr($imageData, 0, 4);

        foreach ($signatures as $imageType => $signature) {
            if (strpos($first4Bytes, $signature) === 0) {
                return $imageType;
            }
        }

        return false;
    }

    $dbh = Database::getConnection();

    if(!file_exists('db/memory.db')) {
        if($handle = opendir('../images')) {
            while(false !== ($entry = readdir($handle))) {
                if($entry != "." && $entry != ".." && $entry != '.DS_Store') {
                    $images[] = encodeimage('../images/'.$entry);
                }
            } 
            closedir($handle);
        } 
    }

    else {
        $query = "SELECT image FROM images";
        $q = $dbh->prepare($query);
        $q->execute();
        $q->bindColumn(1, $image, PDO::PARAM_LOB);

        while($q->fetch())
            array_push($images, 'data:image/'.getImageTypeFromBlob($image).';base64,'.base64_encode($image));
    }

    print json_encode($images);

