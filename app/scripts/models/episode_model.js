HighFidelity.Episode = DS.Model.extend({
    podcast: DS.belongsTo('podcast', {async: true}),

    name: DS.attr('string'),
    audioURL: DS.attr('string'),
    audioLength: DS.attr('number'),
    playbackPosition: DS.attr('number'),
    playCount: DS.attr('number'),
    audioFileName: DS.attr('string'),
    guid: DS.attr('string'),

    // Episode metadata from RSS.
    datePublished: DS.attr('number'),

    // Episode download data; unavailable in hosted version for the time being.
    isDownloaded: DS.attr('boolean'), // TODO: check the file exists on disk
    _loadComplete: false,

    // canDownload: function() {
    //     return HighFidelity.isPackaged;
    // }.property(),

    isDownloading: false,
    isPlaying: false,

    isNew: function() {
        return !this.get('playbackPosition') && !this.get('playCount');
    }.property('playbackPosition', 'playCount'),

    blobURL: function() {
        var _this = this;

        return new Promise(function(resolve) {
            var music = navigator.getDeviceStorage('music');
            var fileRequest = music.get(_this.get("audioFileName"));

            fileRequest.onsuccess = function () {
                resolve(window.URL.createObjectURL(this.result));
            };

            fileRequest.onerror = function () {
                console.warn("Unable to get the file: ", this.error);
            };
        });
    },

    // Download the episode for local playback.
    download: function(model) {
        this.set('isDownloading', true);

        console.log(this, model);

        var _this = this;
        var request = new XMLHttpRequest({mozSystem: true});

        request.open('GET', this.get('audioURL'), true);
        request.responseType = 'blob';

        request.addEventListener('load', function() {
            // _this._setAudioType(_this.get('audioURL'));

            var music = navigator.getDeviceStorage("music");
            // TODO: real name and/or folder structure.
            // * Use responseURL if it exists otherwise fallback to URL.
            // TODO: Use the correct extension. Don't assume MP3.
            // TODO: Uniqueness to avoid overwrite.
            var filename = "podcast-" + Date.now() + ".mp3";
            var saveRequest = music.addNamed(request.response, filename);

            saveRequest.onsuccess = function() {
                var name = this.result;
                console.log('File "' + name + '" successfully wrote to the music storage area');
                _this.set('audioFileName', filename);
                _this.save();
            };

            // An error typically occur if a file with the same name already exist
            saveRequest.onerror = function() {
                console.warn('Unable to write the file: ' + this.error);
            };

            _this._loadComplete = true;
            _this.set('isDownloading', false);
            _this.set('isDownloaded', true);
        });

        request.addEventListener('error', function(event) {
            window.alert('Error downloading this episode. Please try again.');

            // _this.trigger('download:cancel');
        });

        request.send(null);
    },

    // Set the audio type based on the responseType (or filename) of this
    // episode's enclosure file/URL.
    _setAudioType: function(audioURL, event) {
        // TODO: Make this better.
        var type;

        try {
            type = event.target.response.type.split('/')[1];
        } catch (e) {
            // Try to extract the type of this file from its filename.
            var enclosureArray = audioURL.split('.');
            type = enclosureArray[enclosureArray.length - 1];
        }

        // Assume "mpeg" = MP3, for now. Kinda hacky.
        if (type === 'mpeg') {
            type = 'mp3';
        }

        this.set('type', type);
        // this.save();
    }
});

// delete below here if you do not want fixtures
HighFidelity.Episode.FIXTURES = [
    {
        id: 0,
        audioURL: 'http://traffic.libsyn.com/atpfm/atp68.mp3',
        datePublished: 1401828879,
        guid: '513abd71e4b0fe58c655c105:513abd71e4b0fe58c655c111:538e35b2e4b07a3ec5184bf4',
        name: '68: Siracusa Waited Impatiently For This',
        playbackPosition: 15.05034
    }
];
