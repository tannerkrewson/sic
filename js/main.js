var spotifyApi;

const SPOTIFY_CLIENT_ID = '3c982a456c594c39b23403937c5d2343';

function main() {
	var spotifyHash = checkForSpotifyAccessToken();

	if (spotifyHash) {
		showPlaylistAdder();
		playlistList = new PlaylistList('#playlist-list');
		playlistList.show();
		setupPlaylistAdding(playlistList);

		spotifyApi = new SpotifyWebApi();
		spotifyApi.setAccessToken(spotifyHash.access_token);
		spotifyApi.getMe().then(function(data) {
			spotifyApi.thisUser = data;
		})

	} else {
		showSpotifyLoginButton();
	}
}

function showPlaylistAdder() {
	$('#playlist-adder').show();
}

function hidePlaylistAdder() {
	$('#playlist-adder').hide();
}

function showPlaylistOutput() {
	$('#playlist-output').show();
}

function hidePlaylistOutput() {
	$('#playlist-output').hide();
}

function showPlaylistBtn(playlistList) {
	var playlistBtn = $('#create-playlist-btn');
	playlistBtn.off();
	playlistBtn.click(function() {
		onUbiquitise(playlistList);
	});
	playlistBtn.show();
}

function hidePlaylistBtn() {
	$('#create-playlist-btn').hide();
}


function setupPlaylistAdding(playlistList) {
	$('#url-add-btn').click(function() {
		var inputString = getURLFromInput();
		var playlistInfo = parsePlaylistURL(inputString);

		if (!playlistInfo) {
			alert('Invalid playlist URL/URI');
			return;
		}

		var playlist = spotifyApi.getPlaylist(playlistInfo.userId, playlistInfo.playlistId)
			.then(function(playlist) {
				spotifyApi.getPlaylistTracks(playlistInfo.userId, playlistInfo.playlistId)
					.then(function(data) {
						playlist.songs = data.items;
						playlistList.add(playlist);
						playlistList.render();
					}, onErr);
			}, onErr);
	});

	function onErr(err) {
		console.error(err);
		alert('Playlist not found');
	}
}

function showSpotifyLoginButton() {
	var loginBtn = $('#spotify-login-btn');
	loginBtn.off();
	loginBtn.click(loginToSpotify);
	loginBtn.show();
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
			console.log(hash.error);
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
    console.log(newSongList);
	if (newSongList.length > 0) {
		spotifyApi.createPlaylist(thisUserId, {
			name: playlistList.getSuperPlaylistTitle(),
			description: 'Made here: ' + window.location.href
		})
            .then(function(playlist) {
    			spotifyApi.addTracksToPlaylist(thisUserId, playlist.id, newSongList)
    				.then(function() {
    					console.log('success');
    				}, onErr);
		}, onErr);
	}

	function onErr(err) {
		console.error(err);
		alert('Unable to create playlist');
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
	var uriList = [];
    console.log(listOne.length + ', ' + listTwo.length);
    console.log('****');
	for (var i in listOne) {
		for (var j in listTwo) {
            console.log(i + ', ' + j);
			var songOne;
			if (listOne[i].track) {
				songOne = listOne[i].track.uri;
			} else {
				songOne = listOne[i];
			}

			var songTwo;
			if (listTwo[j].track) {
				songTwo = listTwo[j].track.uri;
			} else {
				songTwo = listTwo[j];
			}

			//TODO: check to see if songs have same artist and name, but are
			//      but are different versions/album/etc.
			if (songOne === songTwo) {
				uriList.push(songOne);
			}

		}
	}
	return uriList;
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
