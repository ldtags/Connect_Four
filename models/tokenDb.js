const { v4: uuidv4 } = require('uuid');

class Token {
    constructor( name, url ) {
        this.name = name;
        this.url = url;
        this.id = uuidv4();

        tokens[ this.id ] = this;
    }
}

let tokens = {};
[   new Token('Eagly',         '../images/eagly.jpg'),
    new Token('Frog Car',      '../images/frog-car.jpg'),
    new Token('Jon Favreau',   '../images/jon-favreau.jpg'),
    new Token('Mistuh White',  '../images/mistuh-white.jpg'),
    new Token('Jesse',         '../images/jesse.jpg'),
    new Token('The Squirrels', '../images/star-wars-squirrels.jpg')

].forEach( token => tokens[token.id] = token );

function getTokens() {
    return tokens;
}

function getToken( id ) {
    return tokens[id];
}

function getByName( name ) {
    let vals = Object.values( tokens );
    for (let i = 0; i < vals.length; i++) {
        if (vals[i].name === name) {
            return vals[i];
        }
    }
    return null;
}

module.exports = {
    Token: Token,
    getToken: getToken,
    getTokens: getTokens,
    getByName: getByName
};