import { BMSParser } from '@Bms/parser';
import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { AudioPreloader } from '@Bms/audio/loader/AudioPreloader';

import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { AudioLoadWorker } from '@Bms/audio/loader/AudioLoader.worker';
import { removeFileName } from 'Helpers/functions';
import { fromBMSChart } from '@Bms/audio/judgements/NoteLoader';
import { BmsContext, Log } from '../BmsContext';
import { Timer } from 'Helpers/timer';
import GameController from '@Bms/Controller';
import { throttle } from 'lodash';
import { millisToMinutesAndSeconds, millisToSeconds } from 'Helpers/functions';
import RhythmCanvas from 'Components/notes';
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

    useEffect(() => {
        if (bmsKeySounds && bmsAutos && bmsNotes) {
            (async () => {
                await configureGame();
            })();
        }
    }, [bmsKeySounds, bmsAutos, bmsNotes]);
    //https://bms.dotoritos.net/bms/[ginkiha]%20EOS/_eos_[LN]_l.bml
    //https://bms.dotoritos.net/bms/%5BFreezer+feat.+%E5%A6%83%E8%8B%BA%5D+Berry+Go!!/%5BANOTHER%2B%5D.bme
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <RhythmCanvas />
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

            <button onClick={parseBMS} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                BMS 파싱
            </button>

            {loadingMessage ? <div>음원 로딩: {loadingMessage}</div> : null}
            {playTime ? <div>총 길이: {millisToMinutesAndSeconds(playTime)}</div> : null}
        </div>
    );
};

export default BMSPlayer;
