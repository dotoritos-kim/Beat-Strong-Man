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
import { BmsContext, log } from '../BmsContext';
import { PlayerAudio } from '@Bms/audio/loader/AudioPlayer';
import { throttle } from 'lodash';
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
        setController,
        logger,
        setLogger,
        nowTime,
        setNowTime,
        bmsNotes,
        isPlaying,
        bmsAutos,
        preloader,
        playerAudio,
        bmsKeySounds,
        bmsNoteLoader,
        setPlayerAudio,
    } = bmsContext;
    const gameInput = useCallback(
        (message: string, keys: string[]) => {
            if (controller) {
                const tmp: log = {
                    message: controller._message,
                    worker: controller._workerMessage,
                    date: controller._startDate!.toISOString(),
                    now: new Date(controller._startDate!.getTime() + controller._nowTime!).toISOString(),
                    log: Timer.log,
                    warn: Timer.warningLog,
                };
                setLogger(tmp);
            }
        },
        [controller],
    );
    const gameProgress = useCallback(
        throttle(() => {
            if (controller && controller._nowTime) {
                setNowTime(millisToMinutesAndSeconds(controller._nowTime));
            }
            if (controller && controller._nowTime && playerAudio) {
                playerAudio.playAutoKeySound(millisToSeconds(controller._nowTime));
                playerAudio.playAutoNoteKeySound(millisToSeconds(controller._nowTime));
            }
        }, 10),
        [controller, playerAudio],
    );
    const scrollRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }, [scrollRef, logger, scrollRef.current]);

    const gameStart = () => {
        if (preloader) {
            const init = new GameController(gameInput, gameProgress);
            const player = new PlayerAudio(bmsNoteLoader, bmsAutos, preloader, bmsKeySounds);
            setPlayerAudio(player);
            setController(init);
        }
    };

    useEffect(() => {
        if (controller) {
            controller.gameInputCallback = gameInput;
            controller.gameProgressCallback = gameProgress;
            controller.start();
        }
        return () => {
            if (controller) controller.destroy();
        };
    }, [controller]);
    return (
        <>
            <button
                onClick={() => {
                    gameStart();
                }}
                style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
                BMS 실행
            </button>
            <div ref={scrollRef}>
                <div>{nowTime}</div>
                <div>{logger.message}</div>
                <div>{logger.worker}</div>
                <div>{logger.date}</div>
                <div>{logger.now}</div>
                <div>
                    로그: <JsonView src={[...logger.log.values().toArray()]} collapseObjectsAfterLength={10000} />
                </div>
            </div>
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
