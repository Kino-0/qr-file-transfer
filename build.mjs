// 依存ライブラリを埋め込んだ単一HTMLを dist/ に出力する: npm install && npm run build
import { readFileSync as rd, writeFileSync as wr, mkdirSync } from 'node:fs';

const nm = 'node_modules';
const ver = p => JSON.parse(rd(`${nm}/${p}/package.json`, 'utf8')).version;
const parts = {
  // lean-qr はESモジュールなので、名前の衝突を避けて即時関数で包む
  '/*@inline lean-qr*/': () => {
    const src = rd(`${nm}/lean-qr/index.mjs`, 'utf8');
    const body = src.replace(/export\{(\w+) as correction,(\w+) as generate,(\w+) as mode\};?\s*$/, 'return{correction:$1,generate:$2,mode:$3}');
    if (body === src) throw Error('lean-qr の export 形式が変わっています');
    return `/*! lean-qr ${ver('lean-qr')} | (c) David Evans | MIT License | https://github.com/davidje13/lean-qr */\n`
      + `const{correction,generate,mode}=(()=>{${body}})();`;
  },
  '/*@inline zxing-reader*/': () =>
    `/*! zxing-wasm ${ver('zxing-wasm')} | (c) Ze-Zheng Wu | MIT License | https://github.com/Sec-ant/zxing-wasm`
    + ` | zxing-cpp: Apache License 2.0 | https://github.com/zxing-cpp/zxing-cpp */\n`
    + rd(`${nm}/zxing-wasm/dist/iife/reader/index.js`, 'utf8'),
  '/*@wasm64*/': () => rd(`${nm}/zxing-wasm/dist/reader/zxing_reader.wasm`).toString('base64'),
};

mkdirSync('dist', { recursive: true });
for (const f of ['send.html', 'recv.html']) {
  let s = rd(`src/${f}`, 'utf8');
  for (const [k, v] of Object.entries(parts)) s = s.replace(k, v);  // 関数で置換($の解釈を避ける)
  wr(`dist/${f}`, s);
  console.log(`dist/${f}`, s.length, 'bytes');
}
