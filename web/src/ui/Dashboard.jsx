import React from 'react'
import Layout from './Layout.jsx'
import { Box, Grid, Card, CardContent, Typography, Button, TextField } from '@mui/material'

function useData(){
  const [report,setReport]=React.useState(null)
  const [items,setItems]=React.useState([])
  const [history,setHistory]=React.useState([])
  React.useEffect(()=>{
    const v='?v='+(Date.now())
    Promise.all([
      fetch('report.json'+v).then(r=>r.json()),
      fetch('items.json'+v).then(r=>r.json()),
      fetch('history.json'+v).then(r=>r.json()).catch(()=>[]),
    ]).then(([rep,its,h])=>{ setReport(rep); setItems(its); setHistory(h) })
  },[])
  return { report, items, history }
}

function Health({report,history}){
  const c=report?.counts||{}
  const items=c.items||0
  const evPass=c.evidence_pass||0
  const evTotal = c.evidence!=null? c.evidence : ( (c.evidence_pass||0)+(c.evidence_fail||0) )
  const passRate = evTotal? ((evPass/evTotal)*100).toFixed(1)+'%' : '—'
  const last = history && history.length? history[history.length-1] : null
  const runs = history? history.length: 0
  return (
    <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937'}}>
      <CardContent>
        <Typography sx={{fontWeight:600, mb:1}}>System Health</Typography>
        <Typography sx={{mb:0.5}}>{'Last run: '}{last? (new Date(last.ts).toLocaleString()) : '—'}</Typography>
        <Typography sx={{mb:0.5}}>{'Items: '+items}</Typography>
        <Typography sx={{mb:0.5}}>{'Pass rate: '+passRate}</Typography>
        <Typography sx={{mb:0.5}}>{'Runs: '+runs}</Typography>
      </CardContent>
    </Card>
  )
}

function AQ({items}){
  const list=Array.isArray(items)? items: []
  let unreviewed=0, needs=0, ready=0
  for(const it of list){
    const v=(it.verdict||'').toLowerCase()
    const conf=Number(it.confidence)
    if(!v) unreviewed++
    if(v==='fail' || (!Number.isNaN(conf) && conf<0.5)) needs++
    const overall=Number(it.overall||0), cred=Number(it.credibility||0), act=Number(it.actionability||0)
    if(overall>=0.6 && cred>=0.7 && act>=0.6 && (v==='pass' || (!Number.isNaN(conf) && conf>=0.6))) ready++
  }
  return (
    <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937'}}>
      <CardContent>
        <Typography sx={{fontWeight:600, mb:1}}>Action Queue</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Card sx={{bgcolor:'#0f172a', border:'1px solid #1f2937'}}><CardContent><Typography>Unreviewed</Typography><Typography sx={{fontSize:24,fontWeight:700}}>{unreviewed}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={4}><Card sx={{bgcolor:'#0f172a', border:'1px solid #1f2937'}}><CardContent><Typography>Needs Evidence Review</Typography><Typography sx={{fontSize:24,fontWeight:700}}>{needs}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={4}><Card sx={{bgcolor:'#0f172a', border:'1px solid #1f2937'}}><CardContent><Typography>Ready to Apply</Typography><Typography sx={{fontSize:24,fontWeight:700}}>{ready}</Typography></CardContent></Card></Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

function Ask(){
  const [q,setQ]=React.useState('')
  const [out,setOut]=React.useState('')
  return (
    <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937', outline:'1px solid rgba(99,102,241,.3)'}}>
      <CardContent>
        <Typography sx={{fontWeight:600, mb:1}}>Ask AI (Using Your Data)</Typography>
        <Typography sx={{color:'#d1d5db', mb:1, fontSize:14}}>Query your indexed intel — answers will cite sources (RAG).</Typography>
        <Box sx={{display:'flex', gap:1, flexWrap:'wrap'}}>
          <TextField value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask a question about your indexed AI intel..." size="small" sx={{flex:1, minWidth:240}} InputProps={{sx:{bgcolor:'#0b1220', color:'#e5e7eb', borderRadius:1}}} />
          <Button variant="contained" onClick={()=>setOut('RAG not enabled yet. Build embeddings and wire client.')} sx={{bgcolor:'#2563eb','&:hover':{bgcolor:'#1e4fd6'}}}>Ask</Button>
          <Button variant="outlined" sx={{borderColor:'#374151', color:'#cbd5e1'}}>Settings</Button>
        </Box>
        <Typography sx={{mt:1}}>{out}</Typography>
      </CardContent>
    </Card>
  )
}

function TopItems({report}){
  const top = report?.top_items||[]
  return (
    <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937'}}>
      <CardContent>
        <Typography sx={{fontWeight:600, mb:1}}>Top Items</Typography>
        <Grid container spacing={2}>
          {top.map((t)=> (
            <Grid item xs={12} md={4} key={t.item_id}>
              <Card sx={{bgcolor:'#0f172a', border:'1px solid #1f2937'}}>
                <CardContent>
                  <Typography sx={{fontWeight:600, mb:0.5}}>{t.title}</Typography>
                  <Typography sx={{color:'#9ca3af', mb:1}}>score {Number(t.overall||0).toFixed(3)}</Typography>
                  <a href={t.url} target="_blank" rel="noreferrer">Open</a>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default function Dashboard(){
  const { report, items, history } = useData()
  return (
    <Layout>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}><Ask/></Grid>
        <Grid item xs={12} md={4}><Health report={report} history={history}/></Grid>
        <Grid item xs={12}><AQ items={items}/></Grid>
        <Grid item xs={12}><TopItems report={report}/></Grid>
        <Grid item xs={12}>
          <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937'}}>
            <CardContent>
              <Button id="analyticsToggle" variant="outlined" sx={{borderColor:'#374151', color:'#cbd5e1'}}>Analytics</Button>
              <Box id="analyticsPanel" sx={{display:'none', mt:1, color:'#9ca3af'}}>Charts are optional; we’ll enable them later.</Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  )
}

