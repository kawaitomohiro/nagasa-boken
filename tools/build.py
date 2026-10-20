# 長さの冒険：src/app.html を 1枚の index.html にまとめる
#   - 丸ゴシック（Zen Maru Gothic・SIL OFL 1.1）を、画面で使う字だけにしぼって埋めこむ
#   - はじめの絵（src/splash.webp）を埋めこむ
# 使い方: python3 _作り直し用/build.py [公開用の docs フォルダ]
#   → 作業フォルダの index.html を作る。docs を渡すと index.html と pwa/ の中身と書体のライセンスを そこへ写す
import base64, io, os, shutil, sys
from fontTools import subset
from fontTools.ttLib import TTFont

H = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
src = open(os.path.join(H, 'src', 'app.html'), encoding='utf-8').read()

chars = set(src)
chars |= set(chr(c) for c in range(0x20, 0x7f))
chars |= set('０１２３４５６７８９＋−＝？！（）・、。「」〜…⇔')
text = ''.join(sorted(c for c in chars if ord(c) >= 0x20))

def sub(path):
    font = TTFont(path)
    opt = subset.Options()
    opt.flavor = 'woff'
    opt.layout_features = ['*']
    opt.name_IDs = ['*']
    opt.notdef_outline = True
    s = subset.Subsetter(opt)
    s.populate(text=text)
    s.subset(font)
    buf = io.BytesIO()
    font.flavor = 'woff'
    font.save(buf)
    return base64.b64encode(buf.getvalue()).decode()

faces = ''
for w, f in [(500, 'ZenMaruGothic-Medium.ttf'), (700, 'ZenMaruGothic-Bold.ttf')]:
    b = sub(os.path.join(H, 'src', 'fonts', f))
    faces += "@font-face{font-family:'ZenMaru';font-weight:%d;font-style:normal;font-display:swap;src:url(data:font/woff;base64,%s) format('woff')}\n" % (w, b)
    print(f, len(b) * 3 // 4 // 1024, 'KB')

img = base64.b64encode(open(os.path.join(H, 'src', 'splash.webp'), 'rb').read()).decode()
out = src.replace('/*FONTS*/', '/* 書体: Zen Maru Gothic (c) 2021 The Zen Maru Gothic Authors, SIL Open Font License 1.1 */\n' + faces)
out = out.replace('__SPLASH__', 'data:image/webp;base64,' + img)
assert '__SPLASH__' not in out and '/*FONTS*/' not in out
open(os.path.join(H, 'index.html'), 'w', encoding='utf-8').write(out)
print('index.html', len(out.encode()) // 1024, 'KB')

if len(sys.argv) > 1:
    d = os.path.expanduser(sys.argv[1])
    os.makedirs(d, exist_ok=True)
    shutil.copy(os.path.join(H, 'index.html'), os.path.join(d, 'index.html'))
    for f in os.listdir(os.path.join(H, 'pwa')):
        shutil.copy(os.path.join(H, 'pwa', f), os.path.join(d, f))
    shutil.copy(os.path.join(H, 'src', 'fonts', 'OFL.txt'), os.path.join(d, 'LICENSE-ZenMaruGothic.txt'))
    print('copied ->', d)
