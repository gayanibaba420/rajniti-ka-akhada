"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, BellRing, FilePenLine, ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquare, Plus, Search, Settings, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { articles, categories } from "@/lib/data";

const sections = [
  ["dashboard", "डैशबोर्ड", LayoutDashboard], ["posts", "पोस्ट", FilePenLine], ["media", "मीडिया", ImageIcon], ["breaking", "ब्रेकिंग", BellRing],
  ["authors", "लेखक", Users], ["comments", "टिप्पणियां", MessageSquare], ["ads", "विज्ञापन", BarChart3], ["seo", "SEO", Search], ["settings", "सेटिंग्स", Settings],
] as const;

export default function AdminPage() {
  const [active, setActive] = useState<string>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [postStatus, setPostStatus] = useState<Record<string,string>>({});
  function flash(text:string){setNotice(text);setTimeout(()=>setNotice(""),2200)}
  const content = useMemo(() => {
    if (editing) return <PostEditor close={()=>setEditing(false)} save={()=>{setEditing(false);flash("ड्राफ्ट सुरक्षित किया गया")}}/>;
    switch(active){
      case "posts": return <Posts edit={()=>setEditing(true)} statuses={postStatus} update={(slug,status)=>setPostStatus({...postStatus,[slug]:status})}/>;
      case "media": return <MediaManager flash={flash}/>;
      case "breaking": return <SimpleManager title="ब्रेकिंग न्यूज़" description="टिकर में दिखने वाली खबरों का क्रम और स्थिति बदलें।" items={articles.filter(a=>a.breaking).map(a=>a.title)} flash={flash}/>;
      case "authors": return <SimpleManager title="लेखक और भूमिकाएं" description="Admin, Editor, Reporter और Moderator अनुमतियां।" items={["साक्षी दहिया — संपादक","अमित मलिक — रिपोर्टर","न्यूज़ डेस्क — एडमिन"]} flash={flash}/>;
      case "comments": return <SimpleManager title="टिप्पणी मॉडरेशन" description="समीक्षा कतार: स्पैम या अपमानजनक सामग्री प्रकाशित न करें।" items={["बहुत उपयोगी और संतुलित जानकारी।","स्थानीय खबरों के लिए धन्यवाद।"]} flash={flash}/>;
      case "ads": return <SettingsPanel title="विज्ञापन स्लॉट" fields={["Header leaderboard ID","Article inline ID","Sidebar rectangle ID"]} flash={flash}/>;
      case "seo": return <SettingsPanel title="SEO नियंत्रण" fields={["साइट शीर्षक","मेटा विवरण","Canonical site URL","Google News publication"]} flash={flash}/>;
      case "settings": return <SettingsPanel title="पोर्टल सेटिंग्स" fields={["संपादकीय ईमेल","WhatsApp नंबर","Facebook URL","YouTube URL"]} flash={flash}/>;
      default: return <Dashboard openPosts={()=>setActive("posts")} create={()=>setEditing(true)}/>;
    }
  },[active,editing,postStatus]);
  return <div className="admin-grid bg-[var(--background)]">
    <aside className={`${mobileMenu?"fixed inset-y-0 left-0 z-50 flex":"hidden"} w-[235px] flex-col bg-[#17191c] p-4 text-white md:flex`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-5"><Link href="/" className="font-black">राजनीति का <span className="text-[#ef4050]">अखाड़ा</span><span className="block text-xs font-medium text-neutral-400">संपादकीय CMS</span></Link><button className="md:hidden" onClick={()=>setMobileMenu(false)} aria-label="मेन्यू बंद करें"><X/></button></div>
      <nav className="mt-5 grid gap-1">{sections.map(([id,label,Icon])=><button onClick={()=>{setActive(id);setEditing(false);setMobileMenu(false)}} key={id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${active===id&&!editing?"bg-[#a71d2a]":"hover:bg-white/10"}`}><Icon size={18}/>{label}</button>)}</nav>
      <div className="mt-auto rounded-lg bg-white/5 p-3 text-xs text-neutral-400"><ShieldCheck className="mb-2 text-green-400" size={20}/>डेमो मोड • उत्पादन में SSO और सर्वर डेटाबेस जोड़ें।</div>
    </aside>
    <main className="min-w-0">
      <header className="surface flex h-16 items-center justify-between border-x-0 border-t-0 px-4 sm:px-7"><div className="flex items-center gap-3"><button onClick={()=>setMobileMenu(true)} className="btn btn-ghost !p-2 md:hidden"><Menu/></button><div><strong>नमस्ते, संपादक</strong><span className="muted ml-2 hidden text-xs sm:inline">29 अगस्त 2026</span></div></div><div className="flex items-center gap-2"><button onClick={()=>flash("कोई नई सूचना नहीं")} className="btn btn-ghost !p-2"><BellRing size={18}/></button><Link href="/" className="btn btn-ghost text-sm"><LogOut size={16}/> साइट देखें</Link></div></header>
      <div className="p-4 sm:p-7">{notice&&<div role="status" className="fixed right-5 top-5 z-[80] rounded-lg bg-green-700 px-4 py-3 font-bold text-white shadow-xl">{notice}</div>}{content}</div>
    </main>
  </div>;
}

function Dashboard({openPosts,create}:{openPosts:()=>void;create:()=>void}){
  return <><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">न्यूज़रूम डैशबोर्ड</h1><p className="muted mt-1">आज की प्रकाशन गतिविधि और प्रदर्शन</p></div><button onClick={create} className="btn btn-primary"><Plus size={18}/> नई पोस्ट</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["कुल पोस्ट","1,248","+12 आज"],["मासिक पाठक","8.4 लाख","+18.2%"],["समीक्षा में","07","कार्रवाई जरूरी"],["विज्ञापन आय","₹1.84 लाख","+9.1%"]].map(([a,b,c])=><div className="surface rounded-xl p-5" key={a}><p className="muted text-sm">{a}</p><p className="mt-2 text-3xl font-black">{b}</p><p className="mt-2 text-xs text-green-600">{c}</p></div>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]"><div className="surface rounded-xl p-5"><div className="flex justify-between"><h2 className="font-black">हाल की पोस्ट</h2><button onClick={openPosts} className="brand text-sm font-bold">सभी देखें</button></div><div className="mt-4 grid gap-1">{articles.slice(0,5).map(a=><div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-3 last:border-0" style={{borderColor:"var(--line)"}} key={a.slug}><div><p className="line-clamp-1 font-bold">{a.title}</p><span className="muted text-xs">{a.author} • प्रकाशित</span></div><span className="text-xs font-bold text-green-600">LIVE</span></div>)}</div></div><div className="surface rounded-xl p-5"><h2 className="font-black">रीयल-टाइम ट्रैफ़िक</h2><p className="mt-6 text-center text-5xl font-black brand">2,841</p><p className="muted text-center text-xs">अभी सक्रिय पाठक</p><div className="mt-6 flex h-24 items-end gap-2">{[40,70,55,85,60,95,74,88].map((h,i)=><div className="flex-1 rounded-t bg-[var(--brand)] opacity-80" style={{height:`${h}%`}} key={i}/>)}</div></div></div></>;
}

function Posts({edit,statuses,update}:{edit:()=>void;statuses:Record<string,string>;update:(s:string,v:string)=>void}){
 return <div><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-black">सभी पोस्ट</h1><p className="muted">लेख खोजें, संपादित करें और स्थिति बदलें।</p></div><button onClick={edit} className="btn btn-primary"><Plus size={18}/> नई पोस्ट</button></div><div className="surface mt-6 overflow-x-auto rounded-xl"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-black/5 dark:bg-white/5"><tr>{["शीर्षक","श्रेणी","लेखक","स्थिति","व्यू","कार्रवाई"].map(h=><th className="p-4" key={h}>{h}</th>)}</tr></thead><tbody>{articles.slice(0,9).map(a=><tr className="border-t" style={{borderColor:"var(--line)"}} key={a.slug}><td className="max-w-sm p-4 font-bold">{a.title}</td><td className="p-4">{categories.find(c=>c.slug===a.category)?.name}</td><td className="p-4">{a.author}</td><td className="p-4"><select value={statuses[a.slug]??"प्रकाशित"} onChange={e=>update(a.slug,e.target.value)} className="input !w-auto !py-1"><option>प्रकाशित</option><option>ड्राफ्ट</option><option>समीक्षा</option></select></td><td className="p-4">{a.views}</td><td className="p-4"><button onClick={edit} className="brand font-bold">संपादित करें</button></td></tr>)}</tbody></table></div></div>
}

function PostEditor({close,save}:{close:()=>void;save:()=>void}){
 const [title,setTitle]=useState("हिसार के विकास पर विशेष रिपोर्ट"); const [error,setError]=useState("");
 function submit(e:React.FormEvent){e.preventDefault();if(title.trim().length<10){setError("शीर्षक कम से कम 10 अक्षर का होना चाहिए");return}save()}
 return <form onSubmit={submit}><div className="flex flex-wrap items-center justify-between gap-3"><div><button type="button" onClick={close} className="muted text-sm">← पोस्ट पर लौटें</button><h1 className="text-2xl font-black">नई पोस्ट बनाएं</h1></div><div className="flex gap-2"><button type="button" onClick={close} className="btn btn-ghost">रद्द करें</button><button className="btn btn-primary">ड्राफ्ट सुरक्षित करें</button></div></div><div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]"><div className="surface grid gap-5 rounded-xl p-5"><label className="font-bold">शीर्षक<input value={title} onChange={e=>setTitle(e.target.value)} className="input mt-2" maxLength={160}/>{error&&<span className="mt-1 block text-xs text-red-600">{error}</span>}</label><label className="font-bold">सारांश<textarea className="input mt-2 min-h-24" defaultValue="इस खबर का संक्षिप्त और तथ्यपरक सार यहां लिखें।" maxLength={280}/></label><label className="font-bold">मुख्य सामग्री<textarea className="input mt-2 min-h-72" defaultValue={"भूमिका\n\nविस्तृत जानकारी और सत्यापित तथ्य यहां लिखें।\n\nनिष्कर्ष"} /></label><label className="font-bold">हाइलाइट बॉक्स<textarea className="input mt-2 min-h-20" placeholder="पाठक के लिए खबर का मुख्य सार" /></label></div><div className="grid content-start gap-5"><div className="surface grid gap-4 rounded-xl p-5"><h2 className="font-black">प्रकाशन</h2><label className="text-sm font-bold">स्थिति<select className="input mt-1"><option>ड्राफ्ट</option><option>समीक्षा के लिए</option><option>प्रकाशित</option></select></label><label className="text-sm font-bold">प्रकाशन समय<input type="datetime-local" className="input mt-1"/></label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox"/> ब्रेकिंग न्यूज़</label></div><div className="surface grid gap-4 rounded-xl p-5"><h2 className="font-black">वर्गीकरण और SEO</h2><label className="text-sm font-bold">श्रेणी<select className="input mt-1">{categories.map(c=><option key={c.slug}>{c.name}</option>)}</select></label><label className="text-sm font-bold">Slug<input className="input mt-1" defaultValue="hisar-vikas-special-report" pattern="[a-z0-9-]+"/></label><label className="text-sm font-bold">Meta विवरण<textarea className="input mt-1" maxLength={160}/></label><label className="text-sm font-bold">टैग<input className="input mt-1" placeholder="हिसार, विकास, स्थानीय"/></label></div></div></div></form>
}

function MediaManager({flash}:{flash:(s:string)=>void}){
 const [selected,setSelected]=useState<string[]>([]);
 const files=["/news-assembly.svg","/news-city.svg","/news-farm.svg","/news-sports.svg"];
 return <div><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-black">मीडिया लाइब्रेरी</h1><p className="muted">चित्र चुनें, खोजें और विवरण प्रबंधित करें।</p></div><label className="btn btn-primary cursor-pointer"><Plus/> अपलोड<input onChange={()=>flash("डेमो अपलोड तैयार — उत्पादन में ऑब्जेक्ट स्टोरेज जोड़ें")} type="file" accept="image/*" className="hidden"/></label></div><div className="surface mt-6 flex gap-3 rounded-xl p-3"><Search className="muted"/><input className="w-full bg-transparent outline-none" placeholder="फ़ाइल खोजें..."/></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">{files.concat(files).map((file,i)=><button onClick={()=>setSelected(selected.includes(`${file}${i}`)?selected.filter(x=>x!==`${file}${i}`):[...selected,`${file}${i}`])} className={`surface overflow-hidden rounded-xl text-left ${selected.includes(`${file}${i}`)?"ring-4 ring-[var(--brand)]":""}`} key={`${file}${i}`}><div className="relative aspect-square"><Image fill src={file} alt="मीडिया लाइब्रेरी थंबनेल" className="object-cover"/></div><p className="truncate p-3 text-xs font-bold">{file.slice(1)}</p></button>)}</div>{selected.length>0&&<div className="fixed bottom-5 right-5 flex items-center gap-3 rounded-xl bg-[#17191c] p-4 text-white shadow-2xl"><span>{selected.length} चयनित</span><button onClick={()=>{setSelected([]);flash("चयन हटाया गया")}} aria-label="हटाएं"><Trash2 className="text-red-400"/></button></div>}</div>
}

function SimpleManager({title,description,items,flash}:{title:string;description:string;items:string[];flash:(s:string)=>void}){
 const [enabled,setEnabled]=useState(items.map(()=>true)); return <div><h1 className="text-2xl font-black">{title}</h1><p className="muted mt-1">{description}</p><div className="surface mt-6 rounded-xl p-5">{items.map((item,i)=><div className="flex items-center justify-between gap-4 border-b py-4 last:border-0" style={{borderColor:"var(--line)"}} key={item}><strong>{item}</strong><button onClick={()=>{const n=[...enabled];n[i]=!n[i];setEnabled(n);flash("स्थिति अपडेट हुई")}} className={`btn ${enabled[i]?"btn-primary":"btn-ghost"} text-xs`}>{enabled[i]?"सक्रिय":"निष्क्रिय"}</button></div>)}</div></div>
}

function SettingsPanel({title,fields,flash}:{title:string;fields:string[];flash:(s:string)=>void}){
 return <div><h1 className="text-2xl font-black">{title}</h1><form onSubmit={e=>{e.preventDefault();flash("सेटिंग्स सुरक्षित की गईं")}} className="surface mt-6 max-w-2xl rounded-xl p-5"><div className="grid gap-5">{fields.map((field)=><label className="text-sm font-bold" key={field}>{field}<input className="input mt-2" defaultValue={field.includes("URL")?"https://example.com":""}/></label>)}</div><button className="btn btn-primary mt-6">बदलाव सुरक्षित करें</button></form></div>
}
