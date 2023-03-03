const api = 'api/v1';
let sid = 0;
let cols = 7;
let rows = 5;

/*
   actions performed when the DOM content is initially loaded
*/
window.addEventListener( 'DOMContentLoaded', () => {
   $('#create-game-button').click( createGame );
   $('#return-button').click( listView );
   $('#game-view').hide();
   setDefault();
   setSid();
});


/*
   @event -> event calling the method

   changes view to game-list-view
*/
function listView( event ) {
   event.preventDefault();

   $.ajax({
      url : `/connectfour/${api}/sids/${sid}`,
      method : 'GET',
      success : function ( games, status, xhr ) {
         let body = $('#game-list-table > #game-list-body');
         for (let i = games.length - 1; i > -1; i--) {
            let game = games[i];
            if (body.find( `#list-row-${game.id}` ).length === 0) {
               genListTableRow( game ).appendTo( body );
            } else {
               updateRow( game );
            }
         }
         $('#game-view').hide('slow');
         $('#game-list-view').show('slow');
      },
      error : function ( xhr, status, err ) {
         alert( `Server Error - status ${status} - ${err}` );
      }
   });
}

/*
   @date -> a string representation of a date

   returns a date string formatted to the specified date options
*/
function formatDate( date ) {
   const dateOptions = {
      weekday : 'short',
      month : 'short',
      year : 'numeric',
      day : 'numeric'
   };

   return new Date( date ).toLocaleDateString( "en-US", dateOptions );
}

/*
   @game -> game object of row being updated

   updated the game-list-view row to match the state of @game
*/
function updateRow( game ) {
   let row = $(`#game-list-table
                  > #game-list-body
                  > #list-row-${game.id}`);

   let status = row.find( 'td.list-status' );
   status.text( game.status );

   let finish = row.find( 'td.game-finish' );
   finish.text( game.finish
                     ? formatDate( game.finish ) 
                     : 'UNFINISHED',
                'game-finish' );
}

/*
   @game -> game object

   creates and returns a game list item from @game
*/
function genListTableRow( game ) {
   let row = $('<tr></tr>', {
      'class': "game-list-row"
   });
   row.attr('id', `list-row-${game.id}`);

   row.append( genTableItem( game.status, 'list-status' ) );
   row.append( genTableProfile( game.theme.playerToken,
                                game.id ) );
   row.append( genTableProfile( game.theme.computerToken,
                                game.id ) );

   row.append( genTableItem( formatDate( game.start ),
                             'game-start' ) );

   row.append( genTableItem( game.finish
                                 ? formatDate( game.finish )
                                 : 'UNFINISHED',
                             'game-finish' ) );

   row.append( genTableButton( game.theme.color,
                               game.id ) );
   return row;
}

/*
   @text -> string of text to add to the table item text content

   creates and returns a jQuery object containing a <td> element
      that contains @text
*/
function genTableItem( text, classes ) {
   let item = $('<td></td>');
   item.text( text );

   if (classes) {
      item.addClass( classes );
   }
   return item;
}

/*
   @token -> token object of token being placed in table cell
   @gid -> the id of the game

   returns the table cell with the token inside of it
*/
function genTableProfile( token, gid ) {
   let img = $(`<img src="${token.url}"></img>`);
   img.addClass( [ 'rounded-circle',
                   'border',
                   'border-dark' ]);
   img.css({
      'height': '50px',
      'width': '50px'
   });
   return $('<td class="game-list-cell"></td>').append( img );
}

/*
   @color -> color of game
   @gid -> id of the game

   creates and returns a button that changes the view to the
      game-view of the row
*/
function genTableButton( color, gid ) {
   let item = $('<td></td>');
   let button = $('<button></button>');
   button.addClass( 'btn' );
   button.css( 'background-color', color );
   button.text( 'view' );
   button.click( () => {
      $.ajax({
         url : `/connectfour/${api}/sids/${sid}/gids/${gid}`,
         method : 'GET',
         success : function ( game, status, xhr ) {
            loadGame( game );
         },
         error : function ( xhr, status, err ) {
            alert( `Server Error - status ${status} - ${err}` );
         }
      })
   });

   item.append( button );
   return item;
}

/*
   @event -> event calling the method

   sends a POST request to create a new game
   request parameters:
        @sid -> url-encoded sid of the current session
        @color -> hex value of color from game-list-view user
                     input fields, placed in query
        @player -> player token id, placed in the body
        @computer -> computer token id, placed in the body
*/
function createGame( event ) {
   event.preventDefault();
   let color = $('#color-picker').val();
   let playerId = $('#user-select').val();
   let computerId = $('#computer-select').val();

   $.ajax({
      url : `/connectfour/${api}/sids/${sid}?`
               + $.param({ 'color' : color }),
      data: { 'playerId': playerId,
              'computerId': computerId },
      method : 'POST',
      success : function ( game, status, xhr ) {
         loadGame( game );
      },
      error : function ( xhr, status, err ) {
         alert( `Server Error - status ${status} - ${err}` );
      }
   });
}

