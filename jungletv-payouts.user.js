// ==UserScript==
// @name         JungleTV Payout Estimator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds the users last outgoing BAN transactions below each video in the queue.
// @author       Banonkey
// @match        https://jungletv.live*
// @icon         https://www.google.com/s2/favicons?domain=jungletv.live
// @grant        none
// @license      GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

(function() {
    function updateJungleBansPaid() {
        const playerContainer = document.querySelector( '.player-container' );
        const sidebar = playerContainer.nextElementSibling;
        const maxAge = 3600 * 2 * 1000;

        const queueItems = sidebar.querySelectorAll(
            ':scope > .transition-container > div > div > .flex-row'
        );

        queueItems.forEach( ( item ) => {
            // Check if item has already been updated
            const transactionsElement = item.querySelector(
                ':scope .ban-transactions'
            );
            if ( transactionsElement !== null ) {
                return;
            }

            const itemTitle = item
            .querySelector( ':scope .text-xs .font-mono.cursor-pointer' )
            .getAttribute( 'title' );

            // The complete BAN address
            const banKey = itemTitle.replace( 'Click to copy: ', '' );

            // API call to get last transactions
            const url =
                  'https://api.creeper.banano.cc/v2/accounts/' + banKey + '/history';

            fetch( url )
                .then( function ( response ) {
                if ( response.status !== 200 ) {
                    console.log(
                        'Looks like there was a problem. Status Code: ' +
                        response.status
                    );
                    //return;
                }

                // Examine the text in the response
                response.json().then( function ( data ) {
                    let sentBans = [];

                    data.forEach( ( transaction ) => {
                        if ( transaction.subtype === 'send' ) {
                            const amount =
                                  Math.round(
                                      transaction.amount /
                                      10000000000000000000000000
                                  ) / 10000;

                            const timeDifference =
                                  Date.now() - transaction.timestamp;

                            if ( timeDifference < maxAge ) {
                                console.log(
                                    'Found Transaction: ' +
                                    amount +
                                    ' BAN ' +
                                    timeDifference +
                                    ' ago.'
                                );

                                sentBans = [ ...sentBans, amount ];
                            }
                        }
                    } );

                    // Append to queue item
                    const node = document.createElement( 'p' );
                    node.classList.add('ban-transactions', 'text-xs' );
                    node.style.color = 'red';
                    node.style.fontWeight = 'bold';
                    const textnode = document.createTextNode(
                        sentBans.join( ' / ' )
                    );
                    node.appendChild( textnode );

                    const col2 = item.querySelector(
                        ':scope .flex-col.flex-grow'
                    );
                    col2.appendChild( node );
                } );
            } )
                .catch( function ( err ) {
                console.log( 'Fetch Error :-S', err );
            } );
        } );
    }

    window.setInterval( function () {
        updateJungleBansPaid();
    }, 5000 );

})();
