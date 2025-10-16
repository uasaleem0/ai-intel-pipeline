import React from 'react'
import Layout from './Layout.jsx'
import { Box, Card, CardContent, TextField, MenuItem, Select, InputLabel, FormControl, Typography } from '@mui/material'
import { useSearchParams } from 'react-router-dom'

export default function ItemsPage(){
  const [report,setReport]=React.useState(null)
  const [items,setItems]=React.useState([])
  const [sp, setSp]=useSearchParams()
  const [q,setQ]=React.useState(sp.get('q')||'')
  const [src,setSrc]=React.useState(sp.get('source')||'')
  const [pil,setPil]=React.useState(sp.get('pillar')||'')
  React.useEffect(()=>{
    const v='?v='+(Date.now())
    Promise.all([
      fetch('report.json'+v).then(r=>r.json()),
      fetch('items.json'+v).then(r=>r.json()),
    ]).then(([rep,its])=>{ setReport(rep); setItems(its) })
  },[])
  const sources = report?.by_source? Object.keys(report.by_source): []
  const pillars = report?.pillars? Object.keys(report.pillars): []
  function renderRows(){
    let list=items.slice(0)
    if(q){ const qq=q.toLowerCase(); list=list.filter(it=> ((it.title||'')+' '+(it.tldr||'')+' '+(it.why||'')+' '+(it.pillars||[]).join(' ')).toLowerCase().includes(qq)) }
    if(src){ list=list.filter(it=> String(it.source_type||it.source||'').toLowerCase()===src.toLowerCase()) }
    if(pil){ list=list.filter(it=> (it.pillars||[]).includes(pil)) }
    list=list.sort((a,b)=> Number(b.overall||0)-Number(a.overall||0))
    return list.slice(0,200).map(it=>{
      return (
        <tr key={it.item_id}>
          <td>
            <a href={it.url} target="_blank" rel="noreferrer">{it.title}</a>
            <div style={{color:'#9ca3af', fontSize:12, marginTop:4}}>{String(it.source_type||'')} · {new Date(it.date).toLocaleDateString()} · score {Number(it.overall||0).toFixed(3)}</div>
            <div style={{marginTop:6}}>{(it.pillars||[]).map(p=> <span key={p} style={{display:'inline-block',background:'#1f2937',padding:'2px 8px',borderRadius:999,marginRight:6,fontSize:12}}>{p}</span>)}</div>
          </td>
          <td style={{fontSize:14}}>
            {(it.tldr||'')}
            {it.why && <div style={{marginTop:6,color:'#d1d5db'}}><span style={{color:'#9ca3af'}}>Why:</span> {it.why}</div>}
            {it.apply_steps && it.apply_steps.length>0 && (
              <div style={{marginTop:6,color:'#d1d5db'}}><span style={{color:'#9ca3af'}}>Apply:</span><ul style={{marginLeft:18}}>{it.apply_steps.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
            )}
          </td>
          <td style={{fontSize:12}}>
            {(it.verdict||'')}
            {it.confidence!=null && <div>conf {Number(it.confidence).toFixed(2)}</div>}
          </td>
        </tr>
      )
    })
  }
  return (
    <Layout>
      <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937'}}>
        <CardContent sx={{display:'flex', gap:1, flexWrap:'wrap'}}>
          <TextField size="small" placeholder="Search" value={q} onChange={e=>{ setQ(e.target.value); setSp({ q:e.target.value, source:src, pillar:pil })}} sx={{flex:1,minWidth:240}} InputProps={{sx:{bgcolor:'#0b1220', color:'#e5e7eb', borderRadius:1}}} />
          <FormControl size="small"><InputLabel>Source</InputLabel><Select label="Source" value={src} onChange={e=>{ setSrc(e.target.value); setSp({ q, source:e.target.value, pillar:pil })}} sx={{minWidth:140}}>
            <MenuItem value="">All</MenuItem>
            {sources.map(s=><MenuItem key={s} value={s.toLowerCase()}>{s}</MenuItem>)}
          </Select></FormControl>
          <FormControl size="small"><InputLabel>Pillar</InputLabel><Select label="Pillar" value={pil} onChange={e=>{ setPil(e.target.value); setSp({ q, source:src, pillar:e.target.value })}} sx={{minWidth:160}}>
            <MenuItem value="">All</MenuItem>
            {pillars.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select></FormControl>
        </CardContent>
      </Card>
      <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937', mt:2}}>
        <CardContent>
          <table style={{width:'100%'}}>
            <thead><tr><th>Item</th><th>Summary</th><th>Quality</th></tr></thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </CardContent>
      </Card>
    </Layout>
  )
}

