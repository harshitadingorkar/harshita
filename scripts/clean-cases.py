import json,re
from PIL import Image, ImageStat
d=json.load(open('data/cases.json'))
TOC='Overview|Challenge|Solution|Design Process|Key Learnings|Reflections|Impact:'
def sd(src):
    im=Image.open(src).convert('L').resize((64,64));return round(ImageStat.Stat(im).stddev[0],1)
for k,v in d.items():
    h=v['html'];n0=len(h)
    if k!='github':
        h=re.sub(r'<p>(50M\+|Active Users|1\.5M\+|Daily Pull Requests)</p>\s*','',h)
    prev=None
    while prev!=h:
        prev=h;h=re.sub(r'<h3>(%s)</h3>\s*(?=<h3>|<figure|$)'%TOC,'',h)
    sds={s:sd(s) for s in re.findall(r'src="(assets/[^"]+)"',h)}
    blobs=[s for s,x in sds.items() if x<6]
    for s in blobs: h=re.sub(r'<figure[^>]*>\s*<img[^>]*src="'+re.escape(s)+r'"[^>]*>\s*(<figcaption>.*?</figcaption>)?\s*</figure>\s*','',h,flags=re.S)
    v['html']=h;print(k,n0,'->',len(h),'blobs',blobs,'lowest',sorted(sds.values())[:4])
json.dump(d,open('data/cases.json','w'),ensure_ascii=False)
d=json.load(open('data/cases.json'))
for k,v in d.items():
    h=v['html'];h=re.sub(r'<blockquote><p>\s*,?\s*</p></blockquote>\s*','',h)
    i=h.find('<h3>Reflections</h3>')
    if 0<=i<len(h)*.25: h=h[:i]+h[i+len('<h3>Reflections</h3>'):].lstrip()
    v['html']=h
json.dump(d,open('data/cases.json','w'),ensure_ascii=False)
