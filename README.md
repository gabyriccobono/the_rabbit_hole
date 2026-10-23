# The Rabbit Hole

A choose-your-own-path website. Each answer branches into more questions across an endless, drifting space.

## What's in this folder

| File | What it is | Do you edit it? |
|---|---|---|
| `index.html` | The page structure | Rarely (only to turn on the video) |
| `style.css` | Colors, fonts, sizes, glow | Yes, this is the look |
| `paths.js` | All the questions and answers | Yes, this is your content |
| `stars.js` | Draws a collage star for every ending | No |
| `engine.js` | Animation, camera, endings, back button | No, but timings and the star message at the top are safe to tweak |
| `stars/` | (Optional) your own star pictures | Yes |
| `media/` | Put your background video here | Yes |

## See it on your computer

Open `index.html` in Chrome or Safari. You can also open the folder in VS Code and use the **Live Server** extension (right-click `index.html`, then **Open with Live Server**). With Live Server, the page reloads every time you save.

## Edit the questions

Open `paths.js`. Every box looks like this:

```js
drugs: {
  text: "Drugs",
  options: ["lsd", "weed", "psychedelics"]
},
lsd: { text: "LSD" },
```

- `text` is what the box says.
- `options` lists the boxes that branch out of it. 2 to 6 works best.
- A box with no `options` is the end of that path.
- `detail` (optional) adds smaller typed text under the title.

If you list an id in `options` but forget to create that box, the site shows a "Missing box" note in its place, so typos are easy to spot.

## Add your background video

1. Put the video in the `media` folder and name it `background.mp4`.
2. In `index.html`, find the line with `<video ...>` and remove the `<!--` at its start and the `-->` at its end.
3. To make the video brighter or dimmer, change `opacity` under `.bg-video` in `style.css`.

Keep the video short and compressed (under about 15 MB) so the site loads quickly.

## Fonts

The site uses **Omnium** for the questions and headings, and **Helvetica** for the answers.

- **Omnium** loads from your Adobe Fonts link (`use.typekit.net/vmk7qex.css`) in `index.html`.
- **Helvetica** is already on most computers.

Adobe only serves the font to websites listed in your web project. In Adobe Fonts, open **My Adobe Fonts → Web Projects**, edit the project and add:

- `localhost` (so it works while you test on your computer with Live Server)
- `YOUR-USERNAME.github.io` (your live site)

Also make sure the web project includes both **Regular** and **Bold**. Until Omnium loads, the site shows a similar stand-in font (Audiowide).

## Endings and stars

- Any box with no `options` in `paths.js` is an ending.
- Reaching an ending locks the path: the back button, the path trail and the earlier boxes stop working. A star pops up with the message, and the only way out is **Return to the surface**.
- Every ending has its own star. Collected stars float around the background, and the welcome page shows how many have been found. Stars are saved in the visitor's own browser.
- To change the message, edit `ENDING_MESSAGE` near the top of `engine.js`.
- To use your own star picture for an ending, save it as a PNG with a transparent background in a `stars` folder, then add it to that ending in `paths.js`:
  ```js
  forests: { text: "Forests", star: "stars/forests.png" },
  ```

## Put it online with GitHub Pages (free)

1. Create a free account at github.com and make a new **public** repository (for example `the-rabbit-hole`).
2. On the repository page, click **Add file → Upload files** and drag in everything from this folder.
3. Go to **Settings → Pages**. Under "Branch," choose `main` and `/ (root)`, then click **Save**.
4. After a minute, your site is live at `https://YOUR-USERNAME.github.io/the-rabbit-hole/`.

To update the site later, upload the changed files again the same way.

## How people move around

- Click an answer to go deeper. The chosen box flies forward and new branches grow from it.
- Click the open box to skip the typing.
- Click any earlier box, a faded sibling, or a name in the path at the bottom to jump back.
- **Back** steps back one level. **Esc** does the same. The browser's back button also works.
- **Center** re-frames the current question. **Surface** returns to the welcome screen.
- Drag the background to look around, and scroll to zoom out and see the whole network.
- Every point has its own link (for example `…/index.html#start.drugs.lsd`), so you can share a specific path.
