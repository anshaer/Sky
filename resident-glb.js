(function(root){'use strict';
// Optional, focused-resident GLB detail. Stable wrapper keeps camera and orbit references intact.
const entries=new Map();let libraries=null,busy=false,decoder=null;
function resolveURL(value){if(typeof value!=='string'||!value.trim())return '';const u=new URL(value.trim(),document.baseURI);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.href.length>4096)throw Error('GLB 網址須為公開 http／https 網址或網站相對路徑');return u.href;}
function script(url){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=url;const timer=setTimeout(()=>{el.remove();reject(Error('GLB 載入元件下載逾時'));},20000);el.onload=()=>{clearTimeout(timer);resolve();};el.onerror=()=>{clearTimeout(timer);el.remove();reject(Error('GLB 載入元件下載失敗'));};document.head.appendChild(el);});}
function loaders(){if(!libraries)libraries=(async()=>{if(!THREE.GLTFLoader)await script('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');if(!THREE.DRACOLoader)await script('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js');})().catch(error=>{libraries=null;throw error;});return libraries;}
function disposeModel(object){if(!object)return;const geometries=new Set(),materials=new Set(),textures=new Set();object.traverse(m=>{if(m.geometry)geometries.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:m.material?[m.material]:[]){materials.add(mat);for(const v of Object.values(mat))if(v?.isTexture)textures.add(v);}if(m.isSkinnedMesh)m.skeleton?.dispose?.();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();const images=new Set();for(const t of textures){if(t.image)images.add(t.image);t.dispose();}for(const image of images)image.close?.();}
function status(e,state,message=''){e.state=state;e.root.userData.glbState=state;e.root.userData.glbError=message;}
function attach(base,row){let url;try{url=resolveURL(row?.glbUrl);}catch(err){base.userData.glbState='error';base.userData.glbError=err.message;return base;}if(!url)return base;
 const wrapper=new THREE.Group();wrapper.add(base);const box=new THREE.Box3().setFromObject(base),radius=Math.max(.01,box.getSize(new THREE.Vector3()).length()/2);const e={root:wrapper,base,url,radius,center:box.getCenter(new THREE.Vector3()),row,detail:null,mixer:null,state:'idle',wanted:false,near:false,released:false,lastUsed:0,abort:null};entries.set(wrapper,e);status(e,'idle');return wrapper;
}
function belongs(object,ancestor){for(let p=object;p;p=p.parent)if(p===ancestor)return true;return false;}
function evict(e){if(e.detail){e.root.remove(e.detail);disposeModel(e.detail);e.detail=null;e.mixer?.stopAllAction();e.mixer?.uncacheRoot(e.animationRoot);e.mixer=null;e.animationRoot=null;}e.base.visible=true;e.near=false;if(!e.released)status(e,'idle');}
async function load(e){busy=true;status(e,'loading');let gltf,timeout;try{
 await loaders();if(e.released)return;
 e.abort=new AbortController();timeout=setTimeout(()=>e.abort.abort(),25000);
 const response=await fetch(e.url,{signal:e.abort.signal,mode:'cors',credentials:'omit'});if(!response.ok)throw Error('GLB HTTP '+response.status);const bytes=await response.arrayBuffer();clearTimeout(timeout);if(e.released)return;
 const loader=new THREE.GLTFLoader();if(THREE.DRACOLoader){if(!decoder){decoder=new THREE.DRACOLoader();decoder.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/');decoder.setWorkerLimit(1);}loader.setDRACOLoader(decoder);}
 gltf=await new Promise((resolve,reject)=>{let done=false;const timer=setTimeout(()=>{done=true;reject(Error('GLB 解析逾時'));},30000);loader.parse(bytes,new URL('.',e.url).href,value=>{if(done){disposeModel(value.scene);return;}done=true;clearTimeout(timer);resolve(value);},error=>{if(done)return;done=true;clearTimeout(timer);reject(error);});});
 const model=gltf.scene||gltf.scenes?.[0];if(!model)throw Error('GLB 未包含場景');
 if(e.released){disposeModel(model);return;}
 model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),radius=box.getSize(new THREE.Vector3()).length()/2;if(!Number.isFinite(radius)||radius<=0)throw Error('GLB 模型尺寸無效');
 const detail=new THREE.Group(),center=box.getCenter(new THREE.Vector3());model.position.sub(center);detail.add(model);detail.scale.setScalar(e.radius/radius);detail.position.copy(e.center);
 let data=e.root.userData.type?e.root.userData:null;e.base.traverse(m=>{if(!data&&m.userData.type)data=m.userData;});model.traverse(m=>{if(m.isMesh){if(data)m.userData=data;m.frustumCulled=false;}});
 e.root.add(detail);e.detail=detail;detail.visible=false;if(gltf.animations?.length){e.animationRoot=model;e.mixer=new THREE.AnimationMixer(model);e.mixer.clipAction(gltf.animations[0]).play();}status(e,'ready');
 }catch(err){if(gltf&&!e.detail)disposeModel(gltf.scene);if(!e.released){status(e,'error',err.name==='AbortError'?'GLB 載入逾時':err.message||'GLB 載入失敗');e.base.visible=true;e.near=false;}}
 finally{clearTimeout(timeout);e.abort=null;busy=false;}
}
function update(scene,camera,height,focused,dt=0){if(!scene||!camera||!height)return;const now=performance.now(),cam=camera.getWorldPosition(new THREE.Vector3());let candidate=null;
 for(const e of entries.values()){
  if(!belongs(e.root,scene))continue;const scale=e.root.getWorldScale(new THREE.Vector3()),center=e.center.clone().applyMatrix4(e.root.matrixWorld),radius=e.radius*Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z)),ndc=center.clone().project(camera),pixels=radius*height/(Math.tan(camera.fov*Math.PI/360)*Math.max(.01,cam.distanceTo(center))),mode=e.root.userData.lodMode||'auto';
  e.wanted=e.root===focused&&mode!=='far'&&(mode==='near'||(ndc.z>=-1&&ndc.z<=1&&Math.abs(ndc.x)<1.4&&Math.abs(ndc.y)<1.4&&pixels>=(e.near?64:96)));
  e.near=e.wanted&&e.state==='ready'&&!!e.detail;e.base.visible=!e.near;if(e.detail)e.detail.visible=e.near;if(e.near){e.lastUsed=now;e.mixer?.update(Math.min(.1,Math.max(0,dt)));}if(e.wanted&&e.state==='idle')candidate=e;
 }
 if(candidate&&!busy)load(candidate);
 // Keep at most two resident GLB scenes, and only one visible.
 const cached=[...entries.values()].filter(e=>e.detail),old=cached.filter(e=>!e.near).sort((a,b)=>a.lastUsed-b.lastUsed);while(cached.length>2&&old.length){evict(old.shift());cached.pop();}
}
function release(object){for(const [key,e] of entries)if(belongs(key,object)){e.released=true;e.abort?.abort();evict(e);entries.delete(key);}}
function stats(){return {registered:entries.size,loaded:[...entries.values()].filter(e=>e.detail).length,visible:[...entries.values()].filter(e=>e.near).length,busy};}
root.ResidentGLB={attach,update,release,resolveURL,stats};
})(globalThis);