/*
   @game -> game object that game-view is built from

   shows the game-view of @game
*/
function loadGame( game ) {
   createBoardHead( game.theme.playerToken.url,
                    game.id );

   createBoardBody( game.theme.color,
                    game.status );

   $('#game-list-view').hide('slow');
   $('#game-view').show('slow');

   updateGameView( game.grid,
                   game.theme,
                   game.status );

}

/*
   fetches an sid for the session
   initializes the global sid variable
*/
function setSid() {
   $.ajax({
      url : `/connectfour/${api}/sids`,
      method : 'GET',
      success : function ( data, status, xhr ) {
         sid = xhr.getResponseHeader('X-sid');
      }
   });
}


/*
   fetches the metadata of the app
   sets the values of the user input fields in game-list-view
      to the default metadata specs
*/
function setDefault() {
   $.ajax({
      url : `/connectfour/${api}/meta`,
      method : 'GET',
      success : function ( metadata ) {
         $('#color-picker').val( metadata.def.color );
         setSelects( metadata );
      }
   });
}

/*
   @metadata -> metadata of the app

   injects the player select element and computer select
      element with options for each token
*/
function setSelects( metadata ) {
   let userSelect = $('#user-select');
   let cpuSelect = $('#computer-select');

   for (let i = 0; i < metadata.tokens.length; i++) {
      token = metadata.tokens[i];
      userSelect.append( genOption( token ) );
      cpuSelect.append( genOption( token ) );
   }

   genSelectEvent( userSelect,
                   cpuSelect,
                   metadata.def.playerToken.id );

   genSelectEvent( cpuSelect,
                   userSelect,
                   metadata.def.computerToken.id );
}

/*
   @token -> token object of the token being added

   returns a jQuery object for an option element that
      contains the name and id of the token
*/
function genOption( token ) {
   return $(`<option value="${token.id}">${token.name}</option>`);
}

/*
   @select -> a jQuery object containing the select element
                 that recieved input
   @target -> a jQuery object containing the select element
                 being disabled
   @id -> the id of the option selected

   creates an event to handle a user changing the selected token
   also sets the default token
*/
function genSelectEvent( select, target, id ) {
   select.change( () => {
      enable( target );
      disable( target, select.val() );
   });
   select.val( id );
   disable( target, id );
}

/*
   @select -> a jQuery object containing the select element
                 that recieved input
   @id -> the id of the option selected

   disables the option that's a child of @select
      with @id as it's value
*/
function disable( select, id ) {
   let option = select.find( `option[value=${id}]` );
   option.prop( 'disabled', true );
}

/*
   @select -> a jQuery object containing the select element
                 that recieved input

   enables the disabled option in @select
   assumes there is only one disabled option
*/
function enable( select ) {
   let option = select.find( 'option[disabled]' );
   option.prop( 'disabled', false );
}

/*
   @url -> url to the image of the player token
   @id -> id of the game being set up

   creates and injects the DOM elements to build the board head
   returns a DOM element object of the board head
*/
function createBoardHead( url, gid ) {
   let boardHead = clean( $('#board-head') );
   for (let i = 0; i < cols; i++) {
      let inputTile = buildTile();
      inputTile.id = "head-" + i.toString();
      addInputEvents( $(inputTile),
                      gid,
                      url );

      let inputCircle = buildCircle();
      inputCircle.id = 'input-circle';
      inputTile.appendChild( inputCircle );
      boardHead.appendChild( inputTile );
   }
   return boardHead;
}

/*
   @inputTile -> jQuery object containing tile being set up
   @gid -> id of the game being set up
   @url -> local url to the image of the player token

   attaches event listeners to @inputTile
   event listeners are:
      click -> attempts to play token in associated column
      mouseover -> place token in hovered tile
      mouseleave -> removes token from tile left
*/
function addInputEvents( inputTile, gid, url ) {
   inputTile.click( () => {
      let move = inputTile.attr('id').split( '-' )[1];
      if (!fullCol( parseInt( move, 10 ) )) {
         playMove( gid, move );
      }
   });

   inputTile.mouseenter( () => {
      let circle = inputTile.find( '#input-circle' );
      circle.removeClass( 'bg-white' );
      circle.css( 'background-image', `url(${url})` );
      circle.addClass( 'shadow' );
   });

   inputTile.mouseleave( () => {
      let circle = inputTile.find( '#input-circle' );
      circle.removeClass( 'shadow' );
      circle.css( 'background-image', 'none' );
      circle.addClass( 'bg-white' );
   });
}

