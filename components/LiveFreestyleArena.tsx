import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerStats } from '../types';
import { HEAD_OPTIONS } from '../constants';
import { db, auth } from '../services/firebaseConfig';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import { MicIcon, UsersIcon, TrophyIcon, SkullIcon, HeartIcon } from './Icons';

// Backing track
const GAME_MUSIC_URL = "https://files.catbox.moe/jmykw3.mp3";

// Türkçe Rap Kültürü Lirik Konu Başlıkları - Basit ve Tek Sokak/Rap Kelimeleri
const TOPICS = [
  'mikrofon', 'sokak', 'kafiye', 'ritim', 'sahne', 'karanlık', 'rap', 'flow',
  'punchline', 'mahalle', 'para', 'hırs', 'saygı', 'kral', 'beton',
  'duvar', 'grafiti', 'gece', 'yeraltı', 'hece', 'tempo', 'zirve', 'hız',
  'kalem', 'kaos', 'baslar', 'vokal', 'patlama', 'beat'
];

interface Props {
  player: PlayerStats;
  onExit: () => void;
}

interface RoomData {
  id: string;
  name: string;
  creatorId: string;
  status: 'waiting' | 'countdown' | 'battle' | 'finished';
  p1: { 
    uid: string; 
    name: string; 
    respect: number; 
    avatar: string; 
    hearts: number;
    micActive: boolean;
    micLevel: number;
  } | null;
  p2: { 
    uid: string; 
    name: string; 
    respect: number; 
    avatar: string; 
    hearts: number;
    micActive: boolean;
    micLevel: number;
  } | null;
  currentWord: string;
  timeLeft: number;
  votesP1: number; // backward compatibility (hearts P1)
  votesP2: number; // backward compatibility (hearts P2)
  votedUids: string[];
  winner: string | null;
  createdAt: any;
}

interface FloatingHeartInstance {
  id: string;
  side: 'p1' | 'p2';
  color: string;
  leftOffset: number;
  size: number;
}

