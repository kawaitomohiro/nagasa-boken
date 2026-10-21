// 長さの冒険：実際に操作して確かめる
// 使い方: NODE_PATH=<作業用フォルダ>/node_modules node test.js <URL> <スクショの出力先>
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/';
const OUT = process.argv[3] || __dirname + '/shots';
const fs = require('fs'); fs.mkdirSync(OUT, { recursive: true });
const PIN = ['2', '4', '6', '8'];
let fails = 0;
function ok(cond, msg) { console.log((cond ? '  OK  ' : '  NG  ') + msg); if (!cond) fails++; }

async function st(page) { return page.evaluate(() => JSON.parse(JSON.stringify(window.__nagasa.ST()))); }
async function pinType(page, digits) {
  for (const d of digits) await page.click('#pinpad button:text-is("' + d + '")');
  await page.click('#pin-ok');
}

async function answer(page, genre, mobile, wrongFirst) {
  const s = await st(page); const P = s.prog[genre]; const q = P.qs[P.i];
  if (q.parts) {
    const ans = q.parts.filter(p => p.t === 'blank').map(p => String(p.answer));
    const vals = wrongFirst ? ans.map(a => String(Number(a) + 1)) : ans;
    // いまの値をけす
    for (let i = 0; i < ans.length; i++) {
      await page.click('#q-main .blank[data-idx="' + i + '"]');
      for (let k = 0; k < 6; k++) { if (mobile) await page.click('.key:has-text("けす")'); else await page.keyboard.press('Backspace'); }
      for (const ch of vals[i]) { if (mobile) await page.click('.key:text-is("' + ch + '")'); else await page.keyboard.press(ch); }
    }
    if (mobile) await page.click('#btn-check'); else await page.keyboard.press('Enter');
  } else {
    let idx = q.answer;
    if (wrongFirst) { const tried = await page.$$eval('#q-main .choice', bs => bs.map(b => b.classList.contains('tried'))); for (let j = 1; j < 4; j++) { const c = (q.answer + j) % q.choices.length; if (!tried[c]) { idx = c; break; } } }
    if (mobile) await page.click('#q-main .choice[data-i="' + idx + '"]'); else await page.keyboard.press(String(idx + 1));
    await page.click('#btn-check');
  }
  return q;
}

