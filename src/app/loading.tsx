export default function Loading(){
  return <div className="container-main min-h-[55vh] py-10" aria-label="सामग्री लोड हो रही है"><div className="skeleton h-9 w-64 rounded"/><div className="mt-7 grid gap-6 md:grid-cols-3">{[1,2,3,4,5,6].map(i=><div key={i}><div className="skeleton aspect-[16/10] rounded-xl"/><div className="skeleton mt-3 h-5 rounded"/><div className="skeleton mt-2 h-5 w-3/4 rounded"/></div>)}</div></div>
}
