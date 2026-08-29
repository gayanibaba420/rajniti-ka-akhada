"use client";

export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <div className="container-main grid min-h-[55vh] place-items-center py-12 text-center"><div><p className="text-5xl">⚠️</p><h1 className="mt-4 text-2xl font-black">कुछ तकनीकी समस्या हुई</h1><p className="muted mt-2">हमारी टीम को इसकी जानकारी मिल गई है। कृपया फिर प्रयास करें।</p><button onClick={reset} className="btn btn-primary mt-5">फिर कोशिश करें</button></div></div>
}
