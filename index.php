<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>LolMemory</title>

    <!--blank favicon-->
    <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=" rel="icon" type="image/x-icon" />
    
    <!-- CSS reset -->
    <link media="all" href="http://yui.yahooapis.com/3.3.0/build/cssreset/reset-min.css" type="text/css" rel="stylesheet" />

    <link rel="stylesheet" href="assets/css/style.css" />
    <script type=text/javascript src=http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.js></script>

</head>
<body>
    <header>
        <h1>Meowmory</h1>
        <span id=audio></span>
    </header>
    <div style="clear: all" />
    <div id="memoryContainer">
        <ul>
        <?php
            for($i = 0; $i < 16; $i++) {
                echo "<li data-id=$i></li>";
            }
        ?>
        </ul>
        <img id="spinner" src="assets/images/load.gif" />
        <span id="best">99</span>
        <span id="guesses">0</span>
    </div> 
    <div id=dialog>
        <div>
            <span id=playagain>
                <a href=#>Meowww?</a> 
                (That's cat for "play again?")
            </span>
            You won in <span id=score></span> tries
            <span id=message><span>
        </div>
    </div>
    <script src="assets/js/memory.js" type="text/javascript"></script>
</body>
</html>
