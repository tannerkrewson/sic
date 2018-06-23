# Spotify-in-Common

**Try it out: www.tannerkrewson.com/sic/**

Select a few Spotify playlists, and get back a new playlist containing only the songs that are in all of the selected playlists.

## How it works

For the history of Spotify-in-Common and how it works, see the [readme](https://github.com/tannerkrewson/mutual-music#mutual-music) of its successor, [Mutual Music](https://www.tannerkrewson.com/mutual-music/).

Although Mutual Music is the more polished of the two, Spotify-in-Common is a more powerful tool as it allows you to select the exact playlists that will be compared, while Mutual Music focuses more on simplicity.

### What makes two songs identical

The algorithm compares every song. First, it checks to see if the URI of the songs being compared is identical. However, there are duplicates of the same song with different URIs on Spotify. It is common with compilations, remasters, and explicit/clean versions. So, it also compares the songs by their International Standard Recording Code (ISRC). If that fails, it will proceed to compare the Artist and Title of the songs. It checks to see if the titles of the two songs being the same, so `Bohemian Rhapsody` and `Bohemian Rhapsody - Remastered 2011` will be counted as the same song, as long as they are both by the same artist, in this case, `Queen`.

This could backfire if a single artist has two songs with titles called something like `Game` and `Gameboy`, but I believe the tradeoff of a few false positives is worth the potential for way more false negatives. You can always delete songs from the generated playlist, but if a song is missed, you can never find it.

## Development

Spotify-in-Common is very simple, and doesn't require an `npm install`. You will need to use a local static server  like [http-server](https://github.com/indexzero/http-server), or the Spotify API will not function correctly.
