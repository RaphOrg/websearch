import fs from 'node:fs';
import path from 'node:path';

const WORDS = [
  'alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet',
  'kilo','lima','mike','november','oscar','papa','quebec','romeo','sierra','tango',
  'uniform','victor','whiskey','xray','yankee','zulu'
];

function randInt(n: number) {
  return Math.floor(Math.random() * n);
}

function sentence(words: number) {
  const out: string[] = [];
  for (let i = 0; i < words; i++) out.push(WORDS[randInt(WORDS.length)]);
  return out.join(' ');
}

export function generateJsonl(outPath: string, count: number) {
  const abs = path.resolve(outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const w = fs.createWriteStream(abs, { encoding: 'utf8' });
  for (let i = 0; i < count; i++) {
    const doc = {
      external_id: `doc-${i}`,
      title: sentence(6),
      body: `${sentence(40)}\n${sentence(40)}\n${sentence(40)}`,
      meta: { source: 'generator', i },
      created_at: new Date().toISOString()
    };
    w.write(JSON.stringify(doc) + '\n');
  }
  w.end();
}

