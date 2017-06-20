const SPOTIFY_CLIENT_ID = '3c982a456c594c39b23403937c5d2343';

function main () {
  var spotifyHash = checkForSpotifyAccessToken();

  if (spotifyHash) {
    showPlaylistAdder();
    playlistList = new PlaylistList ('#playlist-list');
    playlistList.show();
    setupPlaylistAdding(playlistList);

    var spotifyApi = new SpotifyWebApi();

  } else {
    showSpotifyLoginButton();
  }
}

function showPlaylistAdder () {
  $('#playlist-adder').show();
}

function hidePlaylistAdder () {
  $('#playlist-adder').hide();
}

function showPlaylistOutput () {
  $('#playlist-output').show();
}

function hidePlaylistOutput () {
  $('#playlist-output').hide();
}


function setupPlaylistAdding (playlistList) {
  $('#url-add-btn').click(function () {
    var playlistToAdd = new Playlist (getURLFromInput());
    playlistList.add(playlistToAdd);
    playlistList.render();
  });
}

function showSpotifyLoginButton () {
  var loginBtn = $('#spotify-login-btn');
  loginBtn.click(loginToSpotify);
  loginBtn.show();
}

function loginToSpotify () {
  location.href = "https://accounts.spotify.com/authorize" +
    "?client_id=" + SPOTIFY_CLIENT_ID +
    "&response_type=token" +
    "&redirect_uri=" + encodeURIComponent(window.location.href) +
    //"&state=" + STATE + // optional
    //"&scope=" + SCOPES.join(" ") + // optional
    "";
}

function checkForSpotifyAccessToken () {
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

function getURLFromInput () {
  var theInput = $('#url-input');
  var playlistURL = theInput.val();
  theInput.val('');
  return playlistURL;
}


function PlaylistList (id) {
  this.id = id;
  this.list = [];
}

PlaylistList.prototype.show = function () {
  $(this.id).show();
}

PlaylistList.prototype.hide = function () {
  $(this.id).hide();
}

PlaylistList.prototype.add = function (playlistToAdd) {
  this.list.push(playlistToAdd);
}

PlaylistList.prototype.render = function () {
  var theList = $('#url-list');
  theList.empty();

  if (this.list.length === 0) {
    theList.append(getListItemHTML('Empty!'));
  } else {
    for (var i in this.list) {
      theList.append(getListItemHTML(this.list[i].url));
    }
  }

  function getListItemHTML (inside) {
    return '<li class="list-group-item list-group-item-action">' + inside + '</li>'
  }
}

function Playlist (url) {
  this.url = url;
}

main();
