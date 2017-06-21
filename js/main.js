var spotifyApi;

const SPOTIFY_CLIENT_ID = '3c982a456c594c39b23403937c5d2343';

function main() {
	var spotifyHash = checkForSpotifyAccessToken();

	if (spotifyHash) {
		showPlaylistAdder();
        showInstructions();
		playlistList = new PlaylistList('#playlist-list');
		playlistList.show();
		setupPlaylistAdding(playlistList);

		spotifyApi = new SpotifyWebApi();
		spotifyApi.setAccessToken(spotifyHash.access_token);
		spotifyApi.getMe().then(function(data) {
			spotifyApi.thisUser = data;
		});

	} else {
		showLoginPage();
	}
}

function showPlaylistBtn(playlistList) {
	var playlistBtn = $('#create-playlist-btn');
	playlistBtn.off();
	playlistBtn.click(function() {
		onUbiquitise(playlistList);
	});
	playlistBtn.show();
}

function setupPlaylistAdding(playlistList) {
	$('#url-add-btn:enabled').click(function() {
		var inputString = getURLFromInput();
		var playlistInfo = parsePlaylistURL(inputString);

		if (!playlistInfo) {
            swal({
                title: 'Invalid playlist URL/URI',
                text: 'Check the instructions on how to find the URL of a playlist.',
                type: 'error'
            });
			return;
		}

        showLoading();

		var playlist = spotifyApi.getPlaylist(playlistInfo.userId, playlistInfo.playlistId)
			.then(function(playlist) {
                getSongsOfPlaylist(playlist, function (songList) {
                    playlist.songs = songList;
                    playlistList.add(playlist);
                    playlistList.render();
                    hideLoading();
                });
			}, onErr);
	});

	function onErr(err) {
		console.error(err);
        hideLoading();
        swal({
            title: 'Playlist not found',
            text: 'Make sure the playlist exists!',
            type: 'error'
        });
	}
}

function showPlaylistAdder() {
	$('#playlist-adder').show();
}

function hidePlaylistAdder() {
	$('#playlist-adder').hide();
}

function showInstructions() {
	$('#instructions').show();
}

function hideInstructions() {
	$('#instructions').hide();
}

function hidePlaylistBtn() {
	$('#create-playlist-btn').hide();
}

function showLoginPage() {
	var loginBtn = $('#spotify-login-btn');
	loginBtn.off();
	loginBtn.click(loginToSpotify);
	loginBtn.show();

    $('#login-info').show();
}

function loginToSpotify() {
    var scopes = 'playlist-read-private playlist-modify-public';
	location.href = "https://accounts.spotify.com/authorize" +
		"?client_id=" + SPOTIFY_CLIENT_ID +
		"&response_type=token" +
		"&redirect_uri=" + encodeURIComponent(window.location.href) +
		//"&state=" + STATE + // optional
		"&scope=" + encodeURIComponent(scopes) + // optional
		"";
}

function checkForSpotifyAccessToken() {
	// https://stackoverflow.com/questions/38706233/javascript-mime-type-text-html-is-not-executable-and-strict-mime-type-chec

	var hash = {};
	var h = location.hash.slice(1);

	if (h !== '') {
		h = h.split('&');
		h.forEach(function(pair) {
			pair = pair.split('=');
			hash[pair.shift()] = pair.join('=');
		});

		if (hash.error) {
			console.error(hash.error);
			return false;
		} else {
			hash.token_type === "Bearer";
			//remove the junk from the url
			history.pushState('', document.title, window.location.pathname);
			return hash;
		}
	} else {
		return false;
	}

}

function getURLFromInput() {
	var theInput = $('#url-input');
	var playlistURL = theInput.val();
	theInput.val('');
	return playlistURL;
}

function parsePlaylistURL(input) {
	/* Examples:
	    URL: https://open.spotify.com/user/1235001726/playlist/14mJG2IpKEr0zOxvTroePJ
	    URI: spotify:user:1235001726:playlist:14mJG2IpKEr0zOxvTroePJ
	*/
	var isURI = input.startsWith('spotify');
	var isURL = input.startsWith('http');

	var splitChar;
	if (isURI) {
		splitChar = ':';
	} else if (isURL) {
		splitChar = '/';
	} else {
		return false;
	}

	var userId;
	var playlistId;

	try {
		var parts = input.split(splitChar);
		for (var i = 0; i < parts.length; i++) {
			if (parts[i] === 'user') {
				userId = parts[i + 1];
			}
			if (parts[i] === 'playlist') {
				playlistId = parts[i + 1];
			}
		}
		return {
			userId,
			playlistId
		}
	} catch (e) {
		return false;
	}
}

function onUbiquitise(playlistList) {
	var thisUserId = spotifyApi.thisUser.id;
	var newSongList = ubiquitiseList(playlistList);
    newSongList = getListOfURIsFromListOfSongs(newSongList);

	if (newSongList.length > 0) {
		spotifyApi.createPlaylist(thisUserId, {
			name: playlistList.getSuperPlaylistTitle(),
			description: 'Made here: ' + window.location.href
		})
            .then(function(playlist) {
                addSongsToPlaylist(thisUserId, playlist.id, newSongList, function () {
                    swal({
                        title: 'Playlist created successfully!',
                        text: 'Check your Spotify; the new playlist should be at the top.',
                        type: 'success'
                    });
                });
		}, onErr);
	} else {
        swal({
            title: 'The selected playlists have no songs in common.',
            text: 'Try selecting fewer playlists.',
            type: 'warning'
        });

    }

	function onErr(err) {
		console.error(err);
		swal('Unable to create playlist');
        swal({
            title: 'Unable to create playlist',
            type: 'error'
        });
	}
}

