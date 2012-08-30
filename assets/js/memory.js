function Shuffle(o) {
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};


Audio = {
    sounds: { 
        purr: { file: 'assets/sounds/purr.wav', volume: 0.1 },
        angry: { file: 'assets/sounds/angry.wav', volume: 0.2 },
        flip: { file: 'assets/sounds/flip.wav', volume: 0.1 },
        start: { file: 'assets/sounds/start.wav', volume: 0.4 },
        win: { file: 'assets/sounds/MeowMix.wav', volume: 0.1 },
        tick: { file: 'assets/sounds/tick.wav', volume: 0.02 },
        again: { file: 'assets/sounds/again.wav', volume: 0.8 }
    }, 
    findSoundKey: function(sound) {
        var i = 0,
        soundKey = 0;

        $.each(Audio.sounds, function(key, value) {
            if(key == sound) {
                soundKey = i;
            }
            else {
                i++;
            }
        });

        return soundKey;
    },

    play: function(sound) {
        if(WebkitAudio.context != null) {
            WebkitAudio.play(Audio.findSoundKey(sound), Audio.sounds[sound].volume);
        }
        else
            $('audio#'+sound).get(0).play();
    },

    pause: function(sound) {
        if(WebkitAudio.context != null)
            WebkitAudio.pause(Audio.findSoundKey(sound));
        else
            $('audio#'+sound).get(0).pause();
    },

    setup: function() { // Insert <audio> tags in document body
        if('webkitAudioContext' in window) {
            WebkitAudio.init();
        }

        else {
            $.each(Audio.sounds, function(key, value) {
                var audio = $('<audio/>', { id: key, src: value.file, preload: 'auto', }).appendTo($('body'));
                document.getElementById(key).volume=value.volume;
            });
        }
    }
}

Defer = {
    // Set up deferred objects
    fetchCards: $.Deferred(),
    deal: $.Deferred(),
}

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
    },

    winDialog: function() {
        $('span#score').text(Memory.attempts);
        $('span#playagain').hide();
        var left = ($(window).width() - $('div#dialog').width()) / 2;
        $('div#dialog').css('left', left).fadeIn(500);
        var playagainLeft = ($('div#dialog').width() - $('span#playagain').width()) / 2;
        $('span#playagain').css('left', playagainLeft);
    },

    record: function() {

        var oldrecord = parseInt($('span#best').text()),
            newrecord = Memory.attempts;

        interval = setInterval(function() {
                $('span#best').text(--oldrecord);
                Audio.play('tick');
                if(oldrecord == newrecord)
                    clearInterval(interval);
        }, 100);
    
    },
};

Events = {

    resize: function(e) {
        var size = ($(window).height() - 46) / 55;
        $('html').css('font-size', ($(window).height() - 46) / 55 + 'px');
    },

    firstClick: function(e) { 
        Audio.play('flip');
        
        // Cache selector of clicked card
        Events.firstClicked = $(this);
        Events.lastClicked = $(this);

        // Flip the card
        Animation.flip();

        // Setup event handler for the next click
        $('body').one(click, 'div.back', Events.secondClick);
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
    best: function() {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: "api/get-highscore.php",
            success: function(response) {
                $('span#best').text(response.clicks);
            }
        });
    },

    fetchCards: function() {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: "api/images.php",
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
                    'background-image': 'url(assets/images/back.png)',
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
  

        if(iOS) {
            $(document).on('touchstart', 'header', function() {
                alert('hax');
                Audio.play('start');
            });
        }
        setTimeout(function() { // Play start sound and create event handlers after a small pause
            Audio.play('start');
            $('img#spinner').hide();
            $('span').show();
            $('body').one(click, 'div.back', Events.firstClick);
            $(document).on('memory/fail', Memory.failure);
            $(document).on('memory/success', Memory.success);
            $(document).on('memory/gameOver', Memory.gameOver);
            $(document).on('memory/record', Memory.record);
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
        Memory.pairs++;
        if(Memory.pairs == 8) {
            $(document).trigger('memory/gameOver');
            return
        }
        else
            Audio.play('purr');
        Memory.reset();
    },

    failure: function() {
        Audio.play('angry');
        $('div.back').css({
            'background-image': 'url(assets/images/angry-back.png)',
        });
        dfd = $.Deferred();
        setTimeout(function() {
            Animation.unflip(Events.firstClicked);
            Animation.unflip(Events.lastClicked);
            $('div.back').delay(1000).queue(function() { 
                $(this).css({ 'background-image': 'url(assets/images/back.png)', });
                $(this).dequeue();
                dfd.resolve();
            });
        }, 1000);
        dfd.done(Memory.reset);
    },

    reset: function() {
        $('body').one(click, 'div.back', Events.firstClick);
    },
    gameOver: function() {
        Audio.play('win');
        Animation.winDialog();

        if(parseInt($('span#best').text()) > Memory.attempts) {
            setTimeout(function() { 
                $('span#message').text("(That's a new record!)");
                $(document).trigger('memory/record'); 
            }, 1200);
        }

        setTimeout(function () {
            $('span#playagain').show().on(click, 'a', function(e) {
                e.preventDefault();
                Audio.pause('win');
                Audio.play('again');
                setTimeout(function() {
                    window.location = "./";
                }, 1000);
            });
        }, 5000);
    },

    record: function() {
        setTimeout(Animation.record, 600);
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "api/post-highscore.php",
            data: { score: Memory.attempts },
        });
    }
};


(function(window, document, undefined) {
    // Detect iOS devices and change click event to touchstart
    iOS = navigator.userAgent.indexOf('iPad') > -1 || navigator.userAgent.indexOf('iPhone') > -1;
    click = iOS ? 'touchstart' : 'click';

    Events.resize();
    $('span').hide();

    // window.addEventListener('load', WebkitAudio.init, false);

    Audio.setup();
    Memory.best();
    Memory.fetchCards();
    Defer.fetchCards.done(Memory.deal);
    Defer.deal.done(Memory.startGame);
}(window, document, undefined));

