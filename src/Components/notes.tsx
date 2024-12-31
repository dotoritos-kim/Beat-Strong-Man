// Install dependencies before running this example:
// npm install @react-three/fiber three zustand

import React, { useContext, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { create } from 'zustand';
import { BmsContext, Log } from '@Src/Pages/BMS/BmsContext';
import { GameNote } from '@Src/Helpers/bms/audio/judgements/types';
import { Mesh, Vector3 } from 'three';
// Define types for key state
type KeyState = Record<string, boolean>;

// Zustand store to manage key states
const useKeyStore = create<{ keyState: KeyState; toggleKey: (key: string, isPressed: boolean) => void }>((set) => ({
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
    toggleKey: (key, isPressed) => {
        set((state) => ({
            keyState: {
                ...state.keyState,
                [key]: isPressed,
            },
        }));
    },
}));

// 타입 정의 (노트의 위치와 속도)
interface NoteState {
    id: number;
    column: string;
    startTime: number;
    position: [number, number, number];
    isAnimating: boolean; // 애니메이션 중인지 여부
}

// Zustand store to manage active notes
const useNoteStore = create<{
    notes: NoteState[];
    addNote: (note: NoteState) => void;
    finishAnimation: (id: number) => void;
}>((set) => ({
    notes: [],
    addNote: (note) =>
        set((state) => ({
            notes: [...state.notes, note],
        })),
    finishAnimation: (id) =>
        set((state) => ({
            notes: state.notes.map((note) => (note.id === id ? { ...note, isAnimating: false } : note)),
        })),
}));
// Note Component
const Note: React.FC<{ note: NoteState }> = ({ note }) => {
    const { id, position, startTime } = note;
    const meshRef = useRef<Mesh>(null);

    useFrame((_, delta) => {
        if (meshRef.current) {
            const elapsed = performance.now() / 1000 - startTime; // 경과 시간 계산
            if (elapsed < 1.5) {
                // 상승 애니메이션
                meshRef.current.position.y = position[1] + elapsed * 3;
            } else {
                // 애니메이션 종료 표시
                useNoteStore.getState().finishAnimation(id);
            }
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#00ff00" />
        </mesh>
    );
};
const keyMappings: Record<string, string> = {
    a: 'SC',
    s: '1',
    d: '2',
    f: '3',
    j: '4',
    k: '5',
    l: '6',
    ';': '7',
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
        input,
        nowTime,
        currentNotes,
    } = bmsContext;
    const toggleKey = useKeyStore((state) => state.toggleKey);
    const { notes, addNote } = useNoteStore();
    useEffect(() => {
        if (input && input.length > -1) {
            input.forEach((value) => {
                const mappedKey = keyMappings[value.key]; // 매핑된 키 가져오기
                if (mappedKey) {
                    console.log(`Key: ${value.key}, Mapped to: ${mappedKey}`);
                    toggleKey(mappedKey, value.state.isPressed); // 매핑된 키로 상태 토글
                }
            });
        }
    }, [input, toggleKey]);

    const keyBoxPositions: Record<string, [number, number, number]> = {
        SC: [-4.5, 0, 0], // SC를 맨 앞으로 이동
        '1': [-3.5, 0, 0],
        '2': [-2.5, 0, 0],
        '3': [-1.5, 0, 0],
        '4': [-0.5, 0, 0],
        '5': [0.5, 0, 0],
        '6': [1.5, 0, 0],
        '7': [2.5, 0, 0],
    };

    console.log(currentNotes);
    // Add notes to zustand state
    useEffect(() => {
        if (currentNotes) {
            currentNotes.forEach((note) => {
                if (!notes.some((n) => n.id === note.id)) {
                    const position = keyBoxPositions[note.column];
                    if (position) {
                        addNote({
                            id: note.id,
                            column: note.column,
                            startTime: performance.now() / 1000, // 현재 시간을 초 단위로 설정
                            position: [position[0], position[1] + 1, position[2]],
                            isAnimating: true,
                        });
                    }
                }
            });
        }
    }, [currentNotes, notes, addNote]);

    return (
        <Canvas camera={{ position: [0, 5, 10] }} style={{ height: 500 }}>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            {/* Render KeyBoxes */}
            {Object.entries(keyBoxPositions).map(([column, position]) => {
                const isActive = useKeyStore((state) => state.keyState[column]); // 키 상태 가져오기

                // SC일 경우와 일반 키의 스타일 구분
                const isSC = column === 'SC';
                const color = isSC
                    ? isActive
                        ? '#0000ff' // SC 눌렸을 때 색상 (파란색)
                        : '#808080' // SC 기본 색상 (회색)
                    : isActive
                      ? '#00ff00' // 일반 키 눌렸을 때 색상 (초록색)
                      : '#ff0000'; // 일반 키 기본 색상 (빨간색)

                const emissive = isSC
                    ? isActive
                        ? '#0000ff' // SC 빛나는 효과 (파란색)
                        : '#000000' // SC 기본 빛 (없음)
                    : isActive
                      ? '#00ff00' // 일반 키 빛나는 효과 (초록색)
                      : '#000000'; // 일반 키 기본 빛 (없음)

                const emissiveIntensity = isSC
                    ? isActive
                        ? 1 // SC 활성화 시 강한 빛
                        : 0 // SC 비활성화 시 빛 없음
                    : isActive
                      ? 0.5 // 일반 키 활성화 시 약한 빛
                      : 0; // 일반 키 비활성화 시 빛 없음

                const scale = isActive ? [1.3, 1.3, 1.3] : isSC ? [1.1, 1.1, 1.1] : [1, 1, 1]; // SC는 기본적으로 약간 더 큼
                return (
                    <mesh key={`key-${column}`} position={position} scale={new Vector3(scale[0], scale[1], scale[2])}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                );
            })}
            {/* Render Notes */}
            {notes
                .filter((note) => note.isAnimating) // 애니메이션 중인 노트만 렌더링
                .map((note) => (
                    <Note key={`note-${note.id}`} note={note} />
                ))}
        </Canvas>
    );
};

export default RhythmGame;
