import fs from 'node:fs/promises';
const root='D:/ComfyUI-output/library-clean-covers-20261006';
const rows=JSON.parse(await fs.readFile(root+'/all-list.json','utf8')).data.filter(b=>!b.category?.includes('파닉스'));
const trial=JSON.parse(await fs.readFile('assets/fonts/tangobook-story-hand/dist-asian/coverage.json','utf8'));
const supported=new Set(trial.codepoints),languages={};
for(const book of rows)for(const [lang,value] of Object.entries({ko:book.title.replace(/_그림체\d+$/,''),...book.titleTranslations})){
 const title=value.normalize('NFC');const item=languages[lang]??={titles:0,missingTitles:0,missingCharacters:new Set()};item.titles++;let missing=false;
 for(const c of title)if(!supported.has(c.codePointAt(0))){missing=true;item.missingCharacters.add(c);}if(missing)item.missingTitles++;
}
for(const item of Object.values(languages))item.missingCharacters=[...item.missingCharacters].sort().join('');
const report={books:rows.length,trialVersion:trial.version,languages,requiredScope:{ko:'all 11172 modern precomposed Hangul syllables + jamo',latin:'en/es/fr/de/vi/ms/id alphabets, accents and combining marks',ja:'hiragana/katakana and everyday kanji',zh:'CJK unified ideographs and Simplified/Traditional title coverage',th:'Thai alphabet, vowels, tone marks and mark shaping'},registeredLanguages:['ko','en','ja','zh','es','fr','de','vi','th','ms','id']};
await fs.writeFile(root+'/font-coverage-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({books:rows.length,languages:Object.fromEntries(Object.entries(languages).map(([l,x])=>[l,{titles:x.titles,missingTitles:x.missingTitles,missingCharacters:[...x.missingCharacters].length}]))}));
