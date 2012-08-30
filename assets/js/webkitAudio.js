function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    var loader = this;

    request.onload = function() {
        loader.context.decodeAudioData(request.response, function(buffer) {
            if(!buffer) {
                alert('error decoding file data: ' + url);
                return;
            }

            loader.bufferList[index] = buffer;
            WebkitAudio.bufferList[index] = buffer;
            if(++loader.loadCount == loader.urlList.length)
                loader.onload(loader.bufferList);
        });
    };
    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
}

WebkitAudio = {
    context: null,

    sounds: function() {
        var sounds = Array();
        $.each(Audio.sounds, function(key,value) {
            sounds.push(value.file);
        });
        return sounds;
    },

    init: function() {
        WebkitAudio.context = new webkitAudioContext();

        bufferLoader = new BufferLoader(WebkitAudio.context, WebkitAudio.sounds(), WebkitAudio.complete);
        bufferLoader.load();
    },

    play: function(soundKey, volume) {
        var source = WebkitAudio.context.createBufferSource();
        var gainNode = WebkitAudio.context.createGainNode();

        source.buffer = WebkitAudio.bufferList[soundKey];
        source.connect(gainNode);
        gainNode.connect(WebkitAudio.context.destination);
        gainNode.gain.value = volume;
        WebkitAudio.source[soundKey] = source;
        source.noteOn(0);
    },

    source: { },

    pause: function(soundKey) {
        WebkitAudio.source[soundKey].noteOff(0);
    },

    complete: function() {},
    bufferList: Array(),
}


