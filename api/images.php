<?php 
    function encodeimage($imagefile) {
        $filename = file_exists($imagefile) ? htmlentities($imagefile) : die('nope');
        $filetype = pathinfo($filename, PATHINFO_EXTENSION);
        $imgbin = fread(fopen($filename, "r"), filesize($filename));
        return 'data:image/' . $filetype . ';base64,' . base64_encode($imgbin);
    }
    $images = array(); 
    if($handle = opendir('../images')) {
        while(false !== ($entry = readdir($handle))) {
            if($entry != "." && $entry != ".." && $entry != '.DS_Store') {
                $images[] = encodeimage('../images/'.$entry);
            }
        } 
        closedir($handle);
    } 

    print json_encode($images);
?>
