const { v4: uuidv4 } = require('uuid');

// keyed by gid
let games = {};

// keyed by sid
// stores lists that contain games associated
//      to the sid
let sidGames = {};

class Game {
    constructor( sid, theme ) {
        this.id = uuidv4();
        this.grid = createGrid();
        this.theme = theme;
        this.start = Date.now();
        this.status = 'UNFINISHED';
        this.finish = '';

        games[this.id] = this;
        if (!sidGames[sid]) {
            sidGames[sid] = [];
        }
        sidGames[sid].push(this);
    }

    /*
        @move -> valid move made by the player

        performs the specified move
        returns true if the move results in a win,
            otherwise returns false
    */
    playerMove( move ) {
        let col = parseInt( move );
        let row = 0;
        while (this.grid[row][col] !== ' ') { row++; }
        this.grid[row][col] = 'X';
        return this.winCheck( row, col, 'X' );
    }

    /*
        generates and performs a random, valid move for the cpu
        returns true if the move results in a win
        returns false if the move does not result in a win,
            or if a move cannot be made
    */
    cpuMove() {
        if (this.full()) {
            return false;
        }

        let row = -1;
        let col = -1;
        do {
            col = Math.floor( Math.random() * 7 );
            row = this.validMove( col );
        } while (row === -1);
        this.grid[row][col] = 'O';
        return this.winCheck( row, col, 'O' );
    }

    /*
        returns true if there are no open slots in the grid
            otherwise returns false
    */
    full() {
        for (let row = 0; row < this.grid.length; row++) {
            if (this.grid[row].indexOf( ' ' ) !== -1) {
                return false;
            }
        }
        return true;
    }

    /*
        @col -> column index of move

        returns the lowest open row if the indexed column has 
            room for a token,
            otherwise returns -1
    */
    validMove( col ) {
        for (let row = 0; row < this.grid.length; row++) {
            if (this.grid[row][col] === ' ') {
                return row;
            }
        }
        return -1;
    }

    /*
        @row -> row index of the valid move
        @col -> column index of the valid move
        @token -> token that the check is matching

        returns true if there are at least four of the same tokens
            in a row
    */
    winCheck( row, col, token ) {
        return this.horizontalWin( row, col, token )
                || this.verticalWin( row, col, token )
                || this.upwardDiagonalWin( row, col, token )
                || this.downwardDiagonalWin( row, col, token );
    }

    /*
        @rowIndex -> row index of the valid move
        @colIndex -> column index of the valid move
        @token -> token that the check is matching

        returns true if there are at least four of the same tokens
            in a horizontal row
    */
    horizontalWin( rowIndex, colIndex, token ) {
        let cols = this.grid[0].length;
        let col = 0;
        let count = 1;

        col = colIndex - 1;
        while ( col > -1 && this.grid[rowIndex][col] === token ) {
            count++;
            col--;
        }

        col = colIndex + 1;
        while ( col < cols && this.grid[rowIndex][col] === token ) {
            count++;
            col++;
        }

        return count >= 4;
    }

    /*
        @rowIndex -> row index of the valid move
        @colIndex -> column index of the valid move
        @token -> token that the check is matching

        returns true if there are at least four of the same tokens
            in a vertical row
    */
    verticalWin( rowIndex, colIndex, token ) {
        let rows = this.grid.length;
        let row = 0;
        let count = 1;

        row = rowIndex - 1;
        while ( row > -1 && this.grid[row][colIndex] === token ) {
            count++;
            row--;
        }

        row = rowIndex + 1;
        while ( row < rows && this.grid[row][colIndex] === token ) {
            count++;
            row++;
        }

        return count >= 4;
    }

    /*
        @rowIndex -> row index of the valid move
        @colIndex -> column index of the valid move
        @token -> token that the check is matching

        returns true if there are at least four of the same tokens
            in an upwards diagonal row
    */
    upwardDiagonalWin( rowIndex, colIndex, token ) {
        let rows = this.grid.length;
        let cols = this.grid[0].length;
        let row = 0;
        let col = 0;
        let count = 1;

        row = rowIndex - 1;
        col = colIndex - 1;
        while ( row > -1
                    && col > -1
                    && this.grid[row][col] === token ){
            count++;
            row--;
            col--;
        }

        row = rowIndex + 1;
        col = colIndex + 1;
        while ( row < rows
                    && col < cols
                    && this.grid[row][col] === token ) {
            count++;
            row++;
            col++;
        }

        return count >= 4;
    }

    /*
        @rowIndex -> row index of the valid move
        @colIndex -> column index of the valid move
        @token -> token that the check is matching

        returns true if there are at least four of the same tokens
            in a downwards diagonal row
    */
    downwardDiagonalWin( rowIndex, colIndex, token ) {
        let rows = this.grid.length;
        let cols = this.grid[0].length;
        let row = 0;
        let col = 0;
        let count = 1;

        row = rowIndex + 1;
        col = colIndex - 1;
        while ( row < rows
                    && col > -1
                    && this.grid[row][col] === token ) {
            count++;
            row++;
            col--;
        }

        row = rowIndex - 1;
        col = colIndex + 1;
        while ( row > -1
                    && col < cols
                    && this.grid[row][col] === token ) {
            count++;
            row--;
            col++;
        }

        return count >= 4;
    }
}

/*
    @sid -> session id associated with games

    returns the list of games associated to @sid
*/
function getGamesBySid( sid ) {
    return sidGames[sid];
}

/*
    @sid -> session id associated with game
    @gid -> game id associated with game

    returns the game associated with @sid and @gid
        returns null if the game doesn't exist
*/
function getGame( sid, gid ) {
    let games = sidGames[sid];
    for (let i = 0; i < games.length; i++) {
        if (games[i].id === gid) {
            return games[i];
        }
    }
    return null;
}

/*
    creates a 5 x 7 grid of whitespace chars for a game
*/
function createGrid() {
    grid = [];
    for (let i = 0; i < 5; i++) {
        grid[i] = [];
        for (let j = 0; j < 7; j++) {
            grid[i][j] = ' ';
        }
    }
    return grid;
}

module.exports = {
    Game: Game,
    getGamesBySid: getGamesBySid,
    getGame: getGame
}