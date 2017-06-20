function main () {
  showPlaylistAdder();
  playlistList = new PlaylistList ('#playlist-list');
  playlistList.show();
  setupPlaylistAdding(playlistList);
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
