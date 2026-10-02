# parsaamini.net

Personal website built with Jekyll and hosted at <https://www.parsaamini.net/>.

## Local development

Install Ruby and Bundler, then run:

```sh
bundle install
bundle exec jekyll serve
```

Open <http://localhost:4000/>.

## Editing

Home content lives in `_includes/home-text.md`, shared by `index.md` and
`home.md`. Contact content lives in `contact.md`, with the form in
`_includes/contact-form.html`. Shared layouts, navigation, and footer are in
`_layouts/` and `_includes/`; styles, scripts, and images are in `assets/`.

The contact form saves messages to a private Google Sheet through Apps Script.
Set its web app URL in `contact_endpoint` in `_config.yml`. See
[backend instructions](apps-script/README.md) for setup and updates.

## Checks

```sh
bundle exec jekyll build
python3 scripts/verify.py
node scripts/test-contact.cjs
```

## Publishing

Pushes to `master` build and check the site in GitHub Actions, then deploy to
GitHub Pages. `CNAME` configures `www.parsaamini.net`. Cloudflare has DNS-only
CNAME records for `www` and the root pointing to `parsa.github.io`; the root uses
CNAME flattening and redirects to `www`.
