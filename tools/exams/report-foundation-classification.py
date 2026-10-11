"""Produce the full Foundation taxonomy counts and question-by-question audit."""
import csv,json
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
all_rows=json.loads((ROOT/'exams/data/exam-index.json').read_text())
rows=[q for q in all_rows if q.get('tier')=='Foundation']
higher={s for q in all_rows if q.get('tier')=='Higher' for s in q.get('subtopics',[q['subtopic']])}
primary=Counter(q['subtopic'] for q in rows)
any_skill=Counter(s for q in rows for s in set(q.get('subtopics',[q['subtopic']])))
plan=json.loads((ROOT/'tools/exams/foundation-bank-plan.json').read_text())
evidence={q['record']['id']:q['classificationEvidence'] for p in plan for q in p['questions']}
groups=['Number','Algebra','Ratio, Proportion and Rates of Change','Geometry and Measures','Probability','Statistics']
assert set(q['topic'] for q in rows)==set(groups)
with (ROOT/'exams/gcse-foundation-classification.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.writer(f);writer.writerow(['id','paper','year','series','question','marks','topic','subtopic','all topics','all subtopics','review evidence'])
 for q in rows:writer.writerow([q['id'],q['paper'],q['examYear'],q['series'],q['question'],q['marks'],q['topic'],q['subtopic'],'; '.join(q.get('topics',[q['topic']])),'; '.join(q.get('subtopics',[q['subtopic']])),evidence.get(q['id'],'Approved June 2024 P1 pilot')])
lines=['# Foundation classification audit','',f'Coverage: **{len(rows):,} questions across 45 papers**. All six agreed main topic groups are used. Existing Higher and approved Foundation pilot labels have been preserved.','',
'Teacher approval recorded: all seven one-off primary labels and all five proposed primary-label judgement calls are approved. The genuine alternative skills listed below remain as secondary subtopics, with their corresponding topic tags, so both primary and secondary topic/subtopic filters find these questions.','',
'Every new question was reviewed from its wording and necessary diagrams; shared Higher questions were compared with the audited Higher bank. November 2019 P2 was also read visually because much of its visible wording is absent from its searchable text layer. No keyword-only classification was accepted without review.','',
'The accompanying `gcse-foundation-classification.csv` lists every record, primary and secondary labels, and review evidence.','',
'## Main topic counts','', '| Primary topic | Questions |','|---|---:|']
for topic in groups:lines.append(f'| {topic} | {sum(q["topic"]==topic for q in rows)} |')
lines+=['','## Every final subtopic','', '“Any tag” includes primary and secondary subtopics; those counts overlap. Primary counts sum to 1,260. A zero-primary label occurs only as a secondary skill.','',
'| Subtopic | Primary count | Any tag count | Used in Higher |','|---|---:|---:|---|']
for s in sorted(any_skill):lines.append(f'| {s} | {primary[s]} | {any_skill[s]} | {"Yes" if s in higher else "No"} |')
lines+=['','## One-off primary labels','', 'These were checked against the actual questions. They are legitimate isolated skills, rather than spelling variants. Some have more than one occurrence when secondary tags are counted.','', '| Question | Primary label |','|---|---|']
for q in rows:
 if primary[q['subtopic']]==1:lines.append(f'| {q["series"]} {q["examYear"]} {q["paper"]} Q{q["question"]} | {q["subtopic"]} |')
lines+=['','## Labels additional to the Higher bank','',
'The following labels cover distinct elementary skills that are not separately labelled in the existing Higher records. They do not add “easy”, “simple” or “basic” prefixes to an established label. `Simple interest` is the mathematical term and is distinct from compound interest. Approved pilot names such as `Function machines`, `Order of operations`, `Range` and `Simplifying ratios` are reused.','',
', '.join(sorted(any_skill.keys()-higher))+'.','',
'No known Foundation-only synonym was retained for the same Higher skill. For example, shared questions use `Ratio problem solving`, `Equations with unknowns on both sides`, `Right-angled trigonometry` and `Standard form` exactly as in Higher. New elementary equation labels distinguish one-sided equations and bracket equations from equations with unknowns on both sides.','',
'## Primary-label judgement calls','',
'The following questions assess more than one skill. The selected primary label is a judgement call; all listed secondary skills remain in the metadata. These are classification choices, not unresolved question/answer matches.','',
'| Question | Primary | Other supported classification | Reason |','|---|---|---|---|',
'| June 2017 P1 Q19 | Linear equations with brackets | Linear inequalities | Two marks for each independent subpart. |',
'| June 2018 P1 Q16 | Substitution | Expanding a single bracket; Linear equations with brackets | Three independent two-mark algebra tasks. |',
'| June 2018 P3 Q15 | Order of operations | Range | Two one-mark error explanations assess different skills. |',
'| November 2017 P2 Q24 | Quadratic equations using square roots | Expanding two brackets; Factorising quadratics | Independent algebra subparts with a 2/2/1 mark split. |',
'| June 2019 P2 Q13 | Ratio problem solving | Geometry and Measures: Properties of shapes | Infer the rectangle width from six equal lengths across and five down; this also relies on equal square sides. |','',
'No unresolved extraction identities or missing classifications remain. All five primary-label choices have been approved; the listed alternative skills remain searchable secondary labels.','']
(ROOT/'exams/gcse-foundation-classification-report.md').write_text('\n'.join(lines),encoding='utf-8')
print(len(rows),'records;',len(any_skill),'subtopics;',sum(n==1 for n in primary.values()),'one-off primary labels')
