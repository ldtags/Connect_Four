const { v4: uuidv4 } = require('uuid');
let express = require('express');
let router = express.Router();
const api = 'api/v1';

let themes = require( '../models/theme.js' );
let meta = require( '../models/meta.js' );
let errors = require( '../models/error.js' );
let gameDb = require( '../models/gameDb.js' );
let tokenDb = require( '../models/tokenDb.js' );

/*
    @req -> the request object
    @res -> the response object
    @next -> the next handler for the request
        these parameters are consistent with every endpoint

    sends the main (and only) html file for the web app
*/
router.get( '', function( req, res, next) {
    res.status( 200 ).sendFile('../public/index.html');
});


/*
    generates and sends a new SID in the header
        X-sid : SID
*/
router.get( `/${api}/sids`, function( req, res, next) {
    res.writeHead( 200, { 'X-sid': uuidv4() } ).send();
});


/*
    responds with the default metadata
*/
router.get( `/${api}/meta`, function( req, res, next ) {
    res.status( 200 ).send( meta.defaultMetadata );
});


/*
    responds with a list of games associated with the provided SID
        responds with an error if no games are found

    request parameters:
        @sid -> a valid, url-encoded session id
*/
router.get( `/${api}/sids/:sid`, function( req, res, next) {
    let games = gameDb.getGamesBySid( req.params.sid );
    let error = new errors.Error( 'no associated games found' );
    res.status( 200 ).send( games
                                ? games
                                : error );
});


/*
    generates and sends a new game associated with the provided SID

    request parameters:
        @sid -> a valid, url-encoded session id
        @color -> a valid hex color, denoted #DDDDDD, located in the query
        @player -> player token id
        @computer -> computer token id
*/
router.post( `/${api}/sids/:sid`, function( req, res, next) {
    if (!req.query.color.match(/[0-9A-Fa-f]{6}/g)) {
        res.status( 200 ).send( new errors.Error( 'invalid color value' ) );
    }
    let sid = req.params.sid;
    let playerId = req.body.playerId;
    let computerId = req.body.computerId;
    let theme = new themes.Theme( req.query.color,
                                  tokenDb.getToken( playerId ),
                                  tokenDb.getToken( computerId ) );
    res.status( 200 ).send( new gameDb.Game( sid, theme ) );
});

/*
    responds with the game associated with the provided SID and GID
        responds with an error if specified game doesn't exist

    request parameters:
        @sid -> a valid, url-encoded session id
        @gid -> a valid, url-encoded game id
*/
router.get( `/${api}/sids/:sid/gids/:gid`, function( req, res, next) {
    let game = gameDb.getGame( req.params.sid, req.params.gid );
    let error = new errors.Error( 'specified game not found' );
    res.status( 200 ).send( game
                                ? game
                                : error );
});

/*
    makes a valid move in the specified game
    responds with the game object after the move is played
        responds with an error if specified game doesn't exist

    request parameters:
        @sid -> a valid, url-encoded session id
        @gid -> a valid, url-encoded game id
        @move -> a valid move, located in the query
*/
router.post( `/${api}/sids/:sid/gids/:gid`, function( req, res, next) {
    let sid = req.params.sid;
    let gid = req.params.gid;
    let game = gameDb.getGame( sid, gid );
    let error = new errors.Error( 'specified game not found' );
    if (game === null) {
        res.status( 200 ).send( error );
    }

    let playerWin = game.playerMove( req.query.move );
    let cpuWin = game.cpuMove();
    if (playerWin && cpuWin) {
        game.status = 'TIE';
    } else if (playerWin) {
        game.status = 'VICTORY';
    } else if (cpuWin) {
        game.status = 'LOSS';
    } else if (game.full()) {
        game.status = 'TIE';
    }

    if (game.status !== 'UNFINISHED') {
        game.finish = Date.now();
    }

    res.status( 200 ).send( game );
});

module.exports = router;