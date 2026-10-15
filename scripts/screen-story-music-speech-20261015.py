import json,pathlib,time
from faster_whisper import WhisperModel
p=pathlib.Path('D:/tangobook-video/classic-bgm-20261015/selection/quality.json');d=json.loads(p.read_text(encoding='utf-8'))
model=WhisperModel('base',device='cuda',compute_type='float16',local_files_only=True)
for t in d['items']:
 segments,info=model.transcribe(t['pcm'],beam_size=1,condition_on_previous_text=False,vad_filter=True,no_speech_threshold=.45,temperature=0)
 evidence=[]
 for s in segments:
  if s.no_speech_prob<.45 and s.avg_logprob>-.65 and len(s.text.strip())>=5:
   evidence.append(dict(start=round(s.start,2),end=round(s.end,2),text=s.text.strip()[:100],confidence=round(s.avg_logprob,3),noSpeech=round(s.no_speech_prob,3)))
 t['speechScreen']={'method':'faster-whisper base, VAD; heuristic only, not human listening or a no-vocals guarantee','suspect':evidence}
 print(t['id'],'suspect',evidence,flush=True)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
