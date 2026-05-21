"use client";
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Mic, MessageSquare, Hand, LogOut, Settings, Users, Menu, X,
  MicOff, VideoOff, PhoneOff, Send, Camera, Monitor, Shield, ChevronRight,
  RefreshCw, Volume2, Maximize2
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '@/services/api';
import { useAIStream } from '@/hooks/useAIStream';

const SOCKET_URL = 'http://localhost:8000';

export default function StudentDashboard() {
  // UI State
  const [step, setStep] = useState<'info' | 'preview' | 'classroom'>('info');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState('');

  // Identity State
  const [classCode, setClassCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Media State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [devices, setDevices] = useState<{video: MediaDeviceInfo[], audio: MediaDeviceInfo[]}>({video: [], audio: []});
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('');

  // WebRTC & Socket Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const peerConnections = useRef<{[key: string]: RTCPeerConnection}>({});
  const [currentClassId, setCurrentClassId] = useState('');

  // AI Monitoring
  useAIStream(videoRef, socket, currentClassId, fullName || 'Student', step === 'classroom' && !isVideoOff);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
      setFullName(email.split('@')[0].toUpperCase());
    }
    loadDevices();
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

  const startPreview = async (forceAudioOnly = false) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      const constraints = {
        video: forceAudioOnly ? false : (selectedVideo ? { deviceId: selectedVideo } : true),
        audio: selectedAudio ? { deviceId: selectedAudio } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (previewRef.current) previewRef.current.srcObject = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Update UI state based on what we actually got
      setIsVideoOff(stream.getVideoTracks().length === 0);
      setIsMuted(stream.getAudioTracks().length === 0);

    } catch (err: any) {
      console.warn("Media failed:", err);
      // Graceful fallback to Audio-Only
      if (!forceAudioOnly) {
        startPreview(true);
      } else {
        setError("No media devices found. Joining in listen-only mode.");
      }
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode || !fullName || !regNo) {
      setError("Please fill in all fields");
      return;
    }
    setError('');
    setStep('preview');
    startPreview();
  };

  const joinClassroom = async () => {
    try {
      const response = await api.post('/classes/join', {
        student_email: userEmail,
        join_code: classCode,
        registration_number: regNo,
        full_name: fullName
      });

      setCurrentClassId(response.data.class_id);
      setupSocket(response.data.class_id);
      setStep('classroom');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid class code");
    }
  };

  const setupSocket = (classId: string) => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => {
      s.emit('join_room', {
        room: classId,
        role: 'student',
        metadata: { name: fullName, regNo: regNo, videoEnabled: !isVideoOff, audioEnabled: !isMuted }
      });
    });

    s.on('user_joined', async (data) => {
      if (data.role === 'teacher') {
        // Teacher just joined, tell them we are here
        s.emit('student_presence', {
           room: classId,
           target: data.sid,
           sid: s.id,
           metadata: { name: fullName, regNo: regNo, videoEnabled: !isVideoOff, audioEnabled: !isMuted }
        });
        createPeerConnection(data.sid, streamRef.current!, s, classId);
      }
    });

    s.on('request_presence', () => {
        s.emit('student_presence', {
           room: classId,
           sid: s.id,
           metadata: { name: fullName, regNo: regNo, videoEnabled: !isVideoOff, audioEnabled: !isMuted }
        });
    });

    s.on('signal', async (data) => {
      let pc = peerConnections.current[data.from];
      if (!pc) pc = createPeerConnection(data.from, streamRef.current!, s, classId);

      if (data.signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        if (data.signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          s.emit('signal', { target: data.from, signal: { sdp: pc.localDescription } });
        }
      } else if (data.signal.ice) {
        await pc.addIceCandidate(new RTCIceCandidate(data.signal.ice));
      }
    });
  };

  const createPeerConnection = (targetSid: string, stream: MediaStream, socket: any, classId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', { target: targetSid, signal: { ice: event.candidate } });
      }
    };

    peerConnections.current[targetSid] = pc;
    return pc;
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
        socketRef.current?.emit('toggle_camera', { enabled: isVideoOff });
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = isMuted;
        setIsMuted(!isMuted);
        socketRef.current?.emit('toggle_mic', { enabled: isMuted });
      }
    }
  };

  // --- RENDERING ---

  if (step === 'info') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="glass p-8 rounded-3xl w-full max-w-md border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
              <Users className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Join classroom</h2>
            <p className="text-slate-500 text-sm text-center mt-1">Enter your details to enter the live session</p>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <InputField label="Classroom Code" value={classCode} onChange={e => setClassCode(e.target.value.toUpperCase())} placeholder="e.g. 7EH6UT" />
            <InputField label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
            <InputField label="Registration Number" value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="e.g. REG-2024-001" />

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">{error}</div>}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group">
              Next Step <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="glass p-8 rounded-3xl w-full max-w-2xl border-white/10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Ready to join?</h2>
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Class Session</p>
                <p className="font-bold text-blue-400">{classCode}</p>
                <div className="h-px bg-white/5 my-2" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Joining as</p>
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-[10px] text-slate-400">{regNo}</p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button onClick={joinClassroom} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
                  Join Now
                </button>
                <button onClick={() => setStep('info')} className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-sm font-bold text-slate-300">
                  Go Back
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border-2 border-blue-500 shadow-2xl relative">
                {isVideoOff ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                    <VideoOff size={48} className="mb-2" />
                    <p className="text-xs font-bold uppercase">Camera Disabled</p>
                  </div>
                ) : (
                  <video ref={previewRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                   <MediaButton icon={isMuted ? <MicOff size={20}/> : <Mic size={20}/>} active={!isMuted} onClick={toggleAudio} />
                   <MediaButton icon={isVideoOff ? <VideoOff size={20}/> : <Video size={20}/>} active={!isVideoOff} onClick={toggleVideo} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-3 font-medium">Check your audio and video before entering</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <header className="flex justify-between items-center p-4 bg-slate-900/50 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-600/10 rounded-lg lg:hidden" onClick={() => setIsChatOpen(!isChatOpen)}>
             <MessageSquare size={20} className="text-blue-400"/>
          </div>
          <div>
            <h2 className="text-sm md:text-lg font-bold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Classroom
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Code: {classCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-white">{fullName}</p>
            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-tighter">{regNo}</p>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
            <Settings size={20}/>
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex bg-slate-950 items-center justify-center p-4">
         <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center">
            <div className="w-full aspect-video glass rounded-3xl overflow-hidden border border-white/5 relative shadow-2xl group">
               {/* Teacher Stream Placeholder */}
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                  <Monitor size={80} className="mb-4 opacity-10" />
                  <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-20">Professor's Stream</p>
               </div>

               {/* Student PIP */}
               <motion.div drag dragConstraints={{left:-100, right:100, top:-100, bottom:100}} className="absolute bottom-6 right-6 w-48 md:w-72 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-blue-500 shadow-2xl z-20 group-hover:scale-105 transition-transform">
                  {isVideoOff ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                         <span className="text-xl font-bold text-slate-500">{fullName[0]}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Camera Off</span>
                    </div>
                  ) : (
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                     {isMuted && <MicOff size={12} className="text-red-500" />}
                  </div>
                  <div className="absolute bottom-3 left-3 text-[10px] bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-bold border border-white/10">You</div>
               </motion.div>
            </div>
         </div>

         {/* Chat Sidebar Overlay */}
         <AnimatePresence>
            {isChatOpen && (
              <motion.div initial={{x:400}} animate={{x:0}} exit={{x:400}} className="absolute top-0 right-0 w-80 h-full glass border-l border-white/10 z-40 flex flex-col shadow-2xl">
                 <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2 text-sm"><MessageSquare size={16}/> Class Chat</h3>
                    <X size={20} className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setIsChatOpen(false)} />
                 </div>
                 <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-500/20 text-xs">
                       <p className="font-black text-blue-400 mb-1 uppercase tracking-tighter">Professor • 10:00 AM</p>
                       <p className="text-slate-300">Welcome to the session. AI Monitoring is now active.</p>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-900/50">
                    <div className="relative">
                       <input type="text" placeholder="Type a message..." className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-blue-500" />
                       <Send className="absolute right-4 top-3 text-blue-500 cursor-pointer" size={18} />
                    </div>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Control Bar */}
      <footer className="p-6 md:p-8 bg-slate-900 border-t border-white/5 flex items-center justify-between z-50">
        <div className="hidden lg:flex items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400 shadow-glow">
                 <Shield size={20} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Security</span>
                 <span className="text-xs font-bold text-blue-500 uppercase tracking-tighter">AI Monitoring Active</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 mx-auto lg:mx-0">
           <MediaButton icon={isMuted ? <MicOff size={24}/> : <Mic size={24}/>} active={!isMuted} onClick={toggleAudio} label="Microphone" />
           <MediaButton icon={isVideoOff ? <VideoOff size={24}/> : <Video size={24}/>} active={!isVideoOff} onClick={toggleVideo} label="Webcam" />
           <MediaButton icon={<Hand size={24}/>} active={false} label="Raise Hand" color="yellow" />
           <button onClick={() => window.location.href = '/dashboard/student'} className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-red-600/30 active:scale-95 group">
              <PhoneOff size={20} className="group-hover:-rotate-12 transition-transform" />
              <span className="hidden sm:block">Leave Classroom</span>
           </button>
        </div>

        <div className="hidden lg:flex items-center gap-3">
           <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><MessageSquare size={22}/></button>
           <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><Settings size={22}/></button>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div initial={{scale:0.9}} animate={{scale:1}} className="glass p-8 rounded-3xl w-full max-w-lg border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-bold flex items-center gap-3"><Settings className="text-blue-400" /> Session Settings</h3>
                   <X className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setIsSettingsOpen(false)} />
                </div>

                <div className="space-y-6">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Camera Device</label>
                      <select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl outline-none focus:border-blue-500 text-sm">
                         {devices.video.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Microphone</label>
                      <select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)} className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl outline-none focus:border-blue-500 text-sm">
                         {devices.audio.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Mic'}</option>)}
                      </select>
                   </div>
                   <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-medium">Background Blur</span>
                         <div className="w-10 h-5 bg-slate-800 rounded-full" />
                      </div>
                   </div>
                </div>

                <button onClick={() => { startPreview(); setIsSettingsOpen(false); }} className="w-full bg-blue-600 mt-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                   Apply Changes <RefreshCw size={18}/>
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ label, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <input {...props} className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-sm" />
    </div>
  );
}

function MediaButton({ icon, active, onClick, label, color = 'blue' }: any) {
  const activeColor = color === 'yellow' ? 'bg-yellow-600' : 'bg-blue-600';
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={`p-4 rounded-2xl transition-all shadow-xl ${active ? `${activeColor} text-white shadow-blue-600/20` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
      >
        {icon}
      </button>
      {label && <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter hidden sm:block">{label}</span>}
    </div>
  );
}
