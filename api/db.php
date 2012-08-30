<?php

class Database {

    public static function getConnection() {
        // Create the database if it doesn't exist
        if(!file_exists('db/memory.db')) {
            copy('db/memory.db.dist', 'db/memory.db');
            chmod('db/memory.db', 0700);
        }
        try {
            $dbh = new PDO("sqlite:db/memory.db");
            $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $dbh;
        }
        catch(PDOException $e) {
            return false;
        }
    }

    private static function getResult($dbh, $query, $parameters) {
        try 
        {
            $sth = $dbh->prepare($query); 
            $sth->execute($parameters);
            return $dbh->lastInsertId();
        }

        catch(PDOException $e) 
        {
            return $e->getMessage(); 
        }
    }

    static function executeNonQuery($query, $parameters = array()) {
        $dbh = self::getConnection();
        $result = self::getResult($dbh, $query, $parameters);
        return $result;
    } 

    static function executeQuery($query, $parameters = array(), $singlerow = false) {
        $dbh = self::getConnection();
        $sth = $dbh->prepare($query);

        if(!empty($parameters)) {
            foreach($parameters as $k => $v) {
                $datatype = 2;

                if(is_int($v))
                    $datatype = PDO::PARAM_INT;
                else if(is_string($v))
                    $datatype = PDO::PARAM_TR;

                $sth->bindParam(':'.$k, $parameter[$k], $datatype);
            }
        }

        $sth->execute();
            $sth->setFetchMode(PDO::FETCH_ASSOC);

        if(!$singlerow)
            return $sth->fetchAll();

        @$result = $sth->fetchAll();

        if(count($result) == 0)
            return false;

        return $result[0];
    }
}
