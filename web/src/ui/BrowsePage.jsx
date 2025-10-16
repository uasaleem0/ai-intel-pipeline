import React from 'react'
import Layout from './Layout.jsx'
import { Card, CardContent, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function BrowsePage(){
  const [report,setReport]=React.useState(null)
  const nav=useNavigate()
  React.useEffect(()=>{ fetch('report.json?v='+(Date.now())).then(r=>r.json()).then(setReport) },[])
  const sources = report?.by_source||{}
  const pillars = report?.pillars||{}
  return (
    <Layout>
      <Card sx={{bgcolor:'#111827', border:'1px solid #1f2937'}}>
        <CardContent>
          <Typography sx={{fontWeight:600, mb:1}}>By Source</Typography>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {Object.entries(sources).sort((a,b)=>b[1]-a[1]).map(([k,v])=> (
              <Button key={k} variant="outlined" onClick={()=>nav('/items?source='+encodeURIComponent(k))} sx={{borderColor:'#374151', color:'#cbd5e1'}}>{k} ({v})</Button>
            ))}
          </div>
          <Typography sx={{fontWeight:600, mb:1, mt:2}}>By Pillar</Typography>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {Object.entries(pillars).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=> (
              <Button key={k} variant="outlined" onClick={()=>nav('/items?pillar='+encodeURIComponent(k))} sx={{borderColor:'#374151', color:'#cbd5e1'}}>{k} ({v})</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </Layout>
  )
}

