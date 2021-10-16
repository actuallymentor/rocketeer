# 👋 🔫 HI PEW - High Performance Website Boilerplate

<img height="50px" style="float: left;" alt="webpack" src="http://i.imgur.com/xz36f45.png" /> <img height="50px" style="float: left;" alt="browsersync" src="http://i.imgur.com/L5peje9.png" /> <img height="50px" style="float: left;" alt="pug" src="http://i.imgur.com/x4sHEg4.png" /> <img height="50px" style="float: left;" alt="sass" src="http://i.imgur.com/O9ikKdz.png" />

A static website generator that implements best practices for page speed. [ Click here for a live demo ]( https://actuallymentor.github.io/hi-pew/ ).

- input: Markup in [pug]( https://github.com/pugjs ), styling in [Sass]( https://github.com/sass/sass ) and Javascript with [Babel]( https://babeljs.io/ )
- output: deployment-ready minified, prefixed and compressed build files

Benefits:

- 🚀 100% Google Page Speed Score ([view score]( https://developers.google.com/speed/pagespeed/insights/?url=https://actuallymentor.github.io/hi-pew/ ))
- 👩‍💻 Use `pug`, `sass` and the newest `js` with zero setup time
- 👓 SEO best practices auto-implemented
- 🇪🇺 Built-in multilanguage support
- 🌐 Built-in broken link checker through `npm test`
- 🧪 Advanced performance options and compatibility warnings

## Getting started

Dependencies:

- [node.js]( https://nodejs.org/en/ )
- [nvm]( https://github.com/nvm-sh/nvm ) ( optional, recommended )

### Basic usage

1. Clone this repository
2. Run `npm start`, your browser will open with a live-updating preview
3. Edit the source files in `src/`
4. Configure SEO settings in `modules/config.js`

To create a production build in `docs/`:

```shell
npm run build
```

### Advanced usage

1. Customise auto-image compression
    - Edit the `system.images` key to include your compression preferences for `jpeg`, `webp` and `avif`
    - Use the `rimg` (responsive img) mixin found in `src/pug/_helpers`
    - Use the `cimg` (compressed img) mixin found in `src/pug/_helpers`
    - Note: images are not compressed in `NODE_ENV=development` mode which is the `npm start` default, `npm run build` does trigger that actual file optimisation
2. Separate your CSS for meaningful-paint optimisation
    - Use `src/css/essential-above-the-fold.sass` for essential above the fold styles
    - Use `src/css/styles.sass` for below the fold styles
3. Set per-page SEO settings
    - Every `.pug` file may contain it's own metadata and sharing image
    - The `page` object can set `title`, `desc`, `url`, `published`, `featuredimg` which are used in the `head` meta tags and the footer `application/ld+json` rich snipped data
4. Confgure deeper browser compatibility
    - By default `npm start` runs a [ caniuse ]( https://caniuse.com/ ) compatibility check on your SASS
    - Javascript backwards compatibility in `.babelrc`
    - CSS compatibility in `modules/config.js` at `browsers`
4. Enable auto-deployment
    - Templates for Github pages, Firebase and AWS are available in `.github/workflows`
5. Use subpages (like `/category/people/john.html`)
    - Any `.pug` file in `src` will be compiled except those that are in reserved folders or begin with `_`
    - `src/index.pug` \> `index.html`
    - `src/pages/contact.pug` \> `/pages/contact.html`
    - `src/{ assets, content, css, js }/template.pug` \> not rendered
    - `src/pug/_footer.pug` \> not rendered (unless included in another pug)

### Multiple languages

Every `.json` or `.js` file in `src/content` will result in a duplicate of your website using the content in that file.

```js
module.exports = {
    slug: "/", // The relative URL of this language
    lang: "en", // The language code of this language (use W3 compliant codes)

    // You can creat any keys and access them inside pug files
    hero: {
        "title": "something",
        "explanation": "lorem ipsum"
    },
    usps: [ "It's good", "It's free" ]
}
```

The attributes can be read inside any pug template under the `content` variable, for example:

```pug
div.hero
    p#title #{ content.hero.title }
    a( href=content.slug ) home
div.usp
    each usp in content.usps
        p= usp
```
