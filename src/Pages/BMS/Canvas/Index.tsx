import * as THREE from 'three';
import React, { Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Canvas,
    Euler,
    ExtendedColors,
    Layers,
    Matrix4,
    NodeProps,
    NonFunctionKeys,
    Overwrite,
    Quaternion,
    useFrame,
    Vector3,
} from '@react-three/fiber';
import { Html, Environment, useGLTF, ContactShadows, OrbitControls } from '@react-three/drei';
import BMSPlayer from '../Parser/BMSPlayer';
import { EventHandlers } from '@react-three/fiber/dist/declarations/src/core/events';
import { JSX } from 'react/jsx-runtime';
import MAC_MODEL from '@Src/Assets/mac-draco.glb';
import { MainThread } from '@Bms/input/index';
import GameController from '@Bms/Controller';
import { Timer } from 'Helpers/timer';
import { v4 as uuidv4 } from 'uuid';
import JsonView from 'react18-json-view';
import { millisToMinutesAndSeconds, millisToSeconds } from 'Helpers/functions';
import { BmsContext, Log } from '../BmsContext';
import { PlayerAudio } from '@Bms/audio/loader/AudioPlayer';
import { throttle } from 'lodash';
import RhythmCanvas from 'Components/notes';
const BMSParser = (
    props: JSX.IntrinsicAttributes &
        Omit<
            ExtendedColors<
                Overwrite<Partial<THREE.Group<THREE.Object3DEventMap>>, NodeProps<THREE.Group<THREE.Object3DEventMap>, typeof THREE.Group>>
            >,
            NonFunctionKeys<{
                position?: Vector3;
                up?: Vector3;
                scale?: Vector3;
                rotation?: Euler;
                matrix?: Matrix4;
                quaternion?: Quaternion;
                layers?: Layers;
                dispose?: (() => void) | null;
            }>
        > & {
            position?: Vector3;
            up?: Vector3;
            scale?: Vector3;
            rotation?: Euler;
            matrix?: Matrix4;
            quaternion?: Quaternion;
            layers?: Layers;
            dispose?: (() => void) | null;
        } & EventHandlers,
) => {
    const bmsContext = useContext(BmsContext);
    if (!bmsContext) {
        throw new Error('SomeComponent must be used within a BmsProvider');
    }
    const {
        controller,
        setIsPlaying,
        setController,
        logger,
        setLogger,
        bmsNotes,
        isPlaying,
        bmsAutos,
        bmsKeySounds,
        resourceURL,
        setNowTime,
        playTime,
        setIsAutoPlay,
        setIsKeySoundAutoPlay,
        isAutoPlay,
        isKeySoundAutoPlay,
        destroyGame,
        startGame,
        nowTime,
    } = bmsContext;

    const scrollRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }, [scrollRef, logger, scrollRef.current, controller]);

    useEffect(() => {
        if (playTime && controller && controller._nowTime && playTime > controller._nowTime) {
            destroyGame();
        }
    }, [playTime, controller]);

    return (
        <>
            <button
                onClick={() => {
                    if (isPlaying === false) {
                        startGame();
                        setIsPlaying(true);
                    } else {
                        controller!.destroy();
                        setIsPlaying(false);
                    }
                }}
                style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
                {isPlaying === false ? `BMS 실행` : `BMS 초기화`}
            </button>
            <div className="checkbox">
                <input
                    type="checkbox"
                    id={'isAutoPlay'}
                    checked={isAutoPlay}
                    onChange={(e) => {
                        setIsAutoPlay(e.target.checked);
                        return;
                    }}
                />
                <label htmlFor={'isAutoPlay'}>isAutoPlay</label>
            </div>
            <div className="checkbox">
                <input
                    type="checkbox"
                    id={'isKeySoundAutoPlay'}
                    checked={isKeySoundAutoPlay}
                    onChange={(e) => {
                        setIsKeySoundAutoPlay(e.target.checked);
                        return;
                    }}
                />
                <label htmlFor={'isKeySoundAutoPlay'}>isKeySoundAutoPlay</label>
            </div>
            <div ref={scrollRef}>{controller ? <div>{nowTime}</div> : null}</div>
        </>
    );
};

export default function MainPage() {
    return (
        <>
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px' }}>
                    <BMSPlayer />
                    <BMSParser />
                </div>
            </div>
        </>
    );
}
