import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Divider, Chip } from '@mui/material'

function useData(){
  const [report,setReport]=React.useState(null)
  const [items,setItems]=React.useState([])
  const [history,setHistory]=React.useState([])
  const [build,setBuild]=React.useState(null)
  React.useEffect(()=>{
    const v = ''
    Promise.all([
      fetch('build.json'+v).then(r=>r.ok?r.json():{}).catch(()=>({})),
      fetch('report.json'+v).then(r=>r.json()),
      fetch('items.json'+v).then(r=>r.json()),
      fetch('history.json'+v).then(r=>r.json()).catch(()=>[]),
    ]).then(([b,rep,its,h])=>{ setBuild(b); setReport(rep); setItems(its); setHistory(h)})
  },[])
  return { report, items, history, build }
}

export default function Layout({children}){
  const { report, build } = useData()
  const [open,setOpen]=React.useState(true)
  const loc=useLocation(); const nav=useNavigate()
  const pillars = report?.pillars||{}
  const sources = report?.by_source||{}
  return (
    <Box sx={{display:'flex', minHeight:'100vh', bgcolor:'#0b0f19', color:'#e5e7eb'}}>
      <Drawer variant="persistent" open={open} sx={{
        '& .MuiDrawer-paper':{ width:260, bgcolor:'#0d1220', color:'#e5e7eb', borderRight:'1px solid #1f2937' }
      }}>
        <Box sx={{p:2, position:'relative'}}>
          <Typography variant="h6">AI Intel</Typography>
          <IconButton aria-label="Collapse" onClick={()=>setOpen(false)} size="small" sx={{position:'absolute', right:8, top:8, color:'#9ca3af', '&:hover':{color:'#e5e7eb', border:'1px solid #374151'}}}>»»</IconButton>
        </Box>
        <List>
          <ListItem disablePadding><ListItemButton selected={loc.pathname==='/' } onClick={()=>nav('/') }><ListItemText primary="Overview"/></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton selected={loc.pathname==='/items' } onClick={()=>nav('/items') }><ListItemText primary="Items"/></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton selected={loc.pathname==='/browse' } onClick={()=>nav('/browse') }><ListItemText primary="Browse"/></ListItemButton></ListItem>
        </List>
        <Divider sx={{borderColor:'#1f2937'}}/>
        <Box sx={{p:2, pt:1}}>
          <Typography variant="caption" sx={{color:'#9ca3af'}}>Pillars</Typography>
          <List>
          {Object.entries(pillars).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=> (
            <ListItem key={k} disablePadding>
              <ListItemButton onClick={()=>nav('/items?pillar='+encodeURIComponent(k))}><ListItemText primary={k} secondary={`(${v})`} secondaryTypographyProps={{sx:{color:'#9ca3af'}}}/></ListItemButton>
            </ListItem>
          ))}
          </List>
          <Typography variant="caption" sx={{color:'#9ca3af'}}>Sources</Typography>
          <List>
          {Object.entries(sources).sort((a,b)=>b[1]-a[1]).map(([k,v])=> (
            <ListItem key={k} disablePadding>
              <ListItemButton onClick={()=>nav('/items?source='+encodeURIComponent(k))}><ListItemText primary={k} secondary={`(${v})`} secondaryTypographyProps={{sx:{color:'#9ca3af'}}}/></ListItemButton>
            </ListItem>
          ))}
          </List>
        </Box>
      </Drawer>
      <Box sx={{flex:1, display:'flex', flexDirection:'column'}}>
        <AppBar position="sticky" sx={{bgcolor:'rgba(11,15,25,.7)', borderBottom:'1px solid #1f2937'}} elevation={0}>
          <Toolbar>
            {!open && (<IconButton aria-label="Open" onClick={()=>setOpen(true)} sx={{border:'1px solid #374151', borderRadius:'6px', bgcolor:'#111827', mr:1, color:'#e5e7eb'}}>☰</IconButton>)}
            <Typography sx={{fontWeight:800, mr:'auto'}}>AI Intel Dashboard</Typography>
            {build?.sha && (<Chip size="small" label={`Build ${String(build.sha).slice(0,7)}`} sx={{color:'#9ca3af', borderColor:'#374151'}} variant="outlined" />)}
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{p:2}}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

