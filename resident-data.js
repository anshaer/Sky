/* Shared resident JSON parsing, recovery, validation, and Separator export. */
(function(root){'use strict';
const SEP='Separator',MAX_ROWS=10000,MAX_TEXT=15*1024*1024;
function object(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
function identify(raw){const m=/"id"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(raw);if(m)try{return JSON.parse(m[1]);}catch{}return '';}
function lineIndex(text){const a=[0];for(let i=0;i<text.length;i++)if(text[i]==='\n')a.push(i+1);return pos=>{let l=0,r=a.length;while(l<r){const m=(l+r)>>1;if(a[m]<=pos)l=m+1;else r=m;}return l;};}
function parse(text){
 if(typeof text!=='string')throw Error('JSON 內容必須是文字。');text=text.replace(/^\uFEFF/,'');if(text.length>MAX_TEXT)throw Error('JSON 請小於15 MB。');
 try{const doc=JSON.parse(text);if(!object(doc))throw Error('JSON 最外層須為物件。');const key=Array.isArray(doc.residents)?'residents':Array.isArray(doc.links)?'links':null;if(!key)return {doc,issues:[],rowMeta:[],recovered:false,total:0};const rows=doc[key].filter(r=>r!==SEP);return {doc:{...doc,[key]:rows},issues:[],rowMeta:rows.map((r,i)=>({record:i+1,id:r?.id||'',raw:JSON.stringify(r,null,2)})),recovered:false,total:rows.length};}
 catch(original){
  const open=/"(residents|links)"\s*:\s*\[/.exec(text);if(!open)throw Error('JSON 語法錯誤：'+original.message);const key=open[1],start=open.index+open[0].length,propertyLine=text.slice(text.lastIndexOf('\n',open.index)+1,open.index),indent=(/^[\t ]*/.exec(propertyLine)||[''])[0].length;
  const closeRx=/^([\t ]*)\][\t ]*,?[\t ]*\r?$/gm;closeRx.lastIndex=start;let close=null,m;while((m=closeRx.exec(text))){if(m[1].length<=indent){close={start:m.index,end:m.index+m[0].indexOf(']')+1};break;}}
  const end=close?close.start:text.length,markerRx=/^[\t ]*"Separator"[\t ]*,?[\t ]*\r?$/gm,markers=[];markerRx.lastIndex=start;while((m=markerRx.exec(text))&&m.index<end)markers.push({start:m.index,end:markerRx.lastIndex});
  if(!markers.length)throw Error('JSON 語法錯誤，找不到獨立一行的 "Separator"，無法逐筆恢復：'+original.message);
  const issues=[],rows=[],rowMeta=[],lineAt=lineIndex(text);let doc;
  try{if(!close)throw Error('缺少居民陣列結尾');doc=JSON.parse(text.slice(0,start-1)+'[]'+text.slice(close.end));if(!object(doc))throw Error('最外層不是物件');}
  catch(e){doc={version:2};issues.push({kind:'warning',id:'檔案設定',reason:'檔頭或結尾設定損壞，採用預設設定；請檢查原始檔。',raw:text.slice(0,start)+(!close?'':text.slice(close.end))});}
  let from=start,record=0;const chunks=[];for(const marker of markers){chunks.push({start:from,end:marker.start,bounded:true});from=marker.end;}chunks.push({start:from,end,bounded:!!close});
  for(const chunk of chunks){let raw=text.slice(chunk.start,chunk.end).trim();raw=raw.replace(/^,\s*/,'').replace(/,\s*$/,'').trim();if(!raw)continue;record++;const meta={record,id:identify(raw),line:lineAt(chunk.start+(text.slice(chunk.start,chunk.end).search(/\S/)>>>0)),raw};
   if(!chunk.bounded){issues.push({...meta,kind:'skip',reason:'缺少最後的分隔標記或陣列結尾，無法確認這筆資料是否完整。'});continue;}
   try{const row=JSON.parse(raw);if(!object(row))throw Error('居民資料須為物件');rows.push(row);rowMeta.push(meta);}catch(e){issues.push({...meta,kind:'skip',reason:'JSON 語法錯誤：'+e.message});}
  }
  return {doc:{...doc,[key]:rows},issues,rowMeta,recovered:true,total:record};
 }
}
function floating(doc,issues){const f=object(doc.floating)?doc.floating:{},fixed=f.maxCount??doc.maxCount;function number(value,fallback,min,max,label){if(value===undefined)return fallback;const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;if(!Number.isFinite(n)){issues.push({kind:'warning',id:'floating',reason:label+' 無效，改用 '+fallback});return fallback;}const v=Math.min(max,Math.max(min,Math.round(n)));if(v!==n||typeof value!=='number')issues.push({kind:'warning',id:'floating',reason:label+' 已調整為 '+v});return v;}
 return {...f,refreshSeconds:number(f.refreshSeconds,60,5,86400,'輪替秒數'),maxCountPortrait:number(f.maxCountPortrait??fixed,20,0,200,'縱屏人數'),maxCountLandscape:number(f.maxCountLandscape??fixed,20,0,200,'橫屏人數')};}
function validateGLBURL(value){if(value===undefined||value==='')return '';if(typeof value!=='string'||value.length>4096)throw Error('GLB 連結須為文字，最多4096字');const text=value.trim();if(!text)return '';const u=new URL(text,'https://example.invalid/');if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('GLB 連結須為 http／https 或網站相對路徑');return text;}
function normalize(parsed,refs={},kind){const doc=parsed.doc;if(!object(doc)||doc.version!==2)throw Error('居民／工具箱 JSON version 必須為2。');kind=kind||(Array.isArray(doc.residents)?'residents':'links');const source=doc[kind];if(!Array.isArray(source))throw Error(kind+' 須為陣列。');const issues=[...(parsed.issues||[])],rows=[],seen=new Set();
 for(let i=0;i<Math.min(source.length,MAX_ROWS);i++){const r=source[i],meta={...(parsed.rowMeta?.[i]||{}),record:parsed.rowMeta?.[i]?.record??i+1,id:r?.id||parsed.rowMeta?.[i]?.id||'',raw:parsed.rowMeta?.[i]?.raw??JSON.stringify(r,null,2)},warn=reason=>issues.push({...meta,kind:'warning',reason});
  let reason='';if(!object(r))reason='資料須為物件';else if(typeof r.id!=='string'||!r.id.trim())reason='缺少有效 id';else if(seen.has(r.id))reason='id 重複，保留前一筆';else if(typeof r.name!=='string'||!r.name.trim()||r.name.length>120)reason='名字須為非空白文字，最多120字';else if(kind==='residents'&&(typeof r.bodyId!=='string'||!r.bodyId.trim()||refs.bodyExists&&!refs.bodyExists(r.bodyId)))reason='住址不存在：'+r.bodyId;
  if(reason){issues.push({...meta,kind:'skip',reason});continue;}seen.add(r.id);const row={...r};row.modelId=typeof r.modelId==='string'&&r.modelId?r.modelId:'ship-01';if(refs.modelExists&&!refs.modelExists(row.modelId)){warn('模型 '+row.modelId+' 不存在，改用 ship-01');row.modelId='ship-01';}
  row.url=r.url??'';if(row.url){try{if(typeof row.url!=='string'||row.url.length>2048)throw Error();const u=new URL(row.url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{warn('網址無效，已停用連結');row.url='';}}else row.url='';
  try{row.glbUrl=validateGLBURL(r.glbUrl);}catch(err){warn(err.message+'，已停用 GLB');row.glbUrl='';}
  if(r.description!==undefined&&typeof r.description!=='string'){warn('介紹不是文字，改為空白');row.description='';}else row.description=r.description??'';
  if(r.linkText!==undefined&&typeof r.linkText!=='string'){warn('連結文字格式錯誤，改用預設');row.linkText='';}else row.linkText=r.linkText??'';if(row.linkText.length>200){warn('連結文字超過200字，已截短');row.linkText=row.linkText.slice(0,200);}
  if(kind==='residents'&&r.travel?.enabled){const t=r.travel;if(typeof t.destinationId!=='string'||t.destinationId===row.bodyId||refs.bodyExists&&!refs.bodyExists(t.destinationId)||!Number.isFinite(t.durationSeconds)||t.durationSeconds<10||t.durationSeconds>86400){warn('往返設定無效，暫時改為住址定居');row.travel={...t,enabled:false};}}
  rows.push(row);
 }
 if(source.length>MAX_ROWS)issues.push({kind:'skip',id:'名單上限',reason:'超過10000筆，後續 '+(source.length-MAX_ROWS)+' 筆未載入。'});
 const total=parsed.total??source.length;return {doc:{...doc,[kind]:rows,floating:floating(doc,issues)},issues,loaded:rows.length,total,skipped:Math.max(0,total-rows.length),recovered:!!parsed.recovered};
}
function serializeResidents(doc){if(!object(doc)||!Array.isArray(doc.residents))throw Error('缺少居民陣列');const meta={...doc};delete meta.residents;meta.residents=[];const items=[JSON.stringify(SEP)];for(const row of doc.residents){if(row===SEP)continue;items.push(JSON.stringify(row,null,2));items.push(JSON.stringify(SEP));}const array='[\n'+items.map(text=>text.split('\n').map(line=>'    '+line).join('\n')).join(',\n')+'\n  ]';return JSON.stringify(meta,null,2).replace(/^  "residents": \[\]$/m,'  "residents": '+array)+'\n';}
function issueText(issue){return (issue.id||'第'+(issue.record||'?')+'筆')+(issue.line?'（約第'+issue.line+'行）':'')+'：'+issue.reason;}
root.ResidentData={parse,normalize,serializeResidents,issueText,validateGLBURL,SEP};
})(globalThis);
