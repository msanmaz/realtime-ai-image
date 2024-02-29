'use client'
import { Excalidraw, exportToBlob,serializeAsJSON } from "@excalidraw/excalidraw";
import Image from "next/image";
import { useState } from "react";
import * as fal from '@fal-ai/serverless-client'


fal.config({
  proxyUrl: "/api/fal/proxy"
})


const seed = Math.floor(Math.random() * 10000)
const baseArgs = {
  sync_mode:true,
  strength: .99,
  seed
}


export default function Home() {
 const [input,setInput] = useState('masterpiece, best quality, A realistic shot of a border-collie cross dog wearing a canada goose brand jacket')
 const [image,setImage] = useState(null)
 const [sceneData,setSceneData] = useState<any>(null)
 const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
 const [_appState,setAppState] = useState<any>(null)

const { send } = fal.realtime.connect("fal-ai/fast-turbo-diffusion", {
  connectionKey: 'realtime-app',
  onResult(result){

  }

})

 return (
    <main className="p-10">

    </main>
  );
}
