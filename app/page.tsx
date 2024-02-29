'use client'
// Import necessary libraries and components
import { useReducer, useEffect } from 'react';
import { Excalidraw, exportToBlob, serializeAsJSON } from '@excalidraw/excalidraw';
import Image from 'next/image';
import * as fal from '@fal-ai/serverless-client';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

interface AppState {
  input: string;
  image: string | null;
  sceneData: string | null;
  excalidrawAPI: any | null; 
}

interface Action {
  type: string;
  payload?: any; 
}

const initialState: AppState = {
  input: 'masterpiece, best quality, A realistic shot of a border-collie cross dog wearing a canada goose brand jacket',
  image: null,
  sceneData: null,
  excalidrawAPI: null,
};

const actionTypes = {
  SET_INPUT: 'SET_INPUT',
  SET_IMAGE: 'SET_IMAGE',
  SET_SCENE_DATA: 'SET_SCENE_DATA',
  SET_EXCALIDRAW_API: 'SET_EXCALIDRAW_API',
};

fal.config({
  proxyUrl: "/api/fal/proxy",
})


function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case actionTypes.SET_INPUT:
      return { ...state, input: action.payload };
    case actionTypes.SET_IMAGE:
      return { ...state, image: action.payload };
    case actionTypes.SET_SCENE_DATA:
      return { ...state, sceneData: action.payload };
    case actionTypes.SET_EXCALIDRAW_API:
      return { ...state, excalidrawAPI: action.payload };
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { send } = fal.realtime.connect('110602490-sdxl-turbo-realtime', {
    connectionKey: 'realtime-app',
    onResult: (result: { error?: string; images: { url: string }[] }) => {
      if (result.error) {
        console.error('Error:', result.error);
        return;
      }
      dispatch({ type: actionTypes.SET_IMAGE, payload: result.images[0].url });
    },
  });

  async function getDataUrl(appState: AppState['excalidrawAPI']) {
    if (!state.excalidrawAPI) return null;

    const elements = state.excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) return null;

    const blob = await exportToBlob({
      elements,
      exportPadding: 0,
      appState,
      quality: 0.5,
      files: state.excalidrawAPI.getFiles(),
      getDimensions: () => ({ width: 450, height: 450 }),
    });

    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    dispatch({ type: actionTypes.SET_INPUT, payload: newInput });
    const dataUrl = await getDataUrl(state.excalidrawAPI?.getAppState());
    if (dataUrl) {
      send({
        sync_mode: true,
        strength: 0.99,
        seed: Math.floor(Math.random() * 10000),
        prompt: newInput,
        image_url: dataUrl,
      });
    }
  };

  const handleExcalidrawChange = async (elements: readonly ExcalidrawElement[], appState: any) => {
    const newSceneData = serializeAsJSON(elements, appState, state.excalidrawAPI.getFiles(), 'local');
    if (newSceneData !== state.sceneData) {
      dispatch({ type: actionTypes.SET_SCENE_DATA, payload: newSceneData });
      const dataUrl = await getDataUrl(appState);
      if (dataUrl) {
        send({
          sync_mode: true,
          strength: 0.99,
          seed: Math.floor(Math.random() * 10000),
          prompt: state.input,
          image_url: dataUrl,
        });
      }
    }
  };

  return (
    <main className="p-12">
      <p className="text-xl mb-2">Fal SDXL Turbo</p>
      <input className='border rounded-lg p-2 w-full mb-2' value={state.input} onChange={handleChange} />
      <div className='flex'>
        <div className="w-[550px] h-[570px]">
          <Excalidraw
          excalidrawAPI={(api) => dispatch({ type: actionTypes.SET_EXCALIDRAW_API, payload: api })}
            onChange={ async(e,appState)=>  handleExcalidrawChange(e,appState)}
          />
        </div>
        {state.image && (
          <Image
            src={state.image}
            width={550}
            height={550}
            alt='Generated Image'
          />
        )}
      </div>
    </main>
  );
}
