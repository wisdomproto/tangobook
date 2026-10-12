"""Validate local creative-series English translations and build a source comparison."""
import argparse
import importlib.util
import json
import pathlib
import re

spec = importlib.util.spec_from_file_location("voicebox_tts", pathlib.Path(__file__).with_name("changjak-voicebox-tts.py"))
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=pathlib.Path, default=pathlib.Path("D:/tangobook-audio/changjak-series-01-10-20261004"))
    parser.add_argument("--export", action="store_true", help="Save verified books as repository translation assets")
    parser.add_argument("--scope", choices=("01-10", "11-19"), default="01-10")
    args = parser.parse_args()
    rows, missing, by_series, invalid_audio = [], [], {}, []
    expected = ({f"changjak-{slug}-{n:02d}" for slug in tts.SERIES for n in range(1, 51)}
                if args.scope == "01-10" else
                {f"changjak-{slug}-{n:02d}" for slug in ("bung", "dingding", "taro", "yuki", "mina", "kota", "moya", "bami", "dari")
                 for n in range(1, 51 if slug in ("bung", "dingding", "taro", "yuki", "mina") else 26)})
    selected = tts.read(args.root / "inventory.json")["perBook"]
    assert len(selected) == len(expected) and {b["id"] for b in selected} == expected, "Inventory scope mismatch or duplicate IDs"
    for row in selected:
        book = tts.read(args.root / "books-before" / (row["id"] + ".json"))
        assert book["id"] == row["id"], "Snapshot ID mismatch"
        assert [p["page_number"] for p in book["pages"]] == list(range(1, 11)), book["id"]
        assert all(isinstance(p.get("text"), str) and p["text"].strip() for p in book["pages"]), book["id"]
        slug = book["id"].split("-")[1]
        path = args.root / "translations" / (book["id"] + ".json")
        translation = tts.read(path) if path.exists() else None
        if translation:
            assert translation["bookId"] == book["id"]
            assert translation["sourceSha256"] == tts.source_hash(book), book["id"]
            assert translation.get("reviewed") is True, book["id"]
            assert translation.get("titleEn", "").strip(), book["id"]
            assert [p["pageNumber"] for p in translation["pages"]] == list(range(1, 11)), book["id"]
            assert all(isinstance(p["text"], str) and re.search("[A-Za-z]", p["text"])
                       and not re.search("[가-힣]", p["text"]) for p in translation["pages"]), book["id"]
            by_series[slug] = by_series.get(slug, 0) + 1
            if args.export:
                output = pathlib.Path(__file__).resolve().parent.parent / "docs/changjak-books/translations/en" / path.name
                # No audio/session data or provider credentials are exported.
                tts.save(output, {"bookId": translation["bookId"], "sourceSha256": translation["sourceSha256"],
                                  "titleEn": translation["titleEn"], "language": "en",
                                  "reviewed": True, "translator": "Codex direct source comparison",
                                  "pages": translation["pages"]})
            for p in translation["pages"]:
                receipt_path = args.root / "audio" / book["id"] / "en" / f"p{p['pageNumber']:02d}.json"
                if receipt_path.exists():
                    receipt = tts.read(receipt_path)
                    if receipt["request"]["text"] != p["text"]:
                        invalid_audio.append({"bookId": book["id"], "pageNumber": p["pageNumber"],
                                              "mp3Sha256": receipt["mp3Sha256"],
                                              "reason": "English text revised; saved audio retained, regenerate later"})
        else:
            missing.append(book["id"])
        rows.append({"id": book["id"], "series": slug, "title": book["title"],
                     "titleEn": translation.get("titleEn", "") if translation else "",
                     "pages": [{"number": p["page_number"], "ko": p["text"],
                                "en": translation["pages"][i]["text"] if translation else ""}
                               for i, p in enumerate(book["pages"])]})
    summary = {"expectedBooks": len(expected), "translatedBooks": len(expected)-len(missing),
               "translatedPages": (len(expected)-len(missing))*10, "perSeries": by_series,
               "missingBookIds": missing, "outdatedEnglishAudio": invalid_audio,
               "status": "translation-files-complete" if not missing else "translation-in-progress",
               "note": "Format/source verification, not a substitute for semantic review"}
    tts.save(args.root / "translation-status.json", summary)
    data = json.dumps(rows, ensure_ascii=False).replace("<", "\\u003c")
    html = """<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>창작동화 01~10 영어 번역 검토</title><style>
body{margin:0;background:#f7f4ef;color:#252525;font:16px/1.75 system-ui}main{max-width:1150px;margin:32px auto;padding:20px}
h1{font-size:26px}select,input{font:inherit;padding:8px;border:1px solid #d6cfc6;border-radius:8px;margin:0 8px 12px 0}
article{background:white;border:1px solid #e3ddd4;border-radius:12px;margin:18px 0;padding:22px}h2{margin:0;font-size:20px}
.row{display:grid;grid-template-columns:36px 1fr 1fr;gap:18px;border-top:1px solid #eee;padding:15px 0}.en{color:#174a67}.pending{color:#987647}
.id{color:#80776e;font-size:13px}#count{margin-bottom:14px}@media(max-width:700px){.row{grid-template-columns:28px 1fr}.en{grid-column:2}}
</style><main><h1>창작동화 01~10 영어 번역 검토</h1><p>한국어 원문과 영어 번역을 쪽별로 대조하는 작업용 화면입니다. 아직 번역하지 않은 책은 빈 영어 본문을 등록하지 않습니다.</p>
<div id="count"></div><select id="series"><option value="">전체 시리즈</option></select><select id="state"><option value="done">번역된 책</option><option value="all">전체 책</option><option value="pending">번역 대기</option></select><input id="query" placeholder="제목 또는 책 ID 검색"><div id="books"></div></main>
<script>const rows=DATA;const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const series=document.querySelector('#series'),state=document.querySelector('#state'),query=document.querySelector('#query'),books=document.querySelector('#books');
for(const slug of [...new Set(rows.map(x=>x.series))]){const o=document.createElement('option');o.value=slug;o.textContent=slug;series.append(o)}
const completed=rows.filter(x=>x.titleEn).length;document.querySelector('#count').textContent=`번역 ${completed}/${rows.length}권 · ${completed*10}/${(rows.length*10).toLocaleString()}쪽`;
function render(){books.innerHTML=rows.filter(x=>(!series.value||x.series===series.value)&&(state.value==='all'||(state.value==='done'?!!x.titleEn:!x.titleEn))&&(!query.value||[x.title,x.titleEn,x.id].join(' ').toLowerCase().includes(query.value.toLowerCase()))).map(x=>`<article><div class="id">${esc(x.id)}</div><h2>${esc(x.title)} / ${x.titleEn?esc(x.titleEn):'번역 대기'}</h2>${x.pages.map(p=>`<div class="row"><b>${p.number}</b><div>${esc(p.ko)}</div><div class="${p.en?'en':'pending'}">${p.en?esc(p.en):'번역 대기'}</div></div>`).join('')}</article>`).join('')}
series.onchange=state.onchange=query.oninput=render;render();</script></html>""".replace("DATA", data)
    html = html.replace("01~10 영어 번역 검토", args.scope.replace("-", "~") + " 영어 번역 검토")
    (args.root / "english-review.html").write_text(html, encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k not in ("missingBookIds", "outdatedEnglishAudio")}, ensure_ascii=False))
    print("Saved audio requiring regeneration:", len(invalid_audio))


if __name__ == "__main__":
    main()
