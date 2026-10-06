/* Shared, data-driven course selectors. */
window.ExamUI={
 options(id,values,placeholder='All',selected=''){const s=document.getElementById(id);s.replaceChildren();for(const [value,label] of [['',placeholder],...values.map(v=>[String(v),String(v)])]){const o=document.createElement('option');o.value=value;o.textContent=label;s.append(o);}s.value=values.map(String).includes(String(selected))?selected:'';},
 values(){return Object.fromEntries(['qualification','tier','yearGroup','component'].map(k=>[k,document.getElementById(k).value]));},
 courses(change){const $=id=>document.getElementById(id),u=this;u.options('qualification',Object.keys(ExamCore.hierarchy),'Choose qualification');function update(){const h=ExamCore.hierarchy[$('qualification').value]||{};for(const [key,values] of [['tier',h.tiers],['yearGroup',h.years],['component',h.components]]){$(key+'Label').hidden=!values;u.options(key,values||[],'Choose '+(key==='yearGroup'?'year':key));}change();} $('qualification').addEventListener('change',update);for(const id of ['tier','yearGroup','component'])$(id).addEventListener('change',change);update();},
 ready(f){const h=ExamCore.hierarchy[f.qualification];return h&&(h.tiers?!!f.tier:!!f.yearGroup&&!!f.component);},
 async index(){const response=await fetch('exams/data/exam-index.json',{cache:'no-store'});if(!response.ok)throw Error('Exam index could not be loaded ('+response.status+').');return ExamCore.validateIndex(await response.json());}
};
