"""Check generated pages, local resources, and contact form markup."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

root = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources = []
        self.headings = 0
        self.frames = []
        self.ids = set()
        self.references = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, attrs['id']
            self.ids.add(attrs['id'])
        for attribute in ['aria-controls', 'aria-labelledby', 'aria-describedby', 'for']:
            self.references.extend(attrs.get(attribute, '').split())
        self.headings += tag == 'h1'
        if tag == 'iframe': self.frames.append(attrs)
        for attr in ['src', 'href']:
            if attr in attrs:
                assert attrs[attr], (tag, attr)
                self.resources.append(attrs[attr])

for name in ['index.html', 'home/index.html', 'contact/index.html']:
    source = (root / '_site' / name).read_text()
    page = Page()
    page.feed(source)
    assert page.headings == 1, name
    assert set(page.references) <= page.ids, (name, set(page.references) - page.ids)
    assert '{{' not in source and '{%' not in source, name
    for resource in page.resources:
        url = urlparse(resource)
        if url.scheme or url.netloc or not url.path: continue
        path = root / '_site' / unquote(url.path).lstrip('/')
        assert path.is_file() or (path / 'index.html').is_file(), (name, resource)
    if name.startswith('contact'):
        assert not page.frames
        assert 'class="contact-form"' in source
        assert 'name="name"' in source and 'name="message"' in source
print('Home, /home/, Contact, local resources, ID references, and contact form verified.')
