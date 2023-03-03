let theme = require( './theme.js' );
let tokenDb = require( './tokenDb.js' );

class Metadata {
    constructor( tokens ) {
        this.tokens = tokens;
        this.def = new theme.Theme( '#FFFF83',
                                    tokenDb.getByName('Frog Car'),
                                    tokenDb.getByName('The Squirrels') );
    }
}

let tokens = tokenDb.getTokens();
const defaultMetadata = new Metadata( Object.values( tokens ) );

module.exports = {
    Metadata: Metadata,
    defaultMetadata: defaultMetadata
};