function ubiquitiseList(playlistList) {
	playlistList = playlistList.list;
	var masterList;
	for (var i = 0; i < playlistList.length; i++) {
		var thisSongList = playlistList[i].songs;
		if (i === 0) {
			masterList = thisSongList;
		} else {
			masterList = ubiquitiseTwo(masterList, thisSongList);
		}
	}
	return masterList;
}

function ubiquitiseTwo(listOne, listTwo) {
	var songList = [];
	for (var i in listOne) {
		for (var j in listTwo) {
			var songOne = listOne[i].track;
		    var songTwo = listTwo[j].track;

            var sameURI = songOne.uri === songTwo.uri;
            var notALocalSong = !songOne.uri.startsWith('spotify:local');
            var sameISRC = false;

            var bothHaveExternalIds = songOne.external_ids && songTwo.external_ids;
            if (!sameURI && bothHaveExternalIds) {
                var isISRCValid = !!songOne.external_ids.isrc && !!songTwo.external_ids.isrc;
                if (isISRCValid) {
                    sameISRC = songOne.external_ids.isrc === songTwo.external_ids.isrc;
                }
            }

            //this is to remedy songs that have "Remastered" and such appended to the title
            //looking at you Bohemian Rhapsody - Remastered 2011
            var sameTitleAndArtist = false;
            if (!sameURI && !sameISRC) {
                var sameArtist = songOne.artists[0].uri === songTwo.artists[0].uri;
                var roughlySameTitle = songOne.name.startsWith(songTwo.name) ||
                                       songTwo.name.startsWith(songOne.name);
                sameTitleAndArtist = sameArtist && roughlySameTitle;
            }

			if ((sameURI || sameISRC || sameTitleAndArtist) && notALocalSong) {
				songList.push(listOne[i]);
			}

		}
	}
	return songList;
}

function getListOfURIsFromListOfSongs (listOfSongs) {
    var uriList = [];
    for (var i in listOfSongs) {
        uriList.push(listOfSongs[i].track.uri);
    }
    return uriList;
}

function getSongsOfPlaylist (pl, next) {
    var total = pl.tracks.total;
    var firstSetOfSongs = pl.tracks.items;

    if (total <= 100) {
        next(firstSetOfSongs);
    } else {
        getSongsOfPlaylistStartingAt(pl, 100, function (songs) {
            next(firstSetOfSongs.concat(songs));
        })
    }
}

function getSongsOfPlaylistStartingAt (pl, offset, next, songListSoFar) {
    if (!songListSoFar) {
        songListSoFar = [];
    }

    spotifyApi.getPlaylistTracks(pl.owner.id, pl.id, { offset })
        .then(function(data) {
            var theSongs = data.items;
            songListSoFar =  songListSoFar.concat(theSongs);
            if (theSongs.length >= 100) {
                //get more songs!
                getSongsOfPlaylistStartingAt(pl, offset + 100, next, songListSoFar)
            } else {
                //all of the songs have been added, we're done!
                next(songListSoFar);
            }
        }, function (err) {
            console.error(err);
        });
}

function addSongsToPlaylist (userId, playlistId, songList, next) {
    var songsToAdd;
    var isLastRun = songList.length <= 100;

    if (!isLastRun) {
        //get the first 100 songs that should be added on this run
        songsToAdd = songList.slice(0, 100);

        //remove the added songs from the list of songs that have yet
        //to be added
        songList = songList.slice(100)
    } else {
        //add all remaining songs
        songsToAdd = songList;
    }
    //get the first 100 songs that should be added on this run

    spotifyApi.addTracksToPlaylist(userId, playlistId, songsToAdd)
        .then(function() {
            if (!isLastRun) {
                addSongsToPlaylist(userId, playlistId, songList, next);
            } else {
                next();
            }
        }, function (err) {
            console.error(err);
            swal('Unable to add tracks to the playlist');
        });
}

function showLoading () {
    $('.spinner').show();
    $('#url-add-btn-plus').hide();
    $('#url-add-btn').prop('disabled', true);
    $('#url-input').prop('disabled', true);
}

function hideLoading () {
    $('.spinner').hide();
    $('#url-add-btn-plus').show();
    $('#url-add-btn').prop('disabled', false);
    $('#url-input').prop('disabled', false);
}


function PlaylistList(id) {
	this.id = id;
	this.list = [];
}

PlaylistList.prototype.show = function() {
	$(this.id).show();
}

PlaylistList.prototype.hide = function() {
	$(this.id).hide();
}

PlaylistList.prototype.add = function(playlistToAdd) {
	this.list.push(playlistToAdd);
}

PlaylistList.prototype.render = function() {
	var theList = $('#url-list');
	theList.empty();

	if (this.list.length >= 2) {
		showPlaylistBtn(this);
	} else {
		hidePlaylistBtn();
	}

	if (this.list.length === 0) {
		theList.append(getListItemHTML('Empty!'));
	} else {
		for (var i in this.list) {
			var pl = this.list[i];
			theList.append(getListItemHTML(pl.name));
		}
	}

	function getListItemHTML(inside) {
		return '<li class="list-group-item list-group-item-action">' + inside + '</li>'
	}
}

PlaylistList.prototype.getSuperPlaylistTitle = function() {
	var title = 'Best of ';
	for (var i in this.list) {
		var pl = this.list[i];
		title += pl.name;
		if (i < this.list.length - 1) {
			title += ' and ';
		}
	}
	return title;
}

main();