export const LiveFreestyleArena: React.FC<Props> = ({ player, onExit }) => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomData | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [localMicLevel, setLocalMicLevel] = useState(0);

  // Spectator/Challenger specific states
  const [joinMode, setJoinMode] = useState<'spectator' | 'challenger' | null>(null);
  const [spectators, setSpectators] = useState<{ uid: string; name: string; avatar: string }[]>([]);
  const [activeSpeakerDocs, setActiveSpeakerDocs] = useState<{ speakerUid: string; speakerName: string }[]>([]);
  const [lastSpokenLyricId, setLastSpokenLyricId] = useState<string>('');
  const [currentPunchline, setCurrentPunchline] = useState<{ text: string; senderName: string } | null>(null);

  // Real-time Jury Voting states
  const [activeVotes, setActiveVotes] = useState<{ [uid: string]: { vote: 'p1' | 'p2'; voterName: string } }>({});

  // Backing beat reference with Web Audio support for iOS device volume mitigation
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beatAudioContextRef = useRef<AudioContext | null>(null);
  const beatGainNodeRef = useRef<GainNode | null>(null);
  const beatSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const guestIdRef = useRef<string>('');

  // Web Audio refs for Live Microphones
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastWriteTimeRef = useRef<number>(0);

  // WebRTC Peer Connection and Streaming references
  const peerConnections = useRef<{ [uid: string]: RTCPeerConnection }>({});
  const peerUnsubscribes = useRef<{ [uid: string]: (() => void)[] }>({});
  const localStream = useRef<MediaStream | null>(null);
  const iceQueue = useRef<{ [uid: string]: any[] }>({});
  const addedIce = useRef<{ [uid: string]: Set<string> }>({});

  // Dynamic remote audio playback streams state
  const [remoteStreams, setRemoteStreams] = useState<{ [uid: string]: MediaStream }>({});

  useEffect(() => {
    // Utilize sessionStorage so that multiple tabs / testing interfaces run as separate contestants
    if (!sessionStorage.getItem('freestyle_guest_uid')) {
      const generatedId = 'mc_flow_' + Math.floor(1000 + Math.random() * 9000) + '_' + Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem('freestyle_guest_uid', generatedId);
    }
    guestIdRef.current = sessionStorage.getItem('freestyle_guest_uid') || 'anonymous_mc';

    if (!sessionStorage.getItem('freestyle_tab_suffix')) {
      const suffix = Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem('freestyle_tab_suffix', suffix);
    }
  }, []);

  const getMyUid = () => {
    return auth.currentUser?.uid || guestIdRef.current || sessionStorage.getItem('freestyle_guest_uid') || 'anonymous';
  };
  const getMyName = () => {
    if (player?.name && player.name !== 'MC') return player.name;
    const suffix = guestIdRef.current ? guestIdRef.current.split('_')[2] || guestIdRef.current.split('_')[1] || 'flow' : 'flow';
    return `mc flow #${suffix}`;
  };
  const getMyAvatarUrl = () => {
    const idx = player?.appearance?.headIndex ?? (guestIdRef.current ? (guestIdRef.current.charCodeAt(guestIdRef.current.length - 1) % HEAD_OPTIONS.length) : 0);
    return HEAD_OPTIONS[idx] || HEAD_OPTIONS[0];
  };

  // List active rooms in real-time
  useEffect(() => {
    const colRef = collection(db, 'freestyle_rooms');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const activeRoomsList: RoomData[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        activeRoomsList.push({ 
          id: doc.id,
          ...data,
          // Compatibility fallbacks mapping votes to hearts
          votesP1: data.votesP1 || 0,
          votesP2: data.votesP2 || 0,
        } as RoomData);
      });
      // Sort newest room at the top
      activeRoomsList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setRooms(activeRoomsList);
    });

    return () => unsubscribe();
  }, []);

  // Sync active room changes in real-time
  useEffect(() => {
    if (!activeRoom?.id) return;
    const docRef = doc(db, 'freestyle_rooms', activeRoom.id);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as RoomData;
        setActiveRoom(data);
      } else {
        setActiveRoom(null);
        notify("Oda kapatıldı veya silindi.", 'info');
      }
    });

    return () => unsubscribe();
  }, [activeRoom?.id]);

  // Sync real-time votes subcollection
  useEffect(() => {
    if (!activeRoom?.id) {
      setActiveVotes({});
      return;
    }
    const votesCol = collection(db, 'freestyle_rooms', activeRoom.id, 'votes');
    const unsubscribe = onSnapshot(votesCol, (snapshot) => {
      const votesMap: { [uid: string]: { vote: 'p1' | 'p2'; voterName: string } } = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data && (data.vote === 'p1' || data.vote === 'p2')) {
          votesMap[doc.id] = {
            vote: data.vote,
            voterName: data.voterName || 'Seyirci'
          };
        }
      });
      setActiveVotes(votesMap);
    });
    return () => unsubscribe();
  }, [activeRoom?.id]);

  // Sync spectators list in real-time
  useEffect(() => {
    if (!activeRoom?.id) {
      setSpectators([]);
      return;
    }
    const spectatorsCol = collection(db, 'freestyle_rooms', activeRoom.id, 'spectators');
    const unsubscribe = onSnapshot(spectatorsCol, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
      setSpectators(list);
    });
    return () => unsubscribe();
  }, [activeRoom?.id]);

  // --- REAL-TIME LOBBY AUDIO WEBRTC SIGNALING SYSTEM ---
  useEffect(() => {
    if (!activeRoom?.id) return;

    const myUid = getMyUid();
    const unsubscribes: (() => void)[] = [];

    const cleanupTargetPeer = (peerKey: string) => {
      if (peerConnections.current[peerKey]) {
        try {
          peerConnections.current[peerKey].close();
        } catch (_) {}
        delete peerConnections.current[peerKey];
      }
      if (peerUnsubscribes.current[peerKey]) {
        peerUnsubscribes.current[peerKey].forEach(unsub => {
          try {
            unsub();
          } catch (_) {}
        });
        delete peerUnsubscribes.current[peerKey];
      }
      delete iceQueue.current[peerKey];
      delete addedIce.current[peerKey];

      // Remove the underlying peerUid from remote audio streaming states
      const peerUid = peerKey.replace(/^(in_|out_)/, '');
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[peerUid];
        return next;
      });
    };

    const cleanupAllPeers = () => {
      Object.keys(peerConnections.current).forEach(peerKey => {
        cleanupTargetPeer(peerKey);
      });
    };

    // 1. Broadcaster presence publishing
    const presenceRef = doc(db, 'freestyle_rooms', activeRoom.id, 'active_streams', myUid);
    if (joinMode !== 'spectator' && isMicEnabled && localStreamState) {
      setDoc(presenceRef, {
        speakerUid: myUid,
        speakerName: getMyName(),
        active: true,
        timestamp: serverTimestamp()
      }).catch(err => console.error("Broadcaster presence publish error:", err));
    } else {
      deleteDoc(presenceRef).catch(() => {});
    }

    // 2. Discover active streams & handle Listener Role (Hearing other active speakers)
    const activeStreamsCol = collection(db, 'freestyle_rooms', activeRoom.id, 'active_streams');
    const unsubscribeActiveStreams = onSnapshot(activeStreamsCol, (snapshot) => {
      const activeSpeakersList: { speakerUid: string; speakerName: string }[] = [];
      const activeRemoteSpeakerUids: string[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.active) {
          activeSpeakersList.push({
            speakerUid: data.speakerUid || docSnap.id,
            speakerName: data.speakerName || 'Bilinmeyen'
          });
          if (docSnap.id !== myUid) {
            activeRemoteSpeakerUids.push(docSnap.id);
          }
        }
      });

      // Maintain active lists on UI
      setActiveSpeakerDocs(activeSpeakersList);

      // A. Clean up speakers that left
      Object.keys(peerConnections.current).forEach(peerKey => {
        if (peerKey.startsWith('out_')) {
          const peerUid = peerKey.substring(4);
          if (peerUid !== myUid && !activeRemoteSpeakerUids.includes(peerUid)) {
            cleanupTargetPeer(peerKey);
          }
        }
      });

      // B. Connect to newly active speakers (Listener Role)
      activeRemoteSpeakerUids.forEach(speakerUid => {
        const peerKey = `out_${speakerUid}`;
        if (peerConnections.current[peerKey]) return; // Already connected or negotiating

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        peerConnections.current[peerKey] = pc;
        iceQueue.current[peerKey] = [];
        addedIce.current[peerKey] = new Set<string>();
        peerUnsubscribes.current[peerKey] = [];

        pc.addTransceiver('audio', { direction: 'recvonly' });

        pc.ontrack = (event) => {
          if (isSubscribed) {
            const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
            setRemoteStreams(prev => ({
              ...prev,
              [speakerUid]: stream
            }));
          }
        };

        const peerDocRef = doc(db, 'freestyle_rooms', activeRoom.id, 'active_streams', speakerUid, 'inter_peers_offers', myUid);

        // Pre-delete any stale signaling documents from past sessions to ensure a fresh, conflict-free connection
        deleteDoc(peerDocRef).catch(() => {});

        pc.onicecandidate = (event) => {
          if (event.candidate && isSubscribed) {
            setDoc(peerDocRef, {
              spectatorCandidates: arrayUnion(event.candidate.toJSON())
            }, { merge: true }).catch(() => {});
          }
        };

        pc.onconnectionstatechange = () => {
          if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
            cleanupTargetPeer(peerKey);
          }
        };

        const createAndSendOffer = async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          if (!isSubscribed) return;

          await setDoc(peerDocRef, {
            offer: offer.sdp
          }, { merge: true });

          let hasAppliedAnswer = false;
          const unsubscribePeerDoc = onSnapshot(peerDocRef, async (snap) => {
            if (!isSubscribed || !snap.exists()) return;
            const snapData = snap.data();

            if (snapData.answer && !hasAppliedAnswer && pc.signalingState === 'have-local-offer') {
              hasAppliedAnswer = true;
              try {
                await pc.setRemoteDescription(new RTCSessionDescription({
                  type: 'answer',
                  sdp: snapData.answer
                }));

                while (iceQueue.current[peerKey]?.length > 0) {
                  const candidate = iceQueue.current[peerKey].shift();
                  if (candidate) {
                    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
                  }
                }
              } catch (e) {
                console.error("setRemoteDescription answer error:", e);
              }
            }

            if (snapData.speakerCandidates) {
              snapData.speakerCandidates.forEach((cand: any) => {
                const candStr = JSON.stringify(cand);
                if (!addedIce.current[peerKey]?.has(candStr)) {
                  addedIce.current[peerKey]?.add(candStr);
                  if (pc.remoteDescription && pc.signalingState !== 'closed') {
                    pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                  } else {
                    iceQueue.current[peerKey]?.push(cand);
                  }
                }
              });
            }
          });

          if (peerUnsubscribes.current[peerKey]) {
            peerUnsubscribes.current[peerKey].push(unsubscribePeerDoc);
          } else {
            unsubscribePeerDoc();
          }
        };

        createAndSendOffer().catch(err => console.error("Error creating WebRTC offer:", err));
      });
    });
    unsubscribes.push(unsubscribeActiveStreams);

    // 3. Hear incoming connection requests (Speaker Role)
    if (isMicEnabled && localStreamState) {
      const myPeersCol = collection(db, 'freestyle_rooms', activeRoom.id, 'active_streams', myUid, 'inter_peers_offers');
      const unsubscribeMyPeers = onSnapshot(myPeersCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const peerUid = change.doc.id;
          const peerKey = `in_${peerUid}`;
          const data = change.doc.data();

          if (change.type === 'removed') {
            cleanupTargetPeer(peerKey);
            return;
          }

          if (data && data.offer && !data.answer && !peerConnections.current[peerKey]) {
            const pc = new RTCPeerConnection({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
              ]
            });
            peerConnections.current[peerKey] = pc;
            iceQueue.current[peerKey] = [];
            addedIce.current[peerKey] = new Set<string>();
            peerUnsubscribes.current[peerKey] = [];

            if (localStreamState) {
              localStreamState.getTracks().forEach(track => {
                pc.addTrack(track, localStreamState);
              });
            }

            const peerDocRef = doc(db, 'freestyle_rooms', activeRoom.id, 'active_streams', myUid, 'inter_peers_offers', peerUid);

            pc.onicecandidate = (event) => {
              if (event.candidate && isSubscribed) {
                setDoc(peerDocRef, {
                  speakerCandidates: arrayUnion(event.candidate.toJSON())
                }, { merge: true }).catch(() => {});
              }
            };

            pc.onconnectionstatechange = () => {
              if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                cleanupTargetPeer(peerKey);
              }
            };

            try {
              await pc.setRemoteDescription(new RTCSessionDescription({
                type: 'offer',
                sdp: data.offer
              }));

              pc.getTransceivers().forEach(transceiver => {
                const kind = transceiver.receiver?.track?.kind || transceiver.sender?.track?.kind;
                if (kind === 'audio') {
                  transceiver.direction = 'sendonly';
                }
              });

              if (data.spectatorCandidates) {
                data.spectatorCandidates.forEach((cand: any) => {
                  const candStr = JSON.stringify(cand);
                  if (!addedIce.current[peerKey]?.has(candStr)) {
                    addedIce.current[peerKey]?.add(candStr);
                    pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                  }
                });
              }

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              if (!isSubscribed) return;

              await setDoc(peerDocRef, {
                answer: answer.sdp
              }, { merge: true });

              const unsubscribePeerDoc = onSnapshot(peerDocRef, (snap) => {
                if (!isSubscribed || !snap.exists()) return;
                const snapData = snap.data();

                if (snapData.spectatorCandidates) {
                  snapData.spectatorCandidates.forEach((cand: any) => {
                    const candStr = JSON.stringify(cand);
                    if (!addedIce.current[peerKey]?.has(candStr)) {
                      addedIce.current[peerKey]?.add(candStr);
                      if (pc.remoteDescription && pc.signalingState !== 'closed') {
                        pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                      } else {
                        iceQueue.current[peerKey]?.push(cand);
                      }
                    }
                  });
                }
              });

              if (peerUnsubscribes.current[peerKey]) {
                peerUnsubscribes.current[peerKey].push(unsubscribePeerDoc);
              } else {
                unsubscribePeerDoc();
              }
            } catch (err) {
              console.error("Error setting up connection for incoming offer:", err);
            }
          }
        });
      });
      unsubscribes.push(unsubscribeMyPeers);
    }

    let isSubscribed = true;

    return () => {
      isSubscribed = false;
      unsubscribes.forEach(unsub => {
        try {
          unsub();
        } catch (_) {}
      });
      const presenceRefClean = doc(db, 'freestyle_rooms', activeRoom.id, 'active_streams', myUid);
      deleteDoc(presenceRefClean).catch(() => {});
      cleanupAllPeers();
    };
  }, [activeRoom?.id, isMicEnabled, isMuted, localStreamState]);

  const initBeatAudio = () => {
    if (audioRef.current && beatAudioContextRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API not supported in this browser.");
      return;
    }

    try {
      const audioEl = new Audio(GAME_MUSIC_URL);
      audioEl.loop = true;
      audioEl.crossOrigin = "anonymous";
      audioRef.current = audioEl;

      const ctx = new AudioContextClass();
      beatAudioContextRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNode.gain.value = isMuted ? 0 : 0.08;
      beatGainNodeRef.current = gainNode;

      const source = ctx.createMediaElementSource(audioEl);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      beatSourceRef.current = source;
    } catch (err) {
      console.error("Failed to initialize Web Audio for beat, falling back to legacy audio element", err);
      const audioEl = new Audio(GAME_MUSIC_URL);
      audioEl.loop = true;
      audioEl.volume = isMuted ? 0 : 0.10;
      audioRef.current = audioEl;
    }
  };

  // Handle local background music loops with Safari gesture unlock
  useEffect(() => {
    const preUnlock = () => {
      initBeatAudio();
      if (beatAudioContextRef.current && beatAudioContextRef.current.state === 'suspended') {
        beatAudioContextRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('click', preUnlock, { once: true });
    window.addEventListener('touchstart', preUnlock, { once: true });

    return () => {
      window.removeEventListener('click', preUnlock);
      window.removeEventListener('touchstart', preUnlock);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (beatAudioContextRef.current) {
        beatAudioContextRef.current.close().catch(() => {});
        beatAudioContextRef.current = null;
      }
      stopMicCapture();
    };
  }, []);

  useEffect(() => {
    const targetVolume = isMuted ? 0 : 0.08;
    if (beatGainNodeRef.current) {
      beatGainNodeRef.current.gain.setValueAtTime(targetVolume, beatAudioContextRef.current?.currentTime || 0);
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.10;
    }
  }, [isMuted]);

  // Start background beat during active freestyle duels - ENABLING BEAT
  useEffect(() => {
    if (activeRoom) {
      const isBattleRunning = ['countdown', 'battle'].includes(activeRoom.status);
      if (isBattleRunning) {
        initBeatAudio();

        if (beatAudioContextRef.current && beatAudioContextRef.current.state === 'suspended') {
          beatAudioContextRef.current.resume().catch(() => {});
        }

        if (beatGainNodeRef.current) {
          beatGainNodeRef.current.gain.value = isMuted ? 0 : 0.08;
        }

        if (audioRef.current) {
          audioRef.current.play().catch(err => {
            console.warn("Audio play blocked, awaiting user action:", err);
          });
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [activeRoom?.status, activeRoom?.id, isMuted]);

  // Start microphone capture if it's the current player's turn to record live audio stream
  const myUid = getMyUid();
  const isP1 = activeRoom?.p1?.uid === myUid;
  const isP2 = activeRoom?.p2?.uid === myUid;
  const isCreator = activeRoom?.creatorId === myUid;

  // Aggregator for Room Creator
  useEffect(() => {
    if (!activeRoom || !isCreator) return;
    
    const totalP1 = Object.values(activeVotes).filter(v => v.vote === 'p1').length;
    const totalP2 = Object.values(activeVotes).filter(v => v.vote === 'p2').length;
    
    if (totalP1 !== (activeRoom.votesP1 || 0) || totalP2 !== (activeRoom.votesP2 || 0)) {
      const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
      updateDoc(roomRef, {
        votesP1: totalP1,
        votesP2: totalP2
      }).catch(err => console.error("Error writing aggregate votes:", err));
    }
  }, [activeVotes, isCreator, activeRoom?.id, activeRoom?.votesP1, activeRoom?.votesP2]);

  // Auto-enable microphone for contestants when the battle starts
  useEffect(() => {
    if (activeRoom?.status === 'battle' && (isP1 || isP2)) {
      setIsMicEnabled(true);
    }
  }, [activeRoom?.status, isP1, isP2]);

  useEffect(() => {
    if (!activeRoom || joinMode === 'spectator') {
      stopMicCapture();
      return;
    }
    
    if (isMicEnabled) {
      startMicCapture();
    } else {
      stopMicCapture();
    }
  }, [activeRoom?.id, isMicEnabled, joinMode]);

  // Handle Web Audio analysis to drive user feedback meter
  const startMicCapture = async () => {
    try {
      if (micStreamRef.current) return; // already capturing

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      // Ensure all local audio tracks are fully active and enabled
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
      micStreamRef.current = stream;
      setLocalStreamState(stream);

      // Instant micActive status sync to alert listeners
      if (activeRoom && (isP1 || isP2)) {
        const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
        const updateActive = isP1 ? 'p1.micActive' : 'p2.micActive';
        updateDoc(roomRef, { [updateActive]: true }).catch(() => {});
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const monitorMic = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Map average vocal level from 0-128 onto 0-100% scale
        const targetPercent = Math.min(Math.round((avg / 64) * 100), 100);
        setLocalMicLevel(targetPercent);

        // Throttle Firestore writes of live speech amplitude (every 220ms) to ensure sleek multi-peer vibes that don't overload DB
        const now = Date.now();
        if (now - lastWriteTimeRef.current > 220 && activeRoom) {
          lastWriteTimeRef.current = now;
          const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
          const updateField = isP1 ? 'p1.micLevel' : 'p2.micLevel';
          const updateActive = isP1 ? 'p1.micActive' : 'p2.micActive';

          updateDoc(roomRef, {
            [updateField]: targetPercent,
            [updateActive]: true
          }).catch(err => {
            const errStr = err?.message || String(err);
            if (errStr.includes("not-found") || errStr.includes("NOT_FOUND") || errStr.includes("No document to update")) {
              return; // Benign error: room deleted by host upon teardown
            }
            console.warn("Benign mic sync warning:", err);
          });
        }

        animationFrameRef.current = requestAnimationFrame(monitorMic);
      };

      animationFrameRef.current = requestAnimationFrame(monitorMic);
      notify("Mikrofon bağlandı! 🔥 Canlı ses kasmaya başla!", 'success');
    } catch (err) {
      console.error("Microphone permission denied or unsupported:", err);
      notify("Mikrofon izni verilmedi veya desteklenmiyor.", 'error');
      setIsMicEnabled(false);
    }
  };

  const stopMicCapture = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setLocalStreamState(null);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setLocalMicLevel(0);

    // Sync remote indicator to offline state
    if (activeRoom && (isP1 || isP2)) {
      const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
      const updateField = isP1 ? 'p1.micLevel' : 'p2.micLevel';
      const updateActive = isP1 ? 'p1.micActive' : 'p2.micActive';
      updateDoc(roomRef, {
        [updateField]: 0,
        [updateActive]: false
      }).catch(() => {});
    }
  };

  const notify = (msg: string, type: 'success' | 'error' | 'info') => {
    window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message: msg, type } }));
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      notify("Odaya havalı bir lobi başlığı seç!", 'error');
      return;
    }

    try {
      const myUid = getMyUid();
      const roomInitial: Omit<RoomData, 'id'> = {
        name: newRoomName,
        creatorId: myUid,
        status: 'waiting',
        p1: {
          uid: myUid,
          name: getMyName(),
          respect: player.respect || 10,
          avatar: getMyAvatarUrl(),
          hearts: 0,
          micActive: false,
          micLevel: 0
        },
        p2: null,
        currentWord: "HAZIRLAN",
        timeLeft: 30,
        votesP1: 0,
        votesP2: 0,
        votedUids: [],
        winner: null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'freestyle_rooms'), roomInitial);
      setActiveRoom({ id: docRef.id, ...roomInitial } as RoomData);
      setJoinMode('challenger');
      setNewRoomName('');
      setShowCreateModal(false);
      notify("Sesli Lobi başarıyla kuruldu! 🎤", 'success');
      playClickSound();
    } catch (e) {
      console.error(e);
      notify("Lobi kurulurken bir hata oluştu.", 'error');
    }
  };

  const joinRoom = async (room: RoomData, mode: 'spectator' | 'challenger') => {
    playClickSound();
    setJoinMode(mode);
    setActiveRoom(room);

    // Register as a spectator in firestore if chosen
    if (mode === 'spectator') {
      try {
        const myUid = getMyUid();
        const specRef = doc(db, 'freestyle_rooms', room.id, 'spectators', myUid);
        await setDoc(specRef, {
          uid: myUid,
          name: getMyName(),
          avatar: getMyAvatarUrl(),
          joinedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to register spectator presence", err);
      }
    }
  };

  const getOnStage = async (spot: 'p1' | 'p2') => {
    if (!activeRoom) return;
    const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
    const myUid = getMyUid();

    // Prevent double signup
    if (activeRoom.p1?.uid === myUid || activeRoom.p2?.uid === myUid) {
      notify("Zaten sahnedesin dostum!", 'error');
      return;
    }

    const stageMc = {
      uid: myUid,
      name: getMyName(),
      respect: player.respect || 10,
      avatar: getMyAvatarUrl(),
      hearts: 0,
      micActive: false,
      micLevel: 0
    };

    try {
      if (spot === 'p1') {
        await updateDoc(roomRef, { p1: stageMc });
      } else {
        await updateDoc(roomRef, { p2: stageMc });
      }
      playClickSound();

      if (joinMode === 'spectator') {
        const specRef = doc(db, 'freestyle_rooms', activeRoom.id, 'spectators', myUid);
        await deleteDoc(specRef).catch(() => {});
      }
      setJoinMode('challenger');

      notify("Sahneye çıktın! Sesli Rap kozunu dökmek için bekle! 🔥", 'success');
    } catch (e) {
      console.error(e);
      notify("Sahneye çıkarken hata oluştu.", 'error');
    }
  };

  const leaveStage = async (spot: 'p1' | 'p2') => {
    if (!activeRoom) return;
    const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
    try {
      if (spot === 'p1') {
        await updateDoc(roomRef, { p1: null, status: 'waiting' });
      } else {
        await updateDoc(roomRef, { p2: null, status: 'waiting' });
      }
      playClickSound();
      notify("Sahnede koltuğu boşalttın.", 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRoom = async () => {
    if (!activeRoom) return;
    const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
    try {
      await deleteDoc(roomRef);
      setActiveRoom(null);
      notify("Oda kapatıldı.", 'info');
      playClickSound();
    } catch (e) {
      console.error(e);
    }
  };

  const leaveRoom = async () => {
    stopMicCapture();
    if (activeRoom && joinMode === 'spectator') {
      try {
        const myUid = getMyUid();
        const specRef = doc(db, 'freestyle_rooms', activeRoom.id, 'spectators', myUid);
        await deleteDoc(specRef);
      } catch (err) {
        console.error("Failed to remove spectator record on leaveRoom", err);
      }
    }
    setActiveRoom(null);
    setJoinMode(null);
    playClickSound();
  };

  // Trigger award when the battle has finished
  useEffect(() => {
    if (activeRoom?.status === 'finished' && activeRoom.winner) {
      const hasWon = (activeRoom.winner === 'p1' && isP1) || (activeRoom.winner === 'p2' && isP2);
      if (hasWon) {
        playWinSound();
        window.dispatchEvent(new CustomEvent('flowify-award', { detail: { respect: 50, followers: 280 } }));
        notify("Tebrikler! Kapışmayı kazandınız! +50 Saygınlık aldınız.", 'success');
      }
    }
  }, [activeRoom?.status, activeRoom?.winner, isP1, isP2]);

  // Turn management effect
  useEffect(() => {
    if (!activeRoom) return;
    const isControlHolder = isCreator;

    if (!isControlHolder) return;

    const interval = setInterval(async () => {
      const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
      
      if (activeRoom.status === 'countdown') {
        if (activeRoom.timeLeft <= 1) {
          await updateDoc(roomRef, {
            status: 'battle',
            timeLeft: 45, // 45 seconds cumulative dual-mic freestyle round
            currentWord: TOPICS[Math.floor(Math.random() * TOPICS.length)]
          });
        } else {
          await updateDoc(roomRef, { timeLeft: activeRoom.timeLeft - 1 });
        }
      } 
      else if (activeRoom.status === 'battle') {
        const updates: any = { timeLeft: activeRoom.timeLeft - 1 };
        
        // Cycle rapid context words during the flow turn (every 5 seconds)
        if (activeRoom.timeLeft % 5 === 0) {
          updates.currentWord = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        }

        if (activeRoom.timeLeft <= 1) {
          // Declare winner based on live user likes count (stored in votesP1 / votesP2)
          let winningSide: string | null = null;
          if (activeRoom.votesP1 > activeRoom.votesP2) {
            winningSide = 'p1';
          } else if (activeRoom.votesP2 > activeRoom.votesP1) {
            winningSide = 'p2';
          } else {
            winningSide = 'draw';
          }

          updates.status = 'finished';
          updates.timeLeft = 0;
          updates.winner = winningSide;
        }

        await updateDoc(roomRef, updates);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoom?.status, activeRoom?.timeLeft, isCreator, activeRoom?.votesP1, activeRoom?.votesP2]);

  // Start the Battle sequence
  const startBattle = async () => {
    if (!activeRoom || !activeRoom.p1 || !activeRoom.p2) return;
    const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
    try {
      await updateDoc(roomRef, {
        status: 'countdown',
        timeLeft: 4,
        votesP1: 0,
        votesP2: 0,
        votedUids: [],
        winner: null,
      });
      playClickSound();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset stage
  const resetStage = async () => {
    if (!activeRoom) return;
    const roomRef = doc(db, 'freestyle_rooms', activeRoom.id);
    try {
      // Clear votes subcollection elements on reset
      const voterUids = Object.keys(activeVotes);
      for (const voterUid of voterUids) {
        await deleteDoc(doc(db, 'freestyle_rooms', activeRoom.id, 'votes', voterUid));
      }

      await updateDoc(roomRef, {
        status: 'waiting',
        timeLeft: 30,
        votesP1: 0,
        votesP2: 0,
        votedUids: [],
        winner: null,
      });
      playClickSound();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 h-full min-h-screen bg-[#020202] text-white font-sans flex flex-col relative overflow-hidden select-none">

      {/* GLOW DECORATIONS */}
      <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[600px] h-[450px] bg-blue-950/30 blur-[130px] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[350px] h-[350px] bg-[#1DB954]/5 blur-[110px] rounded-full z-0 pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {!activeRoom ? (
          /* ROOM LIST LOBBY VIEW */
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex flex-col pt-12 pb-24 px-6 z-10 overflow-y-auto no-scrollbar"
          >
            {/* Minimal Header */}
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#1DB954] tracking-wider uppercase">FLOWIFY ONLINE AUDIO</span>
                <h1 className="text-3xl font-black text-white tracking-tighter lowercase leading-none mt-1">
                  1v1 freestyle<span className="text-blue-500">.</span>
                </h1>
              </div>
              <button 
                onClick={onExit}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* LIVE VOICE INTRO CARD */}
            <div className="w-full bg-[#050505] border border-white/5 rounded-[2rem] p-5 mb-6 text-left relative overflow-hidden">
              <p className="text-neutral-400 text-xs leading-normal lowercase font-semibold">
                mikrofonunu aç, canlı beate kapış ve oyları topla!
              </p>
            </div>

            {/* ACTIONS SECTION */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">AKTİF LOBİLER ({rooms.length})</h3>
              <button
                onClick={() => { playClickSound(); setShowCreateModal(true); }}
                className="bg-blue-600 text-white font-black text-[11px] tracking-tight hover:bg-blue-500 active:scale-95 rounded-full px-5 py-3 shadow-lg transition-all shadow-blue-600/30"
              >
                + SESLİ LOBİ KUR
              </button>
            </div>

            {/* DIRECTIONS LIST */}
            <div className="space-y-3 flex-1 pb-24">
              {rooms.length === 0 ? (
                <div className="h-[230px] flex flex-col items-center justify-center text-center border border-white/5 bg-[#050505]/40 rounded-[2rem] p-6 mb-2">
                  <SkullIcon className="w-8 h-8 text-neutral-700 mb-3 animate-pulse" />
                  <span className="text-xs font-black text-neutral-500 lowercase">henüz kurulmuş 1v1 freestyle lobisi bulunmuyor.</span>
                  <p className="text-[10px] text-neutral-600 mt-1 max-w-[210px] leading-relaxed lowercase">ilk sesli kapışma lobisini sen başlatıp beati patlat!</p>
                </div>
              ) : (
                rooms.map((room) => {
                  const playersCount = (room.p1 ? 1 : 0) + (room.p2 ? 1 : 0);
                  const isBattle = ['countdown', 'battle'].includes(room.status);
                  
                  return (
                    <motion.div
                       key={room.id}
                      whileHover={{ scale: 1.002 }}
                      className="bg-[#050505] border border-white/5 hover:border-white/10 rounded-[2.2rem] p-5 flex flex-col gap-4 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#0b0b0b] border border-white/5 flex items-center justify-center relative">
                            <MicIcon className="w-5 h-5 text-blue-500 animate-pulse" />
                            <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isBattle ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`}></div>
                          </div>
                          <div className="text-left">
                            <h4 className="font-black text-sm text-white tracking-tight leading-none lowercase">
                              {(room.name || '').toLowerCase()}
                            </h4>
                            <p className="text-[10px] text-neutral-500 font-bold lowercase mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="text-white font-black block py-0.5 px-2 bg-blue-600/25 border border-blue-500/20 rounded">
                                {playersCount}/2 MC SAHNEDE
                              </span>
                              •
                              <span className="text-neutral-400 font-semibold">
                                {room.status === 'waiting' && 'sesli düello bekleniyor...'}
                                {room.status === 'countdown' && 'kapışma başlamak üzere!'}
                                {room.status === 'battle' && 'canlı düello devam ediyor! 🎤'}
                                {room.status === 'finished' && 'kapışma bitti'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Explicit diverge entry action buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/5">
                        <button
                          onClick={() => joinRoom(room, 'spectator')}
                          className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[#1DB954] hover:text-[#1ed760] font-black text-[10.5px] tracking-tight transition-all active:scale-[0.98] uppercase cursor-pointer"
                        >
                          👁️ KAPIŞMAYI İZLE
                        </button>
                        <button
                          onClick={() => joinRoom(room, 'challenger')}
                          className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10.5px] tracking-tight transition-all active:scale-[0.98] uppercase cursor-pointer"
                        >
                          🎤 Yarışmacı Girişi
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          /* ACTIVE ARENA SESLI & INTERAKTIF DOUBLE PANEL VIEW */
          <motion.div 
            key="arena-match"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full z-10 select-none relative"
          >
            {/* Header Controls */}
            <div className="pt-12 px-6 pb-4 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-md z-20">
              <div className="text-left">
                <button 
                  onClick={leaveRoom}
                  className="inline-flex items-center gap-1.5 text-[10px] text-neutral-500 hover:text-white font-black uppercase tracking-tight mb-1"
                >
                  ❮ GERİ ÇEKİL
                </button>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-black text-white tracking-tight leading-none lowercase">
                    {(activeRoom?.name || '').toLowerCase()}
                  </h2>
                  <span className="bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(29,185,84,0.15)] shrink-0 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse"></span>
                    {spectators.length} izleyici var
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className={`p-2 px-3 rounded-full border text-[10px] font-black transition-all active:scale-95 ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}
                >
                  {isMuted ? '🔇 beat kapalı' : '🔊 beat çalıyor'}
                </button>

                {isCreator && joinMode !== 'spectator' && (
                  <button
                    onClick={deleteRoom}
                    className="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 font-black text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-tighter"
                  >
                    Kapat
                  </button>
                )}
              </div>
            </div>

            {/* MAIN INTERACTION BOARD */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-48 z-20 font-sans">
              
              {/* STATUS ACTION HEADER ALERT banner */}
              {activeRoom.status !== 'waiting' && (
                <div className="w-full bg-[#080808]/90 border border-white/5 rounded-3xl p-4 flex items-center justify-between shadow-inner">
                  {activeRoom.status === 'countdown' && (
                    <div className="flex items-center gap-2 justify-center w-full py-1">
                      <span className="text-2xl font-black text-blue-400 animate-pulse">
                        HAZIRLANIN • {activeRoom.timeLeft}sn
                      </span>
                    </div>
                  )}
                  {activeRoom.status === 'battle' && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse"></span>
                        <span className="text-[10px] font-black text-[#1DB954] uppercase tracking-widest">
                          CANLI DÜELLO AKTİF! 🎤
                        </span>
                      </div>
                      <div className="text-xl font-black italic tracking-tighter tabular-nums text-[#1DB954] animate-pulse">
                        {activeRoom.timeLeft}sn
                      </div>
                    </div>
                  )}
                  {activeRoom.status === 'finished' && (
                    <div className="flex items-center justify-between w-full py-0.5">
                      <div className="flex items-center gap-1.5">
                        <TrophyIcon className="w-4.5 h-4.5 text-amber-400" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none">
                          KAPİŞMA TAMAMLANDI! 
                          {activeRoom.winner === 'draw' && ' RESMEN BERABERE!'}
                          {activeRoom.winner === 'p1' && ` KAZANAN ${(activeRoom.p1?.name || '').toUpperCase()}!`}
                          {activeRoom.winner === 'p2' && ` KAZANAN ${(activeRoom.p2?.name || '').toUpperCase()}!`}
                        </span>
                      </div>
                      {isCreator && (
                        <button
                          onClick={resetStage}
                          className="bg-white text-black font-semibold text-[9px] uppercase px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                        >
                          Tekrarla
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TWO SPLIT STAGE SIDE-BY-SIDE PANELS with VS indicator */}
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.85)] font-sans">
                    <span className="text-neutral-300 font-extrabold text-[12px] tracking-widest italic select-none">VS</span>
                  </div>
                </div>
                {/* PLAYER 1 CARD */}
                <div 
                  className={`rounded-[2.5rem] border p-5 text-center flex flex-col items-center justify-center relative transition-all bg-[#040404] min-h-[190px] ${activeRoom.status === 'battle' ? 'border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.25)]' : 'border-white/5'}`}
                  style={{
                    boxShadow: activeRoom.status === 'battle' ? `0 0 ${15 + (activeRoom.p1?.micLevel || 0) * 0.4}px rgba(59,130,246,${0.2 + (activeRoom.p1?.micLevel || 0) * 0.005})` : undefined
                  }}
                >
                  {activeRoom.status === 'battle' && activeRoom.p1?.micActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-black text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 z-20">
                      <MicIcon className="w-2.5 h-2.5" /> Ses Açık
                    </div>
                  )}

                  {activeRoom.p1 ? (
                    <div className="w-full flex flex-col items-center justify-center">
                      {/* Avatar container with live speaker glow halo! */}
                      <div className="relative">
                        {/* Dynamic spectrum glow pulsating when mic is active or speaking! */}
                        <div 
                          className={`absolute -inset-2 rounded-full bg-blue-500/35 blur-xl transition-all duration-100 opacity-0 ${activeRoom.p1.micActive || activeRoom.status === 'battle' ? 'opacity-100 scale-125' : ''}`}
                          style={{
                            transform: `scale(${1 + (activeRoom.p1.micLevel || 0) * 0.008})`
                          }}
                        />

                        {/* Score badge directly on top of the avatar */}
                        <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-blue-600 to-sky-600 border border-white/20 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(59,130,246,0.6)] z-20 select-none tracking-tight">
                          {activeRoom.votesP1 || 0} beğeni
                        </div>

                        <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-[#0c0c0c] relative flex items-center justify-center z-10 mx-auto">
                          <img src={activeRoom.p1.avatar || HEAD_OPTIONS[0]} className="w-full h-full object-cover scale-150 relative top-1.5" />
                        </div>

                        {/* Speech peak display ticker */}
                        {activeRoom.p1.micActive && (
                          <div className="absolute bottom-[-2px] right-[-2px] bg-blue-500 text-black border border-black rounded-full px-1.5 py-0.5 text-[8px] font-black z-20 flex items-center gap-0.5">
                            🎤 ON
                          </div>
                        )}
                      </div>

                      {/* Name, Votes & Spectator Voting Trigger underneath profile icon */}
                      <div className="mt-3 flex flex-col items-center relative z-20">
                        <span className="font-extrabold text-[11px] text-white tracking-tight">
                          {(activeRoom.p1.name || 'bilinmeyen mc').toLowerCase()}
                        </span>
                        <span className="text-[9px] text-[#1DB954] font-black mt-0.5">
                          {activeRoom.votesP1 || 0} beğeni
                        </span>

                        {/* Who voted for P1 list */}
                        {Object.values(activeVotes).filter(v => v.vote === 'p1').length > 0 && (
                          <div className="mt-2 text-center w-full max-w-[130px] flex flex-wrap justify-center gap-1">
                            {Object.values(activeVotes)
                              .filter(v => v.vote === 'p1')
                              .map((v, i) => (
                                <span 
                                  key={i} 
                                  className="text-[8.5px] bg-blue-500/15 border border-blue-500/35 text-blue-300 font-extrabold px-1.5 py-0.5 rounded-md uppercase truncate max-w-[120px]"
                                  title={v.voterName}
                                >
                                  {v.voterName.toLowerCase()}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Live Audience Like Indicator for P1 */}
                        {joinMode === 'spectator' && ['countdown', 'battle'].includes(activeRoom.status) && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const votesColRef = collection(db, 'freestyle_rooms', activeRoom.id, 'votes');
                              await setDoc(doc(votesColRef, getMyUid()), {
                                vote: 'p1',
                                voterName: getMyName(),
                                timestamp: serverTimestamp()
                              });
                              playClickSound();
                            }}
                            className={`mt-2.5 px-4 py-1.5 rounded-full border text-[9px] font-black tracking-tight transition-all active:scale-95 flex items-center gap-1 ${
                              activeVotes[getMyUid()]?.vote === 'p1'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.45)]'
                                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span>👍 BEĞEN</span>
                          </button>
                        )}
                      </div>

                      {/* LEAVE SEAT */}
                      {activeRoom.status === 'waiting' && activeRoom.p1.uid === myUid && (
                        <button
                          onClick={() => leaveStage('p1')}
                          className="mt-4 text-[9px] text-red-500 hover:text-red-400 font-bold tracking-tight lowercase relative z-20 cursor-pointer"
                        >
                          sahneden in.
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-3 bg-white/5">
                        <span className="text-lg text-white/30 font-light">+</span>
                      </div>
                      {joinMode === 'spectator' ? (
                        <div className="text-center px-1">
                          <span className="text-[8px] text-neutral-600 font-bold block leading-tight lowercase">izleyici modundasınız</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => getOnStage('p1')}
                          className="bg-blue-600/10 hover:bg-white text-blue-400 hover:text-black transition-all border border-blue-500/20 px-4 py-1.5 rounded-full text-[9px] font-black tracking-tight cursor-pointer"
                        >
                          1. MC OL
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* PLAYER 2 CARD */}
                <div 
                  className={`rounded-[2.5rem] border p-5 text-center flex flex-col items-center justify-center relative transition-all bg-[#040404] min-h-[190px] ${activeRoom.status === 'battle' ? 'border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.25)]' : 'border-white/5'}`}
                  style={{
                    boxShadow: activeRoom.status === 'battle' ? `0 0 ${15 + (activeRoom.p2?.micLevel || 0) * 0.4}px rgba(6,182,212,${0.2 + (activeRoom.p2?.micLevel || 0) * 0.005})` : undefined
                  }}
                >
                  {activeRoom.status === 'battle' && activeRoom.p2?.micActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 z-20">
                      <MicIcon className="w-2.5 h-2.5" /> Ses Açık
                    </div>
                  )}

                  {activeRoom.p2 ? (
                    <div className="w-full flex flex-col items-center justify-center">
                      {/* Avatar container with live speaker glow halo! */}
                      <div className="relative">
                        {/* Dynamic spectrum glow pulsating when mic is active or speaking! */}
                        <div 
                          className={`absolute -inset-2 rounded-full bg-cyan-500/35 blur-xl transition-all duration-100 opacity-0 ${activeRoom.p2.micActive || activeRoom.status === 'battle' ? 'opacity-100 scale-125' : ''}`}
                          style={{
                            transform: `scale(${1 + (activeRoom.p2.micLevel || 0) * 0.008})`
                          }}
                        />

                        {/* Score badge directly on top of the avatar */}
                        <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 border border-white/20 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(6,182,212,0.6)] z-20 select-none tracking-tight">
                          {activeRoom.votesP2 || 0} beğeni
                        </div>

                        <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-[#0c0c0c] relative flex items-center justify-center z-10 mx-auto">
                          <img src={activeRoom.p2.avatar || HEAD_OPTIONS[0]} className="w-full h-full object-cover scale-150 relative top-1.5" />
                        </div>

                        {/* Speech peak display ticker */}
                        {activeRoom.p2.micActive && (
                          <div className="absolute bottom-[-2px] right-[-2px] bg-cyan-500 text-black border border-black rounded-full px-1.5 py-0.5 text-[8px] font-black z-20 flex items-center gap-0.5">
                            🎤 ON
                          </div>
                        )}
                      </div>

                      {/* Name, Votes & Spectator Voting Trigger underneath profile icon */}
                      <div className="mt-3 flex flex-col items-center relative z-20">
                        <span className="font-extrabold text-[11px] text-white tracking-tight">
                          {(activeRoom.p2.name || 'bilinmeyen mc').toLowerCase()}
                        </span>
                        <span className="text-[9px] text-[#1DB954] font-black mt-0.5">
                          {activeRoom.votesP2 || 0} beğeni
                        </span>

                        {/* Who voted for P2 list */}
                        {Object.values(activeVotes).filter(v => v.vote === 'p2').length > 0 && (
                          <div className="mt-2 text-center w-full max-w-[130px] flex flex-wrap justify-center gap-1">
                            {Object.values(activeVotes)
                              .filter(v => v.vote === 'p2')
                              .map((v, i) => (
                                <span 
                                  key={i} 
                                  className="text-[8.5px] bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded-md uppercase truncate max-w-[120px]"
                                  title={v.voterName}
                                >
                                  {v.voterName.toLowerCase()}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Live Audience Like Indicator for P2 */}
                        {joinMode === 'spectator' && ['countdown', 'battle'].includes(activeRoom.status) && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const votesColRef = collection(db, 'freestyle_rooms', activeRoom.id, 'votes');
                              await setDoc(doc(votesColRef, getMyUid()), {
                                vote: 'p2',
                                voterName: getMyName(),
                                timestamp: serverTimestamp()
                              });
                              playClickSound();
                            }}
                            className={`mt-2.5 px-4 py-1.5 rounded-full border text-[9px] font-black tracking-tight transition-all active:scale-95 flex items-center gap-1 ${
                              activeVotes[getMyUid()]?.vote === 'p2'
                                ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.45)]'
                                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span>👍 BEĞEN</span>
                          </button>
                        )}
                      </div>

                      {/* LEAVE SEAT */}
                      {activeRoom.status === 'waiting' && activeRoom.p2.uid === myUid && (
                        <button
                          onClick={() => leaveStage('p2')}
                          className="mt-4 text-[9px] text-red-500 hover:text-red-400 font-bold tracking-tight lowercase relative z-20 cursor-pointer"
                        >
                          sahneden in.
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-3 bg-white/5">
                        <span className="text-lg text-white/30 font-light">+</span>
                      </div>
                      {joinMode === 'spectator' ? (
                        <div className="text-center px-1">
                          <span className="text-[8px] text-neutral-600 font-bold block leading-tight lowercase">izleyici modundasınız</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => getOnStage('p2')}
                          className="bg-cyan-600/10 hover:bg-white text-cyan-400 hover:text-black transition-all border border-cyan-500/20 px-4 py-1.5 rounded-full text-[9px] font-black tracking-tight cursor-pointer"
                        >
                          2. MC OL
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* DYNAMIC FLOW CONTEXT TOPIC PANEL */}
              {['countdown', 'battle'].includes(activeRoom.status) && (
                <div className="w-full bg-[#0a0a0a]/80 border border-white/5 rounded-[2.5rem] p-6 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute -inset-10 bg-blue-500/5 blur-3xl pointer-events-none"></div>
                  
                  {/* Spectrum audio waves simulation */}
                  <div className="mb-3.5 flex justify-center gap-1.5 h-6 items-end">
                    {[...Array(20)].map((_, i) => {
                      const activeMic = Math.max(activeRoom.p1?.micLevel || 0, activeRoom.p2?.micLevel || 0);
                      const sizeBase = activeMic ? Math.min(90, 20 + activeMic * 0.6) : 30;
                      return (
                        <div 
                          key={i}
                          className="w-1 rounded-full bg-[#1DB954]"
                          style={{
                            height: `${sizeBase + Math.sin(Date.now() * 0.02 + i) * 35}%`,
                            transition: 'height 100ms ease'
                          }}
                        />
                      );
                    })}
                  </div>

                  <span className="text-[9px] font-black text-neutral-500 tracking-[0.2em] uppercase leading-none block mb-1">
                    DÜELLO RAP YAPMA LİRİK KONUSU
                  </span>
                  
                  <motion.h3 
                    key={activeRoom.currentWord}
                    initial={{ scale: 0.94, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.1)] py-1"
                  >
                    "{activeRoom.currentWord}"
                  </motion.h3>
                </div>
              )}



              {/* COMPETITOR BANNER */}
              {(isP1 || isP2) && ['countdown', 'battle'].includes(activeRoom.status) && (
                <div className="w-full bg-[#050505] border border-white/5 rounded-[1.5rem] p-3 text-center">
                  <span className="text-[8.5px] text-neutral-400 font-black tracking-widest uppercase">
                    🏆 SAHNEDESİNİZ • JÜRİ OYLARI AKIYOR
                  </span>
                  <p className="text-[8px] text-neutral-500 mt-0.5 lowercase">
                    su an sahnedesiniz ve kendinize oy veremezsiniz. seyircilerin oyları yukarıdaki canlı bar grafiğinde akmaktadır!
                  </p>
                </div>
              )}

              {/* GAME ACTUATOR BUTTON */}
              {activeRoom.status === 'waiting' && (isP1 || isP2) && (
                <div className="w-full pt-4 text-center font-sans">
                  {activeRoom.p1 && activeRoom.p2 ? (
                    <button
                      onClick={startBattle}
                      className="w-full py-4 rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer font-sans shadow-[0_0_20px_rgba(29,185,84,0.3)]"
                    >
                      SAVAŞI BAŞLAT!
                    </button>
                  ) : (
                    <div className="p-4 bg-neutral-900/35 border border-white/5 rounded-2xl text-[10px] text-neutral-500 font-bold lowercase">
                      rakip mc'nin sahneye çıkması bekleniyor. her iki slot dolduğunda savaşı başlatabilirsiniz!
                    </div>
                  )}
                </div>
              )}

              {/* SPEECH SYNTHESIS / REAL-TIME LYRICS SUBTITLE POPUP OVERLAY */}
              {currentPunchline && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: -10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 1, y: -10 }}
                  className="w-full bg-gradient-to-r from-blue-900/40 via-cyan-900/35 to-[#050505] border border-blue-500/20 rounded-[2.5rem] p-6 text-center relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 left-0 bg-[#1DB954] text-black text-[8px] font-black px-3.5 py-1 rounded-br-2xl uppercase tracking-wider">
                    CANLI SESLENDİRME (TTS)
                  </div>
                  <span className="text-[9px] text-blue-400 font-black uppercase tracking-wider block mb-1">
                    {currentPunchline.senderName} punchline patlattı:
                  </span>
                  <p className="text-lg font-black text-white italic tracking-tight leading-snug">
                    "{currentPunchline.text}"
                  </p>
                </motion.div>
              )}

            </div>

            {/* STICKY BOTTOM AUDIO CONTROL CONSOLE FOR PARTICIPANTS */}
            {joinMode !== 'spectator' && (
              <div className="absolute bottom-6 left-6 right-6 z-50 bg-[#090909]/95 border border-white/10 rounded-3xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-fade-in font-sans">
                <div className="flex items-center justify-between gap-4 select-none">
                  {/* Micro on/off dynamic badge indicator */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">MİKROFON AKTİF</span>
                  </div>

                  {/* Beat audio mute/unmute control */}
                  <button
                    onClick={() => setIsMuted(prev => !prev)}
                    className={`px-3.5 py-2 rounded-2xl border text-[9.5px] font-black uppercase transition-all active:scale-95 flex items-center justify-center gap-1.5 ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#1DB954]/10 border-[#1DB954]/20 text-[#1DB954] hover:text-white'}`}
                    title="Arka Plan Ritim Sesi"
                  >
                    <span>{isMuted ? '🔇 beat kapalı' : '🔊 beat çalıyor'}</span>
                  </button>
                </div>

                {isMicEnabled && (
                  <div className="mt-3.5 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center text-[8.5px] font-black text-neutral-400 uppercase tracking-wider mb-2 px-1">
                      <span>ses düzeyiniz</span>
                      <span className="text-blue-400">{localMicLevel}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#1DB954] to-emerald-400 transition-all duration-75"
                        style={{ width: `${localMicLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATION MODAL OVERLAY */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-[200]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c0d] border border-white/10 w-full max-w-sm rounded-[2rem] p-6 text-center space-y-5 shadow-2xl"
            >
              <div>
                <h3 className="text-lg font-black text-white tracking-tight lowercase">yeni sesli lobi.</h3>
              </div>

              <div>
                <label className="text-[9px] font-black text-neutral-500 tracking-tight block lowercase mb-2.5 text-left">lobi adı.</label>
                <input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="lobi başlığı girin..."
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-semibold focus:border-blue-500/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { playClickSound(); setShowCreateModal(false); }}
                  className="py-2.5 px-4 bg-[#111] hover:bg-neutral-800 rounded-2xl font-black text-[10px] text-neutral-400 lowercase border border-white/5 active:scale-95 transition-all cursor-pointer"
                >
                  iptal
                </button>
                <button
                  onClick={createRoom}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-[10px] text-white lowercase active:scale-95 transition-all cursor-pointer"
                >
                  lobi kur
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Render active cross-peer dynamic WebRTC live voice tracks directly as mounted DOM elements to pass Safari security policies */}
      {Object.entries(remoteStreams).map(([peerUid, stream]) => (
        <WebRTCAudioElement 
          key={peerUid} 
          stream={stream} 
        />
      ))}
    </div>
  );
};

// --- MULTI-USER WEBRTC SUPPORT COMPONENT FOR POLISHED CROSS-PLATFORM AUTOPLAY ---
interface WebRTCAudioElementProps {
  stream: MediaStream;
}

const WebRTCAudioElement = ({ stream }: WebRTCAudioElementProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    try {
      audioRef.current.srcObject = stream;
    } catch (e) {
      console.warn("Assigning stream with srcObject failed:", e);
    }
  }, [stream]);

  useEffect(() => {
    if (!audioRef.current) return;
    // Keep voice communication volume always uninhibited by instrumental beat mute states
    audioRef.current.volume = 1.0;
  }, []);

  useEffect(() => {
    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.warn("WebRTC audio autoplay blocked by Safari or Chrome security rules, awaiting touch interaction:", err);
        });
      }
    };

    playAudio();

    // Universal gesture unlock for mobile device speakerphones
    const resumeAutoplay = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('click', resumeAutoplay);
    window.addEventListener('touchstart', resumeAutoplay);

    return () => {
      window.removeEventListener('click', resumeAutoplay);
      window.removeEventListener('touchstart', resumeAutoplay);
    };
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      className="w-0.5 h-0.5 absolute opacity-0 pointer-events-none"
    />
  );
};
