import { useEffect, useRef, useState } from "react"

const MeetingRoom = () => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [joined, setJoined] = useState(false)
    const [micOn, setMicOn] = useState(true)
    const [camOn, setCamOn] = useState(true)

    useEffect(() => {
        if (joined && camOn) {
            startCamera()
        } else {
            stopCamera()
        }
    }, [joined, camOn])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (e) {
            console.error("Camera error:", e)
        }
    }

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
            videoRef.current.srcObject = null
        }
    }

    if (!joined) {
        return (
            <div style={{ height: '100vh', backgroundColor: '#1e1e1e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <h1>Ready to join?</h1>
                <button
                    onClick={() => setJoined(true)}
                    style={{ padding: '15px 30px', fontSize: '1.2em', backgroundColor: '#007bff', border: 'none', borderRadius: '30px', color: 'white', marginTop: '20px', cursor: 'pointer' }}
                >
                    Join Meeting
                </button>
            </div>
        )
    }

    return (
        <div style={{ height: '100vh', backgroundColor: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ height: '80%', borderRadius: '10px', border: '2px solid #333' }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '5px' }}>
                    You (Guest)
                </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '20px', backgroundColor: '#1a1a1a' }}>
                <button onClick={() => setMicOn(!micOn)} style={{ backgroundColor: micOn ? '#333' : '#ff4444', borderRadius: '50%', width: '50px', height: '50px', border: 'none', color: 'white', cursor: 'pointer' }}>
                    {micOn ? '🎤' : '🔇'}
                </button>
                <button onClick={() => setCamOn(!camOn)} style={{ backgroundColor: camOn ? '#333' : '#ff4444', borderRadius: '50%', width: '50px', height: '50px', border: 'none', color: 'white', cursor: 'pointer' }}>
                    {camOn ? '📹' : '❌'}
                </button>
                <button onClick={() => setJoined(false)} style={{ backgroundColor: '#ff4444', borderRadius: '20px', padding: '0 30px', height: '50px', border: 'none', color: 'white', cursor: 'pointer' }}>
                    Leave
                </button>
            </div>
        </div>
    )
}

export default MeetingRoom
