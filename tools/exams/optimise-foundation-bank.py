"""Lossless size reduction of new Foundation extracts only, with rendered proof."""
import argparse,hashlib,importlib.util,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--report',required=True);args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('lossless',Path(__file__).with_name('optimise-working-questions.py'))
helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
plan_path=Path(__file__).with_name('foundation-bank-plan.json');plan=json.loads(plan_path.read_text())
report=[]
for paper in plan:
 for item in paper['questions']:
  for mode,key in [('compact','questionFile'),('working','workingQuestionFile'),('answers','answerFile')]:
   file=(ROOT/item['record'][key]).resolve()
   assert file.is_relative_to(ROOT/'exams') and '/foundation/' in file.as_posix()
   assert '1f-2024-june' not in file.name
   before=file.read_bytes();assert hashlib.sha256(before).hexdigest()==item[mode+'SHA256']
   after=helper.optimise(before)
   identical=True
   if len(after)<len(before):
    identical=helper.render_hashes(before)==helper.render_hashes(after)
    if not identical:after=before
   if len(after)<len(before):
    file.write_bytes(after);item[mode+'SHA256']=hashlib.sha256(after).hexdigest()
   else:after=before
   report.append(dict(id=item['record']['id'],mode=mode,before=len(before),after=len(after),retainedOriginal=not identical))
 plan_path.write_text(json.dumps(plan,indent=2)+'\n')
 print(Path(paper['sourceFile']).stem,flush=True)
Path(args.report).write_text(json.dumps(dict(files=len(report),bytesBefore=sum(r['before'] for r in report),bytesAfter=sum(r['after'] for r in report),renderCheck='Every accepted page identical at 72 dpi',results=report),indent=2))
print('Verified',len(report),'files; saved',sum(r['before']-r['after'] for r in report)//1048576,'MiB')
