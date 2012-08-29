function Shuffle(o) {
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

Audio = {
    sounds: { 
        purr: 'sounds/purr.wav', 
        angry: 'sounds/angry.wav', 
        flip: 'sounds/flip.wav',
        start: 'sounds/start.wav',
    }, 

    play: function(sound) {
        $('audio#'+sound).get(0).play();
    },

    setup: function() { // Insert <audio> tags in document body
        $.each(Audio.sounds, function(key, value) {
            var audio = $('<audio/>', { id: key, src: value, preload: 'auto', volume: 1 }).appendTo($('body'));
            document.getElementById(key).volume=.2;
        });
    }
}

Defer = {
    // Setup deferred objects
    fetchCards: $.Deferred(),
    deal: $.Deferred(),
},

Animation = {
    dealIndex: 0,
    deal: function() {
        $('li').each(function(i, li) {
            this.dfd = $.Deferred();

            // Calculate grid positions
            var row = Math.ceil(((i+1) / 4) - 1),
                col = i++ % 4;

            // 100ms delay between cards
            setTimeout(this.dfd.resolve, 100*i);
            
            this.dfd.done(
                function(li) {
                    // Move card to its new position
                    $('li').eq(Animation.dealIndex).animate({ 
                        left: (11.2 * col) + 'em',
                        top: (11.2 * row) + 'em',
                    }, 500);
                    Animation.dealIndex++;
                    if(Animation.dealIndex == 16) // Finished dealing
                        setTimeout(Defer.deal.resolve, 300);
                }
            );
        });
    },

    flip: function(){ 
        $this = Events.lastClicked;

        back = function() {
            Events.lastClicked.siblings().css({
                'visibility': 'visible',
                '-moz-transform': 'rotate(180deg) rotateY(0deg)',
                '-webkit-transform': 'rotate(180deg) rotateY(0deg)'
            });

            Events.lastClicked.hide();
        };

        $this.css({ // Flip the back
            '-moz-transform': 'rotateX(90deg)',
            '-webkit-transform': 'rotateX(90deg)'
        });

        // Hide the back and rotate the image into view
        setTimeout(back, 100);
    },

    unflip: function(card) {
        for(i = 0; i < 2; i++) {

                var front = function() {

                    card.css({
                        'visibility': 'visible',
                        '-moz-transform': 'rotateX(0deg)',
                        '-webkit-transform': 'rotateX(0deg)',
                    });

                    card.show();
                };

            // Flip the image before hiding it
            card.siblings().css({
                '-moz-transform': 'rotate(180deg) rotateX(90deg)',
                '-webkit-transform': 'rotate(180deg) rotateX(90deg)'
            });

            // Show the back and rotate it back into view
            setTimeout(front, 100);
        }
    }
};

Events = {
    firstClick: function(e) { 
        Audio.play('flip');
        
        // Cache selector of clicked card
        Events.firstClicked = $(this);
        Events.lastClicked = $(this);

        // Flip the card
        Animation.flip();

        // Setup event handler for the next click
        $('body').one('click', 'div.back', Events.secondClick);
    },

    secondClick: function(e) {

        // Increment guess counter
        Memory.attempts++;
        $('span#guesses').text(Memory.attempts);

        // Cache selector
        Events.lastClicked = $(this);

        // Flip the card
        Animation.flip();

        // Wait for 200ms before matching
        setTimeout(Memory.match, 200);
    }
};

Memory = {
    cards: {}, // Image data URLs go here
    pairs: 0, // Number of pairs found
    attempts: 0, // Number of guesses

    fetchCards: function() {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: "images.php",
            success: function(response) {
                Memory.cards = response;
                Defer.fetchCards.resolve();
            },
        });
    },

    shuffle: function() {
        // Duplicate the image array
        Memory.cards = $.merge(Memory.cards, Memory.cards);

        // Shuffle the cards
        Shuffle(Memory.cards);
    },

    deal: function() {
        Memory.shuffle();

        $.each(Memory.cards, function(i, card) {

            var random = (180+ (Math.floor(Math.random()*11) - 5));

            var img = $('<div/>').addClass('image')
                .css({
                    'visibility': 'hidden',
                    'background-image': 'url('+card+')',
                    'background-size': 'cover',
                    '-webkit-transform': 'rotate(180deg) rotateX(90deg)',
                    '-moz-transform': 'rotate(180deg) rotateX(90deg)',
                });

            var back = $('<div/>').addClass('back')
                .css({
                    'box-shadow': '1px 1px 6px #aaa',
                    'background-image': 'url(back.png)',
                    'background-size': 'cover',
                    '-webkit-transform': 'rotateX(0deg)',
                    '-moz-transform': 'rotateX(0deg)',
                });

            // Randomly rotate each card a few degrees
            $('li').eq(i).css({
                '-moz-transform': 'rotate('+ random +'deg)',
                '-webkit-transform': 'rotate('+ random +'deg)'
            }).append(img).append(back);

        });

        setTimeout(Animation.deal, 100);
    },

    startGame: function() {
        setTimeout(function() {
            Audio.play('start');
            $('img#spinner').hide();
            $('span').show();
            $('body').one('click', 'div.back', Events.firstClick);
            $(document).on('memory/fail', Memory.failure);
            $(document).on('memory/success', Memory.success);
            $(document).on('memory/gameOver', Memory.gameOver);
        }, 500);
    },

    match: function() {
        var first = Events.firstClicked.siblings().css('background-image'),
            second = Events.lastClicked.siblings().css('background-image');

        if(first == second)
            $(document).trigger('memory/success');
        else
            $(document).trigger('memory/fail');
                    
    },

    success: function() {
        Audio.play('purr');
        Memory.pairs++;
        if(Memory.pairs == 8) {
            $(document).trigger('memory/gameOver');
            return
        }
        Memory.reset();
    },

    failure: function() {
        Audio.play('angry');
        $('div.back').css({
            'background-image': 'url(angry-back.png)',
            // '-moz-transition-property': 'none',
            // '-webkit-transition-property': 'none',
        });
        dfd = $.Deferred();
        setTimeout(function() {
            Animation.unflip(Events.firstClicked);
            Animation.unflip(Events.lastClicked);
            $('div.back').delay(1000).queue(function() { 
                $(this).css({ 'background-image': 'url(back.png)', });
                $(this).dequeue();
                dfd.resolve();
            });
        }, 1000);
        dfd.done(Memory.reset);
    },

    reset: function() {
        console.log('reset');
        $('body').one('click', 'div.back', Events.firstClick);
    },
    gameOver: function() {
        console.log('A winner is you');
        console.log(Memory.attempts + ' guesses');
    },
};


(function(window, document, undefined) {
    $('span').hide();
    Audio.setup();
    Memory.fetchCards();
    Defer.fetchCards.done(Memory.deal);
    Defer.deal.done(Memory.startGame);
}());
