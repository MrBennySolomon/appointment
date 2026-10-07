import { useState, useEffect } from 'react';
import './index.css';
// כתובת ה-API מ-mockapi.io נקבעת בקובץ .env (VITE_API_URL), למשל: https://xxxx.mockapi.io/api/v1/bookings
// כל עוד המשתנה ריק, האתר עובד במצב הדגמה (שמירה בדפדפן בלבד).
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://6aae754a606bd915d110d395.mockapi.io/api/bookings";
const MONTHS=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAYS=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const SERVICES=[['מניקור ג׳ל',140],['לק רגיל',90],['בניית ציפורניים',220],['מילוי ג׳ל',160],['פדיקור ספא',180]];
const key=d=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const startOfWeek=d=>addDays(d,-d.getDay());
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const hoursFor=d=>d.getDay()===6?[]:d.getDay()===5?[9,10,11,12]:[9,10,11,12,13,14,15,16,17];
const TODAY=new Date();TODAY.setHours(0,0,0,0);

function Nails({colors}){
  return(<svg viewBox="0 0 320 260" width="100%" role="img" aria-label="איור של ציפורניים מטופחות">
    <defs><linearGradient id="skin" x1="0" x2="1"><stop offset="0" stopColor="#fbe0d5"/><stop offset="1" stopColor="#f7cdbd"/></linearGradient></defs>
    <rect x="20" y="150" width="280" height="130" rx="50" fill="url(#skin)"/>
    {[[40,90,38],[98,50,40],[158,34,42],[220,52,40],[276,100,34]].map(([x,y,w],i)=>(
      <g key={i}><rect x={x-w/2} y={y} width={w} height={170-y} rx={w/2} fill="url(#skin)"/>
      <rect x={x-w/2+5} y={y+6} width={w-10} height={34} rx={(w-10)/2} fill={colors[i%colors.length]}/>
      <ellipse cx={x-w/6} cy={y+16} rx="3.5" ry="8" fill="#fff" opacity=".55"/></g>))}
  </svg>)
}
function Bottle({c,label}){
  return(<figure><svg viewBox="0 0 120 130" width="100%" aria-hidden="true"><rect width="120" height="130" fill={c} opacity=".18"/>
    <rect x="40" y="10" width="40" height="34" rx="6" fill="#3a2530"/><rect x="52" y="44" width="16" height="10" fill="#d9c7a3"/>
    <rect x="28" y="54" width="64" height="62" rx="16" fill={c}/><rect x="36" y="62" width="9" height="40" rx="4.5" fill="#fff" opacity=".4"/></svg>
    <figcaption>{label}</figcaption></figure>)
}

