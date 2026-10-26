'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map as LeafletMap, LayerGroup} from 'leaflet';
import type {Place} from '@/lib/places';
import 'leaflet/dist/leaflet.css';
export default function CampusMap({places,selected,onSelect,route}:{places:Place[];selected:number;onSelect:(id:number)=>void;route:boolean}){
 const host=useRef<HTMLDivElement>(null);const map=useRef<LeafletMap|null>(null);const group=useRef<LayerGroup|null>(null);const [ready,setReady]=useState(false);const [offline,setOffline]=useState(false);
 useEffect(()=>{let cancelled=false;import('leaflet').then(L=>{if(cancelled||!host.current)return;const m=L.map(host.current,{zoomControl:false}).setView([33.6443,72.9905],16);map.current=m;L.control.zoom({position:'bottomright'}).addTo(m);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).on('tileerror',()=>setOffline(true)).addTo(m);group.current=L.layerGroup().addTo(m);setReady(true)});return()=>{cancelled=true;map.current?.remove();map.current=null}},[]);
 useEffect(()=>{if(!ready)return;let cancelled=false;import('leaflet').then(L=>{if(cancelled||!group.current)return;group.current.clearLayers();places.forEach(p=>{const icon=L.divIcon({className:'custom-pin',html:`<span class="map-pin ${p.id===selected?'selected':''}">${p.category==='Medical'?'+':p.category==='Washrooms'?'WC':p.category==='Study spaces'?'▤':'↗'}</span>`,iconSize:[42,46],iconAnchor:[21,40]});L.marker([p.lat,p.lng],{icon,title:p.name,alt:p.name}).on('click',()=>onSelect(p.id)).addTo(group.current!)});const p=places.find(p=>p.id===selected);if(p&&route){L.polyline([[33.6398,72.9894],[33.641,72.9894],[33.641, p.lng],[p.lat,p.lng]],{color:'#bd3043',weight:5,dashArray:'9 10'}).addTo(group.current)} });return()=>{cancelled=true}},[places,selected,route,ready,onSelect]);
 return <><div ref={host} className="map-canvas" aria-label="Interactive campus map; the adjacent list contains the same places"/>{offline&&<div className="tile-warning">Base map unavailable. Sample pins and the place list remain available.</div>}</>
}
