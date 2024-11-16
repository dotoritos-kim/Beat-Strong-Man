import { BMSParser } from '@Bms/parser';
import { isArray } from 'lodash';
import React, { useState, useRef } from 'react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
const BMSPlayer = () => {
    const [resourceURL, setResourceURL] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [bmsChart, setBmsChart] = useState<any>(null);
    const [bmsTiming, setBmsTiming] = useState<any>(null);
    const [bmsPositioning, setBmsPositioning] = useState<any>(null);
    const [bmsKeySounds, setBmsKeySounds] = useState<any>(null);
    const [bmsNotes, setBmsNotes] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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

            bmsParser.compileString(await bmsParser.fetchFromUrl(resourceURL));
            bmsParser.getNotes();
            setBmsChart(bmsParser.chart);
            setBmsTiming(bmsParser.getTiming());
            setBmsPositioning(bmsParser.getPositioning());
            setBmsKeySounds(bmsParser.getKeySounds());
            setBmsNotes(bmsParser.chart?.objects.all());
            setIsPlaying(true); // 재생 상태 설정
        } catch (error) {
            console.error('BMS 리소스 로드 오류:', error);
            alert('리소스를 로드하는 데 실패했습니다. URL이나 폴더 경로를 확인하세요.');
        }
    };

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
                    value={resourceURL}
                    onChange={handleURLChange}
                    style={{ padding: '8px', width: '80%' }}
                />
            </div>

            <button onClick={loadAndParseBMS} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                BMS 파싱 및 재생
            </button>

            <div>
                BMS Chart <JsonView src={bmsChart} />
            </div>
            <div>
                BMS Timing <JsonView src={bmsTiming} />
            </div>
            <div>
                BMS Position <JsonView src={bmsPositioning} />
            </div>
            <div>
                BMS KeySounds <JsonView src={bmsKeySounds} />
            </div>
            <div>
                BMS Notes <JsonView src={bmsNotes} />
            </div>
        </div>
    );
};

export default BMSPlayer;