function App(){
  const [view,setView]=useState('month');
  const [cur,setCur]=useState(new Date(TODAY));
  const [book,setBook]=useState({});
  const [pick,setPick]=useState(null);
  const [toast,setToast]=useState('');
  const [myIds,setMyIds]=useState([]);
  const say=t=>{setToast(t);setTimeout(()=>setToast(''),3500)};
  const load=async()=>{if(!API_URL)return;try{const list=await (await fetch(API_URL)).json();const m={};list.forEach(x=>m[x.slot]=x);setBook(m)}catch(e){say('לא הצלחנו לטעון את התורים התפוסים')}};
  useEffect(()=>{
    try{setMyIds(JSON.parse(localStorage.getItem('my-ids')||'[]'))}catch(e){}
    if(API_URL){load();const t=setInterval(load,30000);return()=>clearInterval(t)}
    try{const v=localStorage.getItem('nail-bookings');if(v)setBook(JSON.parse(v))}catch(e){}
  },[]);
  const save=b=>{setBook(b);try{localStorage.setItem('nail-bookings',JSON.stringify(b))}catch(e){}};
  const cancel=async b=>{
    if(API_URL){try{await fetch(API_URL+'/'+b.id,{method:'DELETE'});const ids=myIds.filter(i=>i!==b.id);setMyIds(ids);localStorage.setItem('my-ids',JSON.stringify(ids));load()}catch(e){say('הביטול נכשל, נסי שוב')}}
    else{const c={...book};delete c[b.k];save(c)}
  };
  const confirm=async(name,phone,service)=>{
    const slot=key(pick.d)+'|'+pick.h;
    const label=`${DAYS[pick.d.getDay()]} ${pick.d.getDate()}/${pick.d.getMonth()+1} ב-${String(pick.h).padStart(2,'0')}:00`;
    const ts=new Date(pick.d).setHours(pick.h);
    const rec={slot,name,phone,service,label,ts};
    if(API_URL){
      try{
        const same=await (await fetch(API_URL+'?slot='+encodeURIComponent(slot))).json();
        if(Array.isArray(same)&&same.some(x=>x.slot===slot)){setPick(null);await load();return say('השעה הזו נתפסה הרגע, נא לבחור שעה אחרת')}
        const row=await (await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rec)})).json();
        const ids=[...myIds,row.id];setMyIds(ids);localStorage.setItem('my-ids',JSON.stringify(ids));setBook({...book,[slot]:row});
      }catch(e){return say('קביעת התור נכשלה, נסי שוב')}
    }else save({...book,[slot]:rec});
    setPick(null);say('התור נקבע: '+label);
  };
  const now=new Date();
  const isFree=(d,h)=>{
    if(d<TODAY)return false;
    if(key(d)===key(TODAY)&&h<=now.getHours())return false;
    if(book[key(d)+'|'+h])return false;
    return API_URL?true:hash(key(d)+h)%5!==0;
  };
  const free=d=>hoursFor(d).filter(h=>isFree(d,h));
  const shift=n=>{const d=new Date(cur);
    if(view==='month')d.setMonth(d.getMonth()+n,1);else if(view==='week')d.setDate(d.getDate()+7*n);else d.setDate(d.getDate()+n);setCur(d)};
  const title=view==='month'?`${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`:
    view==='week'?`${startOfWeek(cur).getDate()}–${addDays(startOfWeek(cur),6).getDate()} ${MONTHS[addDays(startOfWeek(cur),6).getMonth()]}`:
    `יום ${DAYS[cur.getDay()]}, ${cur.getDate()} ${MONTHS[cur.getMonth()]}`;
  const goDay=d=>{setCur(d);setView('day')};

  const Slots=({d})=>{const hs=hoursFor(d);
    if(!hs.length)return <p className="note">הסטודיו סגור בשבת.</p>;
    return <div className="slots">{hs.map(h=><button key={h} className="slot" disabled={!isFree(d,h)} onClick={()=>setPick({d,h})}>{String(h).padStart(2,'0')}:00</button>)}</div>};

  const mine=Object.entries(book).map(([k,v])=>({k,...v})).sort((a,b)=>a.ts-b.ts).filter(b=>b.ts>=TODAY.getTime()&&(!API_URL||myIds.includes(b.id)));

  return(<div className="wrap">
    <section className="hero">
      <div>
        <h1>ציפורניים שאתן אוהבות להסתכל עליהן</h1>
        <p>מניקור, ג׳ל ובניית ציפורניים בסטודיו שקט ונעים. בחרי יום ושעה וקבעי תור בכמה לחיצות.</p>
        <button className="cta" onClick={()=>document.getElementById('cal').scrollIntoView({behavior:'smooth'})}>לקביעת תור</button>
      </div>
      <Nails colors={['#e84393','#f8b4d3','#a21a63','#f0b866','#fde0ee']}/>
    </section>
    <div className="gallery">
      <Bottle c="#e84393" label="פוקסיה"/><Bottle c="#f8b4d3" label="ורוד פודרה"/><Bottle c="#a21a63" label="פוקסיה עמוק"/><Bottle c="#f0b866" label="זהב חמים"/>
    </div>

    <section id="cal" className="panel" aria-label="לוח תורים">
      <div className="bar">
        <div className="seg" role="group" aria-label="תצוגה">
          {[['month','חודש'],['week','שבוע'],['day','יום']].map(([v,l])=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{l}</button>)}
        </div>
        <div className="nav">
          <button onClick={()=>shift(1)} aria-label="הבא">›</button>
          <strong>{title}</strong>
          <button onClick={()=>shift(-1)} aria-label="הקודם">‹</button>
        </div>
        <button className="seg" style={{border:0,padding:'8px 16px'}} onClick={()=>setCur(new Date(TODAY))}>היום</button>
      </div>

      {view==='month'&&(()=>{
        const first=new Date(cur.getFullYear(),cur.getMonth(),1),n=new Date(cur.getFullYear(),cur.getMonth()+1,0).getDate();
        const cells=[...Array(first.getDay()).fill(null),...Array.from({length:n},(_,i)=>new Date(cur.getFullYear(),cur.getMonth(),i+1))];
        return <div className="mgrid">{DAYS.map(d=><div key={d} className="dow">{d.slice(0,3)}׳</div>)}
          {cells.map((d,i)=>{if(!d)return <div key={i}/>;const f=free(d).length;
            return <button key={i} disabled={!f} className={`day ${f?'has':'off'} ${key(d)===key(TODAY)?'today':''}`} onClick={()=>goDay(d)} aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}, ${f} שעות פנויות`}>
              {d.getDate()}{f>0&&<small>{f} פנויות</small>}</button>})}</div>})()}

      {view==='week'&&<div className="wgrid">{Array.from({length:7},(_,i)=>addDays(startOfWeek(cur),i)).map(d=>
        <div key={+d} className="wcol"><h3>{DAYS[d.getDay()]}</h3><div className="d">{d.getDate()} {MONTHS[d.getMonth()]}</div>
          {hoursFor(d).length?<div className="slots">{hoursFor(d).map(h=><button key={h} className="slot" disabled={!isFree(d,h)} onClick={()=>setPick({d,h})}>{String(h).padStart(2,'0')}:00</button>)}</div>:<p className="note">סגור</p>}</div>)}</div>}

      {view==='day'&&<Slots d={cur}/>}
      <p className="note">שעות פעילות: ראשון–חמישי 09:00–18:00, שישי 09:00–13:00. שעות מסומנות באפור כבר תפוסות.</p>
    </section>

    {mine.length>0&&<section className="mine panel" style={{marginTop:18}}><h2 style={{fontSize:22}}>התורים שלי</h2><ul>
      {mine.map(b=><li key={b.k}><span>{b.label} · {b.service} · {b.name}</span><button onClick={()=>cancel(b)}>ביטול</button></li>)}</ul></section>}

    {pick&&<Booking pick={pick} onClose={()=>setPick(null)} onSave={confirm}/>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </div>)
}

function Booking({pick,onClose,onSave}){
  const [name,setName]=useState('');const [phone,setPhone]=useState('');const [s,setS]=useState(0);const [err,setErr]=useState('');
  const go=()=>{if(name.trim().length<2)return setErr('נא למלא שם מלא');if(!/^0\d{8,9}$/.test(phone.replace(/[-\s]/g,'')))return setErr('נא להזין מספר טלפון תקין');onSave(name.trim(),phone,SERVICES[s][0])};
  return(<div className="modal" onClick={onClose}><div className="sheet" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>
    <h2 style={{fontSize:26,color:'var(--plum)'}}>קביעת תור</h2>
    <p style={{color:'var(--mute)',margin:'4px 0 0'}}>יום {DAYS[pick.d.getDay()]}, {pick.d.getDate()} {MONTHS[pick.d.getMonth()]} · {String(pick.h).padStart(2,'0')}:00</p>
    <label htmlFor="sv">טיפול</label>
    <select id="sv" value={s} onChange={e=>setS(+e.target.value)}>{SERVICES.map(([n,p],i)=><option key={n} value={i}>{n} – ₪{p}</option>)}</select>
    <label htmlFor="nm">שם מלא</label><input id="nm" value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/>
    <label htmlFor="ph">טלפון</label><input id="ph" type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" dir="ltr" style={{textAlign:'right'}}/>
    {err&&<p role="alert" style={{color:'var(--rose)',margin:'8px 0 0'}}>{err}</p>}
    <div className="row"><button onClick={onClose}>חזרה</button><button className="cta" onClick={go}>אישור התור</button></div>
  </div></div>)
}

export default App;
