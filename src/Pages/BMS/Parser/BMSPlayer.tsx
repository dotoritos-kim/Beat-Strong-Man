import { BMSParser } from '@Bms/parser';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { AudioPreloader } from '@Bms/audio/loader/AudioPreloader';

import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { AudioLoadWorker } from '@Bms/audio/loader/AudioLoader.worker';
import { removeFileName } from 'Helpers/functions';
import { fromBMSChart } from '@Bms/audio/judgements/NoteLoader';
import { BmsContext } from '../BmsContext';

const BMSPlayer = () => {
    const bmsContext = useContext(BmsContext);
    if (!bmsContext) {
        throw new Error('SomeComponent must be used within a BmsProvider');
    }
    const {
        isPlaying,
        setIsPlaying,
        bmsChart,
        setBmsChart,
        preloader,
        resourceURL,
        setResourceURL,
        setBmsTiming,
        setBmsPositioning,
        setBmsKeySounds,
        setBmsNotes,
        setBmsNoteLoader,
        bmsKeySounds,
        setPreloader,
        fileInputRef,
        bmsNoteLoader,
        setBmsAutos,
    } = bmsContext;

    // 폴더 선택 이벤트 핸들러
    const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const folderPath = URL.createObjectURL(files[0]);
            setResourceURL(folderPath);
        }
    };

    // URL 입력 이벤트 핸들러
    const handleURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setResourceURL(event.target.value);
    };

    // BMS 데이터 로드 및 파싱 함수
    const loadAndParseBMS = async () => {
        if (!resourceURL) {
            alert('폴더를 선택하거나 URL을 입력하세요.');
            return;
        }

        try {
            const bmsParser = new BMSParser();
            const chart = await bmsParser.fetchFromUrl(resourceURL);
            const bms = bmsParser.compileString(chart);
            bmsParser.getNotes();
            setBmsChart(bmsParser.chart);
            setBmsTiming(bmsParser.getTiming());
            setBmsPositioning(bmsParser.getPositioning());

            setBmsNotes(bmsParser.chart?.objects.all());
            const data = fromBMSChart(bms, {
                scratch: 'left',
            });
            setBmsKeySounds(data.keysounds);
            setBmsNoteLoader(data.notes);
            setBmsAutos(data.autos);
            setIsPlaying(true); // 재생 상태 설정
        } catch (error) {
            console.error('BMS 리소스 로드 오류:', error);
            alert('리소스를 로드하는 데 실패했습니다. URL이나 폴더 경로를 확인하세요.');
        }
    };

    async function audioLoad() {
        if (bmsKeySounds && resourceURL) {
            console.log('모든 오디오 로딩 시작!');
            const preloader = new AudioPreloader(removeFileName(resourceURL), bmsKeySounds, AudioLoadWorker);
            setPreloader(preloader);

            try {
                await preloader.loadAll();
                await preloader.decodeAll();
            } catch (err) {
                console.error('Audio loading error:', err);
            }
            console.log('모든 오디오 로딩 완료!');
        }
    }
    useEffect(() => {
        if (bmsKeySounds && resourceURL) {
            audioLoad();
        }
    }, [bmsKeySounds]);
    //https://bms.dotoritos.net/bms/[ginkiha]%20EOS/_eos_[LN]_l.bml
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>BMS Player</h2>
            <div style={{ marginBottom: '20px' }}>
                <input type="file" ref={fileInputRef} onChange={handleFolderSelect} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()}>폴더 선택</button>
                <span style={{ marginLeft: '10px', fontSize: '14px' }}>
                    {resourceURL ? `선택된 경로: ${resourceURL}` : '폴더를 선택하세요'}
                </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="URL 입력"
                    value={resourceURL ?? ''}
                    onChange={handleURLChange}
                    style={{ padding: '8px', width: '80%' }}
                />
            </div>

            <button onClick={loadAndParseBMS} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                BMS 파싱
            </button>

            <div>
                BMS NoteLoader <JsonView src={bmsNoteLoader} />
            </div>
            <div>
                BMS KeySounds <JsonView src={bmsKeySounds} />
            </div>
        </div>
    );
};

export default BMSPlayer;
