import * as THREE from 'three';
import React, { Suspense, useEffect, useRef } from 'react';
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
import BMS from '@Bms/index';

const BmsParser = (
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
    useEffect(() => {
        const input = new MainThread((e, keys) => {
            test(e, keys);
        }); // 예시로 worker.js 경로 설정
        return () => {
            input.terminateWorker();
        };
    }, []);
    const test = (e: string, keys: string[]) => {
        console.log(e);
        console.log(`입력된 키: ${JSON.stringify(keys)}`);
    };
    const group = useRef<THREE.Group>(new THREE.Group());
    // Load model
    const { nodes, materials } = useGLTF(MAC_MODEL);
    // Make it float
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, Math.cos(t / 2) / 20 + 0.25, 0.1);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.sin(t / 4) / 20, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, Math.sin(t / 8) / 20, 0.1);
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, (-2 + Math.sin(t / 2)) / 2, 0.1);
    });
    return (
        <group ref={group} {...props} dispose={null}>
            <group rotation-x={-0.425} position={[0, -0.04, 0.41]}>
                <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
                    <mesh material={materials.aluminium} geometry={nodes['Cube008'].geometry} />
                    <mesh material={materials['matte.001']} geometry={nodes['Cube008_1'].geometry} />
                    <mesh geometry={nodes['Cube008_2'].geometry}>
                        {/* Drei's HTML component can "hide behind" canvas geometry */}
                        <Html className="content" rotation-x={-Math.PI / 2} position={[0, 0.05, -0.09]} transform occlude>
                            <div className="wrapper" onPointerDown={(e) => e.stopPropagation()}>
                                <BMSPlayer />
                            </div>
                        </Html>
                    </mesh>
                </group>
            </group>
            <mesh material={materials.keys} geometry={nodes.keyboard.geometry} position={[1.79, 0, 3.45]} />
            <group position={[0, -0.1, 3.39]}>
                <mesh material={materials.aluminium} geometry={nodes['Cube002'].geometry} />
                <mesh material={materials.trackpad} geometry={nodes['Cube002_1'].geometry} />
            </group>
            <mesh material={materials.touchbar} geometry={nodes.touchbar.geometry} position={[0, -0.03, 1.2]} />
        </group>
    );
};

export default function MainPage() {
    return (
        <Canvas camera={{ position: [-5, 0, -15], fov: 55 }}>
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <Suspense fallback={null}>
                <group rotation={[0, Math.PI, 0]} position={[0, 1, 0]}>
                    <BmsParser />
                </group>
                <Environment preset="city" />
            </Suspense>
            <ContactShadows position={[0, -4.5, 0]} scale={20} blur={2} far={4.5} />
            <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} />
        </Canvas>
    );
}
