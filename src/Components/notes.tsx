// Install dependencies before running this example:
// npm install @react-three/fiber three zustand

import React, { useContext, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { create } from 'zustand';
import { BmsContext, Log } from '@Src/Pages/BMS/BmsContext';
// Define types for key state
type KeyState = Record<string, boolean>;

// Zustand store to manage key states
const useKeyStore = create<{ keyState: KeyState; toggleKey: (key: string) => void }>((set) => ({
    keyState: {
        a: false,
        s: false,
        d: false,
        f: false,
        j: false,
        k: false,
        l: false,
        ';': false, // 세미콜론에 해당하는 실제 코드
    },
    toggleKey: (key) =>
        set((state) => ({
            keyState: {
                ...state.keyState,
                [key]: !state.keyState[key],
            },
        })),
}));

// Key visual component
const KeyBox: React.FC<{ position: [number, number, number]; keyName: string }> = ({ position, keyName }) => {
    const isActive = useKeyStore((state) => state.keyState[keyName]);

    return (
        <mesh position={position}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={isActive ? '#00ff00' : '#ff0000'} />
        </mesh>
    );
};

// Main component
const RhythmGame: React.FC = () => {
    const bmsContext = useContext(BmsContext);
    if (!bmsContext) {
        throw new Error('SomeComponent must be used within a BmsProvider');
    }
    const {
        isPlaying,
        setIsPlaying,
        bmsChart,
        setBmsChart,
        resourceURL,
        setResourceURL,
        setBmsTiming,
        setBmsPositioning,
        setBmsKeySounds,
        setBmsNotes,
        bmsKeySounds,
        fileInputRef,
        setBmsAutos,
        controller,
        setController,
        setLogger,
        logger,
        bmsAutos,
        bmsNotes,
        playTime,
        setPlayTime,
        loadingMessage,
        configureGame,
        parseBMS,
    } = bmsContext;
    const toggleKey = useKeyStore((state) => state.toggleKey);

    useEffect(() => {
        if (controller && logger && controller._startDate) {
            controller.inputKeys.forEach((value) => {
                console.log('canvas input: ' + value);
                toggleKey(value);
            });
        }
    }, [controller, logger, toggleKey]);

    return (
        <Canvas camera={{ position: [0, 5, 10] }} style={{ height: 500 }}>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />

            {/* Render key boxes */}
            <KeyBox position={[-3.5, 0, 0]} keyName="a" />
            <KeyBox position={[-2.5, 0, 0]} keyName="s" />
            <KeyBox position={[-1.5, 0, 0]} keyName="d" />
            <KeyBox position={[-0.5, 0, 0]} keyName="f" />
            <KeyBox position={[0.5, 0, 0]} keyName="j" />
            <KeyBox position={[1.5, 0, 0]} keyName="k" />
            <KeyBox position={[2.5, 0, 0]} keyName="l" />
            <KeyBox position={[3.5, 0, 0]} keyName=";" />
        </Canvas>
    );
};

export default RhythmGame;