/*
   @col -> index of the column being checked

   returns true if the selected column is full
      otherwise returns false
*/
function fullCol( col ) {
   for (let row = 0; row < rows; row++) {
      let tile = $(`#game-board > #board-body
                     > #board-row
                     > #${row}-${col}
                     > #token-slot`);
      if (tile.css( 'background-image' ) === 'none') {
         return false;
      }
   }
   return true;
}

/*
   @gid -> id of the current game
   @move -> the column index [0 - 6] of the valid move

   sends a POST request to play a valid move
   request parameters:
        @sid -> url-encoded sid of the current session
        @gid -> url-encoded gid of the current game
        @move -> the column index [0 - 6] of the valid move,
                     placed in the query
*/
function playMove( gid, move ) {
   $.ajax({
      url : `/connectfour/${api}/sids/${sid}/gids/${gid}?`
               + $.param({ 'move' : move }),
      method : 'POST',
      success : function ( game, status, xhr ) {
         updateGameView( game.grid,
                         game.theme,
                         game.status );
      },
      error : function ( xhr, status, err ) {
         alert( `Server Error - status ${status} - ${err}` );
      }
   });

   return '';
}

/*
   @grid -> grid of the current game
   @theme -> theme of the current game
   @status -> status of the current game

   updates game-view to match the state of @game
*/
function updateGameView( grid, theme, status ) {
   updateBoard( grid, theme );
   updateStatus( status );
}

/*
   @grid -> grid of the current game
   @theme -> theme of the current game

   renders both player and cpu tokens after a valid move
*/
function updateBoard( grid, theme ) {
   for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
         if (grid[row][col] === 'X') {
            renderToken( theme.playerToken, row, col );
         }
         if (grid[row][col] === 'O') {
            renderToken( theme.computerToken, row, col );
         }
      }
   }
}

/*
   @status -> status of the current game

   updates state of game-view depending on @status
*/
function updateStatus( status ) {
   $('#game-status').text( status );
   let head = $('#game-board > #board-head');

   if (status === 'UNFINISHED') {
      head.css({ 'background-image': 'none' });
      return;
   }

   let url = '../images/cry.gif';
   if (status === 'VICTORY') {
      url = '../images/winner.gif';
   }

   head.empty();
   head.css({ 'background-image': `url(${url})` });
}

/*
   @token -> token being rendered
   @row -> row index of token
   @col -> col indef of token

   sets the background image of the circle at cell [row, col]
      to the @token image
*/
function renderToken( token, row, col ) {
   let viewToken = $(`#${row}-${col}
                           > #token-slot`);
   if (viewToken.css( 'background-image' ) === 'none') {
      viewToken.css( 'background-image', `url(${token.url})` );
   }
}

/*
   @color -> hex value for the color of the board
   @status -> the current status of the game
               [ UNFINISHED | LOSS | VICTORY | TIE ]

   creates and injects DOM elements to build the board body
   returns a DOM element object of the board body
*/
function createBoardBody( color, status ) {
   let boardBody = clean( $('#board-body') );
   for (let row = 0; row < rows; row++) {
      let boardRow = buildRow();
      boardRow.id = 'board-row';
      for (let col = 0; col < cols; col++) {
         let tile = buildTile();
         tile.id = `${rows - row - 1}-${col}`;
         let openCircle = buildCircle( [ 'border',
                                         'border-dark' ] );
         openCircle.id = 'token-slot';
         tile.appendChild( openCircle );
         boardRow.appendChild( tile );
      }
      boardBody.appendChild( boardRow );
   }
   boardBody.style['background-color'] = color;
   $('#game-status')[0].textContent = status;
   return boardBody;
}

/*
   @classes -> a list of strings denoting extra classes
                  to add to the row

   returns a DOM element object of a board row
*/
function buildRow( classes ) {
   let row = document.createElement('div');
   row.classList.add( 'flex-fill',
                      'd-inline-flex',
                      'justify-content-around',
                      'board-row' );
   if (classes) {
      row.classList.add( classes );
   }
   return row;
}

/*
   @classes -> a list of strings denoting extra classes
                  to add to the tile

   returns a DOM element object of a board tile
*/
function buildTile( classes ) {
   let tile = document.createElement('div');
   tile.classList.add( 'flex-fill',
                       'd-flex',
                       'justify-content-center',
                       'align-items-center' );
   if (classes) {
      tile.classList.add( classes );
   }
   return tile;
}

/*
   @classes -> a list of strings denoting extra classes
                  to add to the circle

   returns a DOM element object of a blank circle
   these circles are used to place tokens on the board
*/
function buildCircle( classes ) {
   let circle = document.createElement('div');
   circle.style['background-image'] = 'none';
   circle.style['background-size'] = '100%';
   circle.classList.add( 'rounded-circle',
                         'token',
                         'bg-white' );
   if (classes) {
      circle.classList.add( classes );
   }
   return circle;
}

/*
   @element -> JQuery object of the element

   removes all children of the element
   returns a DOM element object of the clean element
*/
function clean( element ) {
   element.empty();
   return element[0];
}