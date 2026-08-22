import sys
import time
import socketio
import speech_recognition as sr

# Initialize Socket.IO Client
sio = socketio.Client()

SERVER_URL = 'http://localhost:3000'
username = ""
is_connected = False

@sio.event
def connect():
    global is_connected
    is_connected = True
    print("[SOCKET] Connected to Node.js backend server successfully.")
    if username:
        # Join personal room
        sio.emit('join_personal_room', {'username': username})
        print(f"[SOCKET] Joined personal control room: room_{username}")

@sio.event
def disconnect():
    global is_connected
    is_connected = False
    print("[SOCKET] Disconnected from server.")

@sio.event
def response_status(data):
    print(f"[SERVER REPLY] {data.get('message', '')}")

def listen_loop():
    r = sr.Recognizer()
    mic = sr.Microphone()

    print("\n[AUDIO] Calibrating microphone for ambient noise... Please stay quiet.")
    with mic as source:
        r.adjust_for_ambient_noise(source, duration=2.5)
    print("[AUDIO] Calibration complete. Noise threshold set.")

    print(f"\n=======================================================")
    print(f"  VOICE ENGINE ACTIVE - Listening for commands...")
    print(f"  Say things like: 'select option A', 'move down', 'select line two'")
    print(f"=======================================================\n")

    while True:
        try:
            with mic as source:
                print("🗣️ Listening...", end="", flush=True)
                audio = r.listen(source, timeout=8, phrase_time_limit=4)
                print("\r🔍 Processing...      ", end="", flush=True)

            # Transcribe audio using Google Speech Recognition
            text = r.recognize_google(audio)
            cleaned_text = text.lower().strip()
            print(f"\r🎤 Heard: \"{cleaned_text}\"")

            if is_connected:
                sio.emit('personal_voice_command', {'username': username, 'phrase': cleaned_text})
            else:
                print("[WARNING] Socket not connected. Skipping stream.")

        except sr.WaitTimeoutError:
            print("\r                                 \r", end="") # Clear line
            continue
        except sr.UnknownValueError:
            print("\r🤔 Could not understand audio. Try again.")
        except sr.RequestError as e:
            print(f"\r❌ Google Service Error: {e}")
        except Exception as ex:
            print(f"\r❌ Error: {ex}")
            time.sleep(1)

if __name__ == '__main__':
    print("=========================================================")
    print("  Voice Controlled Gaming Tools - Python Speech Engine")
    print("=========================================================")

    # Prompt user for their active session username
    try:
        username = input("Enter your active Gamer/Student username: ").strip()
        if not username:
            print("Username cannot be empty. Exiting.")
            sys.exit(1)

        print(f"\nConnecting to local game server at {SERVER_URL}...")
        sio.connect(SERVER_URL)

        # Start the listen-transcribe loop
        listen_loop()

    except KeyboardInterrupt:
        print("\nStopping Python Speech Engine. Exiting.")
        if sio.connected:
            sio.disconnect()
        sys.exit(0)
    except Exception as e:
        print(f"\nFatal Connection Error: {e}")
        sys.exit(1)
