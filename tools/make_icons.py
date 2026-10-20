# アイコン（まきじゃく＋旗）を pwa/ に作る： ~/.claude-office-venv/bin/python3 make_icons.py
import os
from PIL import Image, ImageDraw
H=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','pwa')
def draw(sz, maskable=False):
    S=1024; im=Image.new('RGB',(S,S),'#2e9e57'); d=ImageDraw.Draw(im)
    if not maskable:
        im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
        d.rounded_rectangle([0,0,S,S],radius=220,fill='#2e9e57')
    k=0.8 if maskable else 1.0
    def P(x,y): return (S/2+(x-S/2)*k, S/2+(y-S/2)*k)
    # 空と道
    d.ellipse([P(-200,780)[0],P(-200,780)[1],P(1224,1500)[0],P(1224,1500)[1]],fill='#7cc576')
    d.text((0,0),'')
    # まきじゃく
    x0,y0=P(150,420); x1,y1=P(874,610)
    d.rounded_rectangle([x0,y0,x1,y1],radius=int(30*k),fill='#ffe28a',outline='#b8901f',width=int(14*k))
    for i in range(0,11):
        x=P(190+i*65,0)[0]
        h=150 if i%5==0 else 90
        col='#d93a2f' if i==5 else '#6b5512'
        w=int((18 if i==5 else 10)*k)
        d.line([x,y0+8,x,y0+h*k],fill=col,width=w)
    # 旗
    fx,fy=P(700,150); d.line([fx,fy,fx,P(0,420)[1]],fill='#4a3a1a',width=int(18*k))
    d.polygon([P(708,150),P(860,200),P(708,260)],fill='#d93a2f')
    # やじるし
    ax=P(515,0)[0]; d.polygon([(ax-60*k,P(0,250)[1]),(ax+60*k,P(0,250)[1]),(ax,P(0,410)[1])],fill='#ffffff')
    out=im.resize((sz,sz),Image.LANCZOS)
    return out
os.makedirs(H,exist_ok=True)
draw(180).convert('RGB').save(os.path.join(H,'icon-180.png'))
draw(192).save(os.path.join(H,'icon-192.png'))
draw(512).save(os.path.join(H,'icon-512.png'))
draw(512,True).save(os.path.join(H,'icon-maskable-512.png'))
print('ok')
