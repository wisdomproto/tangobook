"""Independent Korean CTC forced alignment against the known 40 syllables.

The model has no 갸 token, so its acoustic anchor uses 가; the displayed lyric
remains 갸. This substitution is disclosed in the evidence, never in the song.
Model inference is CPU-only to avoid changing other local GPU workloads.
"""
from pathlib import Path
import json
import numpy as np
import soundfile as sf
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

BASE=Path('D:/tangobook-video/gagya-song-20261015')
OUT=BASE/'revision-v2'
MODEL='kresnik/wav2vec2-large-xlsr-korean'


def main():
    torch.set_num_threads(6)
    model=Wav2Vec2ForCTC.from_pretrained(MODEL,cache_dir='D:/tangobook-model-cache/huggingface-hub').eval()
    processor=Wav2Vec2Processor.from_pretrained(MODEL,cache_dir='D:/tangobook-model-cache/huggingface-hub')
    y,sr=sf.read(BASE/'stem0.wav');assert sr==16000
    y=y[:18*sr]
    inputs=processor(y,sampling_rate=sr,return_tensors='pt',padding=True)
    with torch.inference_mode(): logits=model(**inputs).logits
    emissions=logits.log_softmax(-1)[0].numpy()
    vocabulary=processor.tokenizer.get_vocab()
    letters=list('가갸거겨고교구규그기')*4+['예']
    targets=[vocabulary['가' if c=='갸' else c] for c in letters]
    blank=model.config.pad_token_id
    states=[blank]
    for token in targets:states.extend([token,blank])
    T,N=len(emissions),len(states)
    scores=np.full((T,N),-np.inf); parents=np.zeros((T,N),dtype=np.int16)
    scores[0,0]=emissions[0,blank];scores[0,1]=emissions[0,states[1]]
    for t in range(1,T):
        for s in range(N):
            candidates=[s]
            if s>0:candidates.append(s-1)
            if s>1 and states[s]!=blank and states[s]!=states[s-2]:candidates.append(s-2)
            parent=max(candidates,key=lambda k:scores[t-1,k])
            scores[t,s]=scores[t-1,parent]+emissions[t,states[s]]
            parents[t,s]=parent
    last=N-1 if scores[-1,N-1]>scores[-1,N-2] else N-2
    path=np.zeros(T,dtype=int);path[-1]=last
    for t in range(T-1,0,-1):path[t-1]=parents[t,path[t]]
    step=len(y)/sr/T
    aligned=[]
    for i,letter in enumerate(letters):
        indices=np.where(path==i*2+1)[0]
        assert len(indices)>0
        peak=int(indices[np.argmax(emissions[indices,targets[i]])])
        aligned.append({'text':letter,'row':i//10,'index':i%10,
                        'ctc_start':round(float(indices[0]*step),4),
                        'ctc_end':round(float((indices[-1]+1)*step),4),
                        'peak':round(float(peak*step),4),
                        'confidence':round(float(np.exp(emissions[peak,targets[i]])),4)})
    data={'model':MODEL,'sample_rate':sr,'step':step,'blank':blank,
          'lyric':'가갸거겨고교구규그기 '*4+'예',
          'anchor_substitution':{'갸':'가 (missing vocabulary token)'},
          'greedy':processor.batch_decode(torch.argmax(logits,dim=-1))[0],
          'words':aligned}
    (OUT/'ctc-alignment.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(data,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
