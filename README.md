# Public Wiki

A public, community-editable wiki about [Excalidraw](https://github.com/excalidraw/excalidraw), published with GitHub Pages.

## Contribute

Visit the published site and choose **New page**, or add a Markdown file to [`pages/`](pages). Every page supports a small frontmatter block:

```md
---
title: Your page title
---

## Start writing
```

Changes committed to `main` appear on the site automatically. The interface loads the current page list through GitHub's public Contents API, so no build step is required.

Each article has **Edit this page** and **Delete this page** actions. Both open GitHub so changes are authenticated and recorded in the repository history.

## Local preview

Serve the directory with any static server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.

Content is available under [CC BY 4.0](LICENSE). Code is available under the MIT License.
