"""Check public files, metadata, Schema.org relationships and internal links."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json, xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]/'dist'
class Doc(HTMLParser):
 def __init__(self,text):
  super().__init__();self.links=[];self.ids=set();self.meta={};self.h1=0;self.schema='';self.in_schema=False;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a: assert a['id'] not in self.ids, 'Duplicate ID';self.ids.add(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='meta':self.meta[a.get('name',a.get('property'))]=a.get('content')
  if tag in ['a','link','img','script','source','audio']:
   value=a.get('href',a.get('src',a.get('srcset')))
   if value:self.links.append(value)
  if tag=='img':assert 'alt' in a and 'width' in a and 'height' in a
  if tag=='script' and a.get('type')=='application/ld+json':self.in_schema=True
 def handle_endtag(self,tag):
  if tag=='script':self.in_schema=False
 def handle_data(self,data):
  if self.in_schema:self.schema+=data
pages={'/':'index.html','/frequences':'frequences/index.html','/fragments':'fragments/index.html'}
docs={url:Doc((root/path).read_text()) for url,path in pages.items()}
for url,d in docs.items():
 assert d.h1==1
 for key in ['description','og:title','og:description','og:image','og:url','twitter:card','twitter:title','twitter:description','twitter:image']:assert d.meta.get(key),key
 graph=json.loads(d.schema)['@graph'];ids={x['@id'] for x in graph}
 for item in graph:
  if item['@type']=='MusicRecording':
   assert item['byArtist']['@id'] in ids and item['inAlbum']['@id'] in ids
   if 'audio' in item:
    assert '/fragments#fragment-' in item['@id'], 'Only the three approved final Fragments have direct audio'
    audio_path=urlparse(item['audio']['contentUrl']).path
    assert (root/audio_path.lstrip('/')).is_file(), audio_path
    assert item.get('duration') and item['inAlbum']['@id'].endswith('/fragments#album')
 for link in d.links:
  u=urlparse(link)
  if u.netloc:continue
  route=u.path or url
  target=root/pages.get(route,unquote(route).lstrip('/'))
  assert target.is_file(),(url,link)
  if u.fragment:assert u.fragment in docs[route].ids,(url,link)
 print('PASS metadata, audio, graph, images and all internal links:',url)
urls=[el.text for el in ET.parse(root/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==3 and set(urls)=={'https://www.vrtgmusic.ca'+p for p in pages}
assert 'Sitemap: https://www.vrtgmusic.ca/sitemap.xml' in (root/'robots.txt').read_text()
print('PASS sitemap and robots')

expected={f'assets/audio/fragment-{n}-final.mp3' for n in ['01','02','03']}
assert {str(p.relative_to(root)) for p in root.rglob('*.mp3')}==expected, 'Only the three approved final Fragments may be exported'
for n in ['01','02','03']:
 assert 'fragment-'+n in docs['/fragments'].ids
fragment_graph=json.loads(docs['/fragments'].schema)['@graph']
assert len([item for item in fragment_graph if item['@type']=='MusicRecording'])==3
assert 'À VENIR' not in (root/'fragments/index.html').read_text()
print('PASS three final Fragments, durations, tracklist and audio export')
