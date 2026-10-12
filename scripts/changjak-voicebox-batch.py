"""Supervise the local 01–19 generation and independent CPU ASR audit.

Can continue after the interactive turn; receipts are the completion evidence.
No database uploads, publishing, voice profile edits, or operating-book writes.
"""
import argparse
import importlib.util
import os
import pathlib
import subprocess
import sys
import time

spec=importlib.util.spec_from_file_location('tts',pathlib.Path(__file__).with_name('changjak-voicebox-tts.py'))
tts=importlib.util.module_from_spec(spec);spec.loader.exec_module(tts)


def totals(root):
    result={'generated':0,'perLanguage':{'ko':0,'en':0},'perSeries':{},
            'asrMatched':0,'needsListeningReview':0,'auditPending':0,'audioSeconds':0}
    expected=tts.scope_ids('01-19')
    for path in (root/'audio').glob('*/*/p*.json'):
        if path.name.endswith('.request.json'):continue
        r=tts.read(path)
        if r['bookId'] not in expected:raise ValueError('Unexpected book receipt')
        result['generated']+=1;result['perLanguage'][r['language']]+=1
        slug=r['bookId'].split('-')[1]
        row=result['perSeries'].setdefault(slug,{'ko':0,'en':0});row[r['language']]+=1
        result['audioSeconds']+=r['duration']
        audit=root/'audit-large-v3-vad-v1'/r['bookId']/r['language']/path.name
        if audit.exists():
            a=tts.read(audit)
            if a['mp3Sha256']!=r['mp3Sha256']:raise ValueError('Audit/receipt version mismatch')
            if a['status']=='asr-matched':result['asrMatched']+=1
            else:result['needsListeningReview']+=1
        else:result['auditPending']+=1
    result['remaining']=17000-result['generated']
    return result


def transient_generation_error(error):
    # Windows socket errors may have localized messages. Use stable error codes
    # as well as the English messages; never retry integrity/identity errors.
    return any(s in error for s in ('HTTP Error 50','Connection','timed out','refused',
        'Remote end closed','WinError 10061','WinError 10054','WinError 10060'))


def run(args):
    prepared=tts.read(args.root/'preparation.json')
    if prepared['status']!='prepared' or prepared['targetAudioPages']!=17000:
        raise ValueError('All 850 current sources must be prepared first')
    books=list(tts.books(args.root,'','01-19'))
    if any(tts.narration(b,'en',args.root) is None for b in books):
        raise ValueError('Every English page must be reviewed')
    env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1','PYTHONUTF8':'1'}
    scripts=pathlib.Path(__file__).parent
    started=time.time();attempt=0;worker=None;auditor=None;handles=[]
    try:
        out=(args.root/'batch-generation.stdout.log').open('a',encoding='utf-8');handles.append(out)
        err=(args.root/'batch-generation.stderr.log').open('a',encoding='utf-8');handles.append(err)
        aout=(args.root/'batch-audit.stdout.log').open('a',encoding='utf-8');handles.append(aout)
        aerr=(args.root/'batch-audit.stderr.log').open('a',encoding='utf-8');handles.append(aerr)
        def launch_generation():
            return subprocess.Popen([sys.executable,'-X','utf8',str(scripts/'changjak-voicebox-tts.py'),'generate',
                '--scope','01-19','--root',str(args.root),'--languages','ko,en'],stdout=out,stderr=err,env=env)
        def launch_audit():
            return subprocess.Popen([sys.executable,'-X','utf8',str(scripts/'changjak-voicebox-audit.py'),
                '--root',str(args.root),'--follow'],stdout=aout,stderr=aerr,env=env)
        worker=launch_generation()
        # Auditor's follow loop must observe the new running job, not the pilot's
        # finished state. It starts only after the new PID owns generation state.
        for _ in range(60):
            path=args.root/'generate-job.json'
            if path.exists():
                state=tts.read(path)
                if state.get('pid')==worker.pid and state.get('status')=='running':break
            if worker.poll() is not None:raise RuntimeError('Generation exited before starting audit')
            time.sleep(1)
        else:raise RuntimeError('Generation failed to initialize')
        auditor=launch_audit()
        while True:
            summary=totals(args.root)
            gen_code=worker.poll();audit_code=auditor.poll()
            if gen_code is None and audit_code==0:
                # A transient generator restart can briefly end follow mode.
                auditor=launch_audit();audit_code=None
            status='running' if gen_code is None else 'auditing' if audit_code is None else 'finished'
            error=None
            if gen_code is not None and gen_code!=0:
                state=tts.read(args.root/'generate-job.json')
                error=state.get('error','Generation process failed')
                # Do not turn identity/hash/unknown-file errors into blind retries.
                transient=transient_generation_error(error)
                if transient and attempt<5:
                    attempt+=1;time.sleep(min(30,5*attempt));worker=launch_generation();continue
                status='needs-attention'
            if audit_code is not None and audit_code!=0:
                status='needs-attention';error=error or 'CPU audit failed; see batch-audit.stderr.log'
            if gen_code==0 and summary['remaining']:
                status='needs-attention';error='Generation exited before 17,000 verified receipts'
            if gen_code==0 and audit_code==0 and not summary['remaining']:
                status='generated-audited-needs-listening' if summary['needsListeningReview'] else 'generated-asr-matched'
                if summary['auditPending']:status='needs-attention';error='ASR audit incomplete'
            summary.update({'status':status,'updatedAt':time.time(),'startedAt':started,'pid':os.getpid(),
                'generationPid':worker.pid,'auditPid':auditor.pid,'generationExitCode':gen_code,'auditExitCode':audit_code,
                'generationRestarts':attempt,'targetAudioPages':17000,'books':850,
                'note':'Generated/decoded/ASR comparison counts; not a claim of complete listening review or operating registration.'})
            if error:summary['error']=error
            tts.save(args.root/'batch-status.json',summary)
            print(f"BATCH {status} generated={summary['generated']}/17000 asr={summary['asrMatched']} review={summary['needsListeningReview']} auditPending={summary['auditPending']}",flush=True)
            if gen_code is not None and audit_code is not None:break
            time.sleep(30)
    finally:
        # On supervisor interruption stop only this supervisor's own children.
        for child in (worker,auditor):
            if child is not None and child.poll() is None:child.terminate()
        for handle in handles:handle.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=pathlib.Path,default=pathlib.Path('D:/tangobook-audio/changjak-series-01-19-20261004'))
    args=parser.parse_args()
    with (args.root/'batch-supervisor.lock').open('a+b') as lock:
        if lock.seek(0,2)==0:lock.write(b'0');lock.flush()
        lock.seek(0)
        if os.name=='nt':
            import msvcrt
            msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        else:
            import fcntl
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        run(args)


if __name__=='__main__':main()