async function run(vw, vh, tag) {
  console.log('== ' + tag + ' ' + vw + 'x' + vh);
  const mobile = vw < 700;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  ok(await page.isVisible('#splash'), 'はじめの絵が出る');
  await page.screenshot({ path: `${OUT}/${tag}_00_splash.png` });
  await page.waitForTimeout(2700);
  ok(!(await page.isVisible('#splash')), 'はじめの絵は 3秒以内に 自動で消える');
  ok(await page.isVisible('#btn-fs') || false, '全画面ボタンがある');
  await page.screenshot({ path: `${OUT}/${tag}_01_home.png`, fullPage: true });
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(!hscroll, 'トップに よこスクロールが出ない');

  // せってい：だれでも開ける
  ok(!(await page.$('#btn-teacher')) && !(await page.$('#m-pin')), '先'+'生ボタン・合言'+'葉パッドが無い');
  await page.click('#btn-settings');
  ok(await page.isVisible('#s-settings'), '歯車で せってい が開く');
  await page.screenshot({ path: `${OUT}/${tag}_03_settings.png`, fullPage: true });
  ok(!(await page.$('#btn-share')) && !(await page.$('#m-share')), '感想投稿のリンク・画面が無い');
  await page.click('[data-cnt="5"]');
  await page.click('#set-diff .opt[data-v="normal"]');
  await page.click('#btn-save');
  ok((await st(page)).settings.count === 5, '問題数5が 保存される');
  ok(!(await page.$('#share-card')), '保存のあとに Xのカードは出ない');
  const txt = await page.evaluate(() => document.body.textContent);
  const NG = ['合言'+'葉','先'+'生','パス'+'ワード','twit'+'ter','int'+'ent','GAS'+'アプリ','rohi'+'moto','X'+'に','X'+'で'];
  ok(!NG.some(w => txt.includes(w)), '画面に 禁止の言葉が無い');
  await page.click('#btn-close-settings');
  ok(await page.isVisible('#s-home'), 'おわると トップへ');

  // 5コースを最後まで
  const genres = ['unit', 'ruler', 'convert', 'calc', 'mix'];
  for (const g of genres) {
    await page.click('.course[data-genre="' + g + '"]');
    await page.waitForSelector('#s-quest.active');
    const n = (await st(page)).prog[g].qs.length;
    ok(n === 5, g + '：設定どおり 5もん');
    let shotDone = false, i = 0;
    while (await page.isVisible('#s-quest')) {
      // 1問目はわざとまちがえる
      if (i === 0) {
        await answer(page, g, mobile, true);
        await page.waitForTimeout(150);
        const fb = await page.textContent('#feedback');
        const hints = await page.$$('#hints .hint');
        ok(!/ちがう|ざんねん|×|✕/.test(fb) && hints.length === 1, g + '：まちがえると やさしい言葉＋ヒント1（' + fb + '）');
        await page.screenshot({ path: `${OUT}/${tag}_${g}_hint.png`, fullPage: true });
        if (g === 'ruler' || g === 'calc') { // 2回目もまちがえて ヒント2
          await answer(page, g, mobile, true); await page.waitForTimeout(100);
          ok((await page.$$('#hints .hint')).length === 2, g + '：2回目で ヒント2');
          await page.screenshot({ path: `${OUT}/${tag}_${g}_hint2.png`, fullPage: true });
        }
      }
      // 入力のとちゅうでは 判定しない
      const s = await st(page); const q = s.prog[g].qs[s.prog[g].i];
      if (q.parts && i === 1) {
        const before = s.prog[g].i;
        const a0 = String(q.parts.filter(p => p.t === 'blank')[0].answer);
        await page.click('#q-main .blank[data-idx="0"]');
        for (let k = 0; k < 6; k++) await page.click('.key:has-text("けす")');
        await page.click('.key:text-is("' + a0[0] + '")');
        await page.waitForTimeout(300);
        ok((await st(page)).prog[g].i === before, g + '：入力のとちゅうでは せいかい判定しない');
      }
      if (!shotDone && i === 1) { await page.screenshot({ path: `${OUT}/${tag}_${g}_q.png`, fullPage: true }); shotDone = true; }
      // まきじゃく：2問目で再読みこみ→続きから
      if (g === 'ruler' && i === 2) {
        await page.reload({ waitUntil: 'load' });
        const t0 = Date.now(); await page.click('#splash'); await page.waitForSelector('#splash', { state: 'hidden' });
        ok(Date.now() - t0 < 1200, 'はじめの絵は さわると すぐ消える');
        ok(await page.isVisible('#resume'), '再読みこみ後 「つづきから」が出る');
        await page.screenshot({ path: `${OUT}/${tag}_05_resume.png`, fullPage: true });
        await page.click('#resume');
        ok((await page.textContent('#q-count')).startsWith('3 /'), '続きは 3もんめから');
      }
      await answer(page, g, mobile, false);
      await page.waitForTimeout(1200);
      i++;
      if (i > 20) break;
    }
    ok(await page.isVisible('#s-goal'), g + '：ゴール画面');
    if (g === 'unit' || g === 'mix') await page.screenshot({ path: `${OUT}/${tag}_${g}_goal.png`, fullPage: true });
    // まちがえた問題をもう一度
    if (g === 'unit') {
      ok(await page.isVisible('#btn-retry-missed'), 'もう一度チャレンジ ボタンが出る');
    }
    await page.click('#btn-home');
  }
  const s1 = await st(page);
  ok(genres.every(g => s1.courses[g] && s1.courses[g].clears === 1), '5コースとも クリアが記録される');
  await page.screenshot({ path: `${OUT}/${tag}_06_home_after.png`, fullPage: true });

  // 設定でむずかしい → 反映（まきじゃくが 入力式になる）
  await page.click('#btn-settings');
  await page.click('#set-diff .opt[data-v="hard"]');
  await page.click('#cnt-minus'); // 5→4
  await page.click('#btn-save');

  const s2 = await st(page);
  ok(s2.settings.diff === 'hard' && s2.settings.count === 4, 'むずかしい・4もんが 保存される');
  // 記録を消す（確認ダイアログ）
  await page.click('#btn-wipe');
  ok(await page.isVisible('#m-confirm'), '消す前に 画面内の確認が出る');
  await page.screenshot({ path: `${OUT}/${tag}_07_wipe_confirm.png` });
  await page.click('#cf-yes');
  ok(Object.keys((await st(page)).courses).length === 0, '記録が消える');
  await page.click('#btn-close-settings');
  await page.click('.course[data-genre="ruler"]');
  const s3 = await st(page);
  ok(s3.prog.ruler.qs.length === 4 && s3.prog.ruler.qs.slice(2).every(q => q.parts), '設定が反映：4もん・むずかしいは まきじゃくを書いて答える');
  await page.screenshot({ path: `${OUT}/${tag}_08_ruler_hard.png`, fullPage: true });
  // ピンチ相当：＋ボタンで大きく
  const w1 = await page.evaluate(() => document.querySelector('.rv-zoom svg').getBoundingClientRect().width);
  await page.click('.zbtn[aria-label="大きく する"]');
  const w2 = await page.evaluate(() => document.querySelector('.rv-zoom svg').getBoundingClientRect().width);
  ok(w2 > w1, 'まきじゃくを 大きくできる');
  // 押す所の大きさ
  const small = await page.evaluate(() => Array.from(document.querySelectorAll('#s-quest button')).filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return [b.textContent.trim().slice(0, 10), Math.round(r.width), Math.round(r.height)]; }).filter(x => x[1] < 44 || x[2] < 44));
  ok(small.length === 0, '問題画面の 押す所が 44px以上 ' + JSON.stringify(small));
  const hs2 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(!hs2, '問題画面に よこスクロールが出ない');
  await page.click('.fseg button[data-f="xl"]');
  ok((await st(page)).settings.font === 'xl', '子ども画面から 文字 あ＋＋ にできて 覚える');
  await page.waitForTimeout(200);
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), 'あ＋＋でも 問題画面に よこスクロールが出ない');
  await page.screenshot({ path: `${OUT}/${tag}_09_ruler_xl.png`, fullPage: true });
  await page.click('.fseg button[data-f="m"]');

  // localStorage が使えない端末でも 遊べる
  const ctx2 = await browser.newContext({ viewport: { width: vw, height: vh } });
  await ctx2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const p2 = await ctx2.newPage(); const e2 = [];
  p2.on('pageerror', e => e2.push(String(e)));
  await p2.goto(URL); await p2.click('#splash'); await p2.waitForSelector('#splash', { state: 'hidden' }); await p2.click('.course[data-genre="convert"]');
  ok(await p2.isVisible('#s-quest') && e2.length === 0, '保存できない端末でも 遊べる');
  await ctx2.close();

  const ctx3 = await browser.newContext({ viewport: { width: vw, height: vh } });
  await ctx3.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', '1'); localStorage.setItem('nagasaBouken.v1', JSON.stringify({ pin: 'abc', salt: 'zz', shareHide: true, settings: { count: 7 } })); } } catch (e) {} });
  const p3 = await ctx3.newPage(); await p3.goto(URL); await p3.waitForTimeout(300);
  const left = await p3.evaluate(() => localStorage.getItem('nagasaBouken.v1'));
  ok(!/"pin"|"salt"|shareHide/.test(left) && /"count":7/.test(left), '前の版の照合値を 起動時に消す（設定は のこる）');
  await ctx3.close();
  ok(errors.length === 0, 'コンソールエラー 0 ' + JSON.stringify(errors));
  await browser.close();
}

(async () => {
  await run(375, 812, 'sp');
  await run(1366, 768, 'pc');
  await run(820, 1180, 'ipad縦');
  await run(1180, 820, 'ipad横');
  console.log(fails ? 'NG ' + fails : 'ALL OK');
  process.exit(fails ? 1 : 0);
})();
