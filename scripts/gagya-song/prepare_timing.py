"""Freeze corrected vocal boundaries and a 30fps vocal aperture envelope.

Read the revision-v2 forced alignment and acoustic onset evidence before changing
these anchors. In particular the fourth 가 is sustained before a vocal pause;
it is not the strong attack at 13.99s (갸).
"""
from pathlib import Path
import json
import numpy as np
import soundfile as sf

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'packages/remotion/public/gagya-song-20261015'
BASE=Path('D:/tangobook-video/gagya-song-20261015')
ROWS=[
    [1.64,1.74,2.040,2.208,2.472,2.656,3.040,3.336,3.488,3.912],
    [4.616,5.240,5.568,5.728,6.000,6.168,6.544,6.864,7.032,7.448],
    [8.128,8.744,9.088,9.256,9.504,9.696,10.072,10.376,10.536,10.944],
    [11.648,13.992,14.336,14.496,14.752,14.936,15.328,15.632,15.792,16.064],
]
ENDS=[4.55,8.03,11.62,16.65]


def main():
    source,sr=sf.read(BASE/'stem0.wav')
    envelope=[]
    for frame in range(664):
        at=round(frame/30*sr)
        window=source[max(0,at-120):at+240]
        envelope.append(float(np.sqrt(np.mean(window**2))) if len(window) else 0)
    reference=float(np.percentile([v for v in envelope if v>.015],75))
    levels=np.clip((np.array(envelope)-.006)/(reference-.006),0,1)
    # Short causal smoothing keeps syllable attacks immediate and releases quiet gaps.
    levels=np.maximum(levels,np.r_[0,levels[:-1]]*.45)
    data={'version':2,'source':'Original-correlated stem0.wav',
          'method':'Known-text Whisper forced alignment, constrained to acoustic vowel attacks; waveform reviewed. CTC singing alignment rejected (low confidence).',
          'unquantizedRows':ROWS,'rows':[[round(t*30)/30 for t in row] for row in ROWS],
          'ends':[round(t*30)/30 for t in ENDS],
          'aperture':[round(float(v),4) for v in levels],
          'notes':['Frame boundaries shared by text and Rive mouth; 30fps quantization <=16.7ms.',
                   'Whisper estimates are not a guarantee of human-audited phonetic accuracy.',
                   'First 가 of rows 1,2,3,4 starts at 1.64,4.616,8.128,11.648 sec respectively.',
                   'Fourth 가 spans a held note and silence before 갸 at 13.992 sec; amplitude closes lips during silence.']}
    (ASSETS/'phoneme-timing.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Frozen 40 corrected cue boundaries and 664 vocal envelope values.')


if __name__=='__main__': main()
