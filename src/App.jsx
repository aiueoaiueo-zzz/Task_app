import { useState, useEffect, useCallback } from "react";

/* ─── Constants ─── */
const PRIORITIES = {
  high:   { label: "高", color: "#ff5f5f", bg: "rgba(255,95,95,0.13)",  border: "rgba(255,95,95,0.35)" },
  medium: { label: "中", color: "#f5a623", bg: "rgba(245,166,35,0.13)", border: "rgba(245,166,35,0.35)" },
  low:    { label: "低", color: "#4db8ff", bg: "rgba(77,184,255,0.13)", border: "rgba(77,184,255,0.35)" },
};
const CATEGORIES = ["デイリー", "非デイリー"];
const DAYS_JP = ["日","月","火","水","木","金","土"];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function dateRange(start, end) {
  const dates = [];
  let cur = start;
  while (cur <= end) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}
function isoToDisplay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.ceil((d - now) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}日超過`, color: "#ff5f5f", urgent: true };
  if (diff === 0) return { label: "今日",  color: "#f5a623", urgent: true };
  if (diff === 1) return { label: "明日",  color: "#f5a623", urgent: false };
  return { label: `${diff}日後`, color: "#666", urgent: false };
}
function getCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

/* ─── Storage (localStorage) ─── */
async function loadTodos() {
  try {
    const raw = localStorage.getItem("todos_v2");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveTodos(todos) {
  try { localStorage.setItem("todos_v2", JSON.stringify(todos)); } catch {}
}

/* ─── Badge ─── */
function PriorityBadge({ priority }) {
  const p = PRIORITIES[priority];
  return (
    <span style={{
      fontSize:"11px",padding:"2px 8px",borderRadius:"20px",
      background:p.bg,color:p.color,fontWeight:"600",flexShrink:0,
    }}>{p.label}</span>
  );
}

/* ─── Copy Modal ─── */
function CopyModal({ todo, onClose, onCopy }) {
  const t = todayKey();
  const [mode,    setMode]    = useState("preset"); // "preset" | "custom"
  const [preset,  setPreset]  = useState("7");
  const [startDate, setStart] = useState(t);
  const [endDate,   setEnd]   = useState(addDays(t, 6));
  const [copying, setCopying] = useState(false);
  const [done,    setDone]    = useState(false);

  const presets = [
    { label: "3日間",  value: "3" },
    { label: "1週間",  value: "7" },
    { label: "2週間",  value: "14" },
    { label: "1ヶ月",  value: "30" },
  ];

  const getTargetDates = () => {
    if (mode === "preset") {
      const days = parseInt(preset);
      return dateRange(t, addDays(t, days - 1));
    }
    if (startDate && endDate && startDate <= endDate) {
      return dateRange(startDate, endDate);
    }
    return [];
  };

  const targets = getTargetDates();

  const handleCopy = () => {
    if (targets.length === 0 || copying) return;
    setCopying(true);
    onCopy(todo, targets);
    setTimeout(() => { setDone(true); setCopying(false); }, 300);
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:200,
      background:"rgba(0,0,0,0.72)",
      display:"flex",alignItems:"flex-end",justifyContent:"center",
      backdropFilter:"blur(6px)",
    }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{
        width:"100%",maxWidth:"520px",
        background:"#16161e",
        borderRadius:"20px 20px 0 0",
        border:"1px solid rgba(255,255,255,0.1)",
        padding:"24px 20px",
        paddingBottom:"calc(24px + env(safe-area-inset-bottom,16px))",
      }}>
        {/* Handle */}
        <div style={{width:"36px",height:"4px",borderRadius:"2px",background:"#2a2a36",margin:"0 auto 20px"}}/>

        <div style={{marginBottom:"16px"}}>
          <div style={{fontSize:"13px",color:"#7c6dfa",fontWeight:"600",marginBottom:"4px",fontFamily:"'DM Mono',monospace"}}>
            デイリータスクをコピー
          </div>
          <div style={{fontSize:"15px",color:"#e2e2e2",fontWeight:"500"}}>{todo.text}</div>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:"6px",marginBottom:"18px"}}>
          {[{v:"preset",l:"プリセット"},{v:"custom",l:"期間指定"}].map(m=>(
            <button key={m.v} onClick={()=>setMode(m.v)} style={{
              flex:1,padding:"9px",borderRadius:"10px",cursor:"pointer",
              background:mode===m.v?"rgba(124,109,250,0.2)":"rgba(255,255,255,0.04)",
              border:`1px solid ${mode===m.v?"#7c6dfa":"rgba(255,255,255,0.08)"}`,
              color:mode===m.v?"#a89eff":"#555",fontSize:"13px",fontWeight:"500",
            }}>{m.l}</button>
          ))}
        </div>

        {mode==="preset" ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"8px",marginBottom:"20px"}}>
            {presets.map(p=>(
              <button key={p.value} onClick={()=>setPreset(p.value)} style={{
                padding:"12px",borderRadius:"12px",cursor:"pointer",
                background:preset===p.value?"rgba(124,109,250,0.18)":"rgba(255,255,255,0.04)",
                border:`1.5px solid ${preset===p.value?"#7c6dfa":"rgba(255,255,255,0.08)"}`,
                color:preset===p.value?"#c4baff":"#777",
                fontSize:"14px",fontWeight:preset===p.value?"600":"400",
              }}>{p.label}</button>
            ))}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <label style={{fontSize:"12px",color:"#555",width:"40px",flexShrink:0}}>開始</label>
              <input type="date" value={startDate} onChange={e=>setStart(e.target.value)}
                style={{...inputSt,flex:1}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <label style={{fontSize:"12px",color:"#555",width:"40px",flexShrink:0}}>終了</label>
              <input type="date" value={endDate} onChange={e=>setEnd(e.target.value)}
                min={startDate}
                style={{...inputSt,flex:1}}/>
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{
          padding:"10px 14px",borderRadius:"10px",
          background:"rgba(124,109,250,0.08)",border:"1px solid rgba(124,109,250,0.18)",
          marginBottom:"16px",
        }}>
          <span style={{fontSize:"13px",color:"#a89eff"}}>
            {targets.length > 0
              ? `${targets[0]} 〜 ${targets[targets.length-1]}（${targets.length}日分）にコピーします`
              : "期間を選択してください"}
          </span>
        </div>

        {done ? (
          <div style={{
            padding:"14px",borderRadius:"12px",textAlign:"center",
            background:"rgba(77,255,158,0.1)",border:"1px solid rgba(77,255,158,0.3)",
            color:"#4dff9e",fontSize:"14px",fontWeight:"600",
          }}>✓ {targets.length}件のタスクをコピーしました</div>
        ) : (
          <button onClick={handleCopy} disabled={targets.length===0||copying} style={{
            width:"100%",padding:"14px",borderRadius:"12px",cursor:"pointer",
            background:targets.length===0?"rgba(255,255,255,0.04)":"#7c6dfa",
            border:"none",color:"#fff",fontSize:"15px",fontWeight:"700",
            opacity:targets.length===0?0.4:1,transition:"opacity 0.2s",
          }}>
            {copying ? "コピー中..." : `コピーする（${targets.length}日分）`}
          </button>
        )}

        <button onClick={onClose} style={{
          width:"100%",marginTop:"10px",padding:"12px",
          background:"none",border:"none",color:"#444",
          fontSize:"14px",cursor:"pointer",
        }}>キャンセル</button>
      </div>
    </div>
  );
}

const inputSt = {
  background:"rgba(255,255,255,0.07)",
  border:"1px solid rgba(255,255,255,0.12)",
  borderRadius:"10px",padding:"10px 14px",
  color:"#e2e2e2",fontSize:"14px",
  WebkitAppearance:"none",
};

/* ─── TodoItem ─── */
function TodoItem({ todo, onToggle, onDelete, onCopyRequest }) {
  const dateInfo = isoToDisplay(todo.deadline);
  const p = PRIORITIES[todo.priority];
  const isDaily = todo.category === "デイリー";

  return (
    <div style={{
      display:"flex",alignItems:"flex-start",gap:"10px",
      padding:"13px 14px",
      background:todo.done?"rgba(255,255,255,0.018)":"rgba(255,255,255,0.042)",
      border:`1px solid ${todo.done?"rgba(255,255,255,0.05)":p.border}`,
      borderRadius:"12px",marginBottom:"7px",
      opacity:todo.done?0.42:1,
      position:"relative",overflow:"hidden",
      transition:"opacity 0.2s",
    }}>
      {!todo.done && (
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:"3px",
          background:p.color,borderRadius:"12px 0 0 12px"}}/>
      )}
      <button onClick={()=>onToggle(todo.id)} style={{
        flexShrink:0,width:"20px",height:"20px",borderRadius:"50%",marginTop:"1px",
        border:`2px solid ${todo.done?"#444":p.color}`,
        background:todo.done?"#444":"transparent",
        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all 0.15s",
      }}>
        {todo.done&&<span style={{color:"#fff",fontSize:"10px",lineHeight:1}}>✓</span>}
      </button>

      <div style={{flex:1,minWidth:0}}>
        <div style={{
          fontSize:"14px",color:todo.done?"#3c3c3c":"#e2e2e2",
          textDecoration:todo.done?"line-through":"none",
          wordBreak:"break-word",lineHeight:"1.4",
        }}>{todo.text}</div>
        <div style={{display:"flex",gap:"5px",marginTop:"5px",flexWrap:"wrap",alignItems:"center"}}>
          <PriorityBadge priority={todo.priority}/>
          <span style={{
            fontSize:"11px",padding:"2px 8px",borderRadius:"20px",
            background:isDaily?"rgba(124,109,250,0.15)":"rgba(255,255,255,0.06)",
            color:isDaily?"#a89eff":"#555",
          }}>{todo.category}</span>
          {dateInfo&&(
            <span style={{
              fontSize:"11px",padding:"2px 7px",borderRadius:"20px",
              background:dateInfo.urgent?"rgba(255,120,0,0.1)":"transparent",
              color:dateInfo.color,fontWeight:dateInfo.urgent?"600":"normal",
            }}>📅 {dateInfo.label}</span>
          )}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"4px",flexShrink:0}}>
        {/* Copy button — only for デイリー and not done */}
        {isDaily && !todo.done && (
          <button
            onClick={()=>onCopyRequest(todo)}
            title="別日にコピー"
            style={{
              background:"rgba(124,109,250,0.14)",
              border:"1px solid rgba(124,109,250,0.3)",
              borderRadius:"7px",width:"28px",height:"28px",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"13px",color:"#a89eff",transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,109,250,0.28)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(124,109,250,0.14)";}}
          >⇉</button>
        )}
        <button onClick={()=>onDelete(todo.id)} style={{
          background:"none",border:"none",color:"#2e2e3a",
          cursor:"pointer",fontSize:"17px",padding:"0",lineHeight:1,
          width:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center",
          borderRadius:"7px",transition:"all 0.15s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.color="#ff5f5f";e.currentTarget.style.background="rgba(255,95,95,0.1)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="#2e2e3a";e.currentTarget.style.background="none";}}
        >×</button>
      </div>
    </div>
  );
}

/* ─── CalendarView ─── */
function CalendarView({ todos }) {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected,  setSelected]  = useState(todayKey());

  const days = getCalendarDays(viewYear, viewMonth);

  const statsMap = {};
  todos.forEach(t => {
    const key = t.deadline || (t.createdAt && t.createdAt.slice(0,10));
    if (!key) return;
    if (!statsMap[key]) statsMap[key] = { total:0, done:0 };
    statsMap[key].total++;
    if (t.done) statsMap[key].done++;
  });

  const prevMonth = () => {
    if (viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}
    else setViewMonth(m=>m-1);
  };
  const nextMonth = () => {
    if (viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}
    else setViewMonth(m=>m+1);
  };

  const selectedTodos = todos.filter(t => {
    const key = t.deadline||(t.createdAt&&t.createdAt.slice(0,10));
    return key===selected;
  });
  const todayStr = todayKey();

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:"16px",color:"#ddd"}}>
          {viewYear}年 {viewMonth+1}月
        </span>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
        {DAYS_JP.map((d,i)=>(
          <div key={d} style={{
            textAlign:"center",fontSize:"11px",padding:"4px 0",
            color:i===0?"#ff5f5f":i===6?"#4db8ff":"#444",
            fontFamily:"'DM Mono',monospace",
          }}>{d}</div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>
        {days.map((d,i)=>{
          if(!d) return <div key={`e${i}`}/>;
          const key=`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const stat=statsMap[key];
          const rate=stat?stat.done/stat.total:null;
          const isToday=key===todayStr;
          const isSel=key===selected;
          const dow=new Date(viewYear,viewMonth,d).getDay();
          return (
            <button key={key} onClick={()=>setSelected(key)} style={{
              background:isSel?"rgba(124,109,250,0.22)":isToday?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.025)",
              border:`1.5px solid ${isSel?"#7c6dfa":isToday?"rgba(255,255,255,0.18)":"transparent"}`,
              borderRadius:"10px",padding:"6px 2px 8px",
              cursor:"pointer",display:"flex",flexDirection:"column",
              alignItems:"center",gap:"4px",minHeight:"54px",
              transition:"all 0.15s",
            }}>
              <span style={{
                fontSize:"13px",fontFamily:"'DM Mono',monospace",
                color:isSel?"#c4baff":isToday?"#fff":dow===0?"#ff5f5f":dow===6?"#4db8ff":"#888",
                fontWeight:isToday||isSel?"600":"400",
              }}>{d}</span>
              {stat&&(
                <div style={{width:"26px",height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.08)",overflow:"hidden"}}>
                  <div style={{
                    height:"100%",borderRadius:"2px",
                    width:`${Math.round(rate*100)}%`,
                    background:rate===1?"#4dff9e":rate>=0.5?"#f5a623":"#ff5f5f",
                  }}/>
                </div>
              )}
              {stat&&(
                <span style={{fontSize:"9px",color:"#444",fontFamily:"'DM Mono',monospace",lineHeight:1}}>
                  {stat.done}/{stat.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{marginTop:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <span style={{fontSize:"13px",color:"#555",fontFamily:"'DM Mono',monospace"}}>{selected}</span>
          {statsMap[selected]&&(
            <span style={{
              fontSize:"12px",fontFamily:"'DM Mono',monospace",
              color:statsMap[selected].done===statsMap[selected].total?"#4dff9e":"#f5a623",
            }}>
              {Math.round(statsMap[selected].done/statsMap[selected].total*100)}% 完了
            </span>
          )}
        </div>
        {selectedTodos.length===0?(
          <div style={{textAlign:"center",color:"#252530",padding:"32px 0",fontSize:"13px"}}>この日のタスクはありません</div>
        ):selectedTodos.map(t=>(
          <div key={t.id} style={{
            display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",
            background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",
            borderRadius:"10px",marginBottom:"6px",
          }}>
            <div style={{
              width:"11px",height:"11px",borderRadius:"50%",flexShrink:0,
              background:t.done?"#4dff9e":"rgba(255,255,255,0.08)",
              border:t.done?"none":`2px solid ${PRIORITIES[t.priority].color}`,
            }}/>
            <span style={{
              fontSize:"13px",color:t.done?"#3a3a3a":"#ccc",
              textDecoration:t.done?"line-through":"none",flex:1,
            }}>{t.text}</span>
            <PriorityBadge priority={t.priority}/>
          </div>
        ))}
      </div>
    </div>
  );
}

const navBtn = {
  background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:"8px",width:"36px",height:"36px",color:"#bbb",cursor:"pointer",
  fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",
};

const selectStyle = {
  background:"rgba(255,255,255,0.07)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:"10px",padding:"8px 12px",
  color:"#ccc",fontSize:"13px",cursor:"pointer",
  WebkitAppearance:"none",appearance:"none",
};

/* ─── Main App ─── */
export default function App() {
  const [todos,     setTodos]      = useState([]);
  const [loaded,    setLoaded]     = useState(false);
  const [tab,       setTab]        = useState("tasks");
  const [text,      setText]       = useState("");
  const [priority,  setPriority]   = useState("medium");
  const [category,  setCategory]   = useState("デイリー");
  const [deadline,  setDeadline]   = useState("");
  const [filter,    setFilter]     = useState("all");
  const [filterCat, setFilterCat]  = useState("すべて");
  const [showDone,  setShowDone]   = useState(false);
  const [copyTarget, setCopyTarget] = useState(null); // todo to copy

  useEffect(()=>{ loadTodos().then(d=>{setTodos(d);setLoaded(true);}); },[]);
  useEffect(()=>{ if(loaded) saveTodos(todos); },[todos,loaded]);

  const addTodo = useCallback(()=>{
    if(!text.trim()) return;
    setTodos(prev=>[{
      id:Date.now(),text:text.trim(),
      priority,category,deadline,
      done:false,createdAt:new Date().toISOString(),
    },...prev]);
    setText(""); setDeadline("");
  },[text,priority,category,deadline]);

  const toggleTodo = useCallback((id)=>
    setTodos(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t)),[]);
  const deleteTodo = useCallback((id)=>
    setTodos(prev=>prev.filter(t=>t.id!==id)),[]);

  // Copy a daily todo to a range of dates (sets deadline for each copy)
  const handleCopy = useCallback((sourceTodo, dates) => {
    const copies = dates.map(dateStr => ({
      ...sourceTodo,
      id: Date.now() + Math.random(),
      done: false,
      deadline: dateStr,
      createdAt: new Date().toISOString(),
      copiedFrom: sourceTodo.id,
    }));
    setTodos(prev => [...prev, ...copies]);
  }, []);

  const active = todos.filter(t=>!t.done);
  const counts = {
    all:active.length,
    high:active.filter(t=>t.priority==="high").length,
    medium:active.filter(t=>t.priority==="medium").length,
    low:active.filter(t=>t.priority==="low").length,
  };

  // Separate active and done, apply filters to each
  const applyFilters = (list) => list.filter(t => {
    if(filter!=="all"&&t.priority!==filter) return false;
    if(filterCat!=="すべて"&&t.category!==filterCat) return false;
    return true;
  });
  const sortByPriority = (list) => [...list].sort((a,b)=>
    ({high:0,medium:1,low:2})[a.priority]-({high:0,medium:1,low:2})[b.priority]
  );

  const activeTodos = sortByPriority(applyFilters(todos.filter(t=>!t.done)));
  const doneTodos   = applyFilters(todos.filter(t=>t.done));
  const totalDone   = todos.filter(t=>t.done).length;

  return (
    <div style={{
      minHeight:"100vh",background:"#0c0c10",
      fontFamily:"'Noto Sans JP','Helvetica Neue',sans-serif",
      color:"#e2e2e2",
      paddingTop:"env(safe-area-inset-top,0px)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        body{overscroll-behavior:none;background:#0c0c10;}
        input,select,button{font-family:'Noto Sans JP',sans-serif;-webkit-appearance:none;appearance:none;}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.4);cursor:pointer;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:2px;}
        input::placeholder{color:#3a3a4a;}
      `}</style>

      <div style={{
        maxWidth:"520px",margin:"0 auto",
        padding:"28px 16px 110px",minHeight:"100vh",
      }}>

        {/* Header */}
        <div style={{marginBottom:"24px",display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
          <div>
            <h1 style={{fontFamily:"'DM Mono',monospace",fontSize:"26px",color:"#fff",letterSpacing:"-0.5px"}}>
              my<span style={{color:"#7c6dfa"}}>tasks</span>
            </h1>
            <p style={{color:"#333",fontSize:"12px",marginTop:"3px",fontFamily:"'DM Mono',monospace"}}>
              {new Date().toLocaleDateString("ja-JP",{month:"long",day:"numeric",weekday:"short"})}
            </p>
          </div>
          <span style={{
            fontFamily:"'DM Mono',monospace",fontSize:"13px",
            color:"#7c6dfa",background:"rgba(124,109,250,0.12)",
            padding:"4px 12px",borderRadius:"20px",border:"1px solid rgba(124,109,250,0.25)",
          }}>{counts.all} 件</span>
        </div>

        {/* ─ TASKS TAB ─ */}
        {tab==="tasks"&&(<>
          {/* Add form */}
          <div style={{
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:"16px",padding:"16px",marginBottom:"20px",
          }}>
            <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
              <input
                value={text} onChange={e=>setText(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTodo()}
                placeholder="新しいタスク..."
                style={{
                  flex:1,background:"rgba(255,255,255,0.07)",
                  border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:"10px",padding:"11px 14px",
                  color:"#e2e2e2",fontSize:"15px",
                }}
              />
              <button onClick={addTodo} style={{
                background:"#7c6dfa",border:"none",borderRadius:"10px",
                padding:"11px 20px",color:"#fff",fontWeight:"700",
                fontSize:"14px",cursor:"pointer",flexShrink:0,
              }}>追加</button>
            </div>
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
              <select value={priority} onChange={e=>setPriority(e.target.value)} style={selectStyle}>
                <option value="high">🔴 高</option>
                <option value="medium">🟡 中</option>
                <option value="low">🔵 低</option>
              </select>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={selectStyle}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}
                style={{...selectStyle,color:deadline?"#ccc":"#3a3a4a",minWidth:"120px",flex:1}}
              />
            </div>
          </div>

          {/* Priority filters */}
          <div style={{display:"flex",gap:"5px",marginBottom:"8px",flexWrap:"wrap"}}>
            {[
              {key:"all",   label:`すべて ${counts.all}`},
              {key:"high",  label:`高 ${counts.high}`,  color:"#ff5f5f"},
              {key:"medium",label:`中 ${counts.medium}`,color:"#f5a623"},
              {key:"low",   label:`低 ${counts.low}`,   color:"#4db8ff"},
            ].map(f=>(
              <button key={f.key} onClick={()=>setFilter(f.key)} style={{
                background:filter===f.key?(f.color?`${f.color}20`:"rgba(124,109,250,0.2)"):"rgba(255,255,255,0.04)",
                border:`1px solid ${filter===f.key?(f.color||"#7c6dfa"):"rgba(255,255,255,0.08)"}`,
                borderRadius:"20px",padding:"5px 13px",
                color:filter===f.key?(f.color||"#7c6dfa"):"#555",
                fontSize:"12px",cursor:"pointer",fontWeight:filter===f.key?"600":"400",
                fontFamily:"'DM Mono',monospace",
              }}>{f.label}</button>
            ))}
          </div>

          {/* Category filters */}
          <div style={{display:"flex",gap:"5px",marginBottom:"18px"}}>
            {["すべて",...CATEGORIES].map(c=>(
              <button key={c} onClick={()=>setFilterCat(c)} style={{
                background:filterCat===c?"rgba(255,255,255,0.07)":"transparent",
                border:`1px solid ${filterCat===c?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.06)"}`,
                borderRadius:"20px",padding:"5px 13px",
                color:filterCat===c?"#ccc":"#444",
                fontSize:"12px",cursor:"pointer",
              }}>{c}</button>
            ))}
          </div>

          {/* ── 未完了タスク ── */}
          {activeTodos.length===0&&(
            <div style={{textAlign:"center",color:"#252530",padding:"44px 0",fontSize:"14px"}}>
              {todos.filter(t=>!t.done).length===0?"🎉 すべて完了！":"条件に一致するタスクはありません"}
            </div>
          )}
          {activeTodos.map(t=>(
            <TodoItem key={t.id} todo={t}
              onToggle={toggleTodo} onDelete={deleteTodo}
              onCopyRequest={setCopyTarget}
            />
          ))}

          {/* ── 完了済みタスク（常に下に表示） ── */}
          {totalDone > 0 && (
            <div style={{marginTop:"8px"}}>
              {/* Divider */}
              <div style={{
                display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px",
              }}>
                <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.06)"}}/>
                <button onClick={()=>setShowDone(s=>!s)} style={{
                  background:"none",border:"none",color:"#3a3a4a",
                  fontSize:"12px",cursor:"pointer",display:"flex",
                  alignItems:"center",gap:"5px",padding:"4px 8px",
                  borderRadius:"20px",
                  border:"1px solid rgba(255,255,255,0.06)",
                  fontFamily:"'DM Mono',monospace",
                }}>
                  <span style={{
                    display:"inline-block",fontSize:"8px",
                    transform:showDone?"rotate(90deg)":"rotate(0deg)",
                    transition:"transform 0.2s",
                  }}>▶</span>
                  完了済み {totalDone}件
                </button>
                <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.06)"}}/>
              </div>

              {showDone && doneTodos.map(t=>(
                <TodoItem key={t.id} todo={t}
                  onToggle={toggleTodo} onDelete={deleteTodo}
                  onCopyRequest={setCopyTarget}
                />
              ))}
            </div>
          )}
        </>)}

        {/* ─ CALENDAR TAB ─ */}
        {tab==="calendar"&&<CalendarView todos={todos}/>}
      </div>

      {/* Bottom Navigation */}
      <nav style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:"rgba(10,10,14,0.96)",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        display:"flex",justifyContent:"center",
        paddingBottom:"env(safe-area-inset-bottom,16px)",
        backdropFilter:"blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
        zIndex:100,
      }}>
        {[
          {key:"tasks",    emoji:"✅", label:"タスク"},
          {key:"calendar", emoji:"📅", label:"カレンダー"},
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1,maxWidth:"200px",
            background:"none",border:"none",cursor:"pointer",
            padding:"12px 8px 10px",
            display:"flex",flexDirection:"column",
            alignItems:"center",gap:"3px",
          }}>
            <span style={{fontSize:"22px",lineHeight:1}}>{t.emoji}</span>
            <span style={{
              fontSize:"11px",
              color:tab===t.key?"#7c6dfa":"#333",
              fontWeight:tab===t.key?"600":"400",
              transition:"color 0.15s",
            }}>{t.label}</span>
            {tab===t.key&&(
              <div style={{width:"18px",height:"2px",borderRadius:"1px",background:"#7c6dfa",marginTop:"1px"}}/>
            )}
          </button>
        ))}
      </nav>

      {/* Copy Modal */}
      {copyTarget && (
        <CopyModal
          todo={copyTarget}
          onClose={()=>setCopyTarget(null)}
          onCopy={(todo, dates)=>{
            handleCopy(todo, dates);
          }}
        />
      )}
    </div>
  );
}
