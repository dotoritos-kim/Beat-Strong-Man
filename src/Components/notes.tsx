import React, { useContext, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { create } from 'zustand';
import { Mesh, Vector3 } from 'three';
import { BmsContext } from '@Src/Pages/BMS/BmsContext';
import { millisToSeconds } from '@Src/Helpers/functions';

/**************************************
 *          타입 및 인터페이스
 **************************************/

// BMS 파서로부터 넘어오는 노트 정보
// time을 초 단위가 아니라 ms 단위로 저장한다고 가정합니다.
export interface GameNote {
    id: number;
    column: string; // 예: '1', '2', '3', 'SC' 등
    time: number; // ms 단위. 예) 2.4초 => 2400(ms)
}

// 실제 렌더링할 때 쓸 노트 상태
interface NoteState extends GameNote {
    isAnimating: boolean; // 화면에서 이동(렌더링) 중인지 여부
}

/**************************************
 *       노트 상태 (Zustand)
 **************************************/
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

/**************************************
 *       키 입력 상태 (Zustand)
 **************************************/
type KeyState = Record<string, boolean>;

const useKeyStore = create<{
    keyState: KeyState;
    toggleKey: (key: string, isPressed: boolean) => void;
}>((set) => ({
    keyState: {
        a: false,
        s: false,
        d: false,
        f: false,
        j: false,
        k: false,
        l: false,
        ';': false,
    },
    toggleKey: (key, isPressed) => {
        set((state) => ({
            keyState: { ...state.keyState, [key]: isPressed },
        }));
    },
}));
// 단일 노트: 시간 기반 이동
const Note: React.FC<{ note: NoteState }> = ({ note }) => {
    const meshRef = useRef<Mesh>(null);

    // BmsContext
    const bmsContext = useContext(BmsContext);
    if (!bmsContext) {
        throw new Error('Note must be used within a BmsProvider');
    }

    useFrame(() => {
        if (!meshRef.current) return;

        // 1) 현재 곡 재생 시간(초)
        const nowTimeSec = millisToSeconds(bmsContext.nowTimeMill ?? 0);

        // 2) 노트가 판정선에 도달해야 할 시각(초)
        const noteTimeSec = note.time;

        // 3) 남은 시간(초)
        const distanceToNote = noteTimeSec - nowTimeSec;

        // -------------------------------------------------------
        // [추가] 현재 BPM 값을 가져와서 (기본 BPM=120) 대비 비율을 구함
        //       만약 bmsContext에 bpm / currentBpm 같은 값이 없으면
        //       1) bmsContext에 있는 이름 확인해서 사용하거나
        //       2) 일단 "120"으로 고정해 두고 테스트
        // -------------------------------------------------------
        const currentBpm = 175;

        // 기준 이동 시간(1초)에서, BPM이 높으면 더 짧게 / 낮으면 더 길게
        // - 예: BPM=240이면 => speedFactor=240/120=2 => travelDuration=1.0/2=0.5초
        // - 예: BPM=60  이면 => speedFactor=60/120=0.5 => travelDuration=1.0/0.5=2.0초
        const baseTravelDuration = 1.0; // 기존 코드에선 1초로 고정
        const speedFactor = currentBpm / 120;
        const travelDuration = baseTravelDuration / speedFactor;
        // -------------------------------------------------------

        // startY~endY는 그대로
        const startY = 10;
        const endY = 0;

        // 4) 아직 등장 전이면 숨김
        if (distanceToNote > travelDuration) {
            meshRef.current.visible = false;
            return;
        }

        // 5) 이미 지나쳤다면 제거
        if (distanceToNote < -0.5) {
            useNoteStore.getState().finishAnimation(note.id);
            return;
        }

        // 6) 보이게 설정
        meshRef.current.visible = true;

        // 7) 이동(선형 보간)
        // distanceToNote === travelDuration => y = startY
        // distanceToNote === 0 => y = endY
        const progress = 1 - distanceToNote / travelDuration;
        const clamped = Math.min(Math.max(progress, 0), 1);
        meshRef.current.position.y = startY - (startY - endY) * clamped;
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={note.column === 'SC' ? '#ff8800' : '#00ff00'} />
        </mesh>
    );
};
/**************************************
 *     키박스(컬럼) 위치 & 매핑
 **************************************/
const keyMappings: Record<string, string> = {
    a: 'SC',
    s: '1',
    d: '2',
    f: '3',
    ' ': '4',
    k: '5',
    l: '6',
    ';': '7',
};

const keyBoxPositions: Record<string, [number, number, number]> = {
    SC: [-4.5, 0, 0],
    '1': [-3.5, 0, 0],
    '2': [-2.5, 0, 0],
    '3': [-1.5, 0, 0],
    '4': [-0.5, 0, 0],
    '5': [0.5, 0, 0],
    '6': [1.5, 0, 0],
    '7': [2.5, 0, 0],
};

/**************************************
 *     메인 리듬 게임 컴포넌트
 **************************************/
const RhythmGame: React.FC = () => {
    const bmsContext = useContext(BmsContext);
    if (!bmsContext) {
        throw new Error('RhythmGame must be used within a BmsProvider');
    }

    const { input, currentNotes } = bmsContext;
    // - input: [{ key: string, state: { isPressed: boolean } }, ...]
    // - currentNotes: GameNote[] (time이 ms 단위)
    // - nowTimeMill: 곡 재생 시각(ms)

    // 키 스토어
    const toggleKey = useKeyStore((state) => state.toggleKey);

    // 노트 스토어
    const { notes, addNote } = useNoteStore();

    // 1) 입력된 키에 따라 상태 갱신
    useEffect(() => {
        if (input && input.length > -1) {
            input.forEach(({ key, state }) => {
                const mappedKey = keyMappings[key];
                if (mappedKey) {
                    toggleKey(mappedKey, state.isPressed);
                }
            });
        }
    }, [input, toggleKey]);

    // 2) 새로 들어온 노트를 스토어에 등록
    useEffect(() => {
        if (!currentNotes) return;
        currentNotes.forEach((note) => {
            // 이미 등록된 노트인지 확인
            const exists = notes.some((n) => n.id === note.id);
            if (!exists) {
                addNote({
                    ...note,
                    isAnimating: true,
                });
            }
        });
    }, [currentNotes, notes, addNote]);

    // 3) 실제 렌더링
    return (
        <Canvas camera={{ position: [0, 5, 10] }} style={{ height: 500 }}>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />

            {/* 키박스들 */}
            {Object.entries(keyBoxPositions).map(([column, pos]) => {
                const isActive = useKeyStore((state) => state.keyState[column]);
                const isSC = column === 'SC';

                // SC는 파란색, 일반 키는 빨간색, 눌림 여부에 따라 색 변경
                const color = isSC
                    ? isActive
                        ? '#0000ff'
                        : '#808080' // SC
                    : isActive
                      ? '#00ff00'
                      : '#ff0000'; // 일반키

                const emissive = isActive ? color : '#000000';
                const emissiveIntensity = isActive ? 0.5 : 0;

                // SC만 크기가 약간 큼
                const scale = isActive ? [1.3, 1.3, 1.3] : isSC ? [1.1, 1.1, 1.1] : [1, 1, 1];

                return (
                    <mesh key={`key-${column}`} position={pos} scale={new Vector3(...scale)}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                );
            })}

            {/* 노트들 (isAnimating인 것만) */}
            {notes
                .filter((note) => note.isAnimating)
                .map((note) => {
                    const colPos = keyBoxPositions[note.column] || [0, 0, 0];
                    return (
                        <group key={`note-${note.id}`} position={[colPos[0], 0, colPos[2]]}>
                            <Note note={note} />
                        </group>
                    );
                })}
        </Canvas>
    );
};

export default RhythmGame;
