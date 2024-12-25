// BMS Context and Provider
import { createContext, useState, useRef, useCallback, ReactNode } from 'react';
import GameController from '@Bms/Controller';
import * as BMS from '@Bms/parser/index';
import { fromBMSChart } from '@Bms/audio/judgements/NoteLoader';
import { Timer } from 'Helpers/timer';
import { AudioLoadWorker } from '@Bms/audio/loader/AudioLoader.worker';
import { throttle } from 'lodash';

export interface Log {
    message: string;
    worker: string;
    date: string;
    now: string;
    log: Map<string, string>;
    warn: Map<string, string>;
}

interface BmsContextProps {
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    bmsChart: BMS.BMSChart | null;
    setBmsChart: React.Dispatch<React.SetStateAction<BMS.BMSChart | null>>;
    bmsTiming: any;
    setBmsTiming: React.Dispatch<React.SetStateAction<any>>;
    bmsPositioning: any;
    setBmsPositioning: React.Dispatch<React.SetStateAction<any>>;
    bmsKeySounds: { [id: string]: string };
    setBmsKeySounds: React.Dispatch<React.SetStateAction<{ [id: string]: string }>>;
    bmsNotes: any;
    setBmsNotes: React.Dispatch<React.SetStateAction<any>>;
    bmsAutos: any;
    setBmsAutos: React.Dispatch<React.SetStateAction<any>>;
    fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
    resourceURL: string | null;
    setResourceURL: React.Dispatch<React.SetStateAction<string | null>>;
    controller: GameController | null;
    setController: React.Dispatch<React.SetStateAction<GameController | null>>;
    nowTime: string | null;
    setNowTime: React.Dispatch<React.SetStateAction<string | null>>;
    logger: Log;
    setLogger: React.Dispatch<React.SetStateAction<Log>>;
    playTime: number | null;
    setPlayTime: React.Dispatch<React.SetStateAction<number | null>>;
    loadingMessage: string | null;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;
    isAutoPlay: boolean;
    setIsAutoPlay: React.Dispatch<React.SetStateAction<boolean>>;
    isKeySoundAutoPlay: boolean;
    setIsKeySoundAutoPlay: React.Dispatch<React.SetStateAction<boolean>>;
    parseBMS: () => Promise<void>;
    configureGame: () => Promise<void>;
    startGame: () => void;
    destroyGame: () => void;
}

export const BmsContext = createContext<BmsContextProps | null>(null);

export const BmsProvider = ({ children }: { children: ReactNode }) => {
    const [resourceURL, setResourceURL] = useState<string | null>(null);
    const [nowTime, setNowTime] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bmsChart, setBmsChart] = useState<BMS.BMSChart | null>(null);
    const [bmsTiming, setBmsTiming] = useState<any>(null);
    const [bmsPositioning, setBmsPositioning] = useState<any>(null);
    const [bmsKeySounds, setBmsKeySounds] = useState<{ [id: string]: string }>({});
    const [bmsNotes, setBmsNotes] = useState<any>(null);
    const [bmsAutos, setBmsAutos] = useState<any>(null);
    const [controller, setController] = useState<GameController | null>(null);
    const [playTime, setPlayTime] = useState<number | null>(null);
    const [logger, setLogger] = useState<Log>({
        message: '',
        worker: '',
        date: '',
        now: '',
        log: new Map(),
        warn: new Map(),
    });
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [isKeySoundAutoPlay, setIsKeySoundAutoPlay] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Callback Functions
    const handleGameInput = useCallback(() => {
        if (controller) {
            setLogger({
                message: controller._message,
                worker: controller._workerMessage,
                date: controller._startDate!.toISOString(),
                now: new Date(controller._startDate!.getTime() + controller._nowTime!).toISOString(),
                log: Timer.log,
                warn: Timer.warningLog,
            });
        }
    }, [controller, bmsKeySounds, bmsAutos, bmsNotes]);

    const updateGameProgress = useCallback(
        throttle(() => {
            if (controller && controller._nowSec) setNowTime(controller._nowSec);
        }, 10),
        [controller, bmsKeySounds, bmsAutos, bmsNotes],
    );

    const handleAudioLoading = useCallback((type: string, payload: any) => {
        const { fileName, loadedCount, total } = payload;
        if (type === 'PROGRESS') {
            setLoadingMessage(`${type}: File: ${fileName}, Loaded: ${loadedCount}/${total}`);
        } else if (type === 'DONE') {
            setLoadingMessage(`${type}: Total Files: ${total}`);
        }
    }, []);

    // Game Management
    const destroyGame = useCallback(() => {
        if (controller) {
            controller.destroy();
            setIsPlaying(false);
            setController(null);
        }
    }, [controller, bmsKeySounds, bmsAutos, bmsNotes]);

    const startGame = useCallback(() => {
        if (controller && controller.isAudioReady) {
            controller.start({
                isAutoPlay,
                isKeySoundAutoPlay,
                gameInputCallback: handleGameInput,
                gameProgressCallback: updateGameProgress,
            });
            setIsPlaying(true);
        }
    }, [controller, isAutoPlay, isKeySoundAutoPlay, bmsKeySounds, bmsAutos, bmsNotes]);

    const configureGame = useCallback(async () => {
        if (bmsKeySounds && resourceURL && bmsNotes && bmsAutos) {
            const newController = new GameController();

            await newController.audioSetting({
                baseUrl: resourceURL,
                fileMap: bmsKeySounds,
                workerUrl: AudioLoadWorker,
                notes: bmsNotes,
                autos: bmsAutos,
                gameLoaderCallback: handleAudioLoading,
            });

            setIsPlaying(false);
            setController(newController);
        }
    }, [resourceURL, bmsKeySounds, bmsAutos, bmsNotes, handleAudioLoading]);

    const parseBMS = useCallback(async () => {
        if (!resourceURL) {
            alert('Please select a folder or input a URL.');
            return;
        }

        try {
            const parser = new BMS.BMSParser();
            const chart = await parser.fetchFromUrl(resourceURL);
            const bms = parser.compileString(chart);
            setPlayTime(parser.calculateTotalPlayTime());
            parser.getNotes();

            setBmsChart(parser.chart);
            setBmsTiming(parser.getTiming());
            setBmsPositioning(parser.getPositioning());

            const data = fromBMSChart(bms, { scratch: 'left' });
            setBmsKeySounds(data.keysounds);
            setBmsNotes(data.notes);
            setBmsAutos(data.autos);
        } catch (error) {
            console.error('Error loading BMS resources:', error);
            alert('Failed to load resources. Check the URL or folder path.');
        }
    }, [resourceURL]);

    return (
        <BmsContext.Provider
            value={{
                isPlaying,
                setIsPlaying,
                bmsChart,
                setBmsChart,
                bmsTiming,
                setBmsTiming,
                bmsPositioning,
                setBmsPositioning,
                bmsKeySounds,
                setBmsKeySounds,
                bmsNotes,
                setBmsNotes,
                fileInputRef,
                resourceURL,
                setResourceURL,
                controller,
                setController,
                logger,
                setLogger,
                bmsAutos,
                setBmsAutos,
                nowTime,
                setNowTime,
                playTime,
                setPlayTime,
                loadingMessage,
                setLoadingMessage,
                isAutoPlay,
                setIsAutoPlay,
                isKeySoundAutoPlay,
                setIsKeySoundAutoPlay,
                parseBMS,
                configureGame,
                startGame,
                destroyGame,
            }}
        >
            {children}
        </BmsContext.Provider>
    );
};
