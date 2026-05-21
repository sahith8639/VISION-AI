"use client";
import Sidebar from '@/components/Dashboard/Sidebar';
import {
  Video, Users, Shield, Settings, PhoneOff, Plus, Mic, MicOff,
  VideoOff, MessageSquare, Monitor, X, RefreshCw, Grid, Search,
  Maximize2, Activity, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '@/services/api';

const SOCKET_URL = 'http://localhost:8000';

export default function TeacherLiveDashboard() {
  // Session State
  const [classData, setClassData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Media State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [devices, setDevices] = useState<{video: MediaDeviceInfo[], audio: MediaDeviceInfo[]}>({video: [], audio: []});
  const [selectedVideo, setSelectedVideo] = useState('');

  // Refs
  const teacherVideoRef = useRef<HTMLVideoElement>(null);
  const teacherStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);
  const peerConnections = useRef<{[key: string]: RTCPeerConnection}>({});

  useEffect(() => {
    loadDevices();
    return () => {
      teacherStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const loadDevices = async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        video: devs.filter(d => d.kind === 'videoinput'),
        audio: devs.filter(d => d.kind === 'audioinput')
      });
    } catch (e) { console.error(e); }
  };

  const startTeacherMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideo ? { deviceId: selectedVideo } : true,
        audio: true
      });
      teacherStreamRef.current = stream;
      if (teacherVideoRef.current) teacherVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Teacher media failed", err);
      return null;
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const startClass = async () => {
    setIsLoading(true);
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        alert("Session expired. Please login again.");
        window.location.href = '/login';
        return;
      }

      const response = await api.post('/classes/create', { teacher_email: email });
      setClassData(response.data);

      const stream = await startTeacherMedia();
      setupSocket(response.data.class_id, stream);
    } catch (err: any) {
      console.error("Failed to start class:", err);
      alert(err.response?.data?.detail || "Failed to create class session. Make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocket = (classId: string, stream: MediaStream | null) => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { room: classId, role: 'teacher' });
      // Ask anyone already in the room to reveal themselves
      socket.emit('request_presence', { room: classId });
    });

    socket.on('user_joined', (data) => {
      if (data.role === 'student') {
        // 1. Instantly add to participant list (even without stream)
        setParticipants(prev => {
           if (prev.find(p => p.sid === data.sid)) return prev;
           return [...prev, { sid: data.sid, ...data.metadata }];
        });
        // 2. Start WebRTC
        initiatePeerConnection(data.sid, socket, classId, stream, data.metadata);
      }
    });

    // Handle students who were already in the room
    socket.on('request_presence', () => {
       // This is for students to reply to teacher
    });

    socket.on('student_presence', (data) => {
       setParticipants(prev => {
          if (prev.find(p => p.sid === data.sid)) return prev;
          return [...prev, { sid: data.sid, ...data.metadata }];
       });
       initiatePeerConnection(data.sid, socket, classId, stream, data.metadata);
    });

    socket.on('signal', async (data) => {
      const pc = peerConnections.current[data.from];
      if (!pc) return;
      if (data.signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        if (data.signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { target: data.from, signal: { sdp: pc.localDescription } });
        }
      } else if (data.signal.ice) {
        await pc.addIceCandidate(new RTCIceCandidate(data.signal.ice));
      }
    });

    socket.on('toggle_camera', (data: any) => {
        setParticipants(prev => prev.map(p => p.sid === data.sid ? { ...p, videoEnabled: data.enabled } : p));
    });

    socket.on('new_alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 15));
    });

    socket.on('user_left', (sid: string) => {
      setParticipants(prev => prev.filter(p => p.sid !== sid));
      if (peerConnections.current[sid]) {
        peerConnections.current[sid].close();
        delete peerConnections.current[sid];
      }
    });
  };

  const initiatePeerConnection = async (studentSid: string, socket: any, classId: string, stream: MediaStream | null, metadata: any) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    if (stream) stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit('signal', { target: studentSid, signal: { ice: event.candidate } });
    };

    pc.ontrack = (event) => {
      setParticipants(prev => {
        const existing = prev.find(s => s.sid === studentSid);
        if (existing) return prev.map(s => s.sid === studentSid ? { ...s, stream: event.streams[0] } : s);
        return [...prev, { sid: studentSid, stream: event.streams[0], ...metadata }];
      });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('signal', { target: studentSid, signal: { sdp: pc.localDescription } });
    peerConnections.current[studentSid] = pc;
  };

  const toggleVideo = () => {
    if (teacherStreamRef.current) {
      const track = teacherStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const toggleAudio = () => {
    if (teacherStreamRef.current) {
      const track = teacherStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.regNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 flex flex-col pt-12 lg:pt-8 overflow-hidden">
        {!classData ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-center space-y-4">
              <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto text-blue-500 shadow-glow">
                <Video size={48} />
              </div>
              <h1 className="text-3xl font-bold">Start a Live Session</h1>
              <p className="text-slate-500 max-w-sm">Launch a new classroom session with real-time AI student monitoring.</p>
            </motion.div>
            <button
              onClick={startClass}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-blue-600/20 active:scale-95 group disabled:opacity-50"
            >
              <Plus size={24} className={isLoading ? "animate-spin" : "group-hover:rotate-90 transition-transform"} />
              {isLoading ? "Launching..." : "Launch Class"}
            </button>
          </div>
        ) : (
          <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-bold">Classroom Monitor</h1>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black tracking-widest border border-green-500/20">SESSION ACTIVE</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">Join Code: <span className="text-blue-400 font-black tracking-widest">{classData.join_code}</span></p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                       type="text"
                       placeholder="Search student..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-blue-500 transition-all"
                    />
                 </div>
                 <button onClick={() => window.location.reload()} className="bg-red-600/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all">End Session</button>
              </div>
            </header>

            <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden">
              {/* Main Grid Area */}
              <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Responsive Video Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar auto-rows-min">
                  {/* Teacher's own view */}
                  <div className="glass rounded-2xl overflow-hidden aspect-video relative border border-blue-500/30 group bg-black">
                     {isVideoOff ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 bg-slate-900">
                          <VideoOff size={32} />
                          <span className="text-[10px] font-bold uppercase mt-2">Your Camera Off</span>
                       </div>
                     ) : (
                       <video ref={teacherVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                     )}
                     <div className="absolute top-4 left-4 bg-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase">You (Teacher)</div>
                     <div className="absolute bottom-4 left-4 flex gap-2">
                        {isMuted && <div className="p-1.5 bg-red-600 rounded-lg shadow-lg"><MicOff size={14}/></div>}
                     </div>
                  </div>

                  {filteredParticipants.map((p) => (
                    <StudentGridCard key={p.sid} student={p} />
                  ))}

                  {filteredParticipants.length === 0 && participants.length > 0 && (
                     <div className="col-span-full h-40 flex items-center justify-center glass rounded-2xl opacity-50 italic text-sm">No results for "{searchQuery}"</div>
                  )}
                  {participants.length === 0 && (
                     <div className="col-span-full flex-1 flex flex-col items-center justify-center glass rounded-[2.5rem] py-20 opacity-30 italic">
                        <Users size={64} className="mb-4" />
                        <p className="text-xl font-medium tracking-tight">Waiting for students to join...</p>
                        <p className="text-xs mt-2 uppercase tracking-widest font-black">Share Code: {classData.join_code}</p>
                     </div>
                  )}
                </div>

                {/* Teacher Control Bar */}
                <div className="glass p-4 rounded-[2rem] border-white/5 flex items-center justify-center gap-4 sm:gap-6 bg-slate-900/50 backdrop-blur-xl">
                   <ControlBtn icon={isMuted ? <MicOff size={22}/> : <Mic size={22}/>} active={!isMuted} onClick={toggleAudio} />
                   <ControlBtn icon={isVideoOff ? <VideoOff size={22}/> : <Video size={22}/>} active={!isVideoOff} onClick={toggleVideo} />
                   <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block" />
                   <ControlBtn icon={<Monitor size={22}/>} label="Present" />
                   <ControlBtn icon={<Settings size={22}/>} onClick={() => setIsSettingsOpen(true)} />
                   <button className="bg-red-600 hover:bg-red-700 p-4 rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-95">
                      <PhoneOff size={22} className="text-white"/>
                   </button>
                </div>
              </div>

              {/* Monitoring Sidebar */}
              <div className="w-full xl:w-80 h-full flex flex-col gap-6">
                <div className="glass p-6 rounded-[2.5rem] border-white/5 flex-1 flex flex-col overflow-hidden">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-slate-400">
                         <Activity size={16} className="text-blue-500" />
                         AI Insights
                      </h3>
                      <span className="bg-blue-600/20 text-blue-500 text-[10px] px-2 py-0.5 rounded-full font-black">{alerts.length}</span>
                   </div>

                   <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                      {alerts.map((a, i) => (
                        <motion.div initial={{x:20, opacity:0}} animate={{x:0, opacity:1}} key={i} className={`p-4 rounded-2xl border ${getAlertStyle(a.type)}`}>
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black uppercase">{a.type}</span>
                              <span className="text-[9px] opacity-50">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                           </div>
                           <p className="text-xs font-bold text-slate-200">{a.name}</p>
                           <p className="text-[10px] opacity-70 mt-1">{a.message}</p>
                        </motion.div>
                      ))}
                      {alerts.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                           <Shield size={48} className="mb-4" />
                           <p className="text-xs font-bold uppercase tracking-widest text-center">Monitoring System<br/>Idle</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <motion.div initial={{scale:0.95}} animate={{scale:1}} className="glass p-10 rounded-[3rem] w-full max-w-xl border-white/10 shadow-3xl">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-2xl font-bold flex items-center gap-3">Classroom Settings</h3>
                      <p className="text-slate-500 text-sm mt-1">Configure your media and AI monitoring preferences</p>
                   </div>
                   <button onClick={() => setIsSettingsOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white">
                      <X size={24}/>
                   </button>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Camera</label>
                         <select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="w-full bg-slate-900/80 border border-white/10 p-3 rounded-2xl outline-none focus:border-blue-500 text-sm appearance-none">
                            {devices.video.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Webcam'}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stream Quality</label>
                         <select className="w-full bg-slate-900/80 border border-white/10 p-3 rounded-2xl outline-none focus:border-blue-500 text-sm appearance-none">
                            <option>720p (High Def)</option>
                            <option>480p (Standard)</option>
                            <option>360p (Low Data)</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <ToggleOption label="Automatic AI Monitoring" desc="Detect phone usage and student absence automatically." enabled />
                      <ToggleOption label="Engagement Heartbeat" desc="Receive real-time graphs of class attention levels." enabled />
                      <ToggleOption label="Background Noise Suppression" desc="Filter out classroom background noise." />
                   </div>
                </div>

                <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-blue-600 mt-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all">
                   Save and Apply <RefreshCw size={20}/>
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentGridCard({ student }: { student: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && student.stream) videoRef.current.srcObject = student.stream;
  }, [student.stream]);

  return (
    <div className="glass rounded-2xl overflow-hidden aspect-video relative group border border-white/5 hover:border-blue-500/50 transition-all bg-black">
      {student.videoEnabled === false ? (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-3 border-2 border-white/5">
               <span className="text-2xl font-bold text-slate-400">{student.name?.[0]}</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Video Disabled</p>
         </div>
      ) : (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      )}

      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
         <div className="flex flex-col gap-1">
            <span className="bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-[11px] font-bold text-white shadow-xl">{student.name}</span>
            <span className="bg-blue-600/80 backdrop-blur px-2 py-0.5 rounded text-[9px] font-black text-white w-fit uppercase tracking-tighter">{student.regNo}</span>
         </div>
         <div className="flex gap-2">
            <span className="bg-green-500/20 text-green-500 border border-green-500/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md">LIVE</span>
         </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/10 ${student.audioEnabled === false ? 'text-red-500' : 'text-green-500'}`}>
               {student.audioEnabled === false ? <MicOff size={14}/> : <Mic size={14}/>}
            </div>
         </div>
         <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attention</span>
            <div className="w-24 h-1.5 bg-slate-800/80 backdrop-blur rounded-full overflow-hidden border border-white/5">
               <motion.div animate={{ width: '85%' }} className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" />
            </div>
         </div>
      </div>
    </div>
  );
}

function ControlBtn({ icon, active, onClick, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
       <button onClick={onClick} className={`p-4 rounded-2xl transition-all shadow-xl ${active === false ? 'bg-red-600/10 text-red-500 border border-red-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'}`}>
          {icon}
       </button>
       {label && <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{label}</span>}
    </div>
  );
}

function ToggleOption({ label, desc, enabled }: any) {
   return (
      <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 group hover:border-blue-500/20 transition-all">
         <div>
            <p className="text-sm font-bold text-slate-200">{label}</p>
            <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
         </div>
         <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${enabled ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'right-1' : 'left-1'}`} />
         </div>
      </div>
   );
}

function getAlertStyle(type: string) {
  const styles: any = {
    distraction: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500',
    phone: 'border-red-500/20 bg-red-500/5 text-red-500',
    absent: 'border-slate-500/20 bg-slate-500/5 text-slate-500',
  };
  return styles[type] || styles.distraction;
}